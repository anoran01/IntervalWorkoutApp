// workout timer settings
// one setting: volume
// changes a global volume state that is saved in capacitor preferences and retrieved by workout timer new for all workouts

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft } from "lucide-react";

interface WorkoutTimerSettingsProps {
    onClose: (volume: number) => void;
    initialVolume?: number;
}

export default function WorkoutTimerSettings({
    onClose,
    initialVolume = 1.0,
}: WorkoutTimerSettingsProps) {
    const [volume, setVolume] = useState(initialVolume);

    const handleClose = () => {
        onClose(volume);
    };

    return (
        <div className="flex flex-col h-screen bg-background border-2 border-foreground rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pt-16 border-b-2 border-foreground">
                <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    onClick={handleClose}
                >
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-2xl font-bold text-center flex-1">Timer Settings</h1>
                <div className="w-10" />
            </div>
            {/* Settings Content */}
            <div className="flex-1 p-6 space-y-8">
                {/* Volume Control */}
                <div className="flex items-center space-x-4">
                    <span className="text-xl font-bold">Volume</span>
                    <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={[Math.round(volume * 10)]}
                        onValueChange={(value) => setVolume(value[0] / 10)}
                        className="flex-1 bg-foreground"
                    />
                    <span className="w-6 text-right text-xl">{Math.round(volume * 10)}</span>
                </div>
            </div>
        </div>
    );
}