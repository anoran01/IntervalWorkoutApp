import { useState } from "react";
import QuickMenu from "@/components/quick-menu";
import WorkoutList from "@/components/workout-list";
import WorkoutMenu from "@/components/workout-menu";
import WorkoutTimer from "@/components/workout-timer-new";
import WorkoutCompleteModal from "@/components/workout-complete-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Workout, Timer } from "@shared/schema";

type Screen = "quick-menu" | "workout-list" | "workout-detail" | "workout-timer";

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("quick-menu");
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [workoutTimers, setWorkoutTimers] = useState<Timer[]>([]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const handleWorkoutSelect = (workout: Workout, timers: Timer[]) => {
    setSelectedWorkout(workout);
    setWorkoutTimers(timers);
    setCurrentScreen("workout-detail");
  };

  const handleStartWorkout = () => {
    setCurrentScreen("workout-timer");
  };

  const handleBackToList = () => {
    setCurrentScreen("workout-list");
  };

  const handleWorkoutComplete = () => {
    setShowCompleteModal(true);
  };

  const handleCompleteModalClose = () => {
    setShowCompleteModal(false);
    setCurrentScreen("workout-list");
  };

  const handleStopWorkout = () => {
    setCurrentScreen("workout-detail");
  };

  const handleEditWorkoutName = async (name: string) => {
    if (!selectedWorkout) return;
    
    try {
      const response = await apiRequest("PATCH", `/api/workouts/${selectedWorkout.id}`, {
        name
      });
      const updatedWorkout = await response.json();
      setSelectedWorkout(updatedWorkout);
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
    } catch (error) {
      console.error("Failed to update workout name:", error);
    }
  };

  const handleEditTimerName = async (timerId: number, name: string) => {
    try {
      const response = await apiRequest("PATCH", `/api/timers/${timerId}`, {
        name
      });
      const updatedTimer = await response.json();
      
      // Update the timers in state
      setWorkoutTimers(prev => 
        prev.map(timer => timer.id === timerId ? updatedTimer : timer)
      );
    } catch (error) {
      console.error("Failed to update timer name:", error);
    }
  };

  const handleEditTimerDuration = async (timerId: number, duration: number) => {
    try {
      const response = await apiRequest("PATCH", `/api/timers/${timerId}`, {
        duration
      });
      const updatedTimer = await response.json();
      
      // Update the timers in state
      setWorkoutTimers(prev => 
        prev.map(timer => timer.id === timerId ? updatedTimer : timer)
      );
    } catch (error) {
      console.error("Failed to update timer duration:", error);
    }
  };

  return (
    <div className="max-w-sm mx-auto min-h-screen relative bg-background">
      {/* Main Content */}
      <div className="h-screen">
        {currentScreen === "quick-menu" && <QuickMenu onNavigateToWorkoutList={() => setCurrentScreen("workout-list")} />}
        {currentScreen === "workout-list" && (
          <WorkoutList 
            onWorkoutSelect={handleWorkoutSelect} 
            onNavigateToQuickCreate={() => setCurrentScreen("quick-menu")}
          />
        )}
        {currentScreen === "workout-detail" && selectedWorkout && (
          <WorkoutMenu
            workout={selectedWorkout}
            timers={workoutTimers}
            onBack={handleBackToList}
            onStart={handleStartWorkout}
            onEditWorkoutName={handleEditWorkoutName}
            onEditTimerName={handleEditTimerName}
            onEditTimerDuration={handleEditTimerDuration}
          />
        )}
        {currentScreen === "workout-timer" && selectedWorkout && (
          <WorkoutTimer
            workout={selectedWorkout}
            timers={workoutTimers}
            onComplete={handleWorkoutComplete}
            onStop={handleStopWorkout}
          />
        )}
      </div>

      {/* Workout Complete Modal */}
      {showCompleteModal && selectedWorkout && (
        <WorkoutCompleteModal
          workout={selectedWorkout}
          onClose={handleCompleteModalClose}
        />
      )}
    </div>
  );
}
