import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique id. Uses `crypto.randomUUID` when available (modern
 * browsers, secure contexts) and falls back to a `Math.random`-based id
 * for older Android WebViews (pre-2022) where `crypto.randomUUID` is
 * undefined. The fallback isn't RFC 4122 compliant but is unique enough
 * for client-side list keys.
 */
export function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
