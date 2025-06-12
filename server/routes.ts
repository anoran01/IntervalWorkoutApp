import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkoutSchema, insertTimerSchema, soundSettingsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all workouts
  app.get("/api/workouts", async (req, res) => {
    try {
      const workouts = await storage.getAllWorkouts();
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workouts" });
    }
  });

  // Get workout by ID
  app.get("/api/workouts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workout = await storage.getWorkout(id);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workout" });
    }
  });

  // Create workout
  app.post("/api/workouts", async (req, res) => {
    try {
      const workoutData = insertWorkoutSchema.parse(req.body);
      const workout = await storage.createWorkout(workoutData);
      res.status(201).json(workout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid workout data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create workout" });
    }
  });

  // Update workout
  app.patch("/api/workouts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertWorkoutSchema.partial().parse(req.body);
      const workout = await storage.updateWorkout(id, updates);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid workout data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update workout" });
    }
  });

  // Delete workout
  app.delete("/api/workouts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWorkout(id);
      if (!deleted) {
        return res.status(404).json({ message: "Workout not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workout" });
    }
  });

  // Get timers for a workout
  app.get("/api/workouts/:id/timers", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.id);
      const timers = await storage.getTimersByWorkoutId(workoutId);
      res.json(timers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch timers" });
    }
  });

  // Create timer
  app.post("/api/timers", async (req, res) => {
    try {
      const timerData = insertTimerSchema.parse(req.body);
      const timer = await storage.createTimer(timerData);
      res.status(201).json(timer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid timer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create timer" });
    }
  });

  // Update timer
  app.patch("/api/timers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertTimerSchema.partial().parse(req.body);
      const timer = await storage.updateTimer(id, updates);
      if (!timer) {
        return res.status(404).json({ message: "Timer not found" });
      }
      res.json(timer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid timer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update timer" });
    }
  });

  // Create workout with timers (for quick menu)
  app.post("/api/workouts/quick", async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().default("Temp Workout"),
        prepare: z.number(),
        work: z.number(),
        rest: z.number(),
        rounds: z.number(),
        cycles: z.number(),
        restBetweenCycles: z.number(),
        soundSettings: soundSettingsSchema,
      });

      const data = schema.parse(req.body);
      
      // Create workout
      const workout = await storage.createWorkout(data);
      
      // Generate timers
      let order = 0;
      
      // Prepare timer
      if (data.prepare > 0) {
        await storage.createTimer({
          workoutId: workout.id,
          name: "Prepare",
          duration: data.prepare,
          type: "prepare",
          order: order++,
        });
      }
      
      // Generate cycles
      for (let cycle = 0; cycle < data.cycles; cycle++) {
        // Generate rounds within each cycle
        for (let round = 0; round < data.rounds; round++) {
          // Work timer
          await storage.createTimer({
            workoutId: workout.id,
            name: `Work ${round + 1}`,
            duration: data.work,
            type: "work",
            order: order++,
          });
          
          // Rest timer (except after last round of last cycle)
          if (!(cycle === data.cycles - 1 && round === data.rounds - 1)) {
            await storage.createTimer({
              workoutId: workout.id,
              name: "Rest",
              duration: data.rest,
              type: "rest",
              order: order++,
            });
          }
        }
        
        // Rest between cycles (except after last cycle)
        if (cycle < data.cycles - 1 && data.restBetweenCycles > 0) {
          await storage.createTimer({
            workoutId: workout.id,
            name: "Rest Between Cycles",
            duration: data.restBetweenCycles,
            type: "rest_between_cycles",
            order: order++,
          });
        }
      }
      
      res.status(201).json(workout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid workout data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create quick workout" });
    }
  });

  // Reorder timers
  app.patch("/api/workouts/:workoutId/timers/reorder", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const schema = z.array(z.object({
        id: z.number(),
        order: z.number()
      }));
      
      const timerOrders = schema.parse(req.body);
      await storage.reorderTimers(workoutId, timerOrders);
      
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reorder data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to reorder timers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
