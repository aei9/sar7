import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, usersTable } from "@workspace/db";
import { LoginBody, LoginResponse, GetMeResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function getUserShape(user: typeof usersTable.$inferSelect) {
  const profileComplete = !!(user.careerGoal && user.cvAnalyzed);
  return {
    id: user.id,
    nationalId: user.nationalId,
    fullName: user.fullName,
    profileComplete,
    avatarInitials: user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2),
  };
}

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
  const authToken = randomUUID();

  if (!user) {
    const [created] = await db
      .insert(usersTable)
      .values({ nationalId, fullName, nafathVerified: parsed.data.nafathVerified ?? false, authToken })
      .returning();
    user = created;
  } else {
    const [updated] = await db
      .update(usersTable)
      .set({ authToken })
      .where(eq(usersTable.id, user.id))
      .returning();
    user = updated;
  }

  (req.session as Record<string, unknown>).userId = user.id;

  res.json(
    LoginResponse.parse({
      user: getUserShape(user),
      token: authToken,
      isNewUser,
    })
  );
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (userId) {
    await db.update(usersTable).set({ authToken: null }).where(eq(usersTable.id, userId));
  }
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  let userId = (req.session as Record<string, unknown>).userId as number | undefined;

  if (!userId) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const userByToken = await db.query.usersTable.findFirst({
        where: eq(usersTable.authToken, token),
      });
      if (userByToken) {
        userId = userByToken.id;
        (req.session as Record<string, unknown>).userId = userId;
      }
    }
  }

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

  res.json(GetMeResponse.parse(getUserShape(user)));
});

export default router;
