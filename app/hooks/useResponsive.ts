import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

interface ResponsiveBreakpoints {
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  isLargeScreen: boolean;
  screenWidth: number;
  screenHeight: number;
}

export const useResponsive = (): ResponsiveBreakpoints => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;

  return {
    isSmallScreen: width < 375,
    isMediumScreen: width >= 375 && width < 414,
    isLargeScreen: width >= 414,
    screenWidth: width,
    screenHeight: height,
  };
};

// Utility functions for responsive values
export const getResponsiveValue = <T>(
  smallValue: T,
  mediumValue: T,
  largeValue: T,
  screenWidth: number
): T => {
  if (screenWidth < 375) return smallValue;
  if (screenWidth < 414) return mediumValue;
  return largeValue;
};

export const getResponsiveFontSize = (
  baseSize: number,
  screenWidth: number,
  scaleFactor: number = 0.9
): number => {
  if (screenWidth < 375) return Math.round(baseSize * scaleFactor);
  if (screenWidth < 414) return baseSize;
  return Math.round(baseSize * 1.1);
};

export const getResponsivePadding = (
  basePadding: number,
  screenWidth: number
): number => {
  if (screenWidth < 375) return Math.max(8, basePadding - 4);
  if (screenWidth < 414) return basePadding;
  return basePadding + 2;
};