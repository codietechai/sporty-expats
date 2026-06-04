import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  AppState,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';

const { height } = Dimensions.get('window');

const images = [
  { id: '1', source: require('../assets/images/slider_image.png') },
  { id: '2', source: require('../assets/images/slider_image2.png') },
  { id: '3', source: require('../assets/images/slider_image3.png') },
];

export const VerticalCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevImage, setPrevImage] = useState(images[0]);
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Use refs for flags accessed inside setInterval to avoid stale closures
  const isAnimatingRef = useRef(false);
  const isFocusedRef = useRef(true);
  const currentIndexRef = useRef(0);

  const scrollToNext = useCallback(() => {
    if (isAnimatingRef.current || !isFocusedRef.current) return;

    const nextIndex = (currentIndexRef.current + 1) % images.length;
    setPrevImage(images[currentIndexRef.current]);
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);

    translateY.setValue(0);
    scale.setValue(0);
    isAnimatingRef.current = true;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isAnimatingRef.current = false;
    });
  }, []);  // stable — no state deps, uses refs

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    stopInterval();
    intervalRef.current = setInterval(scrollToNext, 2000);
  }, [scrollToNext, stopInterval]);

  // Focus: start/stop interval — stable deps, no re-registration on each animation
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      startInterval();
      return () => {
        isFocusedRef.current = false;
        stopInterval();
      };
    }, [startInterval, stopInterval])
  );

  // App state: pause when backgrounded
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        isFocusedRef.current = true;
        startInterval();
      } else {
        isFocusedRef.current = false;
        stopInterval();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [startInterval, stopInterval]);

  // Cleanup on unmount
  useEffect(() => () => stopInterval(), [stopInterval]);

  return (
    <View style={styles.container}>
      {/* Bottom: New image zooms in */}
      <Animated.View style={[styles.imageContainer, { transform: [{ scale }] }]}>
        <Image
          source={images[currentIndex].source}
          style={styles.image}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
        />
      </Animated.View>

      {/* Top: Old image slides down */}
      <Animated.View style={[styles.imageContainer, { transform: [{ translateY }] }]}>
        <Image
          source={prevImage.source}
          style={styles.image}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
        />
      </Animated.View>

      <View style={styles.indicatorWrapper}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[styles.indicator, index === currentIndex && styles.activeIndicator]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
    minHeight: 600,
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  indicatorWrapper: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -50 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#777',
    marginVertical: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
});
