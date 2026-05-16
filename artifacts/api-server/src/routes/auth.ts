import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody, LoginResponse, GetMeResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { nationalId, fullName } = parsed.data;

  let user = await db.query.usersTable.findFirst({
    where: eq(usersTable.nationalId, nationalId),
  });

  const isNewUser = !user;

  if (!user) {
    const [created] = await db
      .insert(usersTable)
      .values({ nationalId, fullName, nafathVerified: parsed.data.nafathVerified ?? false })
      .returning();
    user = created;
  }

  (req.session as Record<string, unknown>).userId = user.id;

  const profileComplete = !!(user.careerGoal && user.cvAnalyzed);

  res.json(
    LoginResponse.parse({
      user: {
        id: user.id,
        nationalId: user.nationalId,
        fullName: user.fullName,
        profileComplete,
        avatarInitials: user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2),
      },
      token: `session_${user.id}`,
      isNewUser,
    })
  );
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const profileComplete = !!(user.careerGoal && user.cvAnalyzed);

  res.json(
    GetMeResponse.parse({
      id: user.id,
      nationalId: user.nationalId,
      fullName: user.fullName,
      profileComplete,
      avatarInitials: user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2),
    })
  );
});

export default router;
