
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import BeepStartPicker from "@/components/beep-start-picker";
import type { SoundSettings } from "@shared/schema";

interface QuickCreateSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  soundSettings: SoundSettings;
  onSoundSettingsChange: (settings: SoundSettings) => void;
}

export default function QuickCreateSettings({
  isOpen,
  onClose,
  soundSettings,
  onSoundSettingsChange
}: QuickCreateSettingsProps) {
  const { theme, toggleTheme } = useTheme();
  const [showBeepToneMenu, setShowBeepToneMenu] = useState(false);
  const [showBeepStartPicker, setShowBeepStartPicker] = useState(false);

  const updateSoundSetting = (key: keyof SoundSettings, value: any) => {
    onSoundSettingsChange({
      ...soundSettings,
      [key]: value
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="flex flex-col h-screen bg-background border-2 border-gray-300 dark:border-gray-600 rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-foreground">
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
        <div className="flex-1 p-6 space-y-8">
          {/* Dark/Light Mode */}
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold">Mode</span>
            <div className="relative flex items-center">
              <span className="mr-3 text-base font-medium">
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
              <div 
                className={`w-16 h-8 rounded-full border-2 border-foreground cursor-pointer transition-colors ${
                  theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                }`}
                onClick={toggleTheme}
              >
                <div 
                  className={`w-6 h-6 bg-white rounded-full border-2 border-foreground transition-transform duration-200 ${
                    theme === 'dark' ? 'translate-x-8' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Beep Tone */}
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold">Beep Tone</span>
            <Button
              variant="outline"
              className="min-w-20 h-10 border-2 border-foreground rounded-lg font-bold text-base bg-white hover:bg-gray-100 text-black"
              onClick={() => setShowBeepToneMenu(true)}
            >
              {soundSettings.beepTone === "standard" ? "Standard" :
               soundSettings.beepTone === "high_pitch" ? "High" : "Low"}
            </Button>
          </div>

          {/* Beep Start */}
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold">Beep Start</span>
            <div className="w-32">
              <Button
                variant="outline"
                className="w-full border-2 border-foreground rounded-lg text-left justify-start"
                onClick={() => setShowBeepStartPicker(true)}
              >
                {soundSettings.beepStart}
              </Button>
            </div>
          </div>

          {/* Halfway Reminder */}
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold">Halfway Reminder</span>
            <div 
              className="w-8 h-8 border-2  rounded flex items-center justify-center cursor-pointer"
              onClick={() => updateSoundSetting('halfwayReminder', !soundSettings.halfwayReminder)}
            >
              {soundSettings.halfwayReminder && (
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
              className="w-8 h-8 border-2  rounded flex items-center justify-center cursor-pointer"
              onClick={() => updateSoundSetting('tenSecondWarning', !soundSettings.tenSecondWarning)}
            >
              {soundSettings.tenSecondWarning && (
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
              className="w-8 h-8 border-2  rounded flex items-center justify-center cursor-pointer"
              onClick={() => updateSoundSetting('verbalReminder', !soundSettings.verbalReminder)}
            >
              {soundSettings.verbalReminder && (
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
            onClick={onClose}
            className="w-full h-16 text-xl font-bold bg-background border-2  hover:bg-gray-100 dark:hover:bg-gray-800  rounded-lg"
          >
            Done
          </Button>
        </div>
      </div>

      {/* Beep Tone Menu */}
      {showBeepToneMenu && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-sm p-6">
            <div className="flex flex-col space-y-1.5 text-center mb-4">
              <h2 className="text-lg font-semibold leading-none tracking-tight">Beep Tone</h2>
            </div>
            
            <div className="py-4 space-y-2">
              {["standard", "high_pitch", "low_pitch"].map((tone) => (
                <Button
                  key={tone}
                  variant={soundSettings.beepTone === tone ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => {
                    updateSoundSetting('beepTone', tone as any);
                    setShowBeepToneMenu(false);
                  }}
                >
                  {tone === "standard" ? "Standard" :
                   tone === "high_pitch" ? "High Pitch" : "Low Pitch"}
                </Button>
              ))}
            </div>
            
            <Button
              onClick={() => setShowBeepToneMenu(false)}
              className="w-full mt-4 border-2 "
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Beep Start Picker */}
      <BeepStartPicker
        isOpen={showBeepStartPicker}
        onClose={() => setShowBeepStartPicker(false)}
        onConfirm={(seconds) => updateSoundSetting('beepStart', seconds)}
        initialValue={soundSettings.beepStart}
      />
    </>
  );
}
