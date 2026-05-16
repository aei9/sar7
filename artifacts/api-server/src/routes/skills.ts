import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, skillsTable, usersTable } from "@workspace/db";
import {
  GetSkillsResponse,
  AddSkillBody,
  DeleteSkillParams,
  GetSkillGapsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: import("express").Request, res: import("express").Response): number | null {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return null; }
  return userId;
}

router.get("/skills", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const skills = await db.query.skillsTable.findMany({
    where: eq(skillsTable.userId, userId),
  });

  res.json(GetSkillsResponse.parse(skills));
});

router.post("/skills", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = AddSkillBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [skill] = await db
    .insert(skillsTable)
    .values({ ...parsed.data, userId })
    .returning();

  res.status(201).json(skill);
});

router.delete("/skills/:id", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteSkillParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  await db.delete(skillsTable).where(
    and(eq(skillsTable.id, params.data.id), eq(skillsTable.userId, userId))
  );

  res.sendStatus(204);
});

router.get("/skills/gaps", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  const currentSkills = await db.query.skillsTable.findMany({
    where: and(eq(skillsTable.userId, userId), eq(skillsTable.type, "current")),
  });

  const careerGoal = user?.careerGoal ?? "مهندس برمجيات";
  const currentSkillNames = currentSkills.map((s) => s.name);

  const goalSkillsMap: Record<string, string[]> = {
    "مهندس برمجيات": ["JavaScript", "Python", "Git", "REST APIs", "قواعد البيانات", "الخوارزميات"],
    "محلل بيانات": ["Python", "SQL", "Excel", "Power BI", "الإحصاء", "Machine Learning"],
    "مدير مشاريع": ["إدارة الوقت", "التواصل", "Agile", "Risk Management", "MS Project"],
    "مصمم": ["Figma", "Adobe XD", "UI/UX", "Photoshop", "Typography"],
  };

  const requiredSkills = goalSkillsMap[careerGoal] ?? ["التواصل", "حل المشكلات", "العمل الجماعي"];
  const missingSkillNames = requiredSkills.filter((s) => !currentSkillNames.includes(s));
  const strengthSkills = currentSkillNames.filter((s) => requiredSkills.includes(s));
  const readiness = Math.round(((requiredSkills.length - missingSkillNames.length) / requiredSkills.length) * 100);

  res.json(
    GetSkillGapsResponse.parse({
      careerGoal,
      missingSkills: missingSkillNames.map((name, i) => ({
        name,
        priority: i < 2 ? "high" : i < 4 ? "medium" : "low",
        reason: `مطلوبة لتحقيق هدفك المهني كـ${careerGoal}`,
      })),
      strengthSkills,
      overallReadiness: readiness,
      recommendations: [
        "ابدأ بالمهارات ذات الأولوية العالية أولاً",
        "خصص ساعتين يومياً للتعلم",
        "طبق ما تتعلمه في مشاريع عملية",
      ],
    })
  );
});

export default router;
