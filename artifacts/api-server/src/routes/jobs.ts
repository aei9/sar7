import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, skillsTable, usersTable } from "@workspace/db";
import { GetJobsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const JOBS_CATALOG = [
  {
    id: 1, title: "Software Engineer", titleAr: "مهندس برمجيات",
    organization: "أرامكو السعودية", salaryMin: 12000, salaryMax: 20000,
    platform: "جدارة", applyUrl: "https://jadara.gov.sa/",
    requiredSkills: ["JavaScript", "Python", "Git", "REST APIs"],
    location: "الظهران", jobType: "دوام كامل",
  },
  {
    id: 2, title: "Data Analyst", titleAr: "محلل بيانات",
    organization: "stc", salaryMin: 10000, salaryMax: 16000,
    platform: "LinkedIn", applyUrl: "https://www.linkedin.com/jobs/",
    requiredSkills: ["Python", "SQL", "Power BI", "Excel"],
    location: "الرياض", jobType: "دوام كامل",
  },
  {
    id: 3, title: "Project Manager", titleAr: "مدير مشاريع",
    organization: "المملكة القابضة", salaryMin: 15000, salaryMax: 25000,
    platform: "جدارة", applyUrl: "https://jadara.gov.sa/",
    requiredSkills: ["إدارة المشاريع", "Agile", "التواصل"],
    location: "الرياض", jobType: "دوام كامل",
  },
  {
    id: 4, title: "UI/UX Designer", titleAr: "مصمم واجهات مستخدم",
    organization: "زيد للتقنية", salaryMin: 8000, salaryMax: 14000,
    platform: "Bayt", applyUrl: "https://www.bayt.com/",
    requiredSkills: ["Figma", "UI/UX", "Adobe XD"],
    location: "جدة", jobType: "دوام كامل",
  },
  {
    id: 5, title: "Business Analyst", titleAr: "محلل أعمال",
    organization: "البنك الأهلي", salaryMin: 11000, salaryMax: 18000,
    platform: "جدارة", applyUrl: "https://jadara.gov.sa/",
    requiredSkills: ["Excel", "تحليل البيانات", "إدارة المشاريع", "SQL"],
    location: "الرياض", jobType: "دوام كامل",
  },
  {
    id: 6, title: "Full Stack Developer", titleAr: "مطور ويب متكامل",
    organization: "تقنيات إنفو", salaryMin: 9000, salaryMax: 16000,
    platform: "LinkedIn", applyUrl: "https://www.linkedin.com/jobs/",
    requiredSkills: ["JavaScript", "React", "Node.js", "قواعد البيانات"],
    location: "عن بُعد", jobType: "دوام كامل",
  },
];

function requireAuth(req: import("express").Request, res: import("express").Response): number | null {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return null; }
  return userId;
}

router.get("/jobs", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const limit = parseInt(String(req.query.limit ?? "10"), 10);
  const readyOnly = req.query.readyOnly === "true";

  const userSkills = await db.query.skillsTable.findMany({
    where: and(eq(skillsTable.userId, userId), eq(skillsTable.type, "current")),
  });
  const userSkillNames = userSkills.map((s) => s.name.toLowerCase());

  const jobs = JOBS_CATALOG.map((j) => {
    const matched = j.requiredSkills.filter((s) => userSkillNames.includes(s.toLowerCase()));
    const missing = j.requiredSkills.filter((s) => !userSkillNames.includes(s.toLowerCase()));
    const pct = Math.round((matched.length / j.requiredSkills.length) * 100);
    return {
      ...j,
      matchedSkills: matched,
      missingSkills: missing,
      matchPercentage: pct,
      canApply: pct >= 70,
    };
  }).sort((a, b) => b.matchPercentage - a.matchPercentage);

  const filtered = readyOnly ? jobs.filter((j) => j.canApply) : jobs;

  res.json(GetJobsResponse.parse(filtered.slice(0, limit)));
});

export default router;
