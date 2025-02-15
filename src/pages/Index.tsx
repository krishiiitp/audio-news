
import { useState, useRef } from "react";
import { FileUpload } from "@/components/FileUpload";
import { AudioControls } from "@/components/AudioControls";
import { toast } from "sonner";
import { textToSpeech } from "@/utils/elevenlabs";
import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + ' ';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw error;
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      setSelectedFile(file);
      toast.success("PDF uploaded successfully!");
      
      const text = await extractTextFromPDF(file);
      const audioUrl = await textToSpeech(text);
      setAudioUrl(audioUrl);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
      }
    } catch (error) {
      toast.error("Error processing PDF");
      console.error(error);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSkipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 10;
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 10;
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
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

      <audio ref={audioRef} />

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
