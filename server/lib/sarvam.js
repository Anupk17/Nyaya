 const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const BASE_URL = 'https://api.sarvam.ai';

async function translateToEnglish(text) {
  if (!SARVAM_API_KEY) throw new Error('SARVAM_API_KEY not configured');

  const response = await fetch(`${BASE_URL}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': SARVAM_API_KEY
    },
    body: JSON.stringify({
      input: text,
      source_language_code: "Unknown", // Sarvam can often auto-detect, or we fallback if they require it.
      target_language_code: "en-IN",
      speaker_gender: "Male",
      mode: "formal",
      algo: "smt"
    })
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Sarvam Translate Error:', data);
    throw new Error(data.message || 'Translation failed');
  }

  // Handle Sarvam's response format (usually translated_text)
  return data.translated_text || data.output || text;
}

async function speechToText(audioBuffer, originalFilename, mimeType) {
  if (!SARVAM_API_KEY) throw new Error('SARVAM_API_KEY not configured');

  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' });
  formData.append('file', blob, originalFilename || 'audio.webm');
  formData.append('model', 'saaras:v3');

  const response = await fetch(`${BASE_URL}/speech-to-text-translate`, {
    method: 'POST',
    headers: {
      'api-subscription-key': SARVAM_API_KEY
    },
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Sarvam STT Error:', data);
    throw new Error(data.message || 'Speech-to-text failed');
  }

  return data.transcript || data.text || '';
}

module.exports = {
  translateToEnglish,
  speechToText
};
