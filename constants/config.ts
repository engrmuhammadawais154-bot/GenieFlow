import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBackendURL = (): string => {
  if (__DEV__) {
    const domain = process.env.REPLIT_DEV_DOMAIN;
    if (domain) {
      return `https://${domain.split('.')[0]}-3001.${domain.split('.').slice(1).join('.')}`;
    }
    
    if (Platform.OS === 'web') {
      return window.location.origin.replace(':8081', ':3001');
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

console.log('Backend URL configured:', BACKEND_URL);
