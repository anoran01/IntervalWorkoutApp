import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Play, Edit3, MoreVertical } from "lucide-react";
import type { Workout, Timer } from "@shared/schema";

interface WorkoutDetailProps {
  workout: Workout;
  timers: Timer[];
  onBack: () => void;
  onStart: () => void;
}

export default function WorkoutDetail({ workout, timers, onBack, onStart }: WorkoutDetailProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [workoutName, setWorkoutName] = useState(workout.name);
  const [editingTimer, setEditingTimer] = useState<number | null>(null);
  const [timerNames, setTimerNames] = useState<Record<number, string>>(() => {
    const names: Record<number, string> = {};
    timers.forEach(timer => {
      names[timer.id] = timer.name;
    });
    return names;
  });

  const queryClient = useQueryClient();

  const updateWorkoutMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await apiRequest("PATCH", `/api/workouts/${workout.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      setIsEditingName(false);
    },
  });

  const updateTimerMutation = useMutation({
    mutationFn: async (data: { id: number; name: string }) => {
      const response = await apiRequest("PATCH", `/api/timers/${data.id}`, { name: data.name });
      return response.json();
    },
    onSuccess: () => {
      setEditingTimer(null);
    },
  });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) {
      return `0:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (type: string) => {
    switch (type) {
      case "work":
        return "bg-orange-500";
      case "rest":
      case "rest_between_cycles":
        return "bg-blue-500";
      case "prepare":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleNameSave = () => {
    if (workoutName.trim() && workoutName !== workout.name) {
      updateWorkoutMutation.mutate({ name: workoutName.trim() });
    } else {
      setIsEditingName(false);
    }
  };

  const handleTimerNameSave = (timerId: number) => {
    const newName = timerNames[timerId]?.trim();
    if (newName && newName !== timers.find(t => t.id === timerId)?.name) {
      updateTimerMutation.mutate({ id: timerId, name: newName });
    } else {
      setEditingTimer(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-orange-500 p-1"
          onClick={onBack}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 p-1"
        >
          <MoreVertical className="w-6 h-6" />
        </Button>
      </div>

      <div className="px-4">
        {/* Workout Name */}
        <div className="flex items-center mb-6">
          {isEditingName ? (
            <div className="flex-1 flex items-center space-x-2">
              <Input
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="flex-1 bg-transparent border-b border-orange-500 rounded-none px-0 text-2xl font-bold text-white"
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleNameSave();
                  } else if (e.key === "Escape") {
                    setWorkoutName(workout.name);
                    setIsEditingName(false);
                  }
                }}
                autoFocus
              />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold flex-1 text-white">{workoutName}</h1>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 text-gray-400 p-1"
                onClick={() => setIsEditingName(true)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Play Button */}
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-xl mb-6"
          onClick={onStart}
        >
          <Play className="w-6 h-6 mr-3" />
          Start Workout
        </Button>

        {/* Timers List */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg mb-4 text-white">Workout Timers</h3>
          
          {timers.map((timer) => (
            <div key={timer.id} className="flex items-center app-gray rounded-lg p-3">
              <div className={`w-4 h-4 rounded-full mr-3 ${getTimerColor(timer.type)}`} />
              <div className="flex-1">
                {editingTimer === timer.id ? (
                  <Input
                    value={timerNames[timer.id] || timer.name}
                    onChange={(e) => setTimerNames(prev => ({
                      ...prev,
                      [timer.id]: e.target.value
                    }))}
                    className="bg-transparent text-white font-medium w-full border-b border-orange-500 rounded-none px-0"
                    onBlur={() => handleTimerNameSave(timer.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleTimerNameSave(timer.id);
                      } else if (e.key === "Escape") {
                        setTimerNames(prev => ({
                          ...prev,
                          [timer.id]: timer.name
                        }));
                        setEditingTimer(null);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div
                    className="text-white font-medium cursor-pointer"
                    onClick={() => {
                      setEditingTimer(timer.id);
                      setTimerNames(prev => ({
                        ...prev,
                        [timer.id]: timer.name
                      }));
                    }}
                  >
                    {timerNames[timer.id] || timer.name}
                  </div>
                )}
                <p className="text-gray-400 text-sm">{formatTime(timer.duration)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 ml-2 p-1"
                onClick={() => setEditingTimer(timer.id)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          <div className="text-center py-4 text-gray-400">
            <p className="text-sm">Total Intervals: {timers.length}</p>
            <p className="text-xs mt-1">
              Total Duration: {Math.ceil(timers.reduce((sum, timer) => sum + timer.duration, 0) / 60)} minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
