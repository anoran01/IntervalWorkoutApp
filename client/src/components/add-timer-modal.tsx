import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/workout-utils";

interface AddTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: string, duration: number) => void;
}

const timerTypes = [
  { value: "prepare", label: "Prepare", color: "border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30" },
  { value: "work", label: "Work", color: "border-orange-500 bg-orange-100 dark:bg-orange-900/30" },
  { value: "rest", label: "Rest", color: "border-blue-500 bg-blue-100 dark:bg-blue-900/30" },
  { value: "rest_between_cycles", label: "Rest Between Cycles", color: "border-green-500 bg-green-100 dark:bg-green-900/30" }
];

export default function AddTimerModal({ isOpen, onClose, onConfirm }: AddTimerModalProps) {
  const [selectedType, setSelectedType] = useState("prepare");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const handleConfirm = () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds > 0) {
      onConfirm(selectedType, totalSeconds);
      onClose();
      // Reset form
      setSelectedType("prepare");
      setHours(0);
      setMinutes(0);
      setSeconds(0);
    }
  };

  const generatePickerValues = (max: number) => {
    return Array.from({ length: max + 1 }, (_, i) => i);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-background border-2 border-black rounded-lg p-6 w-80 max-w-sm mx-4">
        <h2 className="text-2xl font-bold text-center mb-6">Add Timer</h2>
        
        {/* Timer Type Selection */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-3">
            {timerTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`border-2 rounded-lg p-3 text-sm font-bold transition-all ${
                  selectedType === type.value 
                    ? type.color + " opacity-100" 
                    : "border-gray-300 bg-gray-100 dark:bg-gray-800 opacity-50"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Pickers */}
        <div className="mb-6">
          <div className="flex justify-center gap-4">
            {/* Hours */}
            <div className="text-center">
              <div className="text-sm font-bold mb-2">hours</div>
              <div className="border-2 border-black rounded-lg h-32 w-16 overflow-y-auto scrollbar-hide">
                {generatePickerValues(23).map((value) => (
                  <div
                    key={value}
                    className={`h-8 flex items-center justify-center cursor-pointer text-sm ${
                      hours === value ? "bg-blue-200 dark:bg-blue-800" : ""
                    }`}
                    onClick={() => setHours(value)}
                  >
                    {value}
                  </div>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="text-center">
              <div className="text-sm font-bold mb-2">min</div>
              <div className="border-2 border-black rounded-lg h-32 w-16 overflow-y-auto scrollbar-hide">
                {generatePickerValues(59).map((value) => (
                  <div
                    key={value}
                    className={`h-8 flex items-center justify-center cursor-pointer text-sm ${
                      minutes === value ? "bg-blue-200 dark:bg-blue-800" : ""
                    }`}
                    onClick={() => setMinutes(value)}
                  >
                    {value}
                  </div>
                ))}
              </div>
            </div>

            {/* Seconds */}
            <div className="text-center">
              <div className="text-sm font-bold mb-2">sec</div>
              <div className="border-2 border-black rounded-lg h-32 w-16 overflow-y-auto scrollbar-hide">
                {generatePickerValues(59).map((value) => (
                  <div
                    key={value}
                    className={`h-8 flex items-center justify-center cursor-pointer text-sm ${
                      seconds === value ? "bg-blue-200 dark:bg-blue-800" : ""
                    }`}
                    onClick={() => setSeconds(value)}
                  >
                    {value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mb-6 text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">Duration: {formatTime(hours * 3600 + minutes * 60 + seconds)}</div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            className="flex-1 h-12 text-lg font-bold bg-background border-2 border-black hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={hours === 0 && minutes === 0 && seconds === 0}
            className="flex-1 h-12 text-lg font-bold bg-background border-2 border-black hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white rounded-lg disabled:opacity-50"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}