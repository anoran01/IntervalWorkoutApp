import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/workout-utils";
import { useAudio } from "@/hooks/use-audio";
import { useWorkoutAudioPath } from "@/hooks/use-workout-audio-path";
import { ArrowLeft, Play, Pause, SkipForward, SkipBack, Settings } from "lucide-react";
import { useGetTimers } from "@/lib/queryClient";
import type { Workout, Timer, SoundSettings } from "@/schema";
import {NativeAudio} from "@capacitor-community/native-audio";
import { Filesystem, Directory } from '@capacitor/filesystem';
import WorkoutTimerSettings from "@/components/workout-timer-settings";
import { Preferences } from "@capacitor/preferences";

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
  const [timeRemaining, setTimeRemaining] = useState<number>(0); //this is time remaining in the current timer not in the entire workout
  const [duration, setDuration] = useState<number>(0);
  const [pausedTime, setPausedTime] = useState<number>(0);
  const AUDIO_ID = 'workout-audio';
  const [showSettings, setShowSettings] = useState(false);
  const AUDIO_PATH = useWorkoutAudioPath(workout.filePath);
  const [volume, setVolume] = useState(1.0);

  async function preloadAudio(id: string, filepath: string, volume: number = 1.0) {
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
      const duration = await NativeAudio.getDuration({ assetId: id });
      setDuration(duration.duration);
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
      console.log(`Audio stopped for ${id}.`);
    } catch (error) {
      console.error(`Error stopping audio for ${id}: `, error);
    }
  }

  async function playAudio(id: string, time: number = 0) {
    try {
      await NativeAudio.play({
        assetId: id,
        time: time,
      });
      console.log(`Audio started for ${id}.`);
    } catch (error) {
      console.error(`Error playing audio loop for ${id}: `, error);
    }
  }

  async function setNativeAudioVolume(id: string, value: number) {
    try {
      await NativeAudio.setVolume({
        assetId: id,
        volume: value,
      });
    } catch (error) {
      console.error(`Error setting volume for ${id}: `, error);
    }
  }

  // Preload workout audio once the path is resolved
  useEffect(() => {
    if (AUDIO_PATH) {
      preloadAudio(AUDIO_ID, AUDIO_PATH, volume);
    }
  }, [AUDIO_PATH]);

  // Initialize timeRemaining when timers are loaded
  useEffect(() => {
    if (timers && timers.length > 0) {
      setTimeRemaining(timers[0]?.duration || 0);
    }
  }, [timers]);

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

  // Pre-compute total workout duration and cumulative timer end times
  // JSON string representing the full timer sequence so the Live Activity can continue updating when the app is backgrounded
  const timerMapString = useMemo(
    () =>
      JSON.stringify(
        timers.map((t) => ({
          name: t.name,
          duration: t.duration,
          type: t.type,
        })),
      ),
    [timers],
  );

  

  const handleStop = async () => {
    stopAudio(AUDIO_ID);
    unloadAudio(AUDIO_ID);
    setIsRunning(false);
    onStop();
  };

  // Poll NativeAudio for the current playback position while the workout is running
  useEffect(() => {

    const interval = setInterval(async () => {
      try {
        // NOTE: your NativeAudio fork may expose this as `getCurrentTime` or `getCurrentTimer`
        const currentTime = (await (NativeAudio as any).getCurrentTime({ assetId: AUDIO_ID })).currentTime;

        const elapsed = Math.floor(currentTime || 0);

        // Guard against running past the workout duration
        if (elapsed >= totalDuration) {
          setTimeRemaining(0);
          
          // Reset play/pause state so the button shows the play icon after completion
          setIsRunning(false);
          console.log('🎯 Workout complete');
          stopAudio(AUDIO_ID);
          unloadAudio(AUDIO_ID);
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
    }, 50); // 20 Hz polling for smoother UI updates

    return () => clearInterval(interval);
  }, [isRunning, cumulativeEnds, timers, totalDuration, currentTimerIndex, timeRemaining, pausedTime]);

  

  const handlePlayPause = async () => {
    if (!isRunning){
      await playAudio(AUDIO_ID, pausedTime);
    } else if (isRunning) {
      const currentTime = (await NativeAudio.getCurrentTime({ assetId: AUDIO_ID })).currentTime;
      setPausedTime(currentTime);
      await stopAudio(AUDIO_ID);
    }
    console.log('⏯️ Play/Pause toggled - isRunning:', !isRunning, 'Current timer:', currentTimer?.name);
    setIsRunning(!isRunning);
  };

  const handleSkip30Forward = async () => {
    const skipTime = 30;
    const wasPlaying = (await NativeAudio.isPlaying({ assetId: AUDIO_ID })).isPlaying;
    console.log('wasPlaying: ', wasPlaying);
    const currentTime = (await NativeAudio.getCurrentTime({ assetId: AUDIO_ID })).currentTime;
    console.log('currentTime: ', currentTime);
    const newTime = Math.min(duration, currentTime + skipTime);
    console.log('duration: ', duration);
    console.log('newTime: ', newTime);
    
    // Always seek to the new position
    await playAudio(AUDIO_ID, newTime);
    
    // If it wasn't playing before, stop it to maintain paused state
    if (!wasPlaying) {
      setPausedTime(newTime);
      await stopAudio(AUDIO_ID);
      const newCurrentTime = (await NativeAudio.getCurrentTime({ assetId: AUDIO_ID })).currentTime;
      console.log('newCurrentTime: ', newCurrentTime);
    }
  };

  const handleSkip30Backward = async () => {
    const skipTime = 30;
    const wasPlaying = (await NativeAudio.isPlaying({ assetId: AUDIO_ID })).isPlaying;
    console.log('wasPlaying: ', wasPlaying);
    const currentTime = (await NativeAudio.getCurrentTime({ assetId: AUDIO_ID })).currentTime;
    console.log('currentTime: ', currentTime);
    const newTime = Math.max(0, currentTime - skipTime);
    console.log('newTime: ', newTime);
    
    // Always seek to the new position
    await playAudio(AUDIO_ID, newTime);
    
    // If it wasn't playing before, stop it to maintain paused state
    if (!wasPlaying) {
      setPausedTime(newTime);
      await stopAudio(AUDIO_ID);
      const newCurrentTime = (await NativeAudio.getCurrentTime({ assetId: AUDIO_ID })).currentTime;
      console.log('newCurrentTime: ', newCurrentTime);
    }
  };

  const handleTimerSettingsClose = (value: number) => {
    setShowSettings(false);
    setVolume(value);
    setNativeAudioVolume(AUDIO_ID, value);
    //use capacitor preferences to save the volume value from WorkoutTimerSettings
    Preferences.set({
      key: 'workoutTimerVolume',
      value: value.toString(),
    });
  };

  useEffect(() => {
    Preferences.get({ key: 'workoutTimerVolume' }).then((result) => {
      if (result.value === null) {
        // Key does not exist, set to default volume (1)
        Preferences.set({
          key: 'workoutTimerVolume',
          value: '1.0',
        });
        setVolume(1.0);
      } else {
        setVolume(Number(result.value));
      }
    });
  }, []);


  const progressPercentage = useMemo(() =>
    currentTimer.duration > 0
      ? ((currentTimer.duration - timeRemaining) / currentTimer.duration) * 100
      : 0,
  [currentTimer.duration, timeRemaining]);

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

  const elapsedInTimer = currentTimer.duration - timeRemaining;

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
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="w-6 h-6" />
        </Button>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center py-6 space-x-4">
        <Button
          variant="ghost"
          size="lg"
          className="w-20 h-20 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white rounded-lg flex flex-col items-center justify-center"
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
              ? "bg-transparent border-2 border-black dark:border-white text-black dark:text-white"
              : "bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white"
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
          className="w-20 h-20 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white rounded-lg flex flex-col items-center justify-center"
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
            className="absolute inset-0 bg-background transition-all duration-500 ease-linear"
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
      {/* Settings Modal */}
      {showSettings && (  
        <div className="fixed inset-0 z-50">
          <WorkoutTimerSettings
            onClose={handleTimerSettingsClose}
            initialVolume={volume}
          />
        </div>
      )}
    </div>
  );
}
