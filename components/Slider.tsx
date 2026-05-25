import React, { useEffect, useRef, useState } from 'react';
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
  { id: '1', uri: 'https://picsum.photos/id/1011/400/600' }, // Reduced resolution
  { id: '2', uri: 'https://picsum.photos/id/1012/400/600' },
  { id: '3', uri: 'https://picsum.photos/id/1013/400/600' },
];

export const VerticalCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevImage, setPrevImage] = useState(images[0]);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToNext = () => {
    if (isAnimating || !isScreenFocused) return;

    const nextIndex = (currentIndex + 1) % images.length;
    setPrevImage(images[currentIndex]);
    setCurrentIndex(nextIndex);

    // Reset animations
    translateY.setValue(0);
    scale.setValue(0);
    setIsAnimating(true);

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
      setIsAnimating(false);
    });
  };

  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!isAnimating && isScreenFocused) {
        scrollToNext();
      }
    }, 2000);
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Handle screen focus changes
  useFocusEffect(
    React.useCallback(() => {
      setIsScreenFocused(true);
      startInterval();
      return () => {
        setIsScreenFocused(false);
        stopInterval();
      };
    }, [isAnimating])
  );

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        setIsScreenFocused(true);
        startInterval();
      } else {
        setIsScreenFocused(false);
        stopInterval();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopInterval();
  }, []);

  return (
    <View style={styles.container}>
      {/* Bottom: New image zooms out */}
      <Animated.View style={[styles.imageContainer, { transform: [{ scale }] }]}>
        <Image
          source={{ uri: images[currentIndex].uri }}
          style={styles.image}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
        />
      </Animated.View>

      {/* Top: Old image slides down */}
      {isAnimating && (
        <Animated.View style={[styles.imageContainer, { transform: [{ translateY }] }]}>
          <Image
            source={{ uri: prevImage.uri }}
            style={styles.image}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        </Animated.View>
      )}

      <View style={styles.indicatorWrapper}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentIndex && styles.activeIndicator,
            ]}
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
    minHeight:600,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    resizeMode: 'cover',
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
