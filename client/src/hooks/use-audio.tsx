import { useCallback, useRef } from "react";
import type { SoundSettings } from "@/schema";
import { NativeAudio } from "@capacitor-community/native-audio";

// Import audio files
import tenSecondsWav from "@/audio/ten-seconds.wav";
import halfwayWav from "@/audio/halfway.wav";
import workWav from "@/audio/work.wav";
import restWav from "@/audio/rest.wav";
import doneWav from "@/audio/done.wav";
import greatWorkoutWav from "@/audio/great-workout.wav";

// This state is shared across all instances of the useAudio hook
const beepPreloadedState: { [key: string]: boolean } = {};

export function useAudio(soundSettings: SoundSettings) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isAudioEnabledRef = useRef<boolean>(false);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('🔊 Audio context created, state:', audioContextRef.current.state);
      } catch (error) {
        console.warn("Web Audio API not supported:", error);
      }
    }
    return audioContextRef.current;
  }, []);

  // Helper function to play audio files
  /*const playAudioFile = useCallback(async (audioSrc: string) => {
    try {
      const audio = new Audio(audioSrc);
      audio.volume = 0.8;
      await audio.play();
      console.log('🔊 Audio file played:', audioSrc);
    } catch (error) {
      console.warn('❌ Failed to play audio file:', audioSrc, error);
    }
  }, []);*/

  const playAudioFile = useCallback(async (audioSrc: string | null = null, gainValue: number = 0.8) => {
    try {
      const audioContext = initAudioContext();
      if (!audioContext) throw new Error("No AudioContext available");

      // Resume audio context if suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        console.log('🔊 Resuming suspended audio context...');
        await audioContext.resume();
      }

      let decodedBuffer: AudioBuffer;

      if (audioSrc === null) {
        const  channels = 1;
        const sampleRate = audioContext.sampleRate;
        const duration = 10;
        decodedBuffer = audioContext.createBuffer(channels, sampleRate * duration, sampleRate);

      } else if (audioSrc) {
        // Fetch the audio file as ArrayBuffer
        const response = await fetch(audioSrc);
        const arrayBuffer = await response.arrayBuffer();

        // Decode the audio data
        decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
      } else {
        throw new Error("Invalid audio source");
      }

      // Create a buffer source and gain node for volume control
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = decodedBuffer;
      
      // Set volume (equivalent to audio.volume = 0.8)
      gainNode.gain.setValueAtTime(gainValue, audioContext.currentTime);
      
      // Connect: source -> gain -> destination
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Play the audio
      source.start();
      console.log('🔊 Audio file played via Web Audio API:', audioSrc);
    } catch (error) {
      console.warn('❌ Failed to play audio file:', audioSrc, error);
    }
  }, []);

  const beepFiles: Record<string, string> = {
    standard: "public/audio/beep500.wav",
    high_pitch: "public/audio/beep700.wav",
    low_pitch: "public/audio/beep300.wav",
  };

  const playBeep = useCallback(async () => {
    const beepTone = soundSettings.beepTone || "standard";
    const assetId = `beep_${beepTone}`;
    const assetPath = beepFiles[beepTone] || beepFiles["standard"];
    try {
      if (!beepPreloadedState[beepTone]) {
        await NativeAudio.preload({
          assetId,
          assetPath,
          audioChannelNum: 1,
          isUrl: false,
        });
        beepPreloadedState[beepTone] = true;
      }
      await NativeAudio.play({ assetId });
      console.log(`🔊 NativeAudio beep played: ${assetPath}`);
    } catch (error: any) {
        const errorMessage = error.message || error.errorMessage;
        console.warn("❌ Failed to play beep with NativeAudio:", errorMessage);
        if (errorMessage === 'Audio Asset already exists') {
            console.log('Asset already loaded, trying to play...');
            beepPreloadedState[beepTone] = true; // Sync state
            await NativeAudio.play({ assetId }).catch(e => console.error("Play failed too", e));
        }
    }
  }, [soundSettings.beepTone]);

  // New specific audio functions for different reminder types
  const playTenSecondWarning = useCallback(async () => {
    console.log('🔊 Playing ten second warning audio file');
    await playAudioFile(tenSecondsWav);
  }, [playAudioFile]);

  const playHalfwayReminder = useCallback(async () => {
    console.log('🔊 Playing halfway reminder audio file');
    await playAudioFile(halfwayWav);
  }, [playAudioFile]);

  const playVerbalReminder = useCallback(async (timerType: string) => {
    console.log('🔊 Playing verbal reminder for timer type:', timerType);
    if (timerType === 'work') {
      await playAudioFile(workWav);
    } else if (timerType === 'rest' || timerType === 'rest_between_cycles') {
      await playAudioFile(restWav);
    }
  }, [playAudioFile]);

  const playCompletionSound = useCallback(async () => {
    console.log('🔊 Playing completion sound sequence');
    try {
      await playAudioFile(doneWav);
      // Wait a moment before playing the second sound
      setTimeout(async () => {
        await playAudioFile(greatWorkoutWav);
      }, 250);
    } catch (error) {
      console.warn("Failed to play completion sound:", error);
    }
  }, [playAudioFile]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  return {
    playBeep,
    playTenSecondWarning,
    playHalfwayReminder,
    playVerbalReminder,
    playCompletionSound,
    cleanup
  };
}
