import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2 } from "lucide-react";
import type { Workout } from "@/schema";
import { dbService } from "@/services/database";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useWorkoutAudioPath } from "@/hooks/use-workout-audio-path";

interface WorkoutCardProps {
  workout: Workout;
  onSelect: () => void;
  // Add drag props from @dnd-kit
  listeners?: any;
  attributes?: any;
}

export function WorkoutCard({ workout, onSelect, listeners, attributes }: WorkoutCardProps) {
  console.log('workout.filePath: ', workout.filePath);
  const audioPath = useWorkoutAudioPath(workout.filePath);
  console.log('audioPath in onSuccess of deleteMutation: ', audioPath);
  
  const deleteMutation = useMutation({
    mutationFn: (id: number) => dbService.deleteWorkout(id),
    onSuccess: async () => {
      try {
        console.log('in onSuccess of deleteMutation using dbService.deleteWorkout');
        // delete the audio file
        try {
          await Filesystem.deleteFile({
            path: audioPath,
            //directory: Directory.Data,
          });
          console.log('Audio file deleted');
        } catch (error) {
          console.error('Error deleting audio file:', error);
        }
        queryClient.invalidateQueries({ queryKey: ["workouts"] });
      } catch (error) {
        console.error('Error in onSuccess of deleteMutation:', error);
      }
    },
  });

  const handleDeleteClick = (e: React.MouseEvent) => {
    console.log('in handleDeleteClick');
    e.stopPropagation(); // Prevent the card's onSelect from firing
    if (window.confirm(`Are you sure you want to delete "${workout.name}"?`)) {
      deleteMutation.mutate(workout.id);
    }
  };

  return (
    <div className="workout-card border-2 border-foreground rounded-lg p-6 bg-background">
      <div className="flex items-center gap-3">
        <div
          className="cursor-grab active:cursor-grabbing p-2 -m-2 touch-none"
          style={{ touchAction: 'none' }}
          {...listeners}
          {...attributes}
        >
          <GripVertical className="w-5 h-5 text-gray-500" />
        </div>
        <h3 className="text-xl font-bold cursor-pointer flex-1" onClick={onSelect}>
          {workout.name}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 text-red-600"
          onClick={handleDeleteClick}
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
} 