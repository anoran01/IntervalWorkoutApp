import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
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
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout>();
    const itemHeight = 48; // Height of each item
    const containerHeight = 192; // Height of visible area
    
    // Auto-scroll to current value when component mounts
    useEffect(() => {
      if (scrollRef.current) {
        const paddingTop = containerHeight / 2 - itemHeight / 2;
        const scrollPosition = (beepStart - 1) * itemHeight + paddingTop;
        scrollRef.current.scrollTop = scrollPosition;
      }
    }, []);

    const handleScroll = () => {
      if (!scrollRef.current) return;
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      const scrollTop = scrollRef.current.scrollTop;
      const paddingTop = containerHeight / 2 - itemHeight / 2;
      
      // Calculate which item is currently centered  
      const adjustedScrollTop = scrollTop - paddingTop;
      const itemIndex = Math.round(adjustedScrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, itemIndex));
      
      // Update selected value
      setBeepStart(items[clampedIndex]);
      
      // Set timeout to snap to position after scrolling stops
      scrollTimeoutRef.current = setTimeout(() => {
        if (!scrollRef.current) return;
        
        const currentScrollTop = scrollRef.current.scrollTop;
        const currentPaddingTop = containerHeight / 2 - itemHeight / 2;
        const currentAdjustedScrollTop = currentScrollTop - currentPaddingTop;
        const currentItemIndex = Math.round(currentAdjustedScrollTop / itemHeight);
        const currentClampedIndex = Math.max(0, Math.min(items.length - 1, currentItemIndex));
        
        // Calculate target scroll position to center the selected item
        const targetScrollTop = currentClampedIndex * itemHeight + currentPaddingTop;
        
        // Only snap if we're not already at the target position
        if (Math.abs(currentScrollTop - targetScrollTop) > 2) {
          scrollRef.current.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
        }
      }, 200);
    };
    
    return (
      <div className="flex flex-col items-center w-full">
        <div className="relative">
          {/* Selection Bar */}
          <div 
            className="absolute left-0 right-0 border-2 border-black dark:border-white rounded-lg z-10 pointer-events-none"
            style={{ 
              top: `${containerHeight / 2 - itemHeight / 2}px`,
              height: `${itemHeight}px`,
              backgroundColor: 'transparent'
            }}
          />
          
          {/* Scrollable Container */}
          <div 
            ref={scrollRef}
            className="border-2 border-black rounded-lg overflow-y-auto scrollbar-hide"
            style={{ height: `${containerHeight}px`, width: '120px' }}
            onScroll={handleScroll}
          >
            {/* Padding top */}
            <div style={{ height: `${containerHeight / 2 - itemHeight / 2}px` }} />
            
            {/* Values */}
            {items.map((item) => (
              <div
                key={item}
                className="text-center flex items-center justify-center transition-colors cursor-pointer"
                style={{ height: `${itemHeight}px` }}
                onClick={() => setBeepStart(item)}
              >
                <span className="text-lg font-bold">{item}</span>
              </div>
            ))}
            
            {/* Padding bottom */}
            <div style={{ height: `${containerHeight / 2 - itemHeight / 2}px` }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="w-full max-w-sm h-screen m-0 rounded-none [&>button]:hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <DialogHeader className="flex-row items-center space-y-0 pb-2 border-b">
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
            <div className="flex-1 py-2 space-y-2">
              {/* Dark/Light Mode */}
              <div className="flex items-center justify-between py-1">
                <span className="text-lg font-bold">Mode</span>
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
              <div className="flex items-center justify-between py-1">
                <span className="text-lg font-bold">Beep Tone</span>
                <Button
                  variant="outline"
                  className="min-w-20 h-10 border-2 border-black rounded-lg font-bold text-base bg-white hover:bg-gray-100 text-black"
                  onClick={() => setShowBeepToneMenu(true)}
                >
                  {soundSettings.beepTone === "standard" ? "Standard" :
                   soundSettings.beepTone === "high_pitch" ? "High" : "Low"}
                </Button>
              </div>

              {/* Beep Start */}
              <div className="flex items-center justify-between py-1">
                <span className="text-lg font-bold">Beep Start</span>
                <Button
                  variant="outline"
                  className="min-w-20 h-10 border-2 border-black rounded-lg font-bold text-base bg-white hover:bg-gray-100 text-black"
                  onClick={() => setShowBeepStartMenu(true)}
                >
                  {beepStart} sec
                </Button>
              </div>

              {/* Halfway Reminder */}
              <div className="flex items-center justify-between py-1">
                <span className="text-lg font-bold">Halfway Reminder</span>
                <div 
                  className={`w-8 h-8 border-2 border-black rounded cursor-pointer flex items-center justify-center ${
                    soundSettings.halfwayReminder ? 'bg-black' : 'bg-white'
                  }`}
                  onClick={() => updateSoundSetting('halfwayReminder', !soundSettings.halfwayReminder)}
                >
                  {soundSettings.halfwayReminder && (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>

              {/* 10 Second Reminder */}
              <div className="flex items-center justify-between py-1">
                <span className="text-lg font-bold">10 Second Reminder</span>
                <div 
                  className={`w-8 h-8 border-2 border-black rounded cursor-pointer flex items-center justify-center ${
                    soundSettings.tenSecondWarning ? 'bg-black' : 'bg-white'
                  }`}
                  onClick={() => updateSoundSetting('tenSecondWarning', !soundSettings.tenSecondWarning)}
                >
                  {soundSettings.tenSecondWarning && (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Verbal Reminder */}
              <div className="flex items-center justify-between py-1">
                <span className="text-lg font-bold">Verbal Reminder</span>
                <div 
                  className={`w-8 h-8 border-2 border-black rounded cursor-pointer flex items-center justify-center ${
                    soundSettings.verbalReminder ? 'bg-black' : 'bg-white'
                  }`}
                  onClick={() => updateSoundSetting('verbalReminder', !soundSettings.verbalReminder)}
                >
                  {soundSettings.verbalReminder && (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Done Button */}
            <div className="pt-2">
              <Button
                className="w-full h-12 text-lg font-bold border-2 border-black dark:border-white rounded-lg bg-gray-200 hover:bg-gray-300 text-black"
                variant="outline"
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
              className="w-full mt-4 border-2 border-black dark:border-white"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Beep Start Menu */}
      {showBeepStartMenu && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-sm p-6">
            <div className="flex flex-col space-y-1.5 text-center mb-4">
              <h2 className="text-lg font-semibold leading-none tracking-tight">Beep Start (seconds)</h2>
            </div>
            
            <div className="flex justify-center py-4">
              {createBeepStartScrollList()}
            </div>
            
            <div className="flex justify-center pt-4">
              <Button onClick={() => handleBeepStartConfirm(beepStart)} className="w-full border-2 border-black dark:border-white">
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}