import { pgTable, serial, text, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  nationalId: text("national_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  careerGoal: text("career_goal"),
  currentRole: text("current_role"),
  educationLevel: text("education_level"),
  university: text("university"),
  major: text("major"),
  gpa: real("gpa"),
  interests: text("interests").array().default([]),
  hobbies: text("hobbies").array().default([]),
  desiredSkills: text("desired_skills").array().default([]),
  cvFileName: text("cv_file_name"),
  cvAnalyzed: boolean("cv_analyzed").default(false),
  nafathVerified: boolean("nafath_verified").default(false),
  authToken: text("auth_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
