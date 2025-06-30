import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, GripVertical, Plus, Trash2, Settings } from "lucide-react";
import { formatTime } from "@/lib/workout-utils";
import WorkoutSettings from "@/components/workout-settings";
import AddTimerModal from "@/components/add-timer-modal";
import TimePickerModal from "@/components/time-picker-modal";
import { Directory, Filesystem } from "@capacitor/filesystem";
import {
  useGetTimers,
  useInsertTimer,
  useReorderTimers,
  useUpdateWorkout,
  useGetWorkouts,
  useUpdateTimer,
  useDeleteTimer,
} from "@/lib/queryClient";
import type { Workout, Timer, SoundSettings, InsertWorkout } from "@/schema";
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
import { audioGeneratorService } from "@/services/audio-generator";

interface WorkoutEditProps {
  workout: Workout;
  onDone: () => void; // called when regeneration is complete
}

/*
 * SortableTimerItem copied from workout-menu with same behaviour (rename, duration, delete, drag).
 */
function SortableTimerItem({
  timer,
  onEditTimerName,
  onEditTimerDuration,
  onDeleteTimer,
}: {
  timer: Timer;
  onEditTimerName: (id: number, name: string) => void;
  onEditTimerDuration: (id: number, duration: number) => void;
  onDeleteTimer: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: timer.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getTimerColor = (timerName: string) => {
    const name = timerName.toLowerCase();
    if (name.includes("prepare")) return "border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30";
    if (name.includes("work")) return "border-orange-500 bg-orange-100 dark:bg-orange-900/30";
    if (name.includes("rest") && !name.includes("cycle")) return "border-blue-500 bg-blue-100 dark:bg-blue-900/30";
    if (name.includes("cycle")) return "border-green-500 bg-green-100 dark:bg-green-900/30";
    return "border-gray-500 bg-gray-100 dark:bg-gray-900/30";
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the "${timer.name}" timer?`)) {
      onDeleteTimer(timer.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`timer-card border-2 rounded-lg p-4 ${getTimerColor(timer.name)}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5 text-gray-500" />
          </button>
          <span
            className="text-lg font-bold cursor-pointer"
            onClick={() => onEditTimerName(timer.id, timer.name)}
          >
            {timer.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-lg font-bold cursor-pointer"
            onClick={() => onEditTimerDuration(timer.id, timer.duration)}
          >
            {formatTime(timer.duration)}
          </span>
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
    </div>
  );
}

export default function WorkoutEdit({ workout, onDone }: WorkoutEditProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditingWorkoutName, setIsEditingWorkoutName] = useState(false);
  const [workoutNameInput, setWorkoutNameInput] = useState(workout.name);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddTimer, setShowAddTimer] = useState(false);
  const [showTimerDurationPicker, setShowTimerDurationPicker] = useState(false);
  const [editingTimerId, setEditingTimerId] = useState<number | null>(null);
  const [editingTimerDuration, setEditingTimerDuration] = useState(0);
  const [insertPosition, setInsertPosition] = useState(0);

  const [headerHeight, setHeaderHeight] = useState(80);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timerListRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const addTimerButtonRef = useRef<HTMLButtonElement>(null);

  const { data: timers } = useGetTimers(workout.id);
  const { data: workouts } = useGetWorkouts();
  const currentWorkout = workouts?.find((w) => w.id === workout.id) || workout;

  const reorderTimersMutation = useReorderTimers();
  const insertTimerMutation = useInsertTimer();
  const updateWorkoutMutation = useUpdateWorkout();
  const updateTimerMutation = useUpdateTimer();
  const deleteTimerMutation = useDeleteTimer();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleWorkoutNameSave = () => {
    if (workoutNameInput.trim() && workoutNameInput !== workout.name) {
      updateWorkoutMutation.mutate({ id: workout.id, workout: { name: workoutNameInput.trim() } });
    }
    setIsEditingWorkoutName(false);
  };

  /* ------------------- TIMER EDIT HELPERS (same as WorkoutMenu) ------------------- */
  const handleAddTimerConfirm = async (type: string, duration: number) => {
    if (!timers) return;
    const sortedTimers = [...timers].sort((a, b) => a.order - b.order);
    try {
      const tempOrder = sortedTimers.length > 0 ? Math.max(...sortedTimers.map((t) => t.order)) + 1000 : 0;
      const newTimerId = await insertTimerMutation.mutateAsync({
        workoutId: workout.id,
        name: type.charAt(0).toUpperCase() + type.slice(1).replace("_", " "),
        duration,
        type,
        order: tempOrder,
      });
      if (!newTimerId) throw new Error("Failed to insert timer - no ID returned");
      const currentTimerIds = sortedTimers.map((t) => t.id);
      const finalTimerIds = [...currentTimerIds, newTimerId];
      await reorderTimersMutation.mutateAsync({ workoutId: workout.id, timerIds: finalTimerIds });
    } catch (error) {
      console.error("Failed to insert timer with positional reordering:", error);
    }
    setShowAddTimer(false);
  };

  const handleTimerDurationClick = (timerId: number, currentDuration: number) => {
    setEditingTimerId(timerId);
    setEditingTimerDuration(currentDuration);
    setShowTimerDurationPicker(true);
  };

  const handleTimerDurationConfirm = (newDuration: number) => {
    if (editingTimerId !== null && newDuration > 0) {
      updateTimerMutation.mutate({ id: editingTimerId, updates: { duration: newDuration } });
    }
    setShowTimerDurationPicker(false);
    setEditingTimerId(null);
  };

  const handleDeleteTimer = (timerId: number) => {
    deleteTimerMutation.mutate(timerId);
  };

  /* ------------------- DONE BUTTON (AUDIO REGENERATION) ------------------- */
  const regenerateWorkoutAudio = async () => {
    try {
      if (!timers) return;
      // Delete old audio file if present
      if (workout.filePath) {
        try {
          // Extract relative path from URI (e.g., file:///path/to/Documents/workouts/workout_6_full.mp3)
          // The filePath is a URI, so we need to extract just the relative path part
          let relativePath = workout.filePath;
          
          // If it's a file URI, extract the path after Documents/
          if (relativePath.includes("Documents/")) {
            const documentsIndex = relativePath.indexOf("Documents/");
            relativePath = relativePath.substring(documentsIndex + "Documents/".length);
          }
          
          // Remove any leading slashes and platform prefixes
          relativePath = relativePath.replace(/^\/+/, "").replace(/^Documents\//, "");
          
          await Filesystem.deleteFile({ path: relativePath, directory: Directory.Data });
          console.log("✅ Deleted old audio file", relativePath);
        } catch (err) {
          console.warn("Could not delete old audio file, continuing", err);
        }
      }

      // Build InsertTimer-like array expected by audio generator
      const timerInputs = timers.map((t) => ({
        id: t.id.toString(),
        duration: t.duration,
        name: t.name,
        type: t.type,
        workoutId: workout.id,
        order: t.order,
      }));

      console.log("⏳ Regenerating workout audio…");
      const newFileUri = await audioGeneratorService.generateFullWorkoutAudioFile(
        timerInputs,
        currentWorkout.soundSettings,
        "mp3"
      );
      console.log("✅ Audio regenerated", newFileUri);

      // Update workout with new filePath - need to use a different approach since filePath is not in InsertWorkout
      await updateWorkoutMutation.mutateAsync({ id: workout.id, workout: { soundSettings: currentWorkout.soundSettings } });
      
      // Update filePath separately using direct database call
      const { dbService } = await import("@/services/database");
      await dbService.updateWorkout(workout.id, { filePath: newFileUri } as any);
    } catch (err) {
      console.error("Failed to regenerate workout audio", err);
    }
  };

  const handleDoneClick = async () => {
    setIsProcessing(true);
    await regenerateWorkoutAudio();
    setIsProcessing(false);
    onDone();
  };

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

  /* ------------------- RENDER ------------------- */
  const defaultSoundSettings: SoundSettings = {
    beepTone: "standard",
    beepStart: 10,
    tenSecondWarning: true,
    halfwayReminder: true,
    verbalReminder: true,
    vibrate: true,
  };

  const sensorsList = sensors; // keep sensors variable for dnd context

  return (
    <div className="flex flex-col h-screen bg-background relative">
      {/* Header with Done button */}
      <div
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-16 border-b-2 border-black bg-background"
      >
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={handleDoneClick}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black dark:border-white border-t-transparent" />
          ) : (
            <Check className="w-6 h-6" />
          )}
        </Button>
        
        {isEditingWorkoutName ? (
          <input
            type="text"
            value={workoutNameInput}
            onChange={(e) => setWorkoutNameInput(e.target.value)}
            onBlur={handleWorkoutNameSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleWorkoutNameSave();
              if (e.key === "Escape") {
                setWorkoutNameInput(workout.name);
                setIsEditingWorkoutName(false);
              }
            }}
            className="text-2xl font-bold text-center bg-transparent border-none outline-none flex-1"
            autoFocus
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
          onClick={() => setShowSettings(true)}
        >
          <Settings className="w-6 h-6" />
        </Button>
      </div>

      {/* Scrollable Content (timers & add/modify) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pb-4 scrollbar-hide"
        style={{ scrollBehavior: "auto", paddingTop: `${headerHeight}px` }}
      >
        <div className="pl-4 pr-4 py-4 space-y-6">
          {/* Add Timer Button */}
          <Button
            onClick={() => setShowAddTimer(true)}
            className="w-full h-16 text-xl font-bold bg-background border-2 border-gray-300 text-black dark:text-white rounded-lg"
          >
            <Plus className="w-6 h-6 mr-2" />
            Add Timer
          </Button>

          {/* Timer List with drag-drop */}
          <DndContext 
            sensors={sensorsList} 
            collisionDetection={closestCenter} 
            onDragEnd={({ active, over }) => {
              if (!timers || !over) return;
              if (active.id === over.id) return;
              const oldIndex = timers.findIndex((t) => t.id === active.id);
              const newIndex = timers.findIndex((t) => t.id === over.id);
              const newOrder = arrayMove(timers, oldIndex, newIndex);
              const ids = newOrder.map((t) => t.id);
              reorderTimersMutation.mutate({ workoutId: workout.id, timerIds: ids });
            }}
            autoScroll={{
              enabled: true,
              threshold: {
                x: 0,
                y: 0.15,
              },
              acceleration: 10,
            }}
          >
            <SortableContext items={timers?.map((t) => t.id) || []} strategy={verticalListSortingStrategy}>
              <div ref={timerListRef} className="space-y-3">
                {timers?.map((timer) => (
                  <SortableTimerItem
                    key={timer.id}
                    timer={timer}
                    onEditTimerName={(id, name) => {
                      const newName = prompt("Enter timer name:", name);
                      if (newName && newName.trim()) {
                        updateTimerMutation.mutate({ id, updates: { name: newName.trim() } });
                      }
                    }}
                    onEditTimerDuration={handleTimerDurationClick}
                    onDeleteTimer={handleDeleteTimer}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50">
          <WorkoutSettings
            workoutName={currentWorkout.name}
            soundSettings={(currentWorkout.soundSettings as SoundSettings) || defaultSoundSettings}
            onSave={(settings) => {
              const workoutUpdate: Partial<InsertWorkout> = { soundSettings: settings };
              updateWorkoutMutation.mutate({ id: workout.id, workout: workoutUpdate });
            }}
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}

      {/* Add Timer Modal */}
      {showAddTimer && (
        <AddTimerModal isOpen={showAddTimer} onClose={() => setShowAddTimer(false)} onConfirm={handleAddTimerConfirm} />
      )}

      {/* Time Picker Modal */}
      {showTimerDurationPicker && (
        <TimePickerModal
          isOpen={showTimerDurationPicker}
          onClose={() => {
            setShowTimerDurationPicker(false);
            setEditingTimerId(null);
          }}
          onConfirm={handleTimerDurationConfirm}
          title="Edit Timer Duration"
          initialSeconds={editingTimerDuration}
          showHours={true}
        />
      )}
    </div>
  );
} 