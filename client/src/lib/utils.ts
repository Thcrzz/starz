import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Concatena classes Tailwind com merge inteligente (sobrescreve conflitos).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
