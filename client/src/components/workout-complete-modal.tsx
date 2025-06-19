import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import type { Workout } from "@/schema";

interface WorkoutCompleteModalProps {
  workout: Workout;
  onClose: () => void;
}

export default function WorkoutCompleteModal({ workout, onClose }: WorkoutCompleteModalProps) {
  const calculateTotalDuration = () => {
    const { prepare, work, rest, rounds, cycles, restBetweenCycles } = workout;
    
    const cycleTime = rounds * (work + rest) - rest; // Last round doesn't have rest
    const totalCycleTime = cycles * cycleTime;
    const totalRestBetweenCycles = (cycles - 1) * restBetweenCycles;
    const totalTime = prepare + totalCycleTime + totalRestBetweenCycles;
    
    return Math.ceil(totalTime / 60); // Convert to minutes
  };

  const calculateTotalIntervals = () => {
    const { rounds, cycles } = workout;
    let intervals = 0;
    
    // Prepare timer
    if (workout.prepare > 0) intervals += 1;
    
    // Work and rest timers per cycle
    intervals += cycles * (rounds * 2 - 1); // Each cycle has rounds * 2 - 1 intervals (last rest is omitted)
    
    // Rest between cycles
    if (workout.restBetweenCycles > 0 && cycles > 1) {
      intervals += cycles - 1;
    }
    
    return intervals;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="app-gray rounded-lg p-6 max-w-sm w-full text-center">
        <div className="mb-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Workout Complete!</h2>
          <p className="text-gray-400">Great job finishing your {workout.name} workout</p>
        </div>
        
        <div className="bg-black rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Duration</div>
              <div className="font-semibold text-white">{calculateTotalDuration()} min</div>
            </div>
            <div>
              <div className="text-gray-400">Intervals</div>
              <div className="font-semibold text-white">{calculateTotalIntervals()}</div>
            </div>
          </div>
        </div>
        
        <Button 
          className="w-full work-color font-semibold py-3"
          onClick={onClose}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
