export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/api',
  MOCK_MODE: import.meta.env.VITE_ENABLE_MOCKS === 'true',
};
