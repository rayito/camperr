import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useCallback, useState } from 'react';

// Dictado por voz (iOS: SFSpeechRecognizer, Android: SpeechRecognizer). Requiere development build.
export function useVoiceSearch(onText: (text: string, isFinal: boolean) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (e) => {
    const text = e.results[0]?.transcript;
    if (text) onText(text, e.isFinal);
  });
  useSpeechRecognitionEvent('error', (e) => {
    setListening(false);
    setError(e.message || 'No se pudo reconocer la voz.');
  });

  const toggle = useCallback(async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      setError('Falta el permiso de micrófono o de reconocimiento de voz.');
      return;
    }
    setError(null);
    ExpoSpeechRecognitionModule.start({ lang: 'es-ES', interimResults: true });
  }, [listening]);

  return { listening, error, toggle };
}
