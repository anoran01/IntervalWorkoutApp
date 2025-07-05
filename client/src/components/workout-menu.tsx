import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pencil } from "lucide-react";
import { formatTime } from "@/lib/workout-utils";
import { useGetTimers, useUpdateWorkout, useGetWorkouts } from "@/lib/queryClient";
import type { Workout, Timer, SoundSettings, InsertTimer, InsertWorkout } from "@/schema";

interface WorkoutMenuProps {
  workout: Workout;
  onBack: () => void;
  onStart: () => void;
  onEdit: () => void;
}

function TimerItem({ timer }: { timer: Timer }) {
  const getTimerColor = (timerName: string) => {
    const name = timerName.toLowerCase();
    if (name.includes('prepare')) return 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
    if (name.includes('work')) return 'border-orange-500 bg-orange-100 dark:bg-orange-900/30';
    if (name.includes('rest') && !name.includes('cycle')) return 'border-blue-500 bg-blue-100 dark:bg-blue-900/30';
    if (name.includes('cycle')) return 'border-green-500 bg-green-100 dark:bg-green-900/30';
    return 'border-gray-500 bg-gray-100 dark:bg-gray-900/30';
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${getTimerColor(timer.name)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">
            {timer.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">
            {formatTime(timer.duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function WorkoutMenu({ 
  workout, 
  onBack, 
  onStart,
  onEdit,
}: WorkoutMenuProps) {
  const [isEditingWorkoutName, setIsEditingWorkoutName] = useState(false);
  const [workoutNameInput, setWorkoutNameInput] = useState(workout.name);
  const [headerHeight, setHeaderHeight] = useState(80); // Default fallback
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timerListRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const workoutNameInputRef = useRef<HTMLInputElement>(null);

  const { data: timers, isLoading, error } = useGetTimers(workout.id);
  const { data: workouts } = useGetWorkouts();
  const currentWorkout = workouts?.find(w => w.id === workout.id) || workout;
  const updateWorkoutMutation = useUpdateWorkout();

  // Debug logging for timer loading
  useEffect(() => {
    if (timers) {
      console.log(`Successfully loaded ${timers.length} timers for workout ${workout.id}:`, timers);
    }
  }, [timers, workout.id]);

  useEffect(() => {
    if (error) {
      console.error(`Failed to load timers for workout ${workout.id}:`, error);
    }
  }, [error, workout.id]);

  const handleWorkoutNameSave = () => {
    if (workoutNameInput.trim() && workoutNameInput !== workout.name) {
      updateWorkoutMutation.mutate({ id: workout.id, workout: { name: workoutNameInput.trim() } });
    }
    setIsEditingWorkoutName(false);
  };

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditingWorkoutName && workoutNameInputRef.current) {
      workoutNameInputRef.current.focus();
      workoutNameInputRef.current.select();
    }
  }, [isEditingWorkoutName]);

  // Measure header height on mount and when workout name changes
  useEffect(() => {
    const measureHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        setHeaderHeight(height);
      }
    };

    measureHeaderHeight();
    // Re-measure when window resizes or content changes
    window.addEventListener('resize', measureHeaderHeight);

    return () => window.removeEventListener('resize', measureHeaderHeight);
  }, [workout.name, isEditingWorkoutName]);

  return (
    <div className="flex flex-col h-screen bg-background relative">
      {/* Fixed Header */}
      <div ref={headerRef} className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-16 border-b-2 border-foreground bg-background">
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={onBack}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div style={{ width: "1.5rem" }} />
        
        {isEditingWorkoutName ? (
          <input
            ref={workoutNameInputRef}
            type="text"
            value={workoutNameInput}
            onChange={(e) => setWorkoutNameInput(e.target.value)}
            onBlur={handleWorkoutNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleWorkoutNameSave();
              if (e.key === 'Escape') {
                setWorkoutNameInput(workout.name);
                setIsEditingWorkoutName(false);
              }
            }}
            className="text-2xl font-bold text-center bg-transparent border-none outline-none"
          />
        ) : (
          <h1 
            className="text-2xl font-bold text-center flex-1 cursor-pointer"
            onClick={() => setIsEditingWorkoutName(true)}
          >
            {workout.name}
          </h1>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={onEdit}
        >
          <Pencil className="w-6 h-6" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pb-4 scrollbar-hide"
        style={{ scrollBehavior: 'auto',
               paddingTop: `${headerHeight}px` }}
      >
        <div className="pl-4 pr-4 py-4 space-y-6">
          {/* Play Button */}
          <Button
            onClick={onStart}
            className="w-full h-16 text-xl text-foreground font-bold bg-background border-2 border-foreground rounded-lg"
          >
            Play
          </Button>

          {/* Timer List */}
          <div ref={timerListRef} className="space-y-3">
            {timers?.map((timer) => (
              <TimerItem 
                key={timer.id} 
                timer={timer}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}