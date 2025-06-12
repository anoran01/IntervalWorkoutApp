import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Plus, List, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Workout, Timer } from "@shared/schema";

interface WorkoutListProps {
  onWorkoutSelect: (workout: Workout, timers: Timer[]) => void;
  onNavigateToQuickCreate: () => void;
}

export default function WorkoutList({ onWorkoutSelect, onNavigateToQuickCreate }: WorkoutListProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [draggedOver, setDraggedOver] = useState<number | null>(null);
  
  const { data: workouts = [], isLoading } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
  });

  const reorderMutation = useMutation({
    mutationFn: async (workoutOrders: { id: number; order: number }[]) => {
      const response = await fetch('/api/workouts/reorder', {
        method: 'PATCH',
        body: JSON.stringify(workoutOrders),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to reorder workouts');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
    },
  });



  const handleDragStart = (e: React.DragEvent, workoutId: number) => {
    setDraggedItem(workoutId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, workoutId: number) => {
    e.preventDefault();
    setDraggedOver(workoutId);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = (e: React.DragEvent, targetWorkoutId: number) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetWorkoutId) {
      setDraggedItem(null);
      setDraggedOver(null);
      return;
    }

    // Find the indices of the dragged and target items
    const draggedIndex = workouts.findIndex(w => w.id === draggedItem);
    const targetIndex = workouts.findIndex(w => w.id === targetWorkoutId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      setDraggedOver(null);
      return;
    }

    // Create new order by moving the dragged item to the target position
    const newWorkouts = [...workouts];
    const [draggedWorkout] = newWorkouts.splice(draggedIndex, 1);
    newWorkouts.splice(targetIndex, 0, draggedWorkout);

    // Update orders based on new positions
    const workoutOrders = newWorkouts.map((workout, index) => ({
      id: workout.id,
      order: index
    }));

    // Submit the reorder request
    reorderMutation.mutate(workoutOrders);
    
    setDraggedItem(null);
    setDraggedOver(null);
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
                className={`border-2 border-black rounded-lg p-6 transition-all duration-200 bg-background ${
                  draggedItem === workout.id ? 'opacity-50' : ''
                } ${
                  draggedOver === workout.id ? 'transform translate-y-1 shadow-lg' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, workout.id)}
                onDragOver={(e) => handleDragOver(e, workout.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, workout.id)}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-gray-500 cursor-grab active:cursor-grabbing" />
                  <h3 
                    className="text-xl font-bold cursor-pointer flex-1"
                    onClick={() => handleWorkoutClick(workout)}
                  >
                    {workout.name}
                  </h3>
                </div>
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
