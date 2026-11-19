import { API_CONFIG } from '../config/api';

export type HealthStatus = 'healthy' | 'degraded' | 'offline';

export async function checkBackendHealth(): Promise<{ status: HealthStatus, message: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const res = await fetch(`${API_CONFIG.BASE_URL}/health`, { 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (res.ok) {
      return { status: 'healthy', message: 'Connected' };
    }
    return { status: 'degraded', message: 'API issues' };
  } catch (err) {
    if (API_CONFIG.MOCK_MODE) {
       return { status: 'degraded', message: 'Mock Mode Active' };
    }
    return { status: 'offline', message: 'Backend Offline' };
  }
}
