import { workouts, timers, type Workout, type InsertWorkout, type Timer, type InsertTimer } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private workouts: Map<number, Workout>;
  private timers: Map<number, Timer>;
  private currentWorkoutId: number;
  private currentTimerId: number;

  constructor() {
    this.workouts = new Map();
    this.timers = new Map();
    this.currentWorkoutId = 1;
    this.currentTimerId = 1;
  }

  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const id = this.currentWorkoutId++;
    const maxOrder = Math.max(...Array.from(this.workouts.values()).map(w => w.order), -1);
    const workout: Workout = { 
      ...insertWorkout, 
      id,
      order: insertWorkout.order ?? maxOrder + 1,
      createdAt: new Date().toISOString()
    };
    this.workouts.set(id, workout);
    return workout;
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async getAllWorkouts(): Promise<Workout[]> {
    return Array.from(this.workouts.values()).sort((a, b) => a.order - b.order);
  }

  async updateWorkout(id: number, updates: Partial<InsertWorkout>): Promise<Workout | undefined> {
    const existing = this.workouts.get(id);
    if (!existing) return undefined;
    
    const updated: Workout = { ...existing, ...updates };
    this.workouts.set(id, updated);
    return updated;
  }

  async deleteWorkout(id: number): Promise<boolean> {
    const deleted = this.workouts.delete(id);
    if (deleted) {
      await this.deleteTimersByWorkoutId(id);
    }
    return deleted;
  }

  async createTimer(insertTimer: InsertTimer): Promise<Timer> {
    const id = this.currentTimerId++;
    const timer: Timer = { ...insertTimer, id };
    this.timers.set(id, timer);
    return timer;
  }

  async getTimersByWorkoutId(workoutId: number): Promise<Timer[]> {
    return Array.from(this.timers.values())
      .filter(timer => timer.workoutId === workoutId)
      .sort((a, b) => a.order - b.order);
  }

  async updateTimer(id: number, updates: Partial<InsertTimer>): Promise<Timer | undefined> {
    const existing = this.timers.get(id);
    if (!existing) return undefined;
    
    const updated: Timer = { ...existing, ...updates };
    this.timers.set(id, updated);
    return updated;
  }

  async deleteTimer(id: number): Promise<boolean> {
    return this.timers.delete(id);
  }

  async deleteTimersByWorkoutId(workoutId: number): Promise<void> {
    const timersToDelete = Array.from(this.timers.entries())
      .filter(([_, timer]) => timer.workoutId === workoutId)
      .map(([id]) => id);
    
    timersToDelete.forEach(id => this.timers.delete(id));
  }

  async reorderTimers(workoutId: number, timerOrders: { id: number; order: number }[]): Promise<void> {
    for (const { id, order } of timerOrders) {
      const timer = this.timers.get(id);
      if (timer && timer.workoutId === workoutId) {
        this.timers.set(id, { ...timer, order });
      }
    }
  }

  async reorderWorkouts(workoutOrders: { id: number; order: number }[]): Promise<void> {
    for (const { id, order } of workoutOrders) {
      const workout = this.workouts.get(id);
      if (workout) {
        this.workouts.set(id, { ...workout, order });
      }
    }
  }

  async insertTimerAtPosition(workoutId: number, timer: Omit<InsertTimer, 'workoutId' | 'order'>, position: number): Promise<Timer> {
    // Get existing timers for this workout
    const existingTimers = await this.getTimersByWorkoutId(workoutId);
    
    // Shift orders for timers at or after the insertion position
    for (const existingTimer of existingTimers) {
      if (existingTimer.order >= position) {
        this.timers.set(existingTimer.id, { ...existingTimer, order: existingTimer.order + 1 });
      }
    }
    
    // Create new timer at the specified position
    const id = this.currentTimerId++;
    const newTimer: Timer = { 
      ...timer, 
      id,
      workoutId,
      order: position
    };
    this.timers.set(id, newTimer);
    return newTimer;
  }
}

export const storage = new MemStorage();
