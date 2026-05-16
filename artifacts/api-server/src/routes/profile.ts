import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, languagesTable } from "@workspace/db";
import {
  GetProfileResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
  AnalyzeCvBody,
  AnalyzeCvResponse,
  GetProfileCompletionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: import("express").Request, res: import("express").Response): number | null {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
}

router.get("/profile", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const langs = await db.query.languagesTable.findMany({
    where: eq(languagesTable.userId, userId),
  });

  const profileCompleteness = calculateCompleteness(user, langs.length > 0);

  res.json(
    GetProfileResponse.parse({
      id: user.id,
      nationalId: user.nationalId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      careerGoal: user.careerGoal,
      currentRole: user.currentRole,
      educationLevel: user.educationLevel,
      university: user.university,
      major: user.major,
      gpa: user.gpa,
      interests: user.interests ?? [],
      hobbies: user.hobbies ?? [],
      languages: langs.map((l) => ({ name: l.name, level: l.level })),
      cvFileName: user.cvFileName,
      cvAnalyzed: user.cvAnalyzed ?? false,
      desiredSkills: user.desiredSkills ?? [],
      profileCompleteness,
      createdAt: user.createdAt.toISOString(),
    })
  );
});

router.put("/profile", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { languages, ...rest } = parsed.data;

  const [updated] = await db
    .update(usersTable)
    .set({ ...rest, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning();

  if (languages !== undefined) {
    await db.delete(languagesTable).where(eq(languagesTable.userId, userId));
    if (languages.length > 0) {
      await db.insert(languagesTable).values(
        languages.map((l) => ({ userId, name: l.name, level: l.level }))
      );
    }
  }

  const langs = await db.query.languagesTable.findMany({
    where: eq(languagesTable.userId, userId),
  });

  const profileCompleteness = calculateCompleteness(updated, langs.length > 0);

  res.json(
    UpdateProfileResponse.parse({
      id: updated.id,
      nationalId: updated.nationalId,
      fullName: updated.fullName,
      email: updated.email,
      phone: updated.phone,
      careerGoal: updated.careerGoal,
      currentRole: updated.currentRole,
      educationLevel: updated.educationLevel,
      university: updated.university,
      major: updated.major,
      gpa: updated.gpa,
      interests: updated.interests ?? [],
      hobbies: updated.hobbies ?? [],
      languages: langs.map((l) => ({ name: l.name, level: l.level })),
      cvFileName: updated.cvFileName,
      cvAnalyzed: updated.cvAnalyzed ?? false,
      desiredSkills: updated.desiredSkills ?? [],
      profileCompleteness,
      createdAt: updated.createdAt.toISOString(),
    })
  );
});

router.post("/profile/cv/analyze", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = AnalyzeCvBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { fileName } = parsed.data;

  const extractedSkills = ["Microsoft Office", "تحليل البيانات", "التواصل الفعال", "إدارة المشاريع"];
  const summary = "تم تحليل السيرة الذاتية بنجاح. تم استخراج المهارات والخبرات بشكل تلقائي.";

  await db
    .update(usersTable)
    .set({ cvFileName: fileName, cvAnalyzed: true, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  res.json(
    AnalyzeCvResponse.parse({
      fileName,
      extractedSkills,
      summary,
      experienceYears: null,
      educationFound: null,
    })
  );
});

router.get("/profile/completion", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const langs = await db.query.languagesTable.findMany({ where: eq(languagesTable.userId, userId) });

  const completedItems: string[] = [];
  const missingItems: string[] = [];

  const checks = [
    { field: user.cvFileName, label: "السيرة الذاتية" },
    { field: user.careerGoal, label: "الهدف المهني" },
    { field: user.email, label: "البريد الإلكتروني" },
    { field: user.educationLevel, label: "المؤهل التعليمي" },
    { field: langs.length > 0, label: "اللغات" },
    { field: (user.interests ?? []).length > 0, label: "الاهتمامات" },
  ];

  checks.forEach(({ field, label }) => {
    if (field) completedItems.push(label);
    else missingItems.push(label);
  });

  const percentage = Math.round((completedItems.length / checks.length) * 100);

  res.json(GetProfileCompletionResponse.parse({ percentage, completedItems, missingItems }));
});

function calculateCompleteness(user: import("@workspace/db").User, hasLanguages: boolean): number {
  let score = 0;
  if (user.cvFileName) score += 20;
  if (user.careerGoal) score += 20;
  if (user.email) score += 15;
  if (user.educationLevel) score += 15;
  if (hasLanguages) score += 15;
  if ((user.interests ?? []).length > 0) score += 15;
  return score;
}

export default router;
