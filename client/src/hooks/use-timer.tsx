import { useState, useEffect, useCallback, useRef } from "react";

interface UseTimerOptions {
  initialTime: number;
  onTick?: (timeRemaining: number) => void;
  onComplete?: () => void;
}

export function useTimer({ initialTime, onTick, onComplete }: UseTimerOptions) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  const start = useCallback(() => {
    setIsActive(true);
    lastTickRef.current = Date.now();
  }, []);

  const pause = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback((newTime?: number) => {
    setIsActive(false);
    setTimeRemaining(newTime ?? initialTime);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [initialTime]);

  const addTime = useCallback((seconds: number) => {
    setTimeRemaining(prev => prev + seconds);
  }, []);

  // Main timer effect
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const deltaTime = now - lastTickRef.current;
        
        // Use high precision timing - only decrement if at least 1000ms have passed
        if (deltaTime >= 1000) {
          setTimeRemaining(prev => {
            const newTime = Math.max(0, prev - 1);
            
            // Call onTick callback
            if (onTick) {
              onTick(newTime);
            }
            
            // Check if timer completed
            if (newTime === 0 && onComplete) {
              setTimeout(onComplete, 100); // Small delay to ensure state updates
            }
            
            return newTime;
          });
          
          lastTickRef.current = now;
        }
      }, 100); // Check every 100ms for better precision
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, timeRemaining, onTick, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeRemaining,
    isActive,
    start,
    pause,
    reset,
    addTime
  };
}
