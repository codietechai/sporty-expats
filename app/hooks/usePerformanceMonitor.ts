import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  timestamp: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(Date.now());
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = Date.now() - renderStartTime.current;
    
    // Only log in development
    if (__DEV__ && renderTime > 16) { // 16ms = 60fps threshold
      console.log(`🐌 Slow render: ${componentName} took ${renderTime}ms (render #${renderCount.current})`);
    }
    
    renderStartTime.current = Date.now();
  });

  return {
    renderCount: renderCount.current,
  };
};

export const measureAsync = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - start;
    
    if (__DEV__ && duration > 100) { // Log operations taking more than 100ms
      console.log(`⏱️ Slow operation: ${operationName} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    if (__DEV__) {
      console.log(`❌ Failed operation: ${operationName} failed after ${duration}ms`);
    }
    throw error;
  }
};