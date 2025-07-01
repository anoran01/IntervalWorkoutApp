import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import TimePickerWheel from "@/components/timer-picker-wheel";

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
  max = 100
}: CountPickerModalProps) {
  const [count, setCount] = useState(initialCount);

  // Reset count when modal opens with new initial value
  useEffect(() => {
    if (isOpen) {
      setCount(initialCount);
    }
  }, [isOpen, initialCount]);

  const handleConfirm = () => {
    onConfirm(count);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-sm p-6">
        <div className="flex flex-col space-y-1.5 text-center mb-4">
          <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
        </div>

        <div className="flex justify-center py-4">
          <TimePickerWheel
            value={count}
            minValue={min}
            maxValue={max}
            onValueChange={(value) => setCount(value)}
            name=""
            containerHeight={244}
          />
        </div>

        <div className="flex justify-center pt-4">
          <Button
            onClick={handleConfirm}
            className="w-full h-12 text-lg font-bold bg-background border-2 border-black dark:border-white text-black dark:text-white rounded-lg"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}