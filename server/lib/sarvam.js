const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const BASE_URL = 'https://api.sarvam.ai';

/**
 * Translate text between Indic languages and English (or vice versa)
 */
async function translateText(text, sourceLang = 'auto', targetLang = 'en-IN') {
  if (!SARVAM_API_KEY) throw new Error('SARVAM_API_KEY not configured');
  if (!text || !text.trim()) return '';

  const response = await fetch(`${BASE_URL}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': SARVAM_API_KEY
    },
    body: JSON.stringify({
      input: text,
      source_language_code: sourceLang || 'auto',
      target_language_code: targetLang || 'en-IN',
      speaker_gender: 'Male',
      mode: 'formal',
      model: 'mayura:v1',
      enable_preprocessing: true
    })
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Sarvam Translate Error:', data);
    throw new Error(data?.error?.message || data?.message || 'Translation failed');
  }

  return {
    translated_text: data.translated_text || data.output || text,
    detected_source_language: data.source_language_code || sourceLang
  };
}

/**
 * Convenience wrapper for translating to English
 */
async function translateToEnglish(text, sourceLang = 'auto') {
  const result = await translateText(text, sourceLang, 'en-IN');
  return typeof result === 'string' ? result : result.translated_text;
}

/**
 * Convert Speech to Text using Sarvam Saaras model
 */
async function speechToText(audioBuffer, originalFilename, mimeType, languageCode) {
  if (!SARVAM_API_KEY) throw new Error('SARVAM_API_KEY not configured');

  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' });
  formData.append('file', blob, originalFilename || 'audio.webm');
  formData.append('model', 'saaras:v3');
  formData.append('mode', 'translate'); // Translate directly to English for agent processing
  if (languageCode && languageCode !== 'auto' && languageCode !== 'unknown') {
    formData.append('language-code', languageCode);
  }

  const response = await fetch(`${BASE_URL}/speech-to-text`, {
    method: 'POST',
    headers: {
      'api-subscription-key': SARVAM_API_KEY
    },
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    // If /speech-to-text had an issue, fallback to /speech-to-text-translate
    console.warn('Sarvam /speech-to-text returned error, trying fallback:', data);
    const fbFormData = new FormData();
    fbFormData.append('file', blob, originalFilename || 'audio.webm');
    fbFormData.append('model', 'saaras:v3');
    const fbRes = await fetch(`${BASE_URL}/speech-to-text-translate`, {
      method: 'POST',
      headers: { 'api-subscription-key': SARVAM_API_KEY },
      body: fbFormData
    });
    const fbData = await fbRes.json();
    if (!fbRes.ok) {
      console.error('Sarvam STT Fallback Error:', fbData);
      throw new Error(fbData?.error?.message || fbData?.message || 'Speech-to-text failed');
    }
    return {
      text: fbData.transcript || fbData.text || '',
      detected_language: fbData.language_code || 'hi-IN'
    };
  }

  return {
    text: data.transcript || data.text || '',
    detected_language: data.language_code || 'hi-IN'
  };
}

/**
 * Convert Text to Speech using Sarvam Bulbul model
 */
async function textToSpeech(text, languageCode = 'hi-IN') {
  if (!SARVAM_API_KEY) throw new Error('SARVAM_API_KEY not configured');
  if (!text || !text.trim()) throw new Error('Text is required for TTS');

  // Truncate to safe character limit for REST API
  const sanitizedText = text.slice(0, 2000);

  const response = await fetch(`${BASE_URL}/text-to-speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': SARVAM_API_KEY
    },
    body: JSON.stringify({
      text: sanitizedText,
      language_code: languageCode || 'hi-IN',
      model: 'bulbul:v3',
      speaker: 'shubh',
      output_audio_codec: 'mp3',
      pace: 1.0
    })
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Sarvam TTS Error:', data);
    throw new Error(data?.error?.message || data?.message || 'Text-to-speech failed');
  }

  const audioBase64 = data.audios && data.audios[0] ? data.audios[0] : null;
  if (!audioBase64) {
    throw new Error('No audio returned by Sarvam TTS');
  }

  return {
    audioBase64,
    contentType: 'audio/mp3'
  };
}

module.exports = {
  translateText,
  translateToEnglish,
  speechToText,
  textToSpeech
};
