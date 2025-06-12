import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Play } from "lucide-react";
import { formatTime } from "@/lib/workout-utils";
import WorkoutSettings from "@/components/workout-settings";
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
}

export default function WorkoutMenu({ 
  workout, 
  timers, 
  onBack, 
  onStart,
  onEditWorkoutName,
  onEditTimerName,
  onEditTimerDuration,
  onUpdateSoundSettings
}: WorkoutMenuProps) {
  const [isEditingWorkoutName, setIsEditingWorkoutName] = useState(false);
  const [workoutNameInput, setWorkoutNameInput] = useState(workout.name);
  const [showSettings, setShowSettings] = useState(false);

  const handleWorkoutNameSave = () => {
    if (workoutNameInput.trim() && workoutNameInput !== workout.name) {
      onEditWorkoutName(workoutNameInput.trim());
    }
    setIsEditingWorkoutName(false);
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

  if (showSettings) {
    // Provide default sound settings if none exist
    const defaultSoundSettings: SoundSettings = {
      beepTone: "standard",
      beepStart: 10,
      tenSecondWarning: true,
      halfwayReminder: true,
      verbalReminder: true,
      vibrate: true
    };

    const currentSoundSettings = workout.soundSettings as SoundSettings || defaultSoundSettings;

    return (
      <WorkoutSettings
        workoutName={workout.name}
        soundSettings={currentSoundSettings}
        onSave={onUpdateSoundSettings}
        onClose={() => setShowSettings(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black">
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

      {/* Content */}
      <div className="flex-1 p-4 space-y-6">
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
              className={`border-2 rounded-lg p-4 ${getTimerColor(timer.name, index)}`}
            >
              <div className="flex items-center justify-between">
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
  );
}