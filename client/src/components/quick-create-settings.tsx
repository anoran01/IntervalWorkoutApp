import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import BeepStartPicker from "@/components/beep-start-picker";
import type { SoundSettings } from "@shared/schema";
import { useTheme } from "@/lib/theme-context";
import { useAudio } from "@/hooks/use-audio";

interface QuickCreateSettingsProps {
  soundSettings: SoundSettings;
  onSoundSettingsChange: (settings: SoundSettings) => void;
  onClose: () => void;
}

export default function QuickCreateSettings({  
  soundSettings, 
  onSoundSettingsChange, 
  onClose 
}: QuickCreateSettingsProps) {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<SoundSettings>(soundSettings);
  const [showBeepStartPicker, setShowBeepStartPicker] = useState(false);
  const { playBeep } = useAudio(settings);

  const handleSave = () => {
    onSoundSettingsChange(settings);
    onClose();
  };

  const updateSetting = (key: keyof SoundSettings, value: any) => {
    setSettings({
      ...settings,
      [key]: value
    });
  };
  
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    console.log('settings.beepTone', settings.beepTone);
    playBeep();
  }, [settings.beepTone]);

  return (
    <div className="flex flex-col h-screen bg-background border-2 border-gray-300 dark:border-gray-600 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black">
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={onClose}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold text-center flex-1">Settings</h1>
        <div className="w-10" />
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-6 space-y-4">
        {/* Dark/Light Mode */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">Mode</span>
          <div className="relative flex items-center">
            <span className="mr-3 text-base font-medium">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
            <div 
              className={`w-16 h-8 rounded-full border-2 border-black cursor-pointer transition-colors ${
                theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
              }`}
              onClick={toggleTheme}
            >
              <div 
                className={`w-6 h-6 bg-white rounded-full border-2 border-black transition-transform duration-200 ${
                  theme === 'dark' ? 'translate-x-8' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>
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

        {/* Beep Start */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">Beep Start</span>
          <div className="w-32">
            <Button
              variant="outline"
              className="w-full border-2 border-black rounded-lg text-left justify-start"
              onClick={() => setShowBeepStartPicker(true)}
            >
              {settings.beepStart}
            </Button>
          </div>
        </div>

        {/* Halfway Reminder */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">Halfway Reminder</span>
          <div 
            className="w-8 h-8 border-2 border-black dark:border-white rounded flex items-center justify-center cursor-pointer"
            onClick={() => updateSetting("halfwayReminder", !settings.halfwayReminder)}
          >
            {settings.halfwayReminder && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            )}
          </div>
        </div>

        {/* 10 Second Reminder */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">10 second Reminder</span>
          <div 
            className="w-8 h-8 border-2 border-black dark:border-white rounded flex items-center justify-center cursor-pointer"
            onClick={() => updateSetting("tenSecondWarning", !settings.tenSecondWarning)}
          >
            {settings.tenSecondWarning && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            )}
          </div>
        </div>

        {/* Verbal Reminder */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">Verbal Reminder</span>
          <div 
            className="w-8 h-8 border-2 border-black dark:border-white rounded flex items-center justify-center cursor-pointer"
            onClick={() => updateSetting("verbalReminder", !settings.verbalReminder)}
          >
            {settings.verbalReminder && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Done Button */}
      <div className="p-6">
        <Button
          onClick={handleSave}
          className="w-full h-16 text-xl font-bold bg-background border-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white rounded-lg"
        >
          Done
        </Button>
      </div>

      {/* Beep Start Picker Modal */}
      <BeepStartPicker
        isOpen={showBeepStartPicker}
        onClose={() => setShowBeepStartPicker(false)}
        onConfirm={(seconds) => updateSetting("beepStart", seconds)}
        initialValue={settings.beepStart}
      />
    </div>
  );
}