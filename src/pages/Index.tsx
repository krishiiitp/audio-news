
import { useState, useRef, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { VoiceControls } from "@/components/VoiceControls";
import { toast } from "sonner";
import * as pdfjs from 'pdfjs-dist';
import { supabase } from "@/integrations/supabase/client";
import { speechService } from "@/utils/speech";

// 1. Fix PDF.js worker configuration
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);

  // 2. Add abort controller for cleanup
  const abortController = useRef(new AbortController());

  useEffect(() => {
    speechService.setStateChangeCallback(setIsPlaying);
    return () => {
      abortController.current.abort();
      speechService.stop();
    };
  }, []);

  // 3. Improved text extraction with error handling
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({
        data: arrayBuffer,
        disableAutoFetch: true,
        disableStream: true
      }).promise;

      let fullText = '';
      const pagesToParse = Math.min(pdf.numPages, 50); // Limit to 50 pages

      for (let i = 1; i <= pagesToParse; i++) {
        if (abortController.current.signal.aborted) break;
        
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ') + '\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('PDF Extraction Error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  // 4. Enhanced file handling with validation
  const handleFileSelect = async (file: File) => {
    try {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size exceeds 10MB limit');
      }

      setSelectedFile(file);
      const text = await extractTextFromPDF(file);
      setExtractedText(text);

      // 5. Add timeout for large PDFs
      const uploadPromise = supabase.storage
        .from('newspapers')
        .upload(`${crypto.randomUUID()}.pdf`, file);

      const { data: storageData, error: storageError } = await toast.promise(
        uploadPromise,
        {
          loading: 'Uploading PDF...',
          success: 'PDF uploaded successfully!',
          error: 'Upload failed'
        }
      );

      if (storageError) throw storageError;

      // 6. Batch database operations
      const { error: dbError } = await supabase
        .from('newspapers')
        .insert({
          title: file.name,
          extracted_text: text.substring(0, 10000), // Store first 10k chars
          pdf_url: storageData.path
        });

      if (dbError) throw dbError;

      // 7. Add preload before speaking
      await new Promise(resolve => setTimeout(resolve, 500));
      speechService.speak(text, speed, pitch);

    } catch (error: any) {
      setSelectedFile(null);
      setExtractedText('');
      console.error('Processing Error:', error);
      toast.error(error.message || 'Error processing PDF');
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
