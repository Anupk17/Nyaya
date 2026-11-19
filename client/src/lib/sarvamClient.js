/**
 * Sarvam AI Client (Frontend Proxy)
 * All requests route securely through the backend /api/sarvam endpoints.
 * No API keys are exposed to the client.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', name: 'English',  flag: '🇬🇧', sarvam: 'en-IN' },
  { code: 'hi-IN', name: 'हिंदी',    flag: '🇮🇳', sarvam: 'hi-IN' },
  { code: 'ta-IN', name: 'தமிழ்',    flag: '🇮🇳', sarvam: 'ta-IN' },
  { code: 'te-IN', name: 'తెలుగు',   flag: '🇮🇳', sarvam: 'te-IN' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ',    flag: '🇮🇳', sarvam: 'kn-IN' },
  { code: 'bn-IN', name: 'বাংলা',    flag: '🇮🇳', sarvam: 'bn-IN' },
  { code: 'mr-IN', name: 'मराठी',    flag: '🇮🇳', sarvam: 'mr-IN' },
  { code: 'gu-IN', name: 'ગુજરાતી', flag: '🇮🇳', sarvam: 'gu-IN' },
];

/**
 * Translate any text TO English for agent processing
 */
export async function translateToEnglish(text, sourceLang = 'auto') {
  if (!text || !text.trim() || sourceLang === 'en-IN') return text;
  
  try {
    const res = await fetch(`${API_BASE}/sarvam/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        source: sourceLang || 'auto',
        target: 'en-IN'
      })
    });
    const data = await res.json();
    return data.translated || text;
  } catch (err) {
    console.warn('Sarvam translation to English failed, falling back:', err);
    return text;
  }
}

/**
 * Translate verdict reasoning FROM English into the user's selected language
 */
export async function translateFromEnglish(text, targetLang = 'hi-IN') {
  if (!text || !text.trim() || targetLang === 'en-IN') return text;
  
  try {
    const res = await fetch(`${API_BASE}/sarvam/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        source: 'en-IN',
        target: targetLang
      })
    });
    const data = await res.json();
    return data.translated || text;
  } catch (err) {
    console.warn('Sarvam reverse translation failed:', err);
    return text;
  }
}

/**
 * Detect language of incoming text
 */
export async function detectLanguage(text) {
  if (!text || !text.trim()) return 'en-IN';
  try {
    const res = await fetch(`${API_BASE}/sarvam/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        source: 'auto',
        target: 'en-IN'
      })
    });
    const data = await res.json();
    return data.detected_language || 'en-IN';
  } catch {
    return 'en-IN';
  }
}

/**
 * Convert speech audio blob to text via backend proxy
 */
export async function speechToText(audioBlob, languageCode = 'auto') {
  const mimeType = audioBlob.type || 'audio/webm';
  const ext = mimeType.includes('wav') ? 'wav' : (mimeType.includes('mp4') ? 'mp4' : 'webm');
  const formData = new FormData();
  formData.append('audio', audioBlob, `recording.${ext}`);
  if (languageCode) formData.append('language', languageCode);

  try {
    const res = await fetch(`${API_BASE}/sarvam/stt`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to transcribe audio');
    return {
      text: data.text || '',
      detectedLanguage: data.detected_language || 'hi-IN'
    };
  } catch (err) {
    console.warn('Speech to text failed:', err);
    throw err;
  }
}

/**
 * Text to speech via Sarvam Bulbul model
 * Returns an Audio object that can be played immediately
 */
export async function playTextToSpeech(text, languageCode = 'hi-IN') {
  if (!text || !text.trim()) return null;
  try {
    const res = await fetch(`${API_BASE}/sarvam/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: languageCode })
    });
    const data = await res.json();
    if (!data.success || !data.audioBase64) {
      throw new Error(data.error || 'TTS generation failed');
    }
    const audioSrc = `data:${data.contentType || 'audio/mp3'};base64,${data.audioBase64}`;
    const audio = new Audio(audioSrc);
    await audio.play();
    return audio;
  } catch (err) {
    console.error('TTS playback error:', err);
    throw err;
  }
}

/**
 * Generate a customer reply draft in English and the customer's language
 */
export async function generateCustomerDraft(disputeId, action, customerLang = 'hi-IN') {
  try {
    const res = await fetch(`${API_BASE}/sarvam/customer-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disputeId, action, customerLang })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to generate draft');
    return data;
  } catch (err) {
    console.error('Customer draft generation failed:', err);
    throw err;
  }
}
