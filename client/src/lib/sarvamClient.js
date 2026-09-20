const SARVAM_BASE = 'https://api.sarvam.ai'

export const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', name: 'English',  flag: '🇬🇧', sarvam: 'en-IN' },
  { code: 'hi-IN', name: 'हिंदी',    flag: '🇮🇳', sarvam: 'hi-IN' },
  { code: 'ta-IN', name: 'தமிழ்',    flag: '🇮🇳', sarvam: 'ta-IN' },
  { code: 'te-IN', name: 'తెలుగు',   flag: '🇮🇳', sarvam: 'te-IN' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ',    flag: '🇮🇳', sarvam: 'kn-IN' },
  { code: 'bn-IN', name: 'বাংলা',    flag: '🇮🇳', sarvam: 'bn-IN' },
  { code: 'mr-IN', name: 'मराठी',    flag: '🇮🇳', sarvam: 'mr-IN' },
  { code: 'gu-IN', name: 'ગુજરાતી', flag: '🇮🇳', sarvam: 'gu-IN' },
]

// Translate any text TO English for agent processing
export async function translateToEnglish(
  text,
  sourceLang
) {
  if (sourceLang === 'en-IN') return text
  
  try {
    const response = await fetch(
      `${SARVAM_BASE}/translate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': import.meta.env.VITE_SARVAM_API_KEY
        },
        body: JSON.stringify({
          input: text,
          source_language_code: sourceLang,
          target_language_code: 'en-IN',
          speaker_gender: 'Male',
          mode: 'formal',
          model: 'mayura:v1',
          enable_preprocessing: true
        })
      }
    )
    const data = await response.json()
    return data.translated_text || text
  } catch (err) {
    console.warn('Sarvam translation failed:', err)
    return text
  }
}

// Translate verdict reasoning FROM English back to customer's language
export async function translateFromEnglish(
  text,
  targetLang
) {
  if (targetLang === 'en-IN') return text
  
  try {
    const response = await fetch(
      `${SARVAM_BASE}/translate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': import.meta.env.VITE_SARVAM_API_KEY
        },
        body: JSON.stringify({
          input: text,
          source_language_code: 'en-IN',
          target_language_code: targetLang,
          speaker_gender: 'Male',
          mode: 'formal',
          model: 'mayura:v1',
          enable_preprocessing: true
        })
      }
    )
    const data = await response.json()
    return data.translated_text || text
  } catch (err) {
    console.warn('Sarvam reverse translation failed:', err)
    return text
  }
}

// Detect language of incoming text
export async function detectLanguage(text) {
  try {
    const response = await fetch(
      `${SARVAM_BASE}/text-lid`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': import.meta.env.VITE_SARVAM_API_KEY
        },
        body: JSON.stringify({ input: text })
      }
    )
    const data = await response.json()
    return data.language_code || 'en-IN'
  } catch {
    return 'en-IN'
  }
}

// Convert speech to text (bonus feature)
export async function speechToText(
  audioBlob,
  languageCode
) {
  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.wav')
  formData.append('model', 'saarika:v2')
  formData.append('language_code', languageCode)
  
  try {
    const response = await fetch(
      `${SARVAM_BASE}/speech-to-text`,
      {
        method: 'POST',
        headers: {
          'api-subscription-key': import.meta.env.VITE_SARVAM_API_KEY
        },
        body: formData
      }
    )
    const data = await response.json()
    return data.transcript || ''
  } catch (err) {
    console.warn('Speech to text failed:', err)
    return ''
  }
}
