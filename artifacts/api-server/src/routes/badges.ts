import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, badgesTable } from "@workspace/db";
import { GetBadgesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: import("express").Request, res: import("express").Response): number | null {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return null; }
  return userId;
}

router.get("/badges", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const badges = await db.query.badgesTable.findMany({
    where: eq(badgesTable.userId, userId),
  });

  res.json(
    GetBadgesResponse.parse(
      badges.map((b) => ({
        ...b,
        earnedAt: b.earnedAt.toISOString(),
      }))
    )
  );
});

export default router;
