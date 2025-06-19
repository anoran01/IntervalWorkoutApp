import { z } from "zod";

// Sound settings schema
export const soundSettingsSchema = z.object({
  beepTone: z.enum(["standard", "high_pitch", "low_pitch"]).default("standard"),
  beepStart: z.number().min(1).max(30).default(10), // seconds before end when beeps start
  tenSecondWarning: z.boolean().default(true),
  halfwayReminder: z.boolean().default(true),
  verbalReminder: z.boolean().default(true), // says "Work" or "Rest" at start of period
  vibrate: z.boolean().default(true),
});

// Workout schema - complete record as stored in database
export const workoutSchema = z.object({
  id: z.number(),
  name: z.string(),
  prepare: z.number(), // in seconds
  work: z.number(), // in seconds
  rest: z.number(), // in seconds
  rounds: z.number(),
  cycles: z.number(),
  restBetweenCycles: z.number(), // in seconds
  soundSettings: soundSettingsSchema,
  order: z.number(),
  createdAt: z.string(),
});

// Timer schema - complete record as stored in database
export const timerSchema = z.object({
  id: z.number(),
  workoutId: z.number(),
  name: z.string(),
  duration: z.number(), // in seconds
  type: z.string(), // 'prepare' | 'work' | 'rest' | 'rest_between_cycles'
  order: z.number(),
});

// Insert schemas - omit auto-generated fields
export const insertWorkoutSchema = workoutSchema.omit({
  id: true,
  createdAt: true,
}).extend({
  order: z.number().optional(), // Make order optional for inserts
});

export const insertTimerSchema = timerSchema.omit({
  id: true,
});

// TypeScript types
export type SoundSettings = z.infer<typeof soundSettingsSchema>;
export type Workout = z.infer<typeof workoutSchema>;
export type Timer = z.infer<typeof timerSchema>;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type InsertTimer = z.infer<typeof insertTimerSchema>;

// SQL CREATE TABLE statements
export const CREATE_WORKOUTS_TABLE = `
  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    prepare INTEGER NOT NULL,
    work INTEGER NOT NULL,
    rest INTEGER NOT NULL,
    rounds INTEGER NOT NULL,
    cycles INTEGER NOT NULL,
    restBetweenCycles INTEGER NOT NULL,
    soundSettings TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );
`;

export const CREATE_TIMERS_TABLE = `
  CREATE TABLE IF NOT EXISTS timers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workoutId INTEGER NOT NULL,
    name TEXT NOT NULL,
    duration INTEGER NOT NULL,
    type TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    FOREIGN KEY (workoutId) REFERENCES workouts(id) ON DELETE CASCADE
  );
`;
