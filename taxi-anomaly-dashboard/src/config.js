/**
 * Centralized API configuration.
 * Uses VITE_API_URL from .env (local dev) or .env.production (deployed).
 */
export const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
