import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

interface WorkoutListSettingsProps {
  onClose: () => void;
}

export default function WorkoutListSettings({ onClose }: WorkoutListSettingsProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col h-screen bg-background border-2 border-gray-300 dark:border-gray-600 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black">
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
          <div className="relative flex items-center">
            <span className="mr-3 text-base font-medium">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
            <div 
              className={`w-16 h-8 rounded-full border-2 border-black cursor-pointer transition-colors ${
                theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
              }`}
              onClick={toggleTheme}
            >
              <div 
                className={`w-6 h-6 bg-white rounded-full border-2 border-black transition-transform duration-200 ${
                  theme === 'dark' ? 'translate-x-8' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Done Button */}
      <div className="p-6">
        <Button
          onClick={onClose}
          className="w-full h-16 text-xl font-bold bg-background border-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white rounded-lg"
        >
          Done
        </Button>
      </div>
    </div>
  );
}