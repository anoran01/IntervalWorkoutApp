import { useState } from "react";
import { Button } from "@/components/ui/button";
import TimePickerModal from "@/components/time-picker-modal";

interface AddTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: string, duration: number) => void;
}

const TIMER_TYPES = [
  { id: 'prepare', label: 'Prepare', color: 'bg-yellow-500' },
  { id: 'work', label: 'Work', color: 'bg-orange-500' },
  { id: 'rest', label: 'Rest', color: 'bg-blue-500' },
  { id: 'cycle_rest', label: 'Cycle Rest', color: 'bg-green-500' }
];

export default function AddTimerModal({ isOpen, onClose, onConfirm }: AddTimerModalProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState(30);

  if (!isOpen) return null;

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setShowTimePicker(true);
  };

  const handleTimeConfirm = (seconds: number) => {
    setDuration(seconds);
    setShowTimePicker(false);
    onConfirm(selectedType, seconds);
    // Reset state
    setSelectedType('');
    setDuration(30);
  };

  const handleTimePickerClose = () => {
    setShowTimePicker(false);
    setSelectedType('');
  };

  if (showTimePicker) {
    return (
      <TimePickerModal
        isOpen={true}
        onClose={handleTimePickerClose}
        onConfirm={handleTimeConfirm}
        title={`${selectedType.charAt(0).toUpperCase() + selectedType.slice(1).replace('_', ' ')} Duration`}
        initialSeconds={duration}
        showHours={false}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-center">Add Timer</h2>
        </div>

        {/* Timer Type Selection */}
        <div className="p-6 space-y-4">
          {TIMER_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeSelect(type.id)}
              className="w-full p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex items-center gap-3"
            >
              <div className={`w-4 h-4 rounded-full ${type.color}`}></div>
              <span className="text-lg font-medium">{type.label}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}