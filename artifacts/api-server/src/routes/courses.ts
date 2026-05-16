import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, skillsTable, usersTable } from "@workspace/db";
import { GetCoursesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const COURSES_CATALOG = [
  {
    id: 1, title: "Python for Data Science", titleAr: "بايثون لعلم البيانات",
    provider: "Coursera", url: "https://www.coursera.org/learn/python-for-applied-data-science-ai",
    skills: ["Python", "تحليل البيانات", "Machine Learning"],
    duration: "6 أسابيع", level: "مبتدئ", isFree: false, relevanceScore: 95, category: "برمجة",
  },
  {
    id: 2, title: "JavaScript Full Stack", titleAr: "جافاسكريبت للتطوير الكامل",
    provider: "Udemy", url: "https://www.udemy.com/course/the-complete-javascript-course/",
    skills: ["JavaScript", "React", "Node.js", "REST APIs"],
    duration: "69 ساعة", level: "مبتدئ إلى متقدم", isFree: false, relevanceScore: 92, category: "تطوير ويب",
  },
  {
    id: 3, title: "Project Management Professional", titleAr: "إدارة المشاريع الاحترافية",
    provider: "LinkedIn Learning", url: "https://www.linkedin.com/learning/topics/project-management",
    skills: ["إدارة المشاريع", "Agile", "Risk Management"],
    duration: "8 ساعات", level: "متوسط", isFree: false, relevanceScore: 88, category: "إدارة",
  },
  {
    id: 4, title: "SQL for Beginners", titleAr: "SQL للمبتدئين",
    provider: "Khan Academy", url: "https://www.khanacademy.org/computing/computer-programming/sql",
    skills: ["SQL", "قواعد البيانات"],
    duration: "4 ساعات", level: "مبتدئ", isFree: true, relevanceScore: 85, category: "برمجة",
  },
  {
    id: 5, title: "UI/UX Design Fundamentals", titleAr: "أساسيات تصميم واجهات المستخدم",
    provider: "Google", url: "https://grow.google/certificates/ux-design/",
    skills: ["UI/UX", "Figma", "Typography"],
    duration: "6 أشهر", level: "مبتدئ", isFree: false, relevanceScore: 80, category: "تصميم",
  },
  {
    id: 6, title: "Excel للتحليل المالي", titleAr: "Excel للتحليل المالي",
    provider: "Edraak", url: "https://www.edraak.org/",
    skills: ["Excel", "تحليل البيانات", "إدارة الوقت"],
    duration: "12 ساعة", level: "مبتدئ", isFree: true, relevanceScore: 78, category: "تحليل",
  },
  {
    id: 7, title: "Power BI للمبتدئين", titleAr: "Power BI للمبتدئين",
    provider: "Microsoft Learn", url: "https://learn.microsoft.com/ar-sa/training/powerplatform/power-bi",
    skills: ["Power BI", "تصور البيانات"],
    duration: "10 ساعات", level: "مبتدئ", isFree: true, relevanceScore: 75, category: "تحليل",
  },
  {
    id: 8, title: "Git & GitHub المبتدئين", titleAr: "Git وGitHub للمبتدئين",
    provider: "GitHub Skills", url: "https://skills.github.com/",
    skills: ["Git", "GitHub", "Version Control"],
    duration: "3 ساعات", level: "مبتدئ", isFree: true, relevanceScore: 72, category: "أدوات",
  },
];

function requireAuth(req: import("express").Request, res: import("express").Response): number | null {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return null; }
  return userId;
}

router.get("/courses", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const limit = parseInt(String(req.query.limit ?? "10"), 10);

  const gapSkills = await db.query.skillsTable.findMany({
    where: and(eq(skillsTable.userId, userId), eq(skillsTable.type, "desired")),
  });

  const gapNames = gapSkills.map((s) => s.name.toLowerCase());

  const scored = COURSES_CATALOG.map((c) => {
    const overlap = c.skills.filter((s) => gapNames.includes(s.toLowerCase())).length;
    return { ...c, relevanceScore: c.relevanceScore + overlap * 5 };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);

  res.json(GetCoursesResponse.parse(scored.slice(0, limit)));
});

export default router;
