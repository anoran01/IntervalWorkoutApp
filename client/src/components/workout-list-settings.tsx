import { Button } from "@/components/ui/button";
import { ArrowLeft, ToggleLeft, ToggleRight } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

interface WorkoutListSettingsProps {
  onClose: () => void;
}

export default function WorkoutListSettings({ onClose }: WorkoutListSettingsProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col h-screen bg-background border-2 border-gray-300 dark:border-gray-600 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-16 border-b-2 border-black">
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={onClose}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold text-center flex-1">Settings</h1>
        <div className="w-10" />
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-6 space-y-8">
        {/* Dark/Light Mode */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">Mode</span>
          <div className="flex items-center">
            <span className="mr-3 text-base font-medium">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className={`w-16 h-16 ${theme === 'dark' ? 'text-white' : 'text-black'}`}
            >
              {theme === 'dark' ? (
                <ToggleRight size={64} />
              ) : (
                <ToggleLeft size={64} />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}