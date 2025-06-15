import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pause, OctagonMinus, Play, SkipForward, Plus } from "lucide-react";
import { useTimer } from "@/hooks/use-timer";
import { useAudio } from "@/hooks/use-audio";
import type { Workout, Timer, SoundSettings } from "@shared/schema";

interface WorkoutTimerProps {
  workout: Workout;
  timers: Timer[];
  onComplete: () => void;
  onStop: () => void;
}

export default function WorkoutTimer({ workout, timers, onComplete, onStop }: WorkoutTimerProps) {
  const [currentTimerIndex, setCurrentTimerIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const currentTimer = timers[currentTimerIndex];
  
  const workoutSoundSettings = workout.soundSettings as SoundSettings;
  const { playBeep, playCompletionSound } = useAudio(workoutSoundSettings);
  
  const {
    timeRemaining,
    isActive,
    start,
    pause,
    reset,
    addTime
  } = useTimer({
    initialTime: currentTimer?.duration || 0,
    onTick: useCallback((remaining: number) => {
      // Handle sound cues
      if (workoutSoundSettings.tenSecondWarning && remaining === 10) {
        playBeep();
      }
      if (workoutSoundSettings.halfwayReminder && remaining === Math.floor((currentTimer?.duration || 0) / 2)) {
        playBeep();
      }
    }, [currentTimer?.duration, playBeep, workoutSoundSettings]),
    onComplete: useCallback(() => {
      // Vibrate if enabled
      if (workoutSoundSettings.vibrate && navigator.vibrate) {
        navigator.vibrate(200);
      }
      
      // Move to next timer or complete workout
      if (currentTimerIndex < timers.length - 1) {
        setCurrentTimerIndex(prev => prev + 1);
      } else {
        playCompletionSound();
        onComplete();
      }
    }, [currentTimerIndex, timers.length, onComplete, playCompletionSound, workoutSoundSettings.vibrate])
  });

  // Reset timer when current timer changes
  useEffect(() => {
    if (currentTimer) {
      reset(currentTimer.duration);
      if (isRunning) {
        start();
      }
      
      // Verbal reminder at timer start
      if (workoutSoundSettings.verbalReminder && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(currentTimer.type === 'work' ? 'Work' : 'Rest');
        speechSynthesis.speak(utterance);
      }
    }
  }, [currentTimer, reset, start, isRunning, workoutSoundSettings.verbalReminder]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerTypeColor = (type: string) => {
    switch (type) {
      case "work":
        return "work-color";
      case "rest":
      case "rest_between_cycles":
        return "rest-color";
      case "prepare":
        return "bg-yellow-500 text-black";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getTimerTypeIcon = (type: string) => {
    switch (type) {
      case "work":
        return "💪";
      case "rest":
      case "rest_between_cycles":
        return "⏸️";
      case "prepare":
        return "⏰";
      default:
        return "⏱️";
    }
  };

  const getProgressColor = (type: string) => {
    switch (type) {
      case "work":
        return "bg-orange-500";
      case "rest":
      case "rest_between_cycles":
        return "bg-blue-500";
      case "prepare":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const togglePause = () => {
    if (isActive) {
      pause();
      setIsRunning(false);
    } else {
      start();
      setIsRunning(true);
    }
  };

  const skipTimer = () => {
    if (currentTimerIndex < timers.length - 1) {
      setCurrentTimerIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const addTimeToTimer = () => {
    addTime(10); // Add 10 seconds
  };

  const currentRound = Math.floor(currentTimerIndex / 2) + 1;
  const totalRounds = workout.rounds * workout.cycles;
  const remainingTimers = timers.slice(currentTimerIndex + 1);
  const totalRemainingTime = remainingTimers.reduce((sum, timer) => sum + timer.duration, 0) + timeRemaining;

  const progress = currentTimer ? ((currentTimer.duration - timeRemaining) / currentTimer.duration) * 100 : 0;

  if (!currentTimer) {
    return <div className="px-4 text-center text-white">No timers available</div>;
  }

  return (
    <div className="px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-orange-500 p-1"
          onClick={togglePause}
        >
          {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </Button>
        <h2 className="text-lg font-semibold text-white">{workout.name}</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 p-1"
          onClick={onStop}
        >
          <OctagonMinus className="w-6 h-6" />
        </Button>
      </div>

      {/* Current Timer */}
      <div className="text-center mb-8">
        <div className="mb-4">
          <h3 className="text-2xl font-bold mb-2 text-white">{currentTimer.name}</h3>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getTimerTypeColor(currentTimer.type)}`}>
            <span className="mr-2">{getTimerTypeIcon(currentTimer.type)}</span>
            <span>{currentTimer.type === "work" ? "Work" : currentTimer.type === "rest" ? "Rest" : currentTimer.type === "prepare" ? "Prepare" : "Rest Between Cycles"}</span>
          </div>
        </div>
        
        {/* Timer Display */}
        <div className="text-8xl font-bold mb-4 timer-display text-white">{formatTime(timeRemaining)}</div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-1000 ease-linear ${getProgressColor(currentTimer.type)}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Upcoming Timers */}
      <div className="app-gray rounded-lg p-4 mb-8">
        <h4 className="font-semibold mb-3 text-gray-300">Up Next</h4>
        <div className="space-y-2">
          {remainingTimers.slice(0, 3).map((timer, index) => (
            <div key={`${timer.id}-${index}`} className="flex items-center py-2">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                timer.type === "work" ? "bg-orange-500" : 
                timer.type === "rest" || timer.type === "rest_between_cycles" ? "bg-blue-500" : 
                "bg-yellow-500"
              }`} />
              <span className="flex-1 text-sm text-white">{timer.name}</span>
              <span className="text-xs text-gray-400">{formatTime(timer.duration)}</span>
            </div>
          ))}
          {remainingTimers.length > 3 && (
            <div className="text-center text-xs text-gray-500 py-2">
              ... and {remainingTimers.length - 3} more
            </div>
          )}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Timer {currentTimerIndex + 1} of {timers.length}</span>
            <span>{formatTime(totalRemainingTime)} remaining</span>
          </div>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          size="lg"
          className="w-16 h-16 rounded-full app-gray border-gray-600 text-white"
          onClick={skipTimer}
        >
          <SkipForward className="w-6 h-6" />
        </Button>
        <Button
          size="lg"
          className={`w-20 h-20 rounded-full ${isActive ? 'work-color' : 'bg-green-600 text-white'}`}
          onClick={togglePause}
        >
          {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-16 h-16 rounded-full app-gray border-gray-600 text-white"
          onClick={addTimeToTimer}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
