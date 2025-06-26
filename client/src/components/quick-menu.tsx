import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAddWorkoutAndTimer } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Settings, Plus, List } from "lucide-react";
import TimePickerModal from "./time-picker-modal";
import CountPickerModal from "./count-picker-modal";
import QuickCreateSettings from "./quick-create-settings";
import { generateTimersFromWorkout } from "@/lib/workout-utils";
import type { SoundSettings, InsertWorkout } from "@/schema";
import { Preferences } from '@capacitor/preferences';
import { audioGeneratorService } from '@/services/audio-generator';

interface QuickWorkoutSettings {
  prepare: number; // in seconds
  work: number;
  rest: number;
  rounds: number;
  cycles: number;
  restBetweenCycles: number;
  soundSettings: SoundSettings;
}

interface QuickMenuProps {
  onNavigateToWorkoutList: () => void;
}

export default function QuickMenu({ onNavigateToWorkoutList }: QuickMenuProps) {
  console.log("📋 QuickMenu component starting");
  const [isCreating, setIsCreating] = useState(false);

  const DEFAULT_SETTINGS: QuickWorkoutSettings = {
    prepare: 5,
    work: 60,
    rest: 30,
    rounds: 4,
    cycles: 6,
    restBetweenCycles: 60,
    soundSettings: {
      beepTone: "low_pitch",
      beepStart: 3,
      tenSecondWarning: true,
      halfwayReminder: true,
      verbalReminder: true,
      vibrate: true,
    },
  };

  // Async load function for Capacitor Preferences
  const loadSettings = async (): Promise<QuickWorkoutSettings> => {
    try {
      const { value } = await Preferences.get({ key: "quickCreateSettings" });
      if (value) {
        return JSON.parse(value);
      }
    } catch (error) {
      console.error("Failed to load settings from Preferences:", error);
    }
    return DEFAULT_SETTINGS;
  };

  const [settings, setSettings] = useState<QuickWorkoutSettings>(DEFAULT_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  console.log("📋 QuickMenu settings:", settings);

  useEffect(() => {
    if (isLoadingSettings) {
      console.log("📋 QuickMenu isLoadingSettings:", isLoadingSettings);
      const loadSettingsAsync = async () => {
        try {
          const loadedSettings = await loadSettings();
          setSettings(loadedSettings);
        } catch (error) {
          console.error("Failed to load settings:", error);
          // Keep default settings on error
        } finally {
          setIsLoadingSettings(false);
        }
      };

      loadSettingsAsync();
    }
  }, []);

  console.log("📋 QuickMenu post use effect");

  // Save settings to @capacitor/preferences whenever they change
  const updateSettings = (newSettings: QuickWorkoutSettings) => {
    setSettings(newSettings);
    Preferences.set({
      key: "quickCreateSettings",
      value: JSON.stringify(newSettings),
    }).catch((error: any) => {
      console.error("Failed to save settings to Preferences:", error);
    });
  };

  console.log("📋 QuickMenu post updateSettings definition");
  
  const [showSettings, setShowSettings] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCountPicker, setShowCountPicker] = useState(false);
  const [currentEditingField, setCurrentEditingField] = useState<string>("");

  console.log("📋 QuickMenu currentEditingField:", currentEditingField);

  const createWorkoutAndTimerMutation = useAddWorkoutAndTimer();

  console.log("📋 QuickMenu post createWorkoutAndTimerMutation definition");

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) {
      return `:${remainingSeconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatCount = (count: number) => {
    return count.toString();
  };

  const handleCreateWorkout = async () => {
    setIsCreating(true);
    console.log("📋 QuickMenu handleCreateWorkout");
    // Create a user-friendly name for the workout based on the current date and time
    const workoutName = `Quick Workout - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

    const newWorkout: InsertWorkout = {
      ...settings,
      name: workoutName,
    };
    console.log("📋 QuickMenu newWorkout:", newWorkout);

    const timers = generateTimersFromWorkout(newWorkout); // doesn't have workout id because it's of type InsertWorkout
    
    console.log("📋 QuickMenu timers:", timers);

    // generate audio file for the workout
    // do I need to process the timers object or is it good as it?
    console.log("⏳ Starting audio generation at:", new Date().toLocaleTimeString());
    const workoutAudioFile = await audioGeneratorService.generateFullWorkoutAudioFile(timers, settings.soundSettings, 'mp3');
    console.log("⏳ Finished audio generation at:", new Date().toLocaleTimeString());

    createWorkoutAndTimerMutation.mutate({workout: newWorkout, timers: timers, filePath: workoutAudioFile}, {
      onSuccess: (workoutId) => {
        console.log(`Created workout ${workoutId} with ${timers.length} timers`);
        setIsCreating(false);
        onNavigateToWorkoutList();
      },
      onError: () => {
        console.error("Failed to create workout");
        setIsCreating(false);
      }
    });

    

  };

  const handleTimerClick = (type: string) => {
    setCurrentEditingField(type);
    if (type === "rounds" || type === "cycles") {
      setShowCountPicker(true);
    } else {
      setShowTimePicker(true);
    }
  };

  const handleTimePickerConfirm = (totalSeconds: number) => {
    const newSettings = {
      ...settings,
      [currentEditingField]: totalSeconds,
    };
    updateSettings(newSettings);
    setShowTimePicker(false);
    setCurrentEditingField("");
  };

  const handleCountPickerConfirm = (count: number) => {
    const newSettings = {
      ...settings,
      [currentEditingField]: count,
    };
    updateSettings(newSettings);
    setShowCountPicker(false);
    setCurrentEditingField("");
  };

  const handleSoundSettingsChange = (newSoundSettings: SoundSettings) => {
    const newSettings = {
      ...settings,
      soundSettings: newSoundSettings,
    };
    updateSettings(newSettings);
  };

  const getModalTitle = () => {
    switch (currentEditingField) {
      case "prepare":
        return "Set Prepare Time";
      case "work":
        return "Set Work Time";
      case "rest":
        return "Set Rest Time";
      case "restBetweenCycles":
        return "Set Rest Between Cycles";
      case "rounds":
        return "Set Number of Rounds";
      case "cycles":
        return "Set Number of Cycles";
      default:
        return "Set Value";
    }
  };

  const getCurrentValue = () => {
    if (!currentEditingField) return 0;
    const value = settings[
      currentEditingField as keyof QuickWorkoutSettings
    ] as number;
    return isNaN(value) ? 0 : value;
  };

  console.log("📋 QuickMenu about to return JSX");
  // Show loading state while settings are being loaded
  if (isLoadingSettings) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <div>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {console.log("📋 Inside QuickMenu JSX")}
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-16 border-b-2 border-black bg-background">
        <div className="w-10" />
        <h1 className="text-2xl font-bold text-center flex-1">Quick Create</h1>
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
      <div className="flex-1 overflow-y-auto pt-32 pb-20 p-4 space-y-2">
        {/* Prepare */}
        <Button
          variant="outline"
          className="w-full h-10 flex justify-between items-center px-6 text-base font-medium border-2 border-black dark:border-white rounded-lg hover:bg-muted"
          onClick={() => handleTimerClick("prepare")}
        >
          <span>Prepare</span>
          <span className="font-mono">{formatTime(settings.prepare)}</span>
        </Button>

        {/* Work */}
        <Button
          variant="outline"
          className="w-full h-10 flex justify-between items-center px-6 text-base font-medium border-2 border-black dark:border-white rounded-lg hover:bg-muted"
          onClick={() => handleTimerClick("work")}
        >
          <span>Work</span>
          <span className="font-mono">{formatTime(settings.work)}</span>
        </Button>

        {/* Rest */}
        <Button
          variant="outline"
          className="w-full h-10 flex justify-between items-center px-6 text-base font-medium border-2 border-black dark:border-white rounded-lg hover:bg-muted"
          onClick={() => handleTimerClick("rest")}
        >
          <span>Rest</span>
          <span className="font-mono">{formatTime(settings.rest)}</span>
        </Button>

        {/* Rounds */}
        <Button
          variant="outline"
          className="w-full h-10 flex justify-between items-center px-6 text-base font-medium border-2 border-black dark:border-white rounded-lg hover:bg-muted"
          onClick={() => handleTimerClick("rounds")}
        >
          <span>Rounds</span>
          <span className="font-mono">{formatCount(settings.rounds)}</span>
        </Button>

        {/* Cycles */}
        <Button
          variant="outline"
          className="w-full h-10 flex justify-between items-center px-6 text-base font-medium border-2 border-black dark:border-white rounded-lg hover:bg-muted"
          onClick={() => handleTimerClick("cycles")}
        >
          <span>Cycles</span>
          <span className="font-mono">{formatCount(settings.cycles)}</span>
        </Button>

        {/* Rest Between Cycles */}
        <Button
          variant="outline"
          className="w-full h-10 flex justify-between items-center px-6 text-base font-medium border-2 border-black dark:border-white rounded-lg hover:bg-muted"
          onClick={() => handleTimerClick("restBetweenCycles")}
        >
          <span>Rest between Cycles</span>
          <span className="font-mono">
            {formatTime(settings.restBetweenCycles)}
          </span>
        </Button>

        {/* Create Button */}
        <Button
          className="w-full h-12 text-lg font-bold bg-background border-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white rounded-lg mt-4"
          onClick={handleCreateWorkout}
          disabled={isCreating || createWorkoutAndTimerMutation.isPending}
        >
          <div className="flex items-center justify-center gap-2">
           {isCreating || createWorkoutAndTimerMutation.isPending ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-black dark:border-white border-t-transparent" />
              <span>Creating...</span>
            </>
           ) : (
            "Create"
           )}
          </div>
        </Button>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t-2 border-black bg-background">
        <div className="flex">
          <button className="flex-1 py-6 px-4 text-center bg-gray-300 dark:bg-gray-600">
            <div className="text-lg font-bold text-black dark:text-white">
              Quick Create
            </div>
          </button>
          <button
            className="flex-1 py-6 px-4 text-center transition-colors duration-200 bg-white dark:bg-gray-900"
            onClick={onNavigateToWorkoutList}
          >
            <div className="text-lg font-bold text-black dark:text-white">
              Workout List
            </div>
          </button>
        </div>
      </div>

      {/* Modals */}
      <TimePickerModal
        key={`time-${currentEditingField}`}
        isOpen={showTimePicker}
        onClose={() => {
          setShowTimePicker(false);
          setCurrentEditingField("");
        }}
        onConfirm={handleTimePickerConfirm}
        title={getModalTitle()}
        initialSeconds={getCurrentValue()}
        showHours={currentEditingField === "restBetweenCycles"}
      />

      <CountPickerModal
        key={`count-${currentEditingField}`}
        isOpen={showCountPicker}
        onClose={() => {
          setShowCountPicker(false);
          setCurrentEditingField("");
        }}
        onConfirm={handleCountPickerConfirm}
        title={getModalTitle()}
        initialCount={getCurrentValue()}
        min={1}
        max={currentEditingField === "rounds" ? 20 : 10}
      />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50">
          <QuickCreateSettings
            onClose={() => setShowSettings(false)}
            soundSettings={settings.soundSettings}
            onSoundSettingsChange={handleSoundSettingsChange}
          />
        </div>
      )}
    </div>
  );
}
