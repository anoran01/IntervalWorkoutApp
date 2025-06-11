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
    <div className="max-w-sm mx-auto min-h-screen relative">
      {/* Status Bar */}
      <div className="status-bar flex justify-between items-center p-4 text-sm text-gray-400">
        <span>9:41</span>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-2 border border-gray-400 rounded-sm">
            <div className="w-3/4 h-full bg-gray-400 rounded-sm"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-20" style={{ minHeight: "calc(100vh - 120px)" }}>
        {currentScreen === "quick-menu" && <QuickMenu />}
        {currentScreen === "workout-list" && (
          <WorkoutList onWorkoutSelect={handleWorkoutSelect} />
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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto app-gray border-t border-gray-600">
        <div className="flex">
          <button
            className={`flex-1 py-4 px-2 text-center transition-colors duration-200 ${
              currentScreen === "quick-menu" ? "app-gray-light" : ""
            }`}
            onClick={() => setCurrentScreen("quick-menu")}
          >
            <Plus
              className={`w-6 h-6 mx-auto mb-1 ${
                currentScreen === "quick-menu" ? "text-orange-500" : "text-gray-400"
              }`}
            />
            <div
              className={`text-xs font-medium ${
                currentScreen === "quick-menu" ? "text-orange-500" : "text-gray-400"
              }`}
            >
              Quick Menu
            </div>
          </button>
          <button
            className={`flex-1 py-4 px-2 text-center transition-colors duration-200 ${
              currentScreen === "workout-list" ? "app-gray-light" : ""
            }`}
            onClick={() => setCurrentScreen("workout-list")}
          >
            <List
              className={`w-6 h-6 mx-auto mb-1 ${
                currentScreen === "workout-list" ? "text-orange-500" : "text-gray-400"
              }`}
            />
            <div
              className={`text-xs font-medium ${
                currentScreen === "workout-list" ? "text-orange-500" : "text-gray-400"
              }`}
            >
              Workout List
            </div>
          </button>
        </div>
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
