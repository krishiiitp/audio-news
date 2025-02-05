import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Slider } from "./ui/slider";

interface AudioControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onVolumeChange: (value: number) => void;
  volume: number;
}

export const AudioControls = ({
  isPlaying,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onVolumeChange,
  volume,
}: AudioControlsProps) => {
  return (
    <div className="audio-controls">
      <div className="container max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onSkipBack}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button
              onClick={onPlayPause}
              className="p-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={onSkipForward}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-2 w-32">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[volume]}
              max={1}
              step={0.1}
              onValueChange={(value) => onVolumeChange(value[0])}
            />
          </div>
        </div>
      </div>
    </div>
  );
};