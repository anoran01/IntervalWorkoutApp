import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Plus, List, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import WorkoutListSettings from "@/components/workout-list-settings";
import type { Workout, Timer } from "@shared/schema";

interface WorkoutListProps {
  onWorkoutSelect: (workout: Workout, timers: Timer[]) => void;
  onNavigateToQuickCreate: () => void;
}

export default function WorkoutList({ onWorkoutSelect, onNavigateToQuickCreate }: WorkoutListProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [draggedOver, setDraggedOver] = useState<number | null>(null);
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);
  
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
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (workoutId: number) => {
      const response = await apiRequest("DELETE", `/api/workouts/${workoutId}`);
      if (!response.ok) throw new Error('Failed to delete workout');
      return true; // Don't try to parse JSON from 204 response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      setWorkoutToDelete(null);
    },
    onError: (error) => {
      console.error('Delete failed:', error);
      setWorkoutToDelete(null);
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

  const handleDeleteClick = (e: React.MouseEvent, workout: Workout) => {
    e.stopPropagation(); // Prevent workout click
    setWorkoutToDelete(workout);
  };

  const handleConfirmDelete = () => {
    if (workoutToDelete) {
      deleteMutation.mutate(workoutToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between p-4 border-b-2 border-black bg-background">
          <div className="w-10" />
          <h1 className="text-2xl font-bold text-center flex-1">Workout List</h1>
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="w-6 h-6" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center pt-20 pb-20">
          <p className="text-muted-foreground">Loading workouts...</p>
        </div>
        
        {/* Fixed Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t-2 border-black bg-background">
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

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between p-4 border-b-2 border-black bg-background">
        <div className="w-10" />
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

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pt-20 pb-20 p-4 scrollbar-hide">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={(e) => handleDeleteClick(e, workout)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t-2 border-black bg-background">
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50">
          <WorkoutListSettings
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!workoutToDelete} onOpenChange={() => setWorkoutToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{workoutToDelete?.name}"? This action cannot be undone and will permanently remove the workout and all its timers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
