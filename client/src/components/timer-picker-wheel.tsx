import { useState, useEffect, useRef } from "react";

interface TimePickerWheelProps {
  value: number;
  maxValue: number;
  /**
   * The minimum selectable value (inclusive). Defaults to 0 for backwards compatibility.
   */
  minValue?: number;
  onValueChange: (value: number) => void;
  name: string;
  itemHeight?: number;
  containerHeight?: number;
}

export default function TimePickerWheel({ 
  value, 
  maxValue, 
  minValue = 0,
  onValueChange, 
  name,
  itemHeight = 48,
  containerHeight = 144
}: TimePickerWheelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const values = Array.from({ length: maxValue - minValue + 1 }, (_, i) => i + minValue);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollPosition = (value - minValue) * itemHeight;
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, [value, itemHeight, minValue]);

  const handleScroll = () => {
    if (!scrollRef.current) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    const scrollTop = scrollRef.current.scrollTop;
    const itemIndex = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(values.length - 1, itemIndex));

    onValueChange(values[clampedIndex]);

    scrollTimeoutRef.current = setTimeout(() => {
      if (!scrollRef.current) return;

      const currentScrollTop = scrollRef.current.scrollTop;
      const currentItemIndex = Math.round(currentScrollTop / itemHeight);
      const currentClampedIndex = Math.max(0, Math.min(values.length - 1, currentItemIndex));
      const targetScrollTop = currentClampedIndex * itemHeight;

      if (Math.abs(currentScrollTop - targetScrollTop) > 2) {
        scrollRef.current.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    }, 200);
  };

  return (
    <div className="flex flex-col items-center flex-1">
      <div className="text-sm font-medium mb-2 text-foreground">{name}</div>
      <div className="relative">
        {/* Selection Bar */}
        <div 
          className="absolute left-0 right-0 border-2 border-foreground rounded-lg z-10 pointer-events-none"
          style={{ 
            top: `${containerHeight / 2 - itemHeight / 2}px`,
            height: `${itemHeight}px`,
            backgroundColor: 'transparent'
          }}
        />

        {/* Scrollable Container */}
        <div 
          ref={scrollRef}
          className="border-2 border-foreground rounded-lg overflow-y-auto scrollbar-hide"
          style={{ height: `${containerHeight}px`, width: '80px' }}
          onScroll={handleScroll}
        >
          {/* Padding top */}
          <div style={{ height: `${containerHeight / 2 - itemHeight / 2}px` }} />

          {/* Values */}
          {values.map((val) => (
            <div
              key={val}
              className="text-center flex items-center justify-center transition-colors"
              style={{ height: `${itemHeight}px` }}
            >
              <span className="text-lg font-bold">{val.toString().padStart(2, '0')}</span>
            </div>
          ))}

          {/* Padding bottom */}
          <div style={{ height: `${containerHeight / 2 - itemHeight / 2}px` }} />
        </div>
      </div>
    </div>
  );
}