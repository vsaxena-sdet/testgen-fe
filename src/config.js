/**
 * Frontend Environment Configuration
 * 
 * This module provides centralized configuration for the TestGen frontend.
 * Environment variables are loaded from .env file or environment.
 */

// API Host Configuration
const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:8000';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;
const APP_NAME = import.meta.env.VITE_APP_NAME || 'TestGen';
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.2.0';

// Validate API_HOST
if (!API_HOST) {
  console.error('❌ VITE_API_HOST environment variable is not set');
  console.error('Please create a .env file and set VITE_API_HOST');
}

// API Endpoints
const API_ENDPOINTS = {
  health: `${API_HOST}/healthz`,
  llmModels: `${API_HOST}/llm-models`,
  upload: `${API_HOST}/upload`,
  generate: `${API_HOST}/generate`,
  testcases: `${API_HOST}/testcases`,
  statistics: `${API_HOST}/statistics`,
  exportExcel: `${API_HOST}/export/excel`,
};

// Export configuration
export const config = {
  api: {
    host: API_HOST,
    timeout: API_TIMEOUT,
    endpoints: API_ENDPOINTS,
  },
  app: {
    name: APP_NAME,
    version: APP_VERSION,
  },
};

// Default export
export default config;

// Log configuration on load (development only)
if (import.meta.env.DEV) {
  console.log('🔧 Frontend Configuration:');
  console.log(`   API Host: ${API_HOST}`);
  console.log(`   API Timeout: ${API_TIMEOUT}ms`);
  console.log(`   App: ${APP_NAME} v${APP_VERSION}`);
}
