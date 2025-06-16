import { useCallback, useRef } from "react";
import type { SoundSettings } from "@shared/schema";

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
        await audioContext.resume();
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

  const playCompletionSound = useCallback(() => {
    const audioContext = initAudioContext();
    if (!audioContext) return;

    try {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Play a sequence of ascending tones for completion
      const frequencies = [523, 659, 784, 1047]; // C, E, G, C (major chord)
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = 'sine';

        const startTime = audioContext.currentTime + index * 0.15;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
      });
    } catch (error) {
      console.warn("Failed to play completion sound:", error);
    }
  }, [initAudioContext]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  return {
    playBeep,
    playCompletionSound,
    cleanup
  };
}
