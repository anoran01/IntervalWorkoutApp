import type { Workout, Timer } from "@shared/schema";

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) {
    return `0:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function calculateWorkoutDuration(workout: Workout): number {
  const { prepare, work, rest, rounds, cycles, restBetweenCycles } = workout;
  
  // Calculate time for one cycle
  const cycleTime = rounds * (work + rest) - rest; // Last round doesn't have rest
  
  // Calculate total time
  const totalCycleTime = cycles * cycleTime;
  const totalRestBetweenCycles = (cycles - 1) * restBetweenCycles;
  const totalTime = prepare + totalCycleTime + totalRestBetweenCycles;
  
  return totalTime;
}

export function calculateTotalIntervals(workout: Workout): number {
  const { prepare, rounds, cycles, restBetweenCycles } = workout;
  let intervals = 0;
  
  // Prepare timer
  if (prepare > 0) intervals += 1;
  
  // Work and rest timers per cycle
  intervals += cycles * (rounds * 2 - 1); // Each cycle has rounds * 2 - 1 intervals (last rest is omitted)
  
  // Rest between cycles
  if (restBetweenCycles > 0 && cycles > 1) {
    intervals += cycles - 1;
  }
  
  return intervals;
}

export function getTimerTypeColor(type: string): string {
  switch (type) {
    case "work":
      return "bg-orange-500";
    case "rest":
    case "rest_between_cycles":
      return "bg-blue-500";
    case "prepare":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
}

export function getTimerTypeLabel(type: string): string {
  switch (type) {
    case "work":
      return "Work";
    case "rest":
      return "Rest";
    case "rest_between_cycles":
      return "Rest Between Cycles";
    case "prepare":
      return "Prepare";
    default:
      return "Timer";
  }
}

export function vibrate(duration: number = 200): void {
  if (navigator.vibrate) {
    navigator.vibrate(duration);
  }
}

export function checkUniqueWorkoutName(name: string, existingWorkouts: Workout[], excludeId?: number): boolean {
  return !existingWorkouts.some(workout => 
    workout.name.toLowerCase() === name.toLowerCase() && workout.id !== excludeId
  );
}

export function generateUniqueWorkoutName(baseName: string, existingWorkouts: Workout[]): string {
  let counter = 1;
  let newName = baseName;
  
  while (!checkUniqueWorkoutName(newName, existingWorkouts)) {
    newName = `${baseName} ${counter}`;
    counter++;
  }
  
  return newName;
}
