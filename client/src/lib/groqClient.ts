import { API_CONFIG } from '../config/api';

// A mock fallback client that handles errors gracefully
export async function fetchWithGroqFallback(endpoint: string, payload: any) {
  try {
    if (API_CONFIG.MOCK_MODE) {
      throw new Error("Mock mode enabled");
    }
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('API request failed');
    return await response.json();
  } catch (error) {
    console.warn(`[GroqClient] Falling back to mocks for ${endpoint}:`, error);
    
    // Provide safe fallbacks depending on the endpoint
    if (endpoint.includes('chat-assistant')) {
      return { success: true, reply: "*(Mock Mode)* Nyaya AI is currently running in offline/mock mode. Your dispute has been logged and the evidence is recorded. Please proceed to run the resolution engine." };
    }
    
    throw error;
  }
}
