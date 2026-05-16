import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db, usersTable, skillsTable, badgesTable, certificationsTable, activitiesTable,
} from "@workspace/db";
import {
  GetCareerPathResponse, GetCareerDashboardResponse,
  GetCertificationsResponse, AddCertificationBody,
  GetActivitiesResponse, AddActivityBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: import("express").Request, res: import("express").Response): number | null {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return null; }
  return userId;
}

router.get("/career/dashboard", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [user, skills, badges, certs] = await Promise.all([
    db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) }),
    db.query.skillsTable.findMany({ where: eq(skillsTable.userId, userId) }),
    db.query.badgesTable.findMany({ where: eq(badgesTable.userId, userId) }),
    db.query.certificationsTable.findMany({ where: eq(certificationsTable.userId, userId) }),
  ]);

  const profileScore = calculateProfileScore(user, skills.length, badges.length, certs.length);
  const careerReadiness = skills.length > 0 ? Math.min(100, skills.length * 10 + badges.length * 5) : 0;

  const recentActivity = [
    ...(user?.cvFileName ? [{ type: "cv", title: "تم رفع السيرة الذاتية", date: user.createdAt.toISOString() }] : []),
    ...badges.slice(0, 2).map((b) => ({ type: "badge", title: `حصلت على وسام: ${b.titleAr}`, date: b.earnedAt.toISOString() })),
    ...certs.slice(0, 2).map((c) => ({ type: "cert", title: `أضفت شهادة: ${c.title}`, date: c.createdAt.toISOString() })),
  ].slice(0, 5);

  res.json(
    GetCareerDashboardResponse.parse({
      profileScore,
      skillsCount: skills.length,
      badgesCount: badges.length,
      coursesCount: 8,
      jobMatchCount: 6,
      careerReadiness,
      recentActivity,
      topSkillGaps: ["Python", "SQL", "إدارة المشاريع"].slice(0, 3),
    })
  );
});

router.get("/career/path", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  const careerGoal = user?.careerGoal ?? "مهندس برمجيات";

  const stages = [
    {
      stage: 1, title: "بناء الأساس", description: "اكتساب المهارات الأساسية اللازمة للمجال",
      skills: ["Python", "SQL", "Git"], status: "completed" as const, durationMonths: 3,
    },
    {
      stage: 2, title: "التعمق التقني", description: "تطوير المهارات المتوسطة والمتقدمة",
      skills: ["JavaScript", "REST APIs", "قواعد البيانات"], status: "in_progress" as const, durationMonths: 4,
    },
    {
      stage: 3, title: "المشاريع العملية", description: "تطبيق المهارات في مشاريع حقيقية",
      skills: ["مشروع متكامل", "GitHub Portfolio", "Freelance"], status: "upcoming" as const, durationMonths: 3,
    },
    {
      stage: 4, title: "الدخول لسوق العمل", description: "التقديم على الوظائف وبناء الشبكة المهنية",
      skills: ["LinkedIn", "Resume", "Interview Skills"], status: "upcoming" as const, durationMonths: 2,
    },
  ];

  res.json(
    GetCareerPathResponse.parse({
      goal: careerGoal,
      stages,
      estimatedMonths: 12,
      currentStage: 2,
      overallProgress: 35,
    })
  );
});

router.get("/career/certifications", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const certs = await db.query.certificationsTable.findMany({
    where: eq(certificationsTable.userId, userId),
  });

  res.json(
    GetCertificationsResponse.parse(
      certs.map((c) => ({
        ...c,
        score: c.score ?? null,
        dateEarned: c.dateEarned ?? null,
        expiryDate: c.expiryDate ?? null,
        verificationProof: c.verificationProof ?? null,
        platform: c.platform ?? null,
      }))
    )
  );
});

router.post("/career/certifications", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = AddCertificationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [cert] = await db.insert(certificationsTable).values({ ...parsed.data, userId }).returning();

  res.status(201).json({
    ...cert,
    score: cert.score ?? null,
    dateEarned: cert.dateEarned ?? null,
    expiryDate: cert.expiryDate ?? null,
    verificationProof: cert.verificationProof ?? null,
    platform: cert.platform ?? null,
  });
});

router.get("/career/activities", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const acts = await db.query.activitiesTable.findMany({
    where: eq(activitiesTable.userId, userId),
  });

  res.json(
    GetActivitiesResponse.parse(
      acts.map((a) => ({
        ...a,
        role: a.role ?? null,
        startDate: a.startDate ?? null,
        endDate: a.endDate ?? null,
        description: a.description ?? null,
        proofFile: a.proofFile ?? null,
      }))
    )
  );
});

router.post("/career/activities", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = AddActivityBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [act] = await db.insert(activitiesTable).values({ ...parsed.data, userId }).returning();

  res.status(201).json({
    ...act,
    role: act.role ?? null,
    startDate: act.startDate ?? null,
    endDate: act.endDate ?? null,
    description: act.description ?? null,
    proofFile: act.proofFile ?? null,
  });
});

function calculateProfileScore(user: import("@workspace/db").User | undefined, skillsCount: number, badgesCount: number, certsCount: number): number {
  let score = 0;
  if (user?.cvFileName) score += 25;
  if (user?.careerGoal) score += 15;
  if (user?.email) score += 10;
  if (skillsCount > 0) score += Math.min(20, skillsCount * 3);
  if (badgesCount > 0) score += Math.min(15, badgesCount * 5);
  if (certsCount > 0) score += Math.min(15, certsCount * 5);
  return Math.min(100, score);
}

export default router;
