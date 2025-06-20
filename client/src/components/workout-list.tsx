import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useGetWorkouts, useReorderWorkouts, queryClient, useDeleteWorkout } from "@/lib/queryClient";
import { Settings, Plus, List, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import WorkoutListSettings from "@/components/workout-list-settings";
import type { Workout, Timer } from "@/schema";
import { WorkoutCard } from "./workout-card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface WorkoutListProps {
  onWorkoutSelect: (workout: Workout) => void;
  onNavigateToQuickCreate: () => void;
}

function SortableWorkoutCard({ workout, onSelect }: { workout: Workout; onSelect: () => void; }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: workout.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <WorkoutCard workout={workout} onSelect={onSelect} listeners={listeners} attributes={attributes} />
    </div>
  );
}

export default function WorkoutList({ onWorkoutSelect, onNavigateToQuickCreate }: WorkoutListProps) {
  console.log("WOrkout List WOrkout list WorkoutList");
  const [showSettings, setShowSettings] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);
  
  const { data: workouts, isLoading, error } = useGetWorkouts();
  const reorderMutation = useReorderWorkouts();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const deleteMutation = useDeleteWorkout();

  const handleWorkoutClick = (workout: Workout) => {
    onWorkoutSelect(workout);
  };

  const handleDeleteClick = (e: React.MouseEvent, workout: Workout) => {
    e.stopPropagation(); // Prevent workout click
    setWorkoutToDelete(workout);
  };

  const handleConfirmDelete = () => {
    if (workoutToDelete) {
      deleteMutation.mutate(workoutToDelete.id, {
        onSuccess: () => {
          setWorkoutToDelete(null);
        },
        onError: (error) => {
          console.error('Delete failed:', error);
          setWorkoutToDelete(null);
        },
      });
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (!workouts || !active.id || !over?.id || active.id === over.id) {
      return;
    }

    const oldIndex = workouts.findIndex((w) => w.id === active.id);
    const newIndex = workouts.findIndex((w) => w.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newWorkoutsOrder = arrayMove(workouts, oldIndex, newIndex);
    const workoutIds = newWorkoutsOrder.map((w) => w.id);
    reorderMutation.mutate(workoutIds);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-16 border-b-2 border-black bg-background">
          <div className="w-10" />
          <h1 className="text-2xl font-bold text-center flex-1">Workout List</h1>
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="w-6 h-6" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center pt-32 pb-20">
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
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-16 border-b-2 border-black bg-background">
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
      <div className="flex-1 overflow-y-auto pt-32 pb-20 p-4 scrollbar-hide">
        {!workouts || workouts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No workouts created yet</p>
            <p className="text-sm text-muted-foreground">Use Quick Create to create your first workout</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={workouts.map(w => w.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {workouts.map((workout) => (
                  <SortableWorkoutCard 
                    key={workout.id} 
                    workout={workout} 
                    onSelect={() => handleWorkoutClick(workout)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
