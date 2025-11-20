import Constants from 'expo-constants';

const getBackendURL = (): string => {
  if (__DEV__) {
    const replitDomain = Constants.expoConfig?.hostUri?.split(':')[0];
    if (replitDomain) {
      return `https://${replitDomain}:3001`;
    }
    return 'http://localhost:3001';
  }
  
  return process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';
};

export const BACKEND_URL = getBackendURL();
export const API_ENDPOINTS = {
  CHAT: `${BACKEND_URL}/api/chat`,
  UPLOAD_STATEMENT: `${BACKEND_URL}/api/files/statement`,
  HEALTH: `${BACKEND_URL}/health`,
};
