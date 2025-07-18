console.log("Home rendered");

import { useState } from "react";
import QuickMenu from "@/components/quick-menu";
import WorkoutList from "@/components/workout-list";
import WorkoutMenu from "@/components/workout-menu";
import WorkoutTimer from "@/components/workout-timer-new";
import WorkoutCompleteModal from "@/components/workout-complete-modal";
import WorkoutEdit from "@/components/workout-edit";
import type { Workout } from "@/schema";
import { useGetWorkouts } from "@/lib/queryClient";

type Screen = "quick-menu" | "workout-list" | "workout-menu" | "workout-timer" | "workout-edit";

export default function Home() {
  console.log("🏠 Home component starting to render");
  
  const [currentScreen, setCurrentScreen] = useState<Screen>("quick-menu");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [timerBool, setTimerBool] = useState<boolean>(false);

  const { data: workouts } = useGetWorkouts();
  const selectedWorkout = selectedWorkoutId ? workouts?.find(w => w.id === selectedWorkoutId) ?? null : null;

  console.log("🏠 Home state:", { currentScreen, selectedWorkout, showCompleteModal });

  const handleWorkoutSelect = (workout: Workout) => {
    setSelectedWorkoutId(workout.id);
    setCurrentScreen("workout-menu");
  };

  const handleStartWorkout = () => {
    setCurrentScreen("workout-timer");
  };

  const handleBackToList = () => {
    setSelectedWorkoutId(null);
    setCurrentScreen("workout-list");
  };

  const handleWorkoutComplete = () => {
    setTimerBool(!timerBool);
    setShowCompleteModal(false);
  };

  const handleCompleteModalClose = () => {
    setShowCompleteModal(false);
    setCurrentScreen("workout-list");
  };

  const handleStopWorkout = () => {
    setCurrentScreen("workout-menu");
  };

  console.log("🏠 Home about to return JSX, currentScreen:", currentScreen);
  
  return (
    <div className="max-w-sm mx-auto min-h-screen relative bg-background">
      {console.log("🏠 Inside Home JSX render")}
      <div className="h-screen">
        {currentScreen === "quick-menu" && <QuickMenu onNavigateToWorkoutList={() => setCurrentScreen("workout-list")} />}
        {currentScreen === "workout-list" && (
          <WorkoutList 
            onWorkoutSelect={handleWorkoutSelect} 
            onNavigateToQuickCreate={() => setCurrentScreen("quick-menu")}
          />
        )}
        {currentScreen === "workout-menu" && selectedWorkout && (
          <WorkoutMenu
            workout={selectedWorkout}
            onBack={handleBackToList}
            onStart={handleStartWorkout}
            onEdit={() => setCurrentScreen("workout-edit")}
          />
        )}
        {currentScreen === "workout-timer" && selectedWorkout && (
          <WorkoutTimer
            key={Number(timerBool)}
            workout={selectedWorkout}
            onComplete={handleWorkoutComplete}
            onStop={handleStopWorkout}
          />
        )}
        {currentScreen === "workout-edit" && selectedWorkout && (
          <WorkoutEdit
            workout={selectedWorkout}
            onDone={() => setCurrentScreen("workout-menu")}
          />
        )}
      </div>

      {showCompleteModal && selectedWorkout && (
        <WorkoutCompleteModal
          workout={selectedWorkout}
          onClose={handleCompleteModalClose}
        />
      )}
    </div>
  );
}
