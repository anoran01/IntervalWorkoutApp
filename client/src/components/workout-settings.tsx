import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SoundSettings } from "@shared/schema";

interface WorkoutSettingsProps {
  workoutName: string;
  soundSettings: SoundSettings;
  onSave: (settings: SoundSettings) => void;
  onClose: () => void;
}

export default function WorkoutSettings({ 
  workoutName, 
  soundSettings, 
  onSave, 
  onClose 
}: WorkoutSettingsProps) {
  const [settings, setSettings] = useState<SoundSettings>(soundSettings);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const updateSetting = (key: keyof SoundSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b-2 border-black">
        <h1 className="text-2xl font-bold text-center">{workoutName} Settings</h1>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-6 space-y-8">
        {/* Beep Tone */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">Beep Tone</span>
          <div className="w-32">
            <Select
              value={settings.beepTone}
              onValueChange={(value: "standard" | "high_pitch" | "low_pitch") => 
                updateSetting("beepTone", value)
              }
            >
              <SelectTrigger className="border-2 border-black rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="high_pitch">High</SelectItem>
                <SelectItem value="low_pitch">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Beep Start (renamed from Beep Count as per mockup) */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">Beep Count</span>
          <div className="w-32">
            <Select
              value={settings.beepStart.toString()}
              onValueChange={(value: string) => 
                updateSetting("beepStart", parseInt(value))
              }
            >
              <SelectTrigger className="border-2 border-black rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Halfway Reminder */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">Halfway Reminder</span>
          <div className="w-8 h-8 border-2 border-black rounded flex items-center justify-center">
            <Checkbox
              checked={settings.halfwayReminder}
              onCheckedChange={(checked) => 
                updateSetting("halfwayReminder", !!checked)
              }
              className="border-none"
            />
          </div>
        </div>

        {/* 10 Second Reminder */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">10 second Reminder</span>
          <div className="w-8 h-8 border-2 border-black rounded flex items-center justify-center">
            <Checkbox
              checked={settings.tenSecondWarning}
              onCheckedChange={(checked) => 
                updateSetting("tenSecondWarning", !!checked)
              }
              className="border-none"
            />
          </div>
        </div>

        {/* Verbal Reminder */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">Verbal Reminder</span>
          <div className="w-8 h-8 border-2 border-black rounded flex items-center justify-center">
            <Checkbox
              checked={settings.verbalReminder}
              onCheckedChange={(checked) => 
                updateSetting("verbalReminder", !!checked)
              }
              className="border-none"
            />
          </div>
        </div>
      </div>

      {/* Done Button */}
      <div className="p-6">
        <Button
          onClick={handleSave}
          className="w-full h-16 text-xl font-bold bg-background border-2 border-black hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white rounded-lg"
        >
          Done
        </Button>
      </div>
    </div>
  );
}