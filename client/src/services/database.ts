import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Timer, InsertTimer, Workout, InsertWorkout, CREATE_WORKOUTS_TABLE, CREATE_TIMERS_TABLE } from '@/schema';

const DB_NAME = 'interval_workout_app';

class DatabaseService {
  private db: SQLiteDBConnection | null = null;
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);

  constructor() {
  }

  async initialize() {
    try {
      console.log('🔧 Database initialization starting...');

      //check connection first
      const connectionConsistency = (await this.sqlite.checkConnectionsConsistency()).result;
      let isConnection = (await this.sqlite.isConnection(DB_NAME, false)).result;

      if (connectionConsistency && isConnection) {
        this.db = await this.sqlite.retrieveConnection(DB_NAME, false);
        console.log('🔧 Database connection retrieved');
      } else {
        this.db = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
        console.log('🔧 Database connection created');
      }

      await this.db.open();
      const isDBOpen = await this.db.isDBOpen();
      console.log('🔧 Database is open:', isDBOpen);
    } catch(error: any) {
      const msg = error.message ? error.message : error;
      throw new Error('sqlite error: ${msg}');
    }
  
    // Create tables if they don't exist
    await this.createSchema();
    console.log('🔧 Schema creation complete');

  }

  private async createSchema() {
    //await this.db?.execute(CREATE_WORKOUTS_TABLE);
    //await this.db?.execute(CREATE_TIMERS_TABLE);
    try {
      console.log('🔧 Creating database schema...');
      
      // Use individual run() calls instead of execute() to avoid auto-transactions
      //await this.db?.run(CREATE_WORKOUTS_TABLE);
      //await this.db?.run(CREATE_TIMERS_TABLE);
      // First, let's see what tables already exist
      const tables = await this.db?.query("SELECT name FROM sqlite_master WHERE type='table';");
      console.log('🔧 Existing tables:', tables?.values);
      
      // Check if our tables exist
      const workoutTable = await this.db?.query("SELECT sql FROM sqlite_master WHERE type='table' AND name='workouts';");
      const timerTable = await this.db?.query("SELECT sql FROM sqlite_master WHERE type='table' AND name='timers';");
      
      console.log('🔧 Workouts table exists:', workoutTable?.values?.length > 0);
      console.log('🔧 Timers table exists:', timerTable?.values?.length > 0);
      
      // Only create if they don't exist
      if (!workoutTable?.values?.length) {
        console.log('🔧 Creating workouts table...');
        await this.db?.run(CREATE_WORKOUTS_TABLE);
        console.log('🔧 Workouts table created');
      }
      
      if (!timerTable?.values?.length) {
        console.log('🔧 Creating timers table...');
        await this.db?.run(CREATE_TIMERS_TABLE);
        console.log('🔧 Timers table created');
      }
      
      console.log('🔧 Database schema created successfully');
    } catch (error) {
      console.error('🔧 Failed to create schema:', error);
      throw error;
    }
  }

  async getWorkouts(): Promise<Workout[]> {
    const result = await this.db?.query('SELECT * FROM workouts ORDER BY "order" ASC;');
    if (!result || !result.values) {
      return [];
    }
    // The soundSettings are stored as JSON strings, so we need to parse them.
    return result.values.map(workout => ({
      ...workout,
      soundSettings: JSON.parse(workout.soundSettings),
    }));
  }

  async addWorkoutAndTimer(workout: InsertWorkout, timers: InsertTimer[]): Promise<number> {
    console.log('🔍 Running SQLite diagnostics before transaction...');

    const soundSettings = JSON.stringify(workout.soundSettings);
    const createdAt = new Date().toISOString();
    let workoutId: number | undefined;

    
    
    try {
      //console.log('🔵 About to begin transaction...');
      
      // Insert workout
      const workoutResult = await this.db?.run(
        `INSERT INTO workouts (name, prepare, work, rest, rounds, cycles, restBetweenCycles, soundSettings, "order", createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [workout.name, workout.prepare, workout.work, workout.rest, workout.rounds, workout.cycles, workout.restBetweenCycles, soundSettings, workout.order ?? 0, createdAt]
      );
      workoutId = workoutResult?.changes?.lastId;
      
      if (!workoutId) {
        throw new Error('Failed to insert workout');
      }

      // Insert timers
      for (const timer of timers) {
        await this.db?.run(
          'INSERT INTO timers (workoutId, name, duration, type, "order") VALUES (?, ?, ?, ?, ?)',
          [workoutId, timer.name, timer.duration, timer.type, timer.order]
        );
      }
      
      //await this.db?.commitTransaction();
      //await this.db?.run('COMMIT TRANSACTION;');
      return workoutId;
      
    } catch (err) {
      await this.db?.rollbackTransaction();
      //await this.db?.run('ROLLBACK TRANSACTION;');
      console.error('Failed to insert workout and timers', err);
      throw err;
    }
  }

  async addWorkout(workout: InsertWorkout): Promise<number | undefined> {
    const soundSettings = JSON.stringify(workout.soundSettings);
    const createdAt = new Date().toISOString();
    const result = await this.db?.run(
      `INSERT INTO workouts (name, prepare, work, rest, rounds, cycles, restBetweenCycles, soundSettings, "order", createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [workout.name, workout.prepare, workout.work, workout.rest, workout.rounds, workout.cycles, workout.restBetweenCycles, soundSettings, workout.order ?? 0, createdAt]
    );
    return result?.changes?.lastId;
  }

  async updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<void> {
    const fields = Object.keys(workout).filter(k => k !== 'id');
    const values = fields.map(k => (workout as any)[k]);
    const setClause = fields.map(f => `"${f}" = ?`).join(', ');

    if (fields.length === 0) {
      return;
    }

    // Handle soundSettings separately if it's being updated
    const soundSettingsIndex = fields.indexOf('soundSettings');
    if (soundSettingsIndex > -1) {
      values[soundSettingsIndex] = JSON.stringify(values[soundSettingsIndex]);
    }

    //console.log("🔵 updateWorkout (db):", setClause, values, id);

    await this.db?.run(`UPDATE workouts SET ${setClause} WHERE id = ?`, [...values, id]);
  }

  async deleteWorkout(id: number): Promise<void> {
    await this.db?.run('DELETE FROM workouts WHERE id = ?', [id]);
    // The foreign key constraint with ON DELETE CASCADE will automatically delete associated timers.
  }

  async reorderWorkouts(workoutIds: number[]): Promise<void> {
    try {
      for (let i = 0; i < workoutIds.length; i++) {
        const id = workoutIds[i];
        const newOrder = i;
        await this.db?.run('UPDATE workouts SET "order" = ? WHERE id = ?', [newOrder, id]);
      }
    } catch (err) {
      await this.db?.run('ROLLBACK TRANSACTION;');
      console.error('Failed to reorder workouts', err);
      throw err;
    }
  }

  async updateTimer(id: number, updates: Partial<Omit<InsertTimer, 'workoutId'>>): Promise<void> {
    const fields = Object.keys(updates).filter(k => k !== 'id');
    const values = fields.map(k => (updates as any)[k]);
    const setClause = fields.map(f => `"${f}" = ?`).join(', ');

    if (fields.length === 0) {
      return;
    }

    await this.db?.run(`UPDATE timers SET ${setClause} WHERE id = ?`, [...values, id]);
  }

  async deleteTimer(id: number): Promise<void> {
    await this.db?.run('DELETE FROM timers WHERE id = ?', [id]);
  }

  async getTimersForWorkout(workoutId: number): Promise<Timer[]> {
    const result = await this.db?.query('SELECT * FROM timers WHERE workoutId = ? ORDER BY "order" ASC;', [workoutId]);
    return result?.values || [];
  }

  async insertTimer(timer: InsertTimer): Promise<number | undefined> {
    const result = await this.db?.run(
      'INSERT INTO timers (workoutId, name, duration, type, "order") VALUES (?, ?, ?, ?, ?)',
      [timer.workoutId, timer.name, timer.duration, timer.type, timer.order]
    );
    return result?.changes?.lastId;
  }

  async insertMultipleTimers(timers: InsertTimer[]): Promise<void> {
    if (timers.length === 0) return;
    
    try {
      for (const timer of timers) {
        await this.db?.run(
          'INSERT INTO timers (workoutId, name, duration, type, "order") VALUES (?, ?, ?, ?, ?)',
          [timer.workoutId, timer.name, timer.duration, timer.type, timer.order]
        );
      }
    } catch (err) {
      await this.db?.run('ROLLBACK TRANSACTION;');
      console.error('Failed to insert multiple timers', err);
      throw err;
    }
  }

  async reorderTimers(workoutId: number, timerIds: number[]): Promise<void> {
    try {
      for (let i = 0; i < timerIds.length; i++) {
        const id = timerIds[i];
        const newOrder = i;
        await this.db?.run('UPDATE timers SET "order" = ? WHERE id = ? AND workoutId = ?', [newOrder, id, workoutId]);
      }
    } catch (err) {
      await this.db?.run('ROLLBACK TRANSACTION;');
      console.error(`Failed to reorder timers for workout ${workoutId}`, err);
      throw err;
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }
}

export const dbService = new DatabaseService(); 