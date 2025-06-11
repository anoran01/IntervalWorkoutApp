import { useState } from "react";
import QuickMenu from "@/components/quick-menu";
import WorkoutList from "@/components/workout-list";
import WorkoutDetail from "@/components/workout-detail";
import WorkoutTimer from "@/components/workout-timer";
import WorkoutCompleteModal from "@/components/workout-complete-modal";
import { Plus, List } from "lucide-react";
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
          <WorkoutDetail
            workout={selectedWorkout}
            timers={workoutTimers}
            onBack={handleBackToList}
            onStart={handleStartWorkout}
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
