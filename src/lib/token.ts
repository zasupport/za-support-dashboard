/**
 * Sanitised API token — strips newlines/carriage-returns that Vercel
 * occasionally injects when env vars are pasted with trailing whitespace.
 * Import this instead of reading process.env.ZA_API_TOKEN directly.
 */
export const API_TOKEN = (process.env.ZA_API_TOKEN || '').split(/[\r\n]/)[0].trim();
export const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
