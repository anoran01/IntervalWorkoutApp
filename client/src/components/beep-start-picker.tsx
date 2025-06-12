import { useState } from "react";
import { Button } from "@/components/ui/button";

interface BeepStartPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (seconds: number) => void;
  initialValue: number;
}

export default function BeepStartPicker({ isOpen, onClose, onConfirm, initialValue }: BeepStartPickerProps) {
  const [selectedValue, setSelectedValue] = useState(initialValue);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedValue);
    onClose();
  };

  const values = Array.from({ length: 11 }, (_, i) => i); // 0 to 10

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-background border-2 border-black rounded-lg p-6 w-80 max-w-sm mx-4">
        <h2 className="text-2xl font-bold text-center mb-4">Beep Start</h2>
        <p className="text-center mb-6">sec</p>
        
        {/* Picker Wheel */}
        <div className="flex justify-center mb-8">
          <div className="border-2 border-black rounded-lg p-4 h-48 overflow-y-auto">
            <div className="space-y-2">
              {values.map((value) => (
                <div
                  key={value}
                  className={`text-center py-2 px-4 cursor-pointer rounded transition-colors ${
                    selectedValue === value
                      ? 'bg-black text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedValue(value)}
                >
                  <span className="text-xl font-bold">{value}</span>
                </div>
              ))}
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