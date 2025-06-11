import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import type { SoundSettings } from "@shared/schema";

interface QuickCreateSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  soundSettings: SoundSettings;
  onSoundSettingsChange: (settings: SoundSettings) => void;
  isDarkMode: boolean;
  onDarkModeChange: (darkMode: boolean) => void;
}

export default function QuickCreateSettings({
  isOpen,
  onClose,
  soundSettings,
  onSoundSettingsChange,
  isDarkMode,
  onDarkModeChange
}: QuickCreateSettingsProps) {
  const [showBeepToneMenu, setShowBeepToneMenu] = useState(false);
  const [showBeepStartMenu, setShowBeepStartMenu] = useState(false);
  const [beepStart, setBeepStart] = useState(soundSettings.beepStart || 10);

  const updateSoundSetting = (key: keyof SoundSettings, value: any) => {
    onSoundSettingsChange({
      ...soundSettings,
      [key]: value
    });
  };

  const handleBeepStartConfirm = (seconds: number) => {
    setBeepStart(seconds);
    updateSoundSetting('beepStart', seconds);
    setShowBeepStartMenu(false);
  };

  const createBeepStartScrollList = () => {
    const items = Array.from({ length: 30 }, (_, i) => i + 1); // 1-30 seconds
    
    return (
      <div className="flex flex-col items-center w-full">
        <div className="h-64 overflow-y-auto border border-border rounded-lg w-full max-w-24">
          <div className="py-20">
            {items.map((item) => (
              <div
                key={item}
                className={`px-4 py-3 text-center cursor-pointer transition-colors text-lg ${
                  item === beepStart
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-muted"
                }`}
                onClick={() => setBeepStart(item)}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-sm h-screen m-0 rounded-none">
          <div className="flex flex-col h-full">
            {/* Header */}
            <DialogHeader className="flex-row items-center space-y-0 pb-4 border-b">
              <Button
                variant="ghost"
                size="sm"
                className="mr-2 p-1"
                onClick={onClose}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <DialogTitle className="flex-1 text-center">Settings</DialogTitle>
              <div className="w-9"></div> {/* Spacer for centering */}
            </DialogHeader>

            {/* Settings List */}
            <div className="flex-1 py-6 space-y-4">
              {/* Dark/Light Mode */}
              <div className="flex items-center justify-between py-3">
                <span className="text-base">Mode</span>
                <Button
                  variant="outline"
                  className="w-20"
                  onClick={() => onDarkModeChange(!isDarkMode)}
                >
                  {isDarkMode ? "Dark" : "Light"}
                </Button>
              </div>

              {/* Beep Tone */}
              <div className="flex items-center justify-between py-3">
                <span className="text-base">Beep Tone</span>
                <Button
                  variant="outline"
                  className="w-32"
                  onClick={() => setShowBeepToneMenu(true)}
                >
                  {soundSettings.beepTone === "standard" ? "Standard" :
                   soundSettings.beepTone === "high_pitch" ? "High Pitch" : "Low Pitch"}
                </Button>
              </div>

              {/* Beep Start */}
              <div className="flex items-center justify-between py-3">
                <span className="text-base">Beep Start</span>
                <Button
                  variant="outline"
                  className="w-20"
                  onClick={() => setShowBeepStartMenu(true)}
                >
                  {beepStart}s
                </Button>
              </div>

              {/* Halfway Reminder */}
              <div className="flex items-center justify-between py-3">
                <span className="text-base">Halfway Reminder</span>
                <Switch
                  checked={soundSettings.halfwayReminder}
                  onCheckedChange={(checked) => updateSoundSetting('halfwayReminder', checked)}
                />
              </div>

              {/* 10 Second Reminder */}
              <div className="flex items-center justify-between py-3">
                <span className="text-base">10 Second Reminder</span>
                <Switch
                  checked={soundSettings.tenSecondWarning}
                  onCheckedChange={(checked) => updateSoundSetting('tenSecondWarning', checked)}
                />
              </div>

              {/* Verbal Reminder */}
              <div className="flex items-center justify-between py-3">
                <span className="text-base">Verbal Reminder</span>
                <Switch
                  checked={soundSettings.verbalReminder}
                  onCheckedChange={(checked) => updateSoundSetting('verbalReminder', checked)}
                />
              </div>
            </div>

            {/* Done Button */}
            <div className="pt-4 border-t">
              <Button
                className="w-full h-12 text-lg font-semibold"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Beep Tone Menu */}
      {showBeepToneMenu && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
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
              className="w-full mt-4"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Beep Start Menu */}
      <Dialog open={showBeepStartMenu} onOpenChange={setShowBeepStartMenu}>
        <DialogContent className="w-full max-w-sm">
          <DialogHeader>
            <DialogTitle>Beep Start (seconds)</DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-center py-4">
            {createBeepStartScrollList()}
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowBeepStartMenu(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => handleBeepStartConfirm(beepStart)} className="flex-1">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}