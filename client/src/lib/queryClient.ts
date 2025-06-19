import { QueryClient, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbService } from "@/services/database";
import { InsertWorkout, Workout, InsertTimer, Timer } from "@/schema";

export const queryClient = new QueryClient();

// Hook to get all workouts
export function useGetWorkouts() {
  return useQuery<Workout[]>({
    queryKey: ['workouts'],
    queryFn: () => dbService.getWorkouts(),
  });
}

export function useAddWorkoutAndTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workout, timers }: { workout: InsertWorkout, timers: InsertTimer[] }) => 
      dbService.addWorkoutAndTimer(workout, timers),
    onSuccess: (workoutId) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['timers', workoutId] });
    },
  });
}

// Hook to add a new workout
export function useAddWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newWorkout: InsertWorkout) => dbService.addWorkout(newWorkout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Hook to update a workout
export function useUpdateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, workout }: { id: number, workout: Partial<InsertWorkout> }) => {
      console.log("🔵 useUpdateWorkout:", id, workout);
      return dbService.updateWorkout(id, workout);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Hook to delete a workout
export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => dbService.deleteWorkout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Hook to reorder workouts
export function useReorderWorkouts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workoutIds: number[]) => dbService.reorderWorkouts(workoutIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Hook to get timers for a specific workout
export function useGetTimers(workoutId: number) {
  return useQuery<Timer[]>({
    queryKey: ['timers', workoutId],
    queryFn: () => dbService.getTimersForWorkout(workoutId),
    enabled: !!workoutId, // Only run the query if workoutId is available
  });
}

// Hook to add a new timer
export function useInsertTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTimer: InsertTimer) => dbService.insertTimer(newTimer),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timers', variables.workoutId] });
    },
  });
}

// Hook to insert multiple timers
export function useInsertMultipleTimers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (timers: InsertTimer[]) => dbService.insertMultipleTimers(timers),
    onSuccess: (data, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['timers', variables[0].workoutId] });
      }
    },
  });
}

// Hook to reorder timers
export function useReorderTimers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutId, timerIds }: { workoutId: number, timerIds: number[] }) => dbService.reorderTimers(workoutId, timerIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timers', variables.workoutId] });
    },
  });
}

// Hook to update a timer
export function useUpdateTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Omit<InsertTimer, 'workoutId'>> }) => 
      dbService.updateTimer(id, updates),
    onSuccess: (data, variables) => {
      // We need to know the workoutId to invalidate the right query
      // We can get it from the current timers data
      const currentTimers = queryClient.getQueriesData({ queryKey: ['timers'] });
      for (const [queryKey, timers] of currentTimers) {
        if (Array.isArray(timers)) {
          const timer = timers.find((t: any) => t.id === variables.id);
          if (timer) {
            queryClient.invalidateQueries({ queryKey: ['timers', timer.workoutId] });
            break;
          }
        }
      }
    },
  });
}
