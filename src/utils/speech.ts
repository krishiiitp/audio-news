
class SpeechService {
  private utterance: SpeechSynthesisUtterance | null = null;
  private onStateChange: ((isPlaying: boolean) => void) | null = null;

  constructor() {
    this.setupVoiceChangeListener();
  }

  private setupVoiceChangeListener() {
    if (typeof window !== 'undefined') {
      speechSynthesis.addEventListener('voiceschanged', () => {
        console.log('Voices loaded:', speechSynthesis.getVoices().length);
      });
    }
  }

  setStateChangeCallback(callback: (isPlaying: boolean) => void) {
    this.onStateChange = callback;
  }

  speak(text: string, speed: number = 1, pitch: number = 1) {
    this.stop();

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = speed;
    this.utterance.pitch = pitch;

    // Get available voices
    const voices = speechSynthesis.getVoices();
    // Try to find an English voice
    const englishVoice = voices.find(voice => voice.lang.includes('en'));
    if (englishVoice) {
      this.utterance.voice = englishVoice;
    }

    this.utterance.onstart = () => {
      this.onStateChange?.(true);
    };

    this.utterance.onend = () => {
      this.onStateChange?.(false);
    };

    this.utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.onStateChange?.(false);
    };

    speechSynthesis.speak(this.utterance);
  }

  pause() {
    speechSynthesis.pause();
    this.onStateChange?.(false);
  }

  resume() {
    speechSynthesis.resume();
    this.onStateChange?.(true);
  }

  stop() {
    speechSynthesis.cancel();
    this.onStateChange?.(false);
  }

  setSpeed(speed: number) {
    if (this.utterance) {
      this.utterance.rate = speed;
    }
  }

  setPitch(pitch: number) {
    if (this.utterance) {
      this.utterance.pitch = pitch;
    }
  }
}

export const speechService = new SpeechService();
