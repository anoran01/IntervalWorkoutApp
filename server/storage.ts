import { workouts, timers, type Workout, type InsertWorkout, type Timer, type InsertTimer } from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // Workout operations
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  getWorkout(id: number): Promise<Workout | undefined>;
  getAllWorkouts(): Promise<Workout[]>;
  updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout | undefined>;
  deleteWorkout(id: number): Promise<boolean>;
  reorderWorkouts(workoutOrders: { id: number; order: number }[]): Promise<void>;
  
  // Timer operations
  createTimer(timer: InsertTimer): Promise<Timer>;
  getTimersByWorkoutId(workoutId: number): Promise<Timer[]>;
  updateTimer(id: number, timer: Partial<InsertTimer>): Promise<Timer | undefined>;
  deleteTimer(id: number): Promise<boolean>;
  deleteTimersByWorkoutId(workoutId: number): Promise<void>;
  reorderTimers(workoutId: number, timerOrders: { id: number; order: number }[]): Promise<void>;
  insertTimerAtPosition(workoutId: number, timer: Omit<InsertTimer, 'workoutId' | 'order'>, position: number): Promise<Timer>;
}

export class DatabaseStorage implements IStorage {
  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const maxOrderResult = await db.select({ maxOrder: workouts.order }).from(workouts).orderBy(desc(workouts.order)).limit(1);
    const maxOrder = maxOrderResult.length > 0 ? maxOrderResult[0].maxOrder : -1;
    
    const [workout] = await db
      .insert(workouts)
      .values({
        ...insertWorkout,
        order: insertWorkout.order ?? maxOrder + 1,
        createdAt: new Date().toISOString()
      })
      .returning();
    return workout;
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout || undefined;
  }

  async getAllWorkouts(): Promise<Workout[]> {
    return await db.select().from(workouts).orderBy(asc(workouts.order));
  }

  async updateWorkout(id: number, updates: Partial<InsertWorkout>): Promise<Workout | undefined> {
    const [workout] = await db
      .update(workouts)
      .set(updates)
      .where(eq(workouts.id, id))
      .returning();
    return workout || undefined;
  }

  async deleteWorkout(id: number): Promise<boolean> {
    await this.deleteTimersByWorkoutId(id);
    const result = await db.delete(workouts).where(eq(workouts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async reorderWorkouts(workoutOrders: { id: number; order: number }[]): Promise<void> {
    for (const { id, order } of workoutOrders) {
      await db
        .update(workouts)
        .set({ order })
        .where(eq(workouts.id, id));
    }
  }

  async createTimer(insertTimer: InsertTimer): Promise<Timer> {
    const [timer] = await db
      .insert(timers)
      .values(insertTimer)
      .returning();
    return timer;
  }

  async getTimersByWorkoutId(workoutId: number): Promise<Timer[]> {
    return await db
      .select()
      .from(timers)
      .where(eq(timers.workoutId, workoutId))
      .orderBy(asc(timers.order));
  }

  async updateTimer(id: number, updates: Partial<InsertTimer>): Promise<Timer | undefined> {
    const [timer] = await db
      .update(timers)
      .set(updates)
      .where(eq(timers.id, id))
      .returning();
    return timer || undefined;
  }

  async deleteTimer(id: number): Promise<boolean> {
    const result = await db.delete(timers).where(eq(timers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteTimersByWorkoutId(workoutId: number): Promise<void> {
    await db.delete(timers).where(eq(timers.workoutId, workoutId));
  }

  async reorderTimers(workoutId: number, timerOrders: { id: number; order: number }[]): Promise<void> {
    for (const { id, order } of timerOrders) {
      await db
        .update(timers)
        .set({ order })
        .where(and(eq(timers.id, id), eq(timers.workoutId, workoutId)));
    }
  }

  async insertTimerAtPosition(workoutId: number, timer: Omit<InsertTimer, 'workoutId' | 'order'>, position: number): Promise<Timer> {
    // Shift existing timers at or after position up by 1
    await db
      .update(timers)
      .set({ order: sql`${timers.order} + 1` })
      .where(and(eq(timers.workoutId, workoutId), gte(timers.order, position)));

    const [newTimer] = await db
      .insert(timers)
      .values({
        ...timer,
        workoutId,
        order: position
      })
      .returning();
    return newTimer;
  }
}

export const storage = new DatabaseStorage();