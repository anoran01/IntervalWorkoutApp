import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import TimePickerWheel from "@/components/timer-picker-wheel";

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (totalSeconds: number) => void;
  title: string;
  initialSeconds: number;
}

export default function TimePickerModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  initialSeconds,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background border-foreground rounded-lg shadow-lg w-full max-w-sm p-6">
        <div className="flex flex-col space-y-1.5 text-center mb-4">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </h2>
        </div>

        <div className="flex gap-4 py-4">
          <TimePickerWheel
            value={minutes}
            maxValue={59}
            onValueChange={setMinutes}
            name="Minutes"
            containerHeight={244}
          />
          <TimePickerWheel
            value={seconds}
            maxValue={59}
            onValueChange={setSeconds}
            name="Seconds"
            containerHeight={244}
          />
        </div>

        <div className="flex justify-center pt-4">
          <Button
            onClick={handleConfirm}
            className="w-full h-12 text-lg text-foreground font-bold bg-background border-2 border-foreground rounded-lg mt-4"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}