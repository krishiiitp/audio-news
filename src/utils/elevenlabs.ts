import { supabase } from "@/integrations/supabase/client";

export async function textToSpeech(text: string) {
  try {
    const { data: secretData, error: secretError } = await supabase
      .from('secrets')
      .select('value')
      .eq('name', 'ELEVEN_LABS_API_KEY')
      .single();

    if (secretError) throw secretError;
    if (!secretData) throw new Error('API key not found');

    const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // default voice
    const MODEL_ID = "eleven_monolingual_v1";

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": secretData.value,
        },
        body: JSON.stringify({
          text,
          model_id: MODEL_ID,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to convert text to speech');
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  } catch (error) {
    console.error('Error in text to speech:', error);
    throw error;
  }
}