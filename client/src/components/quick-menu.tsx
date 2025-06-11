import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TimePickerModal from "./time-picker-modal";
import CountPickerModal from "./count-picker-modal";
import QuickCreateSettings from "./quick-create-settings";
import type { SoundSettings } from "@shared/schema";

interface QuickWorkoutSettings {
  prepare: number; // in seconds
  work: number;
  rest: number;
  rounds: number;
  cycles: number;
  restBetweenCycles: number;
  soundSettings: SoundSettings;
}

export default function QuickMenu() {
  const [settings, setSettings] = useState<QuickWorkoutSettings>({
    prepare: 6,
    work: 90,
    rest: 30,
    rounds: 4,
    cycles: 6,
    restBetweenCycles: 60,
    soundSettings: {
      beepTone: "standard",
      beepStart: 10,
      tenSecondWarning: true,
      halfwayReminder: true,
      verbalReminder: true,
      vibrate: true,
    },
  });

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCountPicker, setShowCountPicker] = useState(false);
  const [currentEditingField, setCurrentEditingField] = useState<string>("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createWorkoutMutation = useMutation({
    mutationFn: async (data: QuickWorkoutSettings) => {
      const response = await apiRequest("POST", "/api/workouts/quick", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({
        title: "Workout Created",
        description: "Your workout has been created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) {
      return `:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCount = (count: number) => {
    return count.toString();
  };

  const handleCreateWorkout = () => {
    createWorkoutMutation.mutate(settings);
  };

  const handleTimerClick = (type: string) => {
    setCurrentEditingField(type);
    if (type === 'rounds' || type === 'cycles') {
      setShowCountPicker(true);
    } else {
      setShowTimePicker(true);
    }
  };

  const handleTimePickerConfirm = (totalSeconds: number) => {
    setSettings(prev => ({
      ...prev,
      [currentEditingField]: totalSeconds
    }));
    setShowTimePicker(false);
    setCurrentEditingField("");
  };

  const handleCountPickerConfirm = (count: number) => {
    setSettings(prev => ({
      ...prev,
      [currentEditingField]: count
    }));
    setShowCountPicker(false);
    setCurrentEditingField("");
  };

  const handleSoundSettingsChange = (newSoundSettings: SoundSettings) => {
    setSettings(prev => ({
      ...prev,
      soundSettings: newSoundSettings
    }));
  };

  const getModalTitle = () => {
    switch (currentEditingField) {
      case 'prepare': return 'Set Prepare Time';
      case 'work': return 'Set Work Time';
      case 'rest': return 'Set Rest Time';
      case 'restBetweenCycles': return 'Set Rest Between Cycles';
      case 'rounds': return 'Set Number of Rounds';
      case 'cycles': return 'Set Number of Cycles';
      default: return 'Set Value';
    }
  };

  const getCurrentValue = () => {
    return settings[currentEditingField as keyof QuickWorkoutSettings] as number;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl font-bold text-center flex-1">Quick Create</h1>
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="w-6 h-6" />
        </Button>
      </div>

      {/* Timer List */}
      <div className="flex-1 p-4 space-y-3">
        {/* Prepare */}
        <Button
          variant="outline"
          className="w-full h-16 flex justify-between items-center px-6 text-lg font-medium border-2 border-border rounded-lg hover:bg-muted"
          onClick={() => handleTimerClick('prepare')}
        >
          <span>Prepare</span>
          <span className="font-mono">{formatTime(settings.prepare)}</span>
        </Button>

        {/* Work */}
        <Button
          variant="outline"
          className="w-full h-16 flex justify-between items-center px-6 text-lg font-medium border-2 border-border rounded-lg hover:bg-muted"
          onClick={() => handleTimerClick('work')}
        >
          <span>Work</span>
          <span className="font-mono">{formatTime(settings.work)}</span>
        </Button>

        {/* Rest */}
        <Button
          variant="outline"
          className="w-full h-16 flex justify-between items-center px-6 text-lg font-medium border-2 border-border rounded-lg hover:bg-muted"
          onClick={() => handleTimerClick('rest')}
        >
          <span>Rest</span>
          <span className="font-mono">{formatTime(settings.rest)}</span>
        </Button>

        {/* Rounds */}
        <Button
          variant="outline"
          className="w-full h-16 flex justify-between items-center px-6 text-lg font-medium border-2 border-border rounded-lg hover:bg-muted"
          onClick={() => handleTimerClick('rounds')}
        >
          <span>Rounds</span>
          <span className="font-mono">{formatCount(settings.rounds)}</span>
        </Button>

        {/* Cycles */}
        <Button
          variant="outline"
          className="w-full h-16 flex justify-between items-center px-6 text-lg font-medium border-2 border-border rounded-lg hover:bg-muted"
          onClick={() => handleTimerClick('cycles')}
        >
          <span>Cycles</span>
          <span className="font-mono">{formatCount(settings.cycles)}</span>
        </Button>

        {/* Rest Between Cycles */}
        <Button
          variant="outline"
          className="w-full h-16 flex justify-between items-center px-6 text-lg font-medium border-2 border-border rounded-lg hover:bg-muted"
          onClick={() => handleTimerClick('restBetweenCycles')}
        >
          <span>Rest between Cycles</span>
          <span className="font-mono">{formatTime(settings.restBetweenCycles)}</span>
        </Button>
      </div>

      {/* Create Button */}
      <div className="p-4 pt-0">
        <Button
          className="w-full h-16 text-xl font-semibold rounded-lg"
          onClick={handleCreateWorkout}
          disabled={createWorkoutMutation.isPending}
        >
          {createWorkoutMutation.isPending ? "Creating..." : "Create"}
        </Button>
      </div>

      {/* Modals */}
      <TimePickerModal
        isOpen={showTimePicker}
        onClose={() => {
          setShowTimePicker(false);
          setCurrentEditingField("");
        }}
        onConfirm={handleTimePickerConfirm}
        title={getModalTitle()}
        initialSeconds={getCurrentValue()}
        showHours={currentEditingField === 'restBetweenCycles'}
      />

      <CountPickerModal
        isOpen={showCountPicker}
        onClose={() => {
          setShowCountPicker(false);
          setCurrentEditingField("");
        }}
        onConfirm={handleCountPickerConfirm}
        title={getModalTitle()}
        initialCount={getCurrentValue()}
        min={1}
        max={currentEditingField === 'rounds' ? 20 : 10}
      />

      <QuickCreateSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        soundSettings={settings.soundSettings}
        onSoundSettingsChange={handleSoundSettingsChange}
        isDarkMode={isDarkMode}
        onDarkModeChange={setIsDarkMode}
      />
    </div>
  );
}
