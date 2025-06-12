import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface CountPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (count: number) => void;
  title: string;
  initialCount: number;
  min?: number;
  max?: number;
}

export default function CountPickerModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  initialCount,
  min = 1,
  max = 50
}: CountPickerModalProps) {
  const [count, setCount] = useState(initialCount);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset count when modal opens with new initial value
  useEffect(() => {
    if (isOpen) {
      setCount(initialCount);
    }
  }, [isOpen, initialCount]);

  // Scroll to the current value when modal opens or count changes
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      const itemHeight = 48; // px-4 py-3 = roughly 48px height
      const containerHeight = 256; // h-64 = 256px
      const itemIndex = count - min;
      const scrollTop = Math.max(0, itemIndex * itemHeight - containerHeight / 2 + itemHeight / 2);
      
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [count, isOpen, min]);

  const handleConfirm = () => {
    onConfirm(count);
    onClose();
  };

  const createScrollList = () => {
    const items = Array.from({ length: max - min + 1 }, (_, i) => i + min);
    
    return (
      <div className="flex flex-col items-center w-full">
        <div 
          ref={scrollRef}
          className="h-64 overflow-y-auto border border-border rounded-lg w-full max-w-24"
        >
          <div className="py-20"> {/* Padding to center the selected item */}
            {items.map((item) => (
              <div
                key={item}
                className={`px-4 py-3 text-center cursor-pointer transition-colors text-lg ${
                  item === count
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-muted"
                }`}
                onClick={() => setCount(item)}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-sm p-6">
        <div className="flex flex-col space-y-1.5 text-center mb-4">
          <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
        </div>
        
        <div className="flex justify-center py-4">
          {createScrollList()}
        </div>
        
        <div className="flex justify-center pt-4">
          <Button onClick={handleConfirm} className="w-full">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}