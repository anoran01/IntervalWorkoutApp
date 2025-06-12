import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface BeepStartPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (seconds: number) => void;
  initialValue: number;
}

export default function BeepStartPicker({ isOpen, onClose, onConfirm, initialValue }: BeepStartPickerProps) {
  const [selectedValue, setSelectedValue] = useState(initialValue);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemHeight = 48; // Height of each item
  const containerHeight = 144; // Height of visible area (3 items)

  const values = Array.from({ length: 11 }, (_, i) => i); // 0 to 10

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      // Center the initial value in the picker
      const scrollPosition = selectedValue * itemHeight - containerHeight / 2 + itemHeight / 2;
      scrollRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, [isOpen, selectedValue]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    const centerPosition = scrollTop + containerHeight / 2;
    const selectedIndex = Math.round(centerPosition / itemHeight);
    const clampedIndex = Math.max(0, Math.min(values.length - 1, selectedIndex));
    
    if (clampedIndex !== selectedValue) {
      setSelectedValue(clampedIndex);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedValue);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-background border-2 border-black rounded-lg p-6 w-80 max-w-sm mx-4">
        <h2 className="text-2xl font-bold text-center mb-4">Beep Start</h2>
        <p className="text-center mb-6">sec</p>
        
        {/* Picker Wheel */}
        <div className="flex justify-center mb-8 relative">
          <div className="relative">
            {/* Selection Bar */}
            <div 
              className="absolute left-0 right-0 border-2 border-black rounded-lg bg-gray-100 dark:bg-gray-800 z-10 pointer-events-none"
              style={{ 
                top: `${containerHeight / 2 - itemHeight / 2}px`,
                height: `${itemHeight}px`
              }}
            />
            
            {/* Scrollable Container */}
            <div 
              ref={scrollRef}
              className="border-2 border-black rounded-lg overflow-y-auto scrollbar-hide"
              style={{ height: `${containerHeight}px`, width: '120px' }}
              onScroll={handleScroll}
            >
              {/* Padding top */}
              <div style={{ height: `${containerHeight / 2 - itemHeight / 2}px` }} />
              
              {/* Values */}
              {values.map((value) => (
                <div
                  key={value}
                  className="text-center flex items-center justify-center transition-colors"
                  style={{ height: `${itemHeight}px` }}
                >
                  <span className="text-xl font-bold">{value}</span>
                </div>
              ))}
              
              {/* Padding bottom */}
              <div style={{ height: `${containerHeight / 2 - itemHeight / 2}px` }} />
            </div>
          </div>
        </div>

        <Button
          onClick={handleConfirm}
          className="w-full h-12 text-lg font-bold bg-background border-2 border-black hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white rounded-lg"
        >
          Done
        </Button>
      </div>
    </div>
  );
}