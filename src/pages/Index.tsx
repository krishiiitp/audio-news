import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { AudioControls } from "@/components/AudioControls";
import { toast } from "sonner";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    toast.success("PDF uploaded successfully!");
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkipBack = () => {
    // Implement skip back functionality
  };

  const handleSkipForward = () => {
    // Implement skip forward functionality
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
  };

  return (
    <div className="min-h-screen pb-24 page-transition">
      <div className="container max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Newspaper Reader</h1>
          <p className="text-lg text-muted-foreground">
            Upload your newspaper PDF and listen to it
          </p>
        </div>

        {!selectedFile ? (
          <FileUpload onFileSelect={handleFileSelect} />
        ) : (
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">
              {selectedFile.name}
            </h2>
            <p className="text-muted-foreground">
              Your PDF is ready to be read. Click play to start listening.
            </p>
          </div>
        )}
      </div>

      <AudioControls
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onSkipBack={handleSkipBack}
        onSkipForward={handleSkipForward}
        onVolumeChange={handleVolumeChange}
        volume={volume}
      />
    </div>
  );
};

export default Index;