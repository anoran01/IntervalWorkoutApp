import { workouts, timers, type Workout, type InsertWorkout, type Timer, type InsertTimer } from "@shared/schema";

export interface IStorage {
  // Workout operations
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  getWorkout(id: number): Promise<Workout | undefined>;
  getAllWorkouts(): Promise<Workout[]>;
  updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout | undefined>;
  deleteWorkout(id: number): Promise<boolean>;
  
  // Timer operations
  createTimer(timer: InsertTimer): Promise<Timer>;
  getTimersByWorkoutId(workoutId: number): Promise<Timer[]>;
  updateTimer(id: number, timer: Partial<InsertTimer>): Promise<Timer | undefined>;
  deleteTimer(id: number): Promise<boolean>;
  deleteTimersByWorkoutId(workoutId: number): Promise<void>;
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
    const workout: Workout = { 
      ...insertWorkout, 
      id,
      createdAt: new Date().toISOString()
    };
    this.workouts.set(id, workout);
    return workout;
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async getAllWorkouts(): Promise<Workout[]> {
    return Array.from(this.workouts.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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
}

export const storage = new MemStorage();
