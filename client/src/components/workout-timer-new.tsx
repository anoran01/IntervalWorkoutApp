import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/workout-utils";
import { useAudio } from "@/hooks/use-audio";
import { useWorkoutAudioPath } from "@/hooks/use-workout-audio-path";
import { ArrowLeft, Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { useGetTimers } from "@/lib/queryClient";
import { liveActivityService } from "@/services/live-activity";
import type { Workout, Timer, SoundSettings } from "@/schema";
import {NativeAudio} from "@capacitor-community/native-audio";
import { Filesystem, Directory } from '@capacitor/filesystem';

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
  const [liveActivitySupported, setLiveActivitySupported] = useState(false);
  const [activityId, setActivityId] = useState<string | null>(null);

  const SILENT_AUDIO_ID = 'silentloop';
  const SILENT_AUDIO_PATH = 'public/audio/silence.wav';
  let isLoopPlaying = false;
  const AUDIO_ID = 'workout-audio';

  const AUDIO_PATH = useWorkoutAudioPath(workout.filePath);

  async function preloadAudio(id: string, filepath: string, volume: number = 0.4) {
    try {
      await NativeAudio.preload({
        assetId: id,
        assetPath: filepath,
        audioChannelNum: 1,
        isUrl: true,
      });
      console.log(`Audio preloaded for ${id}.`);
      await NativeAudio.setVolume({
        assetId: id,
        volume: volume,
      });
      console.log(`Audio volume set to ${volume} for ${id}.`);
    } catch (error) {
      console.error(`Error setting up audio for ${id}: `, error);
    }
  }

  async function unloadAudio(id: string) {
    try {
      await NativeAudio.unload({ assetId: id });
      console.log(`Audio unloaded for ${id}.`);
    } catch (error) {
      console.error(`Error unloading audio for ${id}: `, error);
    }
  }

  async function stopAudio(id: string) {
    try {
      await NativeAudio.stop({ assetId: id });
      if (id === SILENT_AUDIO_ID) {
        isLoopPlaying = false;
      }
      console.log(`Audio stopped for ${id}.`);
    } catch (error) {
      console.error(`Error stopping audio for ${id}: `, error);
    }
  }

  async function playAudioLoop(id: string) {
    try {
      await NativeAudio.loop({
        assetId: id,
      });
      if (id === SILENT_AUDIO_ID) {
        isLoopPlaying = true;
      }
      console.log(`Audio loop started for ${id}.`);
    } catch (error) {
      console.error(`Error playing audio loop for ${id}: `, error);
    }
  }

  // Preload workout audio once the path is resolved
  useEffect(() => {
    if (AUDIO_PATH) {
      preloadAudio(AUDIO_ID, AUDIO_PATH, 1.0);
    }
  }, [AUDIO_PATH]);

  // Initialize timeRemaining when timers are loaded
  useEffect(() => {
    if (timers && timers.length > 0) {
      setTimeRemaining(timers[0]?.duration || 0);
    }
  }, [timers]);

  // Check Live Activity support on mount
  useEffect(() => {
    const checkLiveActivitySupport = async () => {
      const isAvailable = await liveActivityService.isAvailable();
      setLiveActivitySupported(isAvailable);
    };
    checkLiveActivitySupport();
  }, []);

  // Use the workout's sound settings
  const workoutSoundSettings = workout.soundSettings as SoundSettings;

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

  // Pre-compute total workout duration and cumulative timer end times
  const totalDuration = useMemo(() =>
    timers.reduce((sum, t) => sum + t.duration, 0), [timers]);

  const cumulativeEnds = useMemo(() => {
    let acc = 0;
    return timers.map((t) => (acc += t.duration));
  }, [timers]);

  const currentTimer = timers[currentTimerIndex];
  const isLastTimer = currentTimerIndex === timers.length - 1;

  // Helper function to get next timer info
  const getNextTimer = () => {
    if (isLastTimer) return null;
    return timers[currentTimerIndex + 1];
  };

  // Helper function to get timer type from database (not from name guessing)
  const getTimerType = (timer: Timer): 'work' | 'rest' | 'prepare' | 'rest_between_cycles' => {
    return timer.type as 'work' | 'rest' | 'prepare' | 'rest_between_cycles';
  };

  // Helper function to update Live Activity
  const updateLiveActivity = async () => {
    if (!liveActivitySupported || !activityId) return;

    const nextTimer = getNextTimer();
    const progress = ((currentTimer.duration - timeRemaining) / currentTimer.duration);

    await liveActivityService.updateActivity({
      id: activityId,
      contentState: {
        currentTimerName: currentTimer.name,
        currentTimerDuration: currentTimer.duration,
        currentTimerTimeRemaining: timeRemaining,
        nextTimerName: nextTimer?.name || null,
        timerType: getTimerType(currentTimer),
        isRunning,
        progress,
      },
    });
  };

  const handleStop = async () => {
    // End Live Activity when stopping the workout
    if (liveActivitySupported && activityId) {
      await liveActivityService.endActivity({
        id: activityId,
      });
      console.log('🎯 Live Activity ended');
    }
    stopAudio(AUDIO_ID);
    unloadAudio(AUDIO_ID);
    onStop();
  };

  // Poll NativeAudio for the current playback position while the workout is running
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(async () => {
      try {
        // NOTE: your NativeAudio fork may expose this as `getCurrentTime` or `getCurrentTimer`
        const { currentTime } = await (NativeAudio as any).getCurrentTime({ assetId: AUDIO_ID });

        const elapsed = Math.floor(currentTime || 0);

        // Guard against running past the workout duration
        if (elapsed >= totalDuration) {
          setTimeRemaining(0);
          console.log('🎯 Workout complete - Audio finished');
          
          if (liveActivitySupported && activityId) {
            liveActivityService.endActivity({
              id: activityId,
              contentState: { message: "Great workout! 🎉" }
            });
          }
          
          onComplete();
          return;
        }

        // Determine which timer we are in
        const idx = cumulativeEnds.findIndex((end) => elapsed < end);
        if (idx !== -1 && idx !== currentTimerIndex) {
          setCurrentTimerIndex(idx);
        }

        const prevEnd = idx === 0 ? 0 : cumulativeEnds[idx - 1];
        const remaining = timers[idx].duration - (elapsed - prevEnd);

        if (remaining !== timeRemaining) {
          setTimeRemaining(remaining);
        }
      } catch (err) {
        console.error('Error polling audio currentTime:', err);
      }
    }, 500); // 2 Hz polling is enough

    return () => clearInterval(interval);
  }, [isRunning, cumulativeEnds, timers, totalDuration, currentTimerIndex, timeRemaining]);

  // Update Live Activity when time changes (every second)
  useEffect(() => {
    if (isRunning) {
      updateLiveActivity();
    }
  }, [timeRemaining]);

  const handlePlayPause = async () => {
    if (
      !isRunning &&
      currentTimerIndex === 0 &&
      timeRemaining === timers[0]?.duration
    ) {
      // Starting workout - verbal reminder for first timer
      console.log('▶️ Starting workout:', workout.name, 'First timer:', timers[0]?.name);
      await playAudioLoop(AUDIO_ID);
      if (workoutSoundSettings.verbalReminder) {
        console.log('🔊 Verbal reminder audio - Timer:', timers[0]?.name, 'Type:', timers[0]?.type, 'Starting with duration:', timers[0]?.duration);
      }

      // Start Live Activity when starting the workout
      if (liveActivitySupported) {
        const nextTimer = getNextTimer();
        const newActivityId = `workout-${workout.id}-${Date.now()}`;
        setActivityId(newActivityId);
        
        const started = await liveActivityService.startActivity({
          id: newActivityId,
          attributes: {
            workoutName: workout.name,
          },
          contentState: {
            currentTimerName: currentTimer.name,
            currentTimerDuration: currentTimer.duration,
            currentTimerTimeRemaining: timeRemaining,
            nextTimerName: nextTimer?.name || null,
            timerType: getTimerType(currentTimer),
            isRunning: true,
            progress: 0,
          },
        });
        console.log('🎯 Live Activity started:', started);
      }
    } else if (!isRunning){
      await playAudioLoop(AUDIO_ID);
    } else if (isRunning) {
      await stopAudio(AUDIO_ID);
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

  // Listen for Live Activity actions
  useEffect(() => {
    const handleLiveActivityAction = (event: CustomEvent) => {
      const { action } = event.detail;
      console.log('🎯 Live Activity action received:', action);
      
      switch (action) {
        case 'play':
          if (!isRunning) handlePlayPause();
          break;
        case 'pause':
          if (isRunning) handlePlayPause();
          break;
        case 'skip_forward':
          handleSkip30Forward();
          break;
        case 'skip_backward':
          handleSkip30Backward();
          break;
        default:
          console.log('Unknown Live Activity action:', action);
      }
    };

    window.addEventListener('liveActivityAction', handleLiveActivityAction as EventListener);
    
    // Cleanup event listener when component unmounts
    return () => {
      window.removeEventListener('liveActivityAction', handleLiveActivityAction as EventListener);
    };
  }, []); // Empty dependency array - register once on mount

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
        <Button variant="ghost" size="sm" className="p-2" onClick={handleStop}>
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
