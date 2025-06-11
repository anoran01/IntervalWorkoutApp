import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    
    return (
      <div className="flex flex-col items-center flex-1">
        <div className="text-sm font-medium mb-2 text-muted-foreground">{label}</div>
        <div className="h-48 w-full overflow-y-auto border border-border rounded-lg bg-background">
          <div className="py-20"> {/* Padding to center the selected item */}
            {items.map((item) => (
              <div
                key={item}
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 py-4">
          {showHours && createScrollList(23, hours, setHours, "Hours")}
          {createScrollList(59, minutes, setMinutes, "Minutes")}
          {createScrollList(59, seconds, setSeconds, "Seconds")}
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}