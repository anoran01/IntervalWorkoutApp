import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  prepare: integer("prepare").notNull(), // in seconds
  work: integer("work").notNull(), // in seconds
  rest: integer("rest").notNull(), // in seconds
  rounds: integer("rounds").notNull(),
  cycles: integer("cycles").notNull(),
  restBetweenCycles: integer("rest_between_cycles").notNull(), // in seconds
  soundSettings: jsonb("sound_settings").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const timers = pgTable("timers", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  name: text("name").notNull(),
  duration: integer("duration").notNull(), // in seconds
  type: text("type").notNull(), // 'prepare' | 'work' | 'rest' | 'rest_between_cycles'
  order: integer("order").notNull(),
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
  createdAt: true,
}).extend({
  order: z.number().optional(),
});

export const insertTimerSchema = createInsertSchema(timers).omit({
  id: true,
});

export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertTimer = z.infer<typeof insertTimerSchema>;
export type Timer = typeof timers.$inferSelect;

export const soundSettingsSchema = z.object({
  beepTone: z.enum(["standard", "high_pitch", "low_pitch"]).default("standard"),
  beepStart: z.number().min(1).max(30).default(10), // seconds before end when beeps start
  tenSecondWarning: z.boolean().default(true),
  halfwayReminder: z.boolean().default(true),
  verbalReminder: z.boolean().default(true), // says "Work" or "Rest" at start of period
  vibrate: z.boolean().default(true),
});

export type SoundSettings = z.infer<typeof soundSettingsSchema>;
