import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/workout-utils";
import { useAudio } from "@/hooks/use-audio";
import { ArrowLeft, Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { useGetTimers } from "@/lib/queryClient";
import type { Workout, Timer, SoundSettings } from "@/schema";

interface WorkoutTimerProps {
  workout: Workout;
  onComplete: () => void;
  onStop: () => void;
}

export default function WorkoutTimer({
  workout,
  onComplete,
  onStop,
}: WorkoutTimerProps) {
  const { data: timers, isLoading } = useGetTimers(workout.id);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTimerIndex, setCurrentTimerIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Initialize timeRemaining when timers are loaded
  useEffect(() => {
    if (timers && timers.length > 0) {
      setTimeRemaining(timers[0]?.duration || 0);
    }
  }, [timers]);

  // Use the workout's sound settings
  const workoutSoundSettings = workout.soundSettings as SoundSettings;

  const { playBeep, playTenSecondWarning, playHalfwayReminder, playVerbalReminder, playCompletionSound } = useAudio(workoutSoundSettings);

  // Show loading state if timers are still loading
  if (isLoading || !timers) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <p className="text-muted-foreground">Loading workout timers...</p>
      </div>
    );
  }

  // Show error state if no timers
  if (timers.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <p className="text-muted-foreground">No timers available for this workout</p>
        <Button onClick={onStop} className="mt-4">
          Back to Workout
        </Button>
      </div>
    );
  }

  const currentTimer = timers[currentTimerIndex];
  const isLastTimer = currentTimerIndex === timers.length - 1;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;

          // Audio notifications
          if (
            newTime === Math.floor(currentTimer.duration / 2) &&
            workoutSoundSettings.halfwayReminder
          ) {
            console.log('🔊 Halfway reminder audio - Timer:', currentTimer.name, 'Time:', newTime);
            playHalfwayReminder();
          }
          if (newTime === 10 && workoutSoundSettings.tenSecondWarning) {
            console.log('🔊 Ten second warning audio - Timer:', currentTimer.name, 'Time:', newTime);
            playTenSecondWarning();
          }
          // Beep start functionality - beep during countdown to 1 second
          if (newTime <= workoutSoundSettings.beepStart && newTime > 0) {
            console.log('🔊 Beep start countdown - Timer:', currentTimer.name, 'Time:', newTime, 'BeepStart setting:', workoutSoundSettings.beepStart);
            playBeep();
          }

          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, currentTimer, playBeep, workoutSoundSettings]);

  useEffect(() => {
    if (timeRemaining === 0 && currentTimer && isRunning) {
      if (isLastTimer) {
        console.log('🎯 Workout complete - Playing completion sound');
        playCompletionSound();
        onComplete();
      } else {
        // Move to next timer
        const nextIndex = currentTimerIndex + 1;
        const nextTimer = timers[nextIndex];
        console.log('⏭️ Moving to next timer:', nextTimer.name, 'Duration:', nextTimer.duration);
        setCurrentTimerIndex(nextIndex);
        setTimeRemaining(nextTimer.duration);
        
        // Verbal reminder for the new timer
        if (workoutSoundSettings.verbalReminder) {
          console.log('🔊 Verbal reminder audio - Timer:', nextTimer.name, 'Type:', nextTimer.type, 'Starting with duration:', nextTimer.duration);
          playVerbalReminder(nextTimer.type);
        } else if (workoutSoundSettings.tenSecondWarning && nextTimer.duration === 10) {
          console.log('🔊 Ten Second Timer Duration - Timer:', nextTimer.name, 'Time:', nextTimer.duration);
          playTenSecondWarning();
        }
      }
    }
  }, [
    timeRemaining,
    currentTimer,
    isLastTimer,
    currentTimerIndex,
    timers,
    workoutSoundSettings.verbalReminder,
    workoutSoundSettings.tenSecondWarning,
    playBeep,
    playVerbalReminder,
    playTenSecondWarning,
  ]);

  const handlePlayPause = () => {
    if (
      !isRunning &&
      currentTimerIndex === 0 &&
      timeRemaining === timers[0]?.duration
    ) {
      // Starting workout - verbal reminder for first timer
      console.log('▶️ Starting workout:', workout.name, 'First timer:', timers[0]?.name);
      if (workoutSoundSettings.verbalReminder) {
        console.log('🔊 Verbal reminder audio - Timer:', timers[0]?.name, 'Type:', timers[0]?.type, 'Starting with duration:', timers[0]?.duration);
        playVerbalReminder(timers[0]?.type);
      }
    }
    console.log('⏯️ Play/Pause toggled - isRunning:', !isRunning, 'Current timer:', currentTimer?.name);
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

  const progressPercentage =
    ((currentTimer.duration - timeRemaining) / currentTimer.duration) * 100;

  const getTimerColor = (timerName: string) => {
    const name = timerName.toLowerCase();
    if (name.includes("prepare"))
      return "border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30";
    if (name.includes("work"))
      return "border-orange-500 bg-orange-100 dark:bg-orange-900/30";
    if (name.includes("rest") && !name.includes("cycle"))
      return "border-blue-500 bg-blue-100 dark:bg-blue-900/30";
    if (name.includes("cycle"))
      return "border-green-500 bg-green-100 dark:bg-green-900/30";
    return "border-gray-500 bg-gray-100 dark:bg-gray-900/30";
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-16 border-b-2 border-black">
        <Button variant="ghost" size="sm" className="p-2" onClick={onStop}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold text-center flex-1">
          {workout.name}
        </h1>
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
              ? "bg-transparent border-2 border-black dark:border-white text-black dark:text-white hover:bg-gray-800/20 dark:hover:bg-gray-200/20"
              : "bg-white dark:bg-black text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          {isRunning ? (
            <div className="flex space-x-1">
              <div className="w-2 h-8 bg-black dark:bg-white rounded"></div>
              <div className="w-2 h-8 bg-black dark:bg-white rounded"></div>
            </div>
          ) : (
            <Play className="w-12 h-12 ml-1" fill="currentColor" />
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
        <div
          className={`border-4 rounded-lg p-4 relative overflow-hidden ${getTimerColor(currentTimer.name)}`}
        >
          {/* Progress fill that depletes from right to left */}
          <div
            className="absolute inset-0 bg-background transition-all duration-1000 ease-linear"
            style={{
              width: `${100 - progressPercentage}%`,
              right: 0,
            }}
          />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-lg font-bold">{currentTimer.name}</span>
            <span className="text-lg font-bold">
              {formatTime(timeRemaining)}
            </span>
            
          </div>
          
        </div>
        <div className="border-b-2 dark:border-white border-black my-2" />
      </div>

      {/* Future Timer List */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto scrollbar-hide">
        <div className="space-y-3">
          {timers.slice(currentTimerIndex + 1).map((timer, index) => (
            <div
              key={`${timer.id}-${index}`}
              className={`border-2 rounded-lg p-4 ${getTimerColor(timer.name)}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{timer.name}</span>
                <span className="text-lg font-bold">
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
