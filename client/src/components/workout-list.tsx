import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Plus, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Workout, Timer } from "@shared/schema";

interface WorkoutListProps {
  onWorkoutSelect: (workout: Workout, timers: Timer[]) => void;
  onNavigateToQuickCreate: () => void;
}

export default function WorkoutList({ onWorkoutSelect, onNavigateToQuickCreate }: WorkoutListProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { data: workouts = [], isLoading } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
  });



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
      <div className="flex flex-col h-screen bg-background">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h1 className="text-2xl font-bold text-center flex-1">Workout List</h1>
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="w-6 h-6" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading workouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-2xl font-bold text-center flex-1">Workout List</h1>
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="w-6 h-6" />
        </Button>
      </div>

      {/* Workouts List */}
      <div className="flex-1 p-4">
        {workouts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No workouts created yet</p>
            <p className="text-sm text-muted-foreground">Use Quick Create to create your first workout</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="border-2 border-black rounded-lg p-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-background"
                onClick={() => handleWorkoutClick(workout)}
              >
                <h3 className="text-xl font-bold">{workout.name}</h3>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t-2 border-black">
        <div className="flex">
          <button 
            className="flex-1 py-6 px-4 text-center transition-colors duration-200 bg-white dark:bg-gray-900"
            onClick={onNavigateToQuickCreate}
          >
            <div className="text-lg font-bold text-black dark:text-white">Quick Create</div>
          </button>
          <button className="flex-1 py-6 px-4 text-center bg-gray-300 dark:bg-gray-600">
            <div className="text-lg font-bold text-black dark:text-white">Workout List</div>
          </button>
        </div>
      </div>
    </div>
  );
}
