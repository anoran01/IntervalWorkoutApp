import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Play, GripVertical, Plus } from "lucide-react";
import { formatTime } from "@/lib/workout-utils";
import WorkoutSettings from "@/components/workout-settings";
import AddTimerModal from "@/components/add-timer-modal";
import TimePickerModal from "@/components/time-picker-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import type { Workout, Timer, SoundSettings } from "@shared/schema";

interface WorkoutMenuProps {
  workout: Workout;
  timers: Timer[];
  onBack: () => void;
  onStart: () => void;
  onEditWorkoutName: (name: string) => void;
  onEditTimerName: (timerId: number, name: string) => void;
  onEditTimerDuration: (timerId: number, duration: number) => void;
  onUpdateSoundSettings: (settings: SoundSettings) => void;
  onTimersReordered: () => void;
}

export default function WorkoutMenu({ 
  workout, 
  timers, 
  onBack, 
  onStart,
  onEditWorkoutName,
  onEditTimerName,
  onEditTimerDuration,
  onUpdateSoundSettings,
  onTimersReordered
}: WorkoutMenuProps) {
  const [isEditingWorkoutName, setIsEditingWorkoutName] = useState(false);
  const [workoutNameInput, setWorkoutNameInput] = useState(workout.name);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddTimer, setShowAddTimer] = useState(false);
  const [showTimerDurationPicker, setShowTimerDurationPicker] = useState(false);
  const [editingTimerId, setEditingTimerId] = useState<number | null>(null);
  const [editingTimerDuration, setEditingTimerDuration] = useState(0);
  const [insertPosition, setInsertPosition] = useState(0);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [draggedOver, setDraggedOver] = useState<number | null>(null);
  const [headerHeight, setHeaderHeight] = useState(80); // Default fallback
  const [lineAngle, setLineAngle] = useState(0); // Line angle in degrees
  const [lineLength, setLineLength] = useState(200); // Line length in pixels
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timerListRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const addTimerButtonRef = useRef<HTMLButtonElement>(null);
  const addTimerLineRef = useRef<HTMLDivElement>(null);
  const timerRefs = useRef<(HTMLDivElement | null)[]>([]);

  const reorderMutation = useMutation({
    mutationFn: async (timerOrders: { id: number; order: number }[]) => {
      const response = await fetch(`/api/workouts/${workout.id}/timers/reorder`, {
        method: 'PATCH',
        body: JSON.stringify(timerOrders),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to reorder timers');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workouts', workout.id, 'timers'] });
      onTimersReordered();
    },
  });

  const addTimerMutation = useMutation({
    mutationFn: async ({ type, duration, position }: { type: string; duration: number; position: number }) => {
      const response = await fetch(`/api/workouts/${workout.id}/timers/insert`, {
        method: 'POST',
        body: JSON.stringify({
          name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
          type,
          duration,
          position
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to add timer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workouts', workout.id, 'timers'] });
      onTimersReordered();
    },
  });

  const handleWorkoutNameSave = () => {
    if (workoutNameInput.trim() && workoutNameInput !== workout.name) {
      onEditWorkoutName(workoutNameInput.trim());
    }
    setIsEditingWorkoutName(false);
  };

  // Calculate the nearest gap between timers and angle the line to point there
  const updateLineAngle = () => {
    if (!addTimerButtonRef.current || !timerListRef.current) return;

    const buttonRect = addTimerButtonRef.current.getBoundingClientRect();
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;

    // Get all timer elements
    const timerElements = timerRefs.current.filter(ref => ref !== null);
    
    if (timerElements.length === 0) {
      // No timers, point to the timer list area
      const listRect = timerListRef.current.getBoundingClientRect();
      const targetY = listRect.top + 50; // Point to beginning of list area
      const targetX = listRect.left + listRect.width / 2;
      
      const deltaX = targetX - buttonCenterX;
      const deltaY = targetY - buttonCenterY;
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      setLineAngle(angle);
      setLineLength(length);
      setInsertPosition(0);
      return;
    }

    // Find the gap closest to the button's Y position
    let closestGapY = 0;
    let closestDistance = Infinity;
    let closestPosition = 0;

    // Check gap before first timer
    const firstTimerRect = timerElements[0].getBoundingClientRect();
    const gapBeforeFirst = firstTimerRect.top - 15; // 15px above first timer
    const distanceToFirst = Math.abs(buttonCenterY - gapBeforeFirst);
    
    if (distanceToFirst < closestDistance) {
      closestDistance = distanceToFirst;
      closestGapY = gapBeforeFirst;
      closestPosition = 0;
    }

    // Check gaps between timers
    for (let i = 0; i < timerElements.length - 1; i++) {
      const currentRect = timerElements[i].getBoundingClientRect();
      const nextRect = timerElements[i + 1].getBoundingClientRect();
      const gapY = currentRect.bottom + ((nextRect.top - currentRect.bottom) / 2);
      const distance = Math.abs(buttonCenterY - gapY);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestGapY = gapY;
        closestPosition = i + 1;
      }
    }

    // Check gap after last timer
    const lastTimerRect = timerElements[timerElements.length - 1].getBoundingClientRect();
    const gapAfterLast = lastTimerRect.bottom + 15; // 15px below last timer
    const distanceToLast = Math.abs(buttonCenterY - gapAfterLast);
    
    if (distanceToLast < closestDistance) {
      closestDistance = distanceToLast;
      closestGapY = gapAfterLast;
      closestPosition = timerElements.length;
    }

    // Calculate angle from button to closest gap
    const listRect = timerListRef.current.getBoundingClientRect();
    const targetX = listRect.left + listRect.width / 2;
    
    const deltaX = targetX - buttonCenterX;
    const deltaY = closestGapY - buttonCenterY;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    setLineAngle(angle);
    setLineLength(Math.min(length, 300)); // Cap length at 300px
    setInsertPosition(closestPosition);
  };

  // Update line angle when timers change or on scroll
  useEffect(() => {
    updateLineAngle();
    
    const handleScroll = () => {
      updateLineAngle();
    };
    
    const handleResize = () => {
      updateLineAngle();
    };
    
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    
    window.addEventListener('resize', handleResize);
    
    // Update angle after a short delay to ensure DOM is settled
    const timer = setTimeout(updateLineAngle, 100);
    
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [timers.length, showAddTimer]); // Re-run when timer count changes

  const handleDragStart = (e: React.DragEvent, timerId: number) => {
    setDraggedItem(timerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, timerId: number) => {
    e.preventDefault();
    setDraggedOver(timerId);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = (e: React.DragEvent, targetTimerId: number) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetTimerId) {
      setDraggedItem(null);
      setDraggedOver(null);
      return;
    }

    // Find the indices of the dragged and target items
    const draggedIndex = timers.findIndex(t => t.id === draggedItem);
    const targetIndex = timers.findIndex(t => t.id === targetTimerId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      setDraggedOver(null);
      return;
    }

    // Create new order by moving the dragged item to the target position
    const newTimers = [...timers];
    const [draggedTimer] = newTimers.splice(draggedIndex, 1);
    newTimers.splice(targetIndex, 0, draggedTimer);

    // Update orders based on new positions
    const timerOrders = newTimers.map((timer, index) => ({
      id: timer.id,
      order: index
    }));

    // Submit the reorder request
    reorderMutation.mutate(timerOrders);
    
    setDraggedItem(null);
    setDraggedOver(null);
  };

  const handleAddTimer = (position: number) => {
    setInsertPosition(position);
    setShowAddTimer(true);
  };

  const handleAddTimerConfirm = (type: string, duration: number) => {
    addTimerMutation.mutate({ type, duration, position: insertPosition });
    setShowAddTimer(false);
  };

  const handleTimerDurationClick = (timerId: number, currentDuration: number) => {
    setEditingTimerId(timerId);
    setEditingTimerDuration(currentDuration);
    setShowTimerDurationPicker(true);
  };

  const handleTimerDurationConfirm = (newDuration: number) => {
    if (editingTimerId !== null && newDuration > 0) {
      onEditTimerDuration(editingTimerId, newDuration);
    }
    setShowTimerDurationPicker(false);
    setEditingTimerId(null);
  };

  const handleTimerDurationPickerClose = () => {
    setShowTimerDurationPicker(false);
    setEditingTimerId(null);
  };

  // Snap scroll to position the horizontal bar between timers
  const snapToPosition = () => {
    if (!scrollContainerRef.current || !timerListRef.current || timers.length === 0) return;

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerHeight = containerRect.height;
    const middleY = containerHeight / 3.9;

    // Get all timer elements
    const timerElements = timerListRef.current.children;
    if (timerElements.length === 0) return;

    let bestPosition = 0;
    let minDistance = Infinity;

    // Check positions between timers
    for (let i = 0; i <= timerElements.length; i++) {
      let targetY: number;

      if (i === 0) {
        // Before first timer
        const firstTimer = timerElements[0] as HTMLElement;
        const firstTimerRect = firstTimer.getBoundingClientRect();
        targetY = firstTimerRect.top - containerRect.top - 24; // 24px spacing
      } else if (i === timerElements.length) {
        // After last timer
        const lastTimer = timerElements[timerElements.length - 1] as HTMLElement;
        const lastTimerRect = lastTimer.getBoundingClientRect();
        targetY = lastTimerRect.bottom - containerRect.top + 24; // 24px spacing
      } else {
        // Between timers
        const prevTimer = timerElements[i - 1] as HTMLElement;
        const nextTimer = timerElements[i] as HTMLElement;
        const prevRect = prevTimer.getBoundingClientRect();
        const nextRect = nextTimer.getBoundingClientRect();
        targetY = (prevRect.bottom + nextRect.top) / 2 - containerRect.top;
      }

      const distance = Math.abs(targetY - middleY);
      if (distance < minDistance) {
        minDistance = distance;
        bestPosition = i;
      }
    }

    // Calculate the scroll adjustment needed
    let targetScrollTop: number;

    if (bestPosition === 0) {
      // Before first timer
      const firstTimer = timerElements[0] as HTMLElement;
      const firstTimerRect = firstTimer.getBoundingClientRect();
      targetScrollTop = container.scrollTop + (firstTimerRect.top - containerRect.top - 24) - middleY;
    } else if (bestPosition === timerElements.length) {
      // After last timer
      const lastTimer = timerElements[timerElements.length - 1] as HTMLElement;
      const lastTimerRect = lastTimer.getBoundingClientRect();
      targetScrollTop = container.scrollTop + (lastTimerRect.bottom - containerRect.top + 24) - middleY;
    } else {
      // Between timers
      const prevTimer = timerElements[bestPosition - 1] as HTMLElement;
      const nextTimer = timerElements[bestPosition] as HTMLElement;
      const prevRect = prevTimer.getBoundingClientRect();
      const nextRect = nextTimer.getBoundingClientRect();
      const betweenY = (prevRect.bottom + nextRect.top) / 2 - containerRect.top;
      targetScrollTop = container.scrollTop + betweenY - middleY;
    }

    // Smooth scroll to the target position
    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });

    setInsertPosition(bestPosition);
  };

  // Handle scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        snapToPosition();
      }, 150); // Debounce scroll events
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [timers.length]);

  // Measure header height on mount and when workout name changes
  useEffect(() => {
    const measureHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        setHeaderHeight(height);
      }
    };

    measureHeaderHeight();
    // Re-measure when window resizes or content changes
    window.addEventListener('resize', measureHeaderHeight);

    return () => window.removeEventListener('resize', measureHeaderHeight);
  }, [workout.name, isEditingWorkoutName]);
  
  // Initial snap on mount and when timers change
  useEffect(() => {
    setTimeout(() => snapToPosition(), 100);
  }, [timers.length]);

  const getTimerColor = (timerName: string, index: number) => {
    const name = timerName.toLowerCase();
    if (name.includes('prepare')) return 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
    if (name.includes('work')) return 'border-orange-500 bg-orange-100 dark:bg-orange-900/30';
    if (name.includes('rest') && !name.includes('cycle')) return 'border-blue-500 bg-blue-100 dark:bg-blue-900/30';
    if (name.includes('cycle')) return 'border-green-500 bg-green-100 dark:bg-green-900/30';
    
    // Fallback color cycling
    const colors = [
      'border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
      'border-orange-500 bg-orange-100 dark:bg-orange-900/30', 
      'border-blue-500 bg-blue-100 dark:bg-blue-900/30',
      'border-green-500 bg-green-100 dark:bg-green-900/30'
    ];
    return colors[index % colors.length];
  };

  const defaultSoundSettings: SoundSettings = {
    beepTone: "standard",
    beepStart: 10,
    tenSecondWarning: true,
    halfwayReminder: true,
    verbalReminder: true,
    vibrate: true
  };

  return (
    <div className="flex flex-col h-screen bg-background relative">
      {/* Fixed Header */}
      <div ref={headerRef} className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between p-4 border-b-2 border-black bg-background">
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={onBack}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        
        {isEditingWorkoutName ? (
          <input
            type="text"
            value={workoutNameInput}
            onChange={(e) => setWorkoutNameInput(e.target.value)}
            onBlur={handleWorkoutNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleWorkoutNameSave();
              if (e.key === 'Escape') {
                setWorkoutNameInput(workout.name);
                setIsEditingWorkoutName(false);
              }
            }}
            className="text-2xl font-bold text-center bg-transparent border-none outline-none"
            autoFocus
          />
        ) : (
          <h1 
            className="text-2xl font-bold text-center flex-1 cursor-pointer"
            onClick={() => setIsEditingWorkoutName(true)}
          >
            {workout.name}
          </h1>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="w-6 h-6" />
        </Button>
      </div>

      {/* Fixed Add Timer Button - positioned between 2nd and 3rd timers */}
      <div className="fixed left-4 right-4 z-30 flex items-center" style={{ 
        top: '50vh' // Header + Play button + spacing + 1st timer + spacing + half of spacing?
      }}>
        <button ref={addTimerButtonRef} 
          onClick={() => handleAddTimer(insertPosition)}
          className="w-8 h-8 rounded-full border-2 border-black dark:border-white bg-background flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
        <svg 
          ref={addTimerLineRef}
          className="ml-3" 
          width={lineLength} 
          height="100" 
          style={{ 
            position: 'absolute',
            left: '44px', // Position after button (32px + 12px margin)
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            zIndex: 25
          }}
        >
          <line
            x1="0"
            y1="50"
            x2={lineLength}
            y2="50"
            stroke="currentColor"
            strokeWidth="2"
            className="text-black dark:text-white"
            style={{
              transform: `rotate(${lineAngle}deg)`,
              transformOrigin: '0 50px'
            }}
          />
        </svg>
      </div>

      {/* Scrollable Content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pb-4 scrollbar-hide"
        style={{ scrollBehavior: 'auto',
               paddingTop: `${headerHeight}px` }}
      >
        <div className="p-4 space-y-6">
          {/* Play Button */}
          <Button
            onClick={onStart}
            className="w-full h-16 text-xl font-bold bg-background border-2 border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white rounded-lg"
          >
            Play
          </Button>

          {/* Timer List */}
          <div ref={timerListRef} className="space-y-3">
            {timers.map((timer, index) => (
              <div
                key={timer.id}
                ref={(el) => { timerRefs.current[index] = el; }}
                className={`border-2 rounded-lg p-4 transition-all duration-200 ${getTimerColor(timer.name, index)} ${
                  draggedItem === timer.id ? 'opacity-50' : ''
                } ${
                  draggedOver === timer.id ? 'transform translate-y-1 shadow-lg' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, timer.id)}
                onDragOver={(e) => handleDragOver(e, timer.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, timer.id)}
              >
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    
                    <GripVertical className="w-5 h-5 text-gray-500 cursor-grab active:cursor-grabbing" />
                    <span 
                      className="text-lg font-bold cursor-pointer"
                      onClick={() => {
                        const newName = prompt('Enter timer name:', timer.name);
                        if (newName && newName.trim() && newName !== timer.name) {
                          onEditTimerName(timer.id, newName.trim());
                        }
                      }}
                    >
                      {timer.name}
                    </span>
                  </div>
                  <span 
                    className="text-lg font-bold cursor-pointer"
                    onClick={() => handleTimerDurationClick(timer.id, timer.duration)}
                  >
                    {formatTime(timer.duration)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50">
          <WorkoutSettings
            workoutName={workout.name}
            soundSettings={workout.soundSettings as SoundSettings || defaultSoundSettings}
            onSave={onUpdateSoundSettings}
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}

      {/* Add Timer Modal */}
      {showAddTimer && (
        <AddTimerModal
          isOpen={showAddTimer}
          onClose={() => setShowAddTimer(false)}
          onConfirm={handleAddTimerConfirm}
        />
      )}

      {/* Timer Duration Picker Modal */}
      {showTimerDurationPicker && (
        <TimePickerModal
          isOpen={showTimerDurationPicker}
          onClose={handleTimerDurationPickerClose}
          onConfirm={handleTimerDurationConfirm}
          title="Edit Timer Duration"
          initialSeconds={editingTimerDuration}
          showHours={true}
        />
      )}
    </div>
  );
}