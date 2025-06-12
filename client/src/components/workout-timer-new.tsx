import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/workout-utils";
import { useAudio } from "@/hooks/use-audio";
import { ArrowLeft, Play, Pause, SkipForward, SkipBack } from "lucide-react";
import type { Workout, Timer, SoundSettings } from "@shared/schema";

interface WorkoutTimerProps {
  workout: Workout;
  timers: Timer[];
  onComplete: () => void;
  onStop: () => void;
}

export default function WorkoutTimer({ workout, timers, onComplete, onStop }: WorkoutTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTimerIndex, setCurrentTimerIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(timers[0]?.duration || 0);

  // Default sound settings - in a real app this would come from workout settings
  const defaultSoundSettings: SoundSettings = {
    beepTone: "standard",
    beepStart: 10,
    tenSecondWarning: true,
    halfwayReminder: true,
    verbalReminder: true,
    vibrate: true
  };

  const { playBeep, playCompletionSound } = useAudio(defaultSoundSettings);

  const currentTimer = timers[currentTimerIndex];
  const isLastTimer = currentTimerIndex === timers.length - 1;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;

          // Audio notifications
          if (newTime === Math.floor(currentTimer.duration / 2) && defaultSoundSettings.halfwayReminder) {
            playBeep();
          }
          if (newTime === 10 && defaultSoundSettings.tenSecondWarning) {
            playBeep();
          }
          if (newTime === 0) {
            playBeep();
          }

          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, currentTimer, playBeep, defaultSoundSettings]);

  useEffect(() => {
    if (timeRemaining === 0 && currentTimer) {
      if (isLastTimer) {
        playCompletionSound();
        onComplete();
      } else {
        // Move to next timer
        const nextIndex = currentTimerIndex + 1;
        setCurrentTimerIndex(nextIndex);
        setTimeRemaining(timers[nextIndex].duration);
        playBeep(); // Timer start sound
      }
    }
  }, [timeRemaining, currentTimer, isLastTimer, currentTimerIndex, timers, onComplete, playBeep, playCompletionSound]);

  const handlePlayPause = () => {
    if (!isRunning && currentTimerIndex === 0 && timeRemaining === timers[0]?.duration) {
      // Starting workout
      playBeep();
    }
    setIsRunning(!isRunning);
  };

  const handleSkip30Forward = () => {
    let remainingSkip = 30;
    let currentIndex = currentTimerIndex;
    let currentTime = timeRemaining;

    while (remainingSkip > 0 && currentIndex < timers.length) {
      if (currentTime > remainingSkip) {
        // Skip within current timer
        setTimeRemaining(currentTime - remainingSkip);
        return;
      } else {
        // Skip entire current timer and move to next
        remainingSkip -= currentTime;
        currentIndex++;
        if (currentIndex >= timers.length) {
          // Reached end of workout
          onComplete();
          return;
        }
        currentTime = timers[currentIndex].duration;
        setCurrentTimerIndex(currentIndex);
      }
    }
    
    setTimeRemaining(currentTime);
  };

  const handleSkip30Backward = () => {
    let remainingSkip = 30;
    let currentIndex = currentTimerIndex;
    let currentTime = timeRemaining;
    const maxTimeForCurrentTimer = timers[currentIndex].duration;

    // How much time has already elapsed in current timer
    const elapsedInCurrentTimer = maxTimeForCurrentTimer - currentTime;

    if (elapsedInCurrentTimer >= remainingSkip) {
      // Skip backward within current timer (add time back)
      setTimeRemaining(currentTime + remainingSkip);
      return;
    }

    // We need to go back to previous timer(s)
    // First, use up the elapsed time in current timer
    remainingSkip -= elapsedInCurrentTimer;
    
    // Move to previous timer
    while (remainingSkip > 0 && currentIndex > 0) {
      currentIndex--;
      const prevTimerDuration = timers[currentIndex].duration;
      
      if (remainingSkip <= prevTimerDuration) {
        // We can fit the remaining skip within this previous timer
        setCurrentTimerIndex(currentIndex);
        setTimeRemaining(remainingSkip);
        return;
      } else {
        // This previous timer is not long enough, skip it entirely
        remainingSkip -= prevTimerDuration;
      }
    }
    
    // If we've gone back to the beginning, set to start of first timer
    setCurrentTimerIndex(0);
    setTimeRemaining(timers[0].duration);
  };

  if (!currentTimer) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <p className="text-muted-foreground">No timers available</p>
        <Button onClick={onStop} className="mt-4">Back to Workout</Button>
      </div>
    );
  }

  const progressPercentage = ((currentTimer.duration - timeRemaining) / currentTimer.duration) * 100;

  const getTimerColor = (timerName: string) => {
    const name = timerName.toLowerCase();
    if (name.includes('prepare')) return 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
    if (name.includes('work')) return 'border-orange-500 bg-orange-100 dark:bg-orange-900/30';
    if (name.includes('rest') && !name.includes('cycle')) return 'border-blue-500 bg-blue-100 dark:bg-blue-900/30';
    if (name.includes('cycle')) return 'border-green-500 bg-green-100 dark:bg-green-900/30';
    return 'border-gray-500 bg-gray-100 dark:bg-gray-900/30';
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black">
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={onStop}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold text-center flex-1">{workout.name}</h1>
        <div className="w-10" />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center py-6 space-x-4">
        <Button
          variant="ghost"
          size="lg"
          className="w-20 h-20 bg-black text-white rounded-lg flex flex-col items-center justify-center"
          onClick={handleSkip30Backward}
        >
          <SkipBack className="w-6 h-6" />
          <span className="text-xs mt-1">30</span>
        </Button>
        
        <Button
          onClick={handlePlayPause}
          size="lg"
          className={`w-20 h-20 rounded-lg flex items-center justify-center ${
            isRunning 
              ? 'bg-black text-white' 
              : 'bg-white border-4 border-black text-black hover:bg-gray-50'
          }`}
        >
          {isRunning ? (
            <div className="flex space-x-1">
              <div className="w-2 h-8 bg-white rounded"></div>
              <div className="w-2 h-8 bg-white rounded"></div>
            </div>
          ) : (
            <Play className="w-8 h-8 ml-1" fill="currentColor" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="lg"
          className="w-20 h-20 bg-black text-white rounded-lg flex flex-col items-center justify-center"
          onClick={handleSkip30Forward}
        >
          <SkipForward className="w-6 h-6" />
          <span className="text-xs mt-1">30</span>
        </Button>
      </div>

      {/* Current Timer Progress Bar */}
      <div className="px-4 mb-4">
        <div className={`border-2 rounded-lg p-4 relative overflow-hidden ${getTimerColor(currentTimer.name)}`}>
          {/* Progress fill that depletes from right to left */}
          <div 
            className="absolute inset-0 bg-background transition-all duration-1000 ease-linear"
            style={{ 
              width: `${100 - progressPercentage}%`,
              right: 0
            }}
          />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-lg font-bold">{currentTimer.name}</span>
            <span className="text-lg font-bold">{formatTime(timeRemaining)}</span>
          </div>
        </div>
      </div>

      {/* Future Timer List */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="space-y-3">
          {timers.slice(currentTimerIndex + 1).map((timer, index) => (
            <div
              key={`${timer.id}-${index}`}
              className={`border-2 rounded-lg p-4 ${getTimerColor(timer.name)}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{timer.name}</span>
                <span className="text-lg font-bold">{formatTime(timer.duration)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}