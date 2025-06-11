import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
      tenSecondWarning: true,
      halfwayReminder: false,
      vibrate: true,
    },
  });

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
      return `0:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const updateSetting = (key: keyof Omit<QuickWorkoutSettings, 'soundSettings'>, delta: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: Math.max(1, prev[key] + delta)
    }));
  };

  const handleCreateWorkout = () => {
    createWorkoutMutation.mutate(settings);
  };

  return (
    <div className="px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-white">Quick Workout</h1>
        <p className="text-gray-400">Create a custom interval workout</p>
      </div>

      {/* Workout Settings */}
      <div className="space-y-4 mb-6">
        {/* Prepare */}
        <div className="app-gray rounded-lg p-4">
          <div className="flex justify-between items-center">
            <label className="text-white font-medium">Prepare</label>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 rounded-full app-gray-light p-0"
                onClick={() => updateSetting('prepare', -1)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-16 text-center font-mono text-lg text-white">
                {formatTime(settings.prepare)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 rounded-full app-gray-light p-0"
                onClick={() => updateSetting('prepare', 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Work */}
        <div className="app-gray rounded-lg p-4">
          <div className="flex justify-between items-center">
            <label className="text-white font-medium">Work</label>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 rounded-full app-gray-light p-0"
                onClick={() => updateSetting('work', -5)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-16 text-center font-mono text-lg text-white">
                {formatTime(settings.work)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 rounded-full app-gray-light p-0"
                onClick={() => updateSetting('work', 5)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Rest */}
        <div className="app-gray rounded-lg p-4">
          <div className="flex justify-between items-center">
            <label className="text-white font-medium">Rest</label>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 rounded-full app-gray-light p-0"
                onClick={() => updateSetting('rest', -5)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-16 text-center font-mono text-lg text-white">
                {formatTime(settings.rest)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 rounded-full app-gray-light p-0"
                onClick={() => updateSetting('rest', 5)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Rounds */}
        <div className="app-gray rounded-lg p-4">
          <div className="flex justify-between items-center">
            <label className="text-white font-medium">Rounds</label>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 rounded-full app-gray-light p-0"
                onClick={() => updateSetting('rounds', -1)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-16 text-center font-mono text-lg text-white">
                {settings.rounds}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 rounded-full app-gray-light p-0"
                onClick={() => updateSetting('rounds', 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Cycles */}
        <div className="app-gray rounded-lg p-4">
          <div className="flex justify-between items-center">
            <label className="text-white font-medium">Cycles</label>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 rounded-full app-gray-light p-0"
                onClick={() => updateSetting('cycles', -1)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-16 text-center font-mono text-lg text-white">
                {settings.cycles}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 rounded-full app-gray-light p-0"
                onClick={() => updateSetting('cycles', 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Rest Between Cycles */}
        <div className="app-gray rounded-lg p-4">
          <div className="flex justify-between items-center">
            <label className="text-white font-medium">Rest Between Cycles</label>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 rounded-full app-gray-light p-0"
                onClick={() => updateSetting('restBetweenCycles', -5)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-16 text-center font-mono text-lg text-white">
                {formatTime(settings.restBetweenCycles)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 rounded-full app-gray-light p-0"
                onClick={() => updateSetting('restBetweenCycles', 5)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Workout Button */}
      <Button
        className="w-full work-color font-semibold py-4 text-lg mb-6"
        onClick={handleCreateWorkout}
        disabled={createWorkoutMutation.isPending}
      >
        {createWorkoutMutation.isPending ? "Creating..." : "Create Workout"}
      </Button>

      {/* Sound Settings */}
      <div className="app-gray rounded-lg p-4">
        <h3 className="font-semibold mb-3 flex items-center text-white">
          <Volume2 className="w-5 h-5 mr-2" />
          Sound Settings
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white">Beep Tone</span>
            <Select
              value={settings.soundSettings.beepTone}
              onValueChange={(value: "standard" | "high_pitch" | "low_pitch") =>
                setSettings(prev => ({
                  ...prev,
                  soundSettings: { ...prev.soundSettings, beepTone: value }
                }))
              }
            >
              <SelectTrigger className="w-32 app-gray-light border-none text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="high_pitch">High Pitch</SelectItem>
                <SelectItem value="low_pitch">Low Pitch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-white">10 Second Warning</span>
            <Switch
              checked={settings.soundSettings.tenSecondWarning}
              onCheckedChange={(checked) =>
                setSettings(prev => ({
                  ...prev,
                  soundSettings: { ...prev.soundSettings, tenSecondWarning: checked }
                }))
              }
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-white">Halfway Reminder</span>
            <Switch
              checked={settings.soundSettings.halfwayReminder}
              onCheckedChange={(checked) =>
                setSettings(prev => ({
                  ...prev,
                  soundSettings: { ...prev.soundSettings, halfwayReminder: checked }
                }))
              }
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-white">Vibrate on Timer Change</span>
            <Switch
              checked={settings.soundSettings.vibrate}
              onCheckedChange={(checked) =>
                setSettings(prev => ({
                  ...prev,
                  soundSettings: { ...prev.soundSettings, vibrate: checked }
                }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
