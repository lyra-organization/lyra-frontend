import { useRef, useCallback } from 'react';

/**
 * Moving average smoother for distance values.
 * Prevents the displayed distance from jumping around.
 */
export function useSmoothedDistance(windowSize = 5) {
  const buffer = useRef<number[]>([]);

  const push = useCallback((value: number): number => {
    buffer.current.push(value);
    if (buffer.current.length > windowSize) {
      buffer.current.shift();
    }
    const sum = buffer.current.reduce((a, b) => a + b, 0);
    return sum / buffer.current.length;
  }, [windowSize]);

  const reset = useCallback(() => {
    buffer.current = [];
  }, []);

  return { push, reset };
}
