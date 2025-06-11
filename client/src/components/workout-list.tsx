import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MoreVertical, Dumbbell, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Workout, Timer } from "@shared/schema";

interface WorkoutListProps {
  onWorkoutSelect: (workout: Workout, timers: Timer[]) => void;
}

export default function WorkoutList({ onWorkoutSelect }: WorkoutListProps) {
  const { data: workouts = [], isLoading } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
  });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) {
      return `0:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const calculateTotalDuration = (workout: Workout) => {
    const { prepare, work, rest, rounds, cycles, restBetweenCycles } = workout;
    
    const cycleTime = rounds * (work + rest) - rest; // Last round doesn't have rest
    const totalCycleTime = cycles * cycleTime;
    const totalRestBetweenCycles = (cycles - 1) * restBetweenCycles;
    const totalTime = prepare + totalCycleTime + totalRestBetweenCycles;
    
    return Math.ceil(totalTime / 60); // Convert to minutes
  };

  const handleWorkoutClick = async (workout: Workout) => {
    try {
      const response = await apiRequest("GET", `/api/workouts/${workout.id}/timers`);
      const timers: Timer[] = await response.json();
      onWorkoutSelect(workout, timers);
    } catch (error) {
      console.error("Failed to fetch workout timers:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 text-white">My Workouts</h1>
          <p className="text-gray-400">Loading workouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-white">My Workouts</h1>
        <p className="text-gray-400">Saved interval workouts</p>
      </div>

      {/* Workouts List */}
      {workouts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No workouts created yet</p>
          <p className="text-sm text-gray-500">Use the Quick Menu to create your first workout</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              className="app-gray rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => handleWorkoutClick(workout)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-white">{workout.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {workout.rounds} rounds × {workout.cycles} cycles • {calculateTotalDuration(workout)} min total
                  </p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs work-color">
                      <Dumbbell className="w-3 h-3 mr-1" />
                      Work {formatTime(workout.work)}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs rest-color">
                      <Pause className="w-3 h-3 mr-1" />
                      Rest {formatTime(workout.rest)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-3 text-gray-400 hover:text-white p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement workout menu
                  }}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
