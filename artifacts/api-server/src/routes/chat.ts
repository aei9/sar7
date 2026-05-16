import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, chatMessagesTable, usersTable, skillsTable } from "@workspace/db";
import { SendChatMessageBody, SendChatMessageResponse, GetChatHistoryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: import("express").Request, res: import("express").Response): number | null {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return null; }
  return userId;
}

function generateSmartReply(message: string, userName: string, careerGoal: string, skillNames: string[]): { reply: string; suggestions: string[] } {
  const msg = message.toLowerCase();

  if (msg.includes("مهارة") || msg.includes("skill")) {
    return {
      reply: `مرحباً ${userName}! بناءً على هدفك كـ${careerGoal}، أنصحك بالتركيز على المهارات التقنية الأساسية أولاً. لديك حالياً ${skillNames.length} مهارة مسجلة. أنصح بإضافة مهارات جديدة وتطوير الموجودة.`,
      suggestions: ["ما هي المهارات الأكثر طلباً؟", "كيف أطور مهاراتي؟", "اقترح لي دورات"],
    };
  }

  if (msg.includes("وظيفة") || msg.includes("عمل") || msg.includes("توظيف")) {
    return {
      reply: `سوق العمل في المملكة يبحث بقوة عن ${careerGoal}. بناءً على مهاراتك الحالية، نسبة تطابقك مع بعض الوظائف وصلت إلى 70%+. أنصحك بالتقديم على منصة جدارة وإكمال ملفك الشخصي أولاً.`,
      suggestions: ["أرني الوظائف المناسبة لي", "كيف أحسّن ملفي؟", "ما الراتب المتوقع؟"],
    };
  }

  if (msg.includes("دورة") || msg.includes("تعلم") || msg.includes("course")) {
    return {
      reply: `ممتاز! التعلم المستمر هو مفتاح النجاح. بناءً على الفجوات في مهاراتك، أنصحك بالبدء بدورة Python على Coursera، ثم دورة SQL على Khan Academy. كلتاهما مجانية أو بأسعار معقولة.`,
      suggestions: ["أرني الدورات المقترحة", "ما هي الدورات المجانية؟", "كم وقت أحتاج للتعلم؟"],
    };
  }

  if (msg.includes("مسار") || msg.includes("career") || msg.includes("خطة")) {
    return {
      reply: `مسارك المهني نحو ${careerGoal} يسير على المسار الصحيح! المرحلة الحالية: بناء المهارات المتوسطة. التقدير الزمني للوصول لأول وظيفة: 8-12 شهراً إذا خصصت 2 ساعة يومياً للتعلم.`,
      suggestions: ["أرني خطتي التفصيلية", "كيف أسرع مساري؟", "ما التحديات المتوقعة؟"],
    };
  }

  if (msg.includes("شهادة") || msg.includes("certification")) {
    return {
      reply: `الشهادات المهنية تعزز ملفك كثيراً! للمسار التقني، أنصح بشهادات: AWS Cloud Practitioner، أو Google Data Analytics، أو Microsoft Azure. هذه الشهادات معترف بها في سوق العمل السعودي.`,
      suggestions: ["ما الشهادات الأنسب لي؟", "كيف أضيف شهادة؟", "هل الشهادات مدفوعة؟"],
    };
  }

  return {
    reply: `مرحباً ${userName}! أنا مستشارك المهني الذكي في صرح. يمكنني مساعدتك في: تحليل مهاراتك، اقتراح الدورات، البحث عن وظائف، وتخطيط مسارك المهني نحو ${careerGoal}. ما الذي تودّ معرفته؟`,
    suggestions: ["حلل مهاراتي", "اقترح وظائف مناسبة", "أرني مساري المهني", "ما الدورات المقترحة؟"],
  };
}

router.post("/chat/message", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { message } = parsed.data;

  const [user, skills] = await Promise.all([
    db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) }),
    db.query.skillsTable.findMany({ where: eq(skillsTable.userId, userId) }),
  ]);

  await db.insert(chatMessagesTable).values({ userId, role: "user", content: message });

  const { reply, suggestions } = generateSmartReply(
    message,
    user?.fullName ?? "الطالب",
    user?.careerGoal ?? "مهندس برمجيات",
    skills.map((s) => s.name)
  );

  const [saved] = await db
    .insert(chatMessagesTable)
    .values({ userId, role: "assistant", content: reply })
    .returning();

  res.json(
    SendChatMessageResponse.parse({
      id: saved.id,
      reply,
      timestamp: saved.createdAt.toISOString(),
      suggestions,
    })
  );
});

router.get("/chat/history", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const messages = await db.query.chatMessagesTable.findMany({
    where: eq(chatMessagesTable.userId, userId),
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  });

  res.json(
    GetChatHistoryResponse.parse(
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.createdAt.toISOString(),
      }))
    )
  );
});

export default router;
