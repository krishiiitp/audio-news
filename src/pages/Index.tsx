
import { useState, useRef, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { VoiceControls } from "@/components/VoiceControls";
import { toast } from "sonner";
import * as pdfjs from 'pdfjs-dist';
import { supabase } from "@/integrations/supabase/client";
import { speechService } from "@/utils/speech";

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);

  useEffect(() => {
    speechService.setStateChangeCallback(setIsPlaying);
  }, []);

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
      
      // Extract text from PDF
      const text = await extractTextFromPDF(file);
      setExtractedText(text);

      // Upload PDF to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('newspapers')
        .upload(`${crypto.randomUUID()}.pdf`, file);

      if (storageError) {
        throw storageError;
      }

      // Save newspaper entry to database
      const { error: dbError } = await supabase
        .from('newspapers')
        .insert({
          title: file.name,
          extracted_text: text,
          pdf_url: storageData.path
        });

      if (dbError) {
        throw dbError;
      }

      // Start speech
      speechService.speak(text, speed, pitch);
    } catch (error) {
      toast.error("Error processing PDF");
      console.error(error);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      speechService.pause();
    } else {
      if (extractedText) {
        speechService.resume();
      }
    }
  };

  const handleSkipBack = () => {
    // Reset and start from the beginning for now
    // In a future iteration, we could implement more granular control
    if (extractedText) {
      speechService.speak(extractedText, speed, pitch);
    }
  };

  const handleSkipForward = () => {
    // For now, this just stops the current speech
    // In a future iteration, we could implement more granular control
    speechService.stop();
  };

  const handleSpeedChange = (value: number) => {
    setSpeed(value);
    speechService.setSpeed(value);
  };

  const handlePitchChange = (value: number) => {
    setPitch(value);
    speechService.setPitch(value);
  };

  return (
    <div className="min-h-screen pb-24 page-transition">
      <div className="container max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Voice Newspaper</h1>
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
            <p className="text-muted-foreground mb-4">
              Your PDF is ready. Use the controls below to manage playback.
            </p>
            <div className="max-h-96 overflow-y-auto p-4 bg-muted/50 rounded">
              {extractedText}
            </div>
          </div>
        )}
      </div>

      <VoiceControls
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onSkipBack={handleSkipBack}
        onSkipForward={handleSkipForward}
        onSpeedChange={handleSpeedChange}
        onPitchChange={handlePitchChange}
        speed={speed}
        pitch={pitch}
      />
    </div>
  );
};

export default Index;
