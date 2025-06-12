import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Play, GripVertical, Plus } from "lucide-react";
import { formatTime } from "@/lib/workout-utils";
import WorkoutSettings from "@/components/workout-settings";
import AddTimerModal from "@/components/add-timer-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import type { Workout, Timer, SoundSettings } from "@shared/schema";

interface WorkoutMenuProps {
  workout: Workout;
  timers: Timer[];
  onBack: () => void;
  onStart: () => void;
  onEditWorkoutName: (name: string) => void;
  onEditTimerName: (timerId: number, name: string) => void;
  onEditTimerDuration: (timerId: number, duration: number) => void;
  onUpdateSoundSettings: (settings: SoundSettings) => void;
  onTimersReordered: () => void;
}

export default function WorkoutMenu({ 
  workout, 
  timers, 
  onBack, 
  onStart,
  onEditWorkoutName,
  onEditTimerName,
  onEditTimerDuration,
  onUpdateSoundSettings,
  onTimersReordered
}: WorkoutMenuProps) {
  const [isEditingWorkoutName, setIsEditingWorkoutName] = useState(false);
  const [workoutNameInput, setWorkoutNameInput] = useState(workout.name);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddTimer, setShowAddTimer] = useState(false);
  const [insertPosition, setInsertPosition] = useState(0);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [draggedOver, setDraggedOver] = useState<number | null>(null);

  const reorderMutation = useMutation({
    mutationFn: async (timerOrders: { id: number; order: number }[]) => {
      const response = await fetch(`/api/workouts/${workout.id}/timers/reorder`, {
        method: 'PATCH',
        body: JSON.stringify(timerOrders),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to reorder timers');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workouts', workout.id, 'timers'] });
      onTimersReordered();
    },
  });

  const addTimerMutation = useMutation({
    mutationFn: async ({ type, duration, position }: { type: string; duration: number; position: number }) => {
      const response = await fetch(`/api/workouts/${workout.id}/timers/insert`, {
        method: 'POST',
        body: JSON.stringify({
          name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
          type,
          duration,
          position
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to add timer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workouts', workout.id, 'timers'] });
      onTimersReordered();
    },
  });

  const handleWorkoutNameSave = () => {
    if (workoutNameInput.trim() && workoutNameInput !== workout.name) {
      onEditWorkoutName(workoutNameInput.trim());
    }
    setIsEditingWorkoutName(false);
  };

  const handleDragStart = (e: React.DragEvent, timerId: number) => {
    setDraggedItem(timerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, timerId: number) => {
    e.preventDefault();
    setDraggedOver(timerId);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = (e: React.DragEvent, targetTimerId: number) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetTimerId) {
      setDraggedItem(null);
      setDraggedOver(null);
      return;
    }

    // Find the indices of the dragged and target items
    const draggedIndex = timers.findIndex(t => t.id === draggedItem);
    const targetIndex = timers.findIndex(t => t.id === targetTimerId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      setDraggedOver(null);
      return;
    }

    // Create new order by moving the dragged item to the target position
    const newTimers = [...timers];
    const [draggedTimer] = newTimers.splice(draggedIndex, 1);
    newTimers.splice(targetIndex, 0, draggedTimer);

    // Update orders based on new positions
    const timerOrders = newTimers.map((timer, index) => ({
      id: timer.id,
      order: index
    }));

    // Submit the reorder request
    reorderMutation.mutate(timerOrders);
    
    setDraggedItem(null);
    setDraggedOver(null);
  };

  const handleAddTimer = (position: number) => {
    setInsertPosition(position);
    setShowAddTimer(true);
  };

  const handleAddTimerConfirm = (type: string, duration: number) => {
    addTimerMutation.mutate({ type, duration, position: insertPosition });
    setShowAddTimer(false);
  };

  const getTimerColor = (timerName: string, index: number) => {
    const name = timerName.toLowerCase();
    if (name.includes('prepare')) return 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
    if (name.includes('work')) return 'border-orange-500 bg-orange-100 dark:bg-orange-900/30';
    if (name.includes('rest') && !name.includes('cycle')) return 'border-blue-500 bg-blue-100 dark:bg-blue-900/30';
    if (name.includes('cycle')) return 'border-green-500 bg-green-100 dark:bg-green-900/30';
    
    // Fallback color cycling
    const colors = [
      'border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
      'border-orange-500 bg-orange-100 dark:bg-orange-900/30', 
      'border-blue-500 bg-blue-100 dark:bg-blue-900/30',
      'border-green-500 bg-green-100 dark:bg-green-900/30'
    ];
    return colors[index % colors.length];
  };

  const defaultSoundSettings: SoundSettings = {
    beepTone: "standard",
    beepStart: 10,
    tenSecondWarning: true,
    halfwayReminder: true,
    verbalReminder: true,
    vibrate: true
  };

  return (
    <div className="flex flex-col h-screen bg-background relative">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between p-4 border-b-2 border-black bg-background">
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={onBack}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        
        {isEditingWorkoutName ? (
          <input
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

      {/* Fixed Add Timer Button - positioned in middle of screen */}
      <div className="fixed top-1/2 left-0 right-0 z-30 flex items-center px-4 transform -translate-y-1/2">
        <button
          onClick={() => handleAddTimer(Math.floor(timers.length / 2))}
          className="w-8 h-8 rounded-full border-2 border-black bg-background flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="flex-1 h-0.5 bg-black ml-3"></div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pt-20 pb-4">
        <div className="p-4 space-y-6">
          {/* Play Button */}
          <Button
            onClick={onStart}
            className="w-full h-16 text-xl font-bold bg-background border-2 border-black hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white rounded-lg"
          >
            Play
          </Button>

          {/* Timer List */}
          <div className="space-y-3">
            {timers.map((timer, index) => (
              <div
                key={timer.id}
                className={`border-2 rounded-lg p-4 transition-all duration-200 ${getTimerColor(timer.name, index)} ${
                  draggedItem === timer.id ? 'opacity-50' : ''
                } ${
                  draggedOver === timer.id ? 'transform translate-y-1 shadow-lg' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, timer.id)}
                onDragOver={(e) => handleDragOver(e, timer.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, timer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-gray-500 cursor-grab active:cursor-grabbing" />
                    <span 
                      className="text-lg font-bold cursor-pointer"
                      onClick={() => {
                        const newName = prompt('Enter timer name:', timer.name);
                        if (newName && newName.trim() && newName !== timer.name) {
                          onEditTimerName(timer.id, newName.trim());
                        }
                      }}
                    >
                      {timer.name}
                    </span>
                  </div>
                  <span 
                    className="text-lg font-bold cursor-pointer"
                    onClick={() => {
                      const newDuration = prompt('Enter duration in seconds:', timer.duration.toString());
                      if (newDuration && !isNaN(Number(newDuration)) && Number(newDuration) > 0) {
                        onEditTimerDuration(timer.id, Number(newDuration));
                      }
                    }}
                  >
                    {formatTime(timer.duration)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <WorkoutSettings
          workoutName={workout.name}
          soundSettings={workout.soundSettings as SoundSettings || defaultSoundSettings}
          onSave={onUpdateSoundSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Add Timer Modal */}
      {showAddTimer && (
        <AddTimerModal
          isOpen={showAddTimer}
          onClose={() => setShowAddTimer(false)}
          onConfirm={handleAddTimerConfirm}
        />
      )}
    </div>
  );
}