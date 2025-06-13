import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (totalSeconds: number) => void;
  title: string;
  initialSeconds: number;
  showHours?: boolean;
}

export default function TimePickerModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  initialSeconds,
  showHours = true
}: TimePickerModalProps) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  // Reset values when modal opens with new initial seconds
  useEffect(() => {
    if (isOpen && initialSeconds >= 0) {
      const h = Math.floor(initialSeconds / 3600);
      const m = Math.floor((initialSeconds % 3600) / 60);
      const s = initialSeconds % 60;
      setHours(h);
      setMinutes(m);
      setSeconds(s);
    }
  }, [isOpen, initialSeconds]);

  const handleConfirm = () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    onConfirm(totalSeconds);
    onClose();
  };

  const createScrollList = (max: number, value: number, onChange: (val: number) => void, label: string) => {
    const items = Array.from({ length: max + 1 }, (_, i) => i);
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // Scroll to the current value when component mounts or value changes
    useEffect(() => {
      if (scrollRef.current && isOpen) {
        // Wait for DOM to render then calculate exact dimensions
        setTimeout(() => {
          if (!scrollRef.current) return;
          
          const container = scrollRef.current;
          const firstItem = container.querySelector('div[data-item]') as HTMLElement;
          
          if (firstItem) {
            const itemHeight = firstItem.offsetHeight;
            const containerHeight = container.clientHeight;
            const scrollTop = Math.max(0, value * itemHeight - containerHeight / 2 + itemHeight / 2);
            
            container.scrollTo({
              top: scrollTop,
              behavior: 'auto'
            });
          }
        }, 100);
      }
    }, [value, isOpen]);
    
    return (
      <div className="flex flex-col items-center flex-1">
        <div className="text-sm font-medium mb-2 text-muted-foreground">{label}</div>
        <div 
          ref={scrollRef}
          className="h-48 w-full overflow-y-auto border border-border rounded-lg bg-background"
        >
          <div className="py-20"> {/* Padding to center the selected item */}
            {items.map((item) => (
              <div
                key={item}
                data-item
                className={`px-4 py-3 text-center cursor-pointer transition-colors text-lg ${
                  item === value
                    ? "bg-primary text-primary-foreground font-bold"
                    : "hover:bg-muted text-foreground"
                }`}
                onClick={() => onChange(item)}
              >
                {item.toString().padStart(2, '0')}
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
        
        <div className="flex gap-4 py-4">
          {showHours && createScrollList(23, hours, setHours, "Hours")}
          {createScrollList(59, minutes, setMinutes, "Minutes")}
          {createScrollList(59, seconds, setSeconds, "Seconds")}
        </div>
        
        <div className="flex justify-center pt-4">
          <Button onClick={handleConfirm} className="w-full border-2 border-black dark:border-white">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}