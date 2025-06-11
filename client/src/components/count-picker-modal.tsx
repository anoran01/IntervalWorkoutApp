import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

  const handleConfirm = () => {
    onConfirm(count);
    onClose();
  };

  const createScrollList = () => {
    const items = Array.from({ length: max - min + 1 }, (_, i) => i + min);
    
    return (
      <div className="flex flex-col items-center w-full">
        <div className="h-64 overflow-y-auto border border-border rounded-lg w-full max-w-24">
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-center py-4">
          {createScrollList()}
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