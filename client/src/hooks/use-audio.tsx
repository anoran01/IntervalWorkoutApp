import { useCallback, useRef } from "react";
import type { SoundSettings } from "@/schema";

// Import audio files
import tenSecondsWav from "@/audio/ten-seconds.wav";
import halfwayWav from "@/audio/halfway.wav";
import workWav from "@/audio/work.wav";
import restWav from "@/audio/rest.wav";
import doneWav from "@/audio/done.wav";
import greatWorkoutWav from "@/audio/great-workout.wav";

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

  const playBeep = useCallback(async () => {
    console.log('🔊 playBeep called - Settings:', soundSettings);
    
    const audioContext = initAudioContext();
    if (!audioContext) {
      console.warn('❌ No audio context available');
      return;
    }

    try {
      // Resume audio context if suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        console.log('🔊 Resuming suspended audio context...');
        audioContext.resume();//await audioContext.resume();
      }

      // Mark audio as enabled on first successful interaction
      if (!isAudioEnabledRef.current) {
        isAudioEnabledRef.current = true;
        console.log('✅ Audio context activated by user interaction');
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set frequency based on beep tone setting
      let frequency = 800; // Standard
      switch (soundSettings.beepTone) {
        case "high_pitch":
          frequency = 1200;
          break;
        case "low_pitch":
          frequency = 400;
          break;
        default:
          frequency = 800;
      }

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      // Envelope for the beep
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      console.log('🔊 Beep played successfully - Frequency:', frequency, 'State:', audioContext.state);
    } catch (error) {
      console.warn("❌ Failed to play beep:", error);
    }
  }, [soundSettings.beepTone, initAudioContext, soundSettings]);

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
