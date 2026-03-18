import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  View,
} from 'react-native';

const { height } = Dimensions.get('window');

const images = [
  { id: '1', uri: 'https://picsum.photos/id/1011/800/1200' },
  { id: '2', uri: 'https://picsum.photos/id/1012/800/1200' },
  { id: '3', uri: 'https://picsum.photos/id/1013/800/1200' },
];

export const VerticalCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevImage, setPrevImage] = useState(images[0]);
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  const scrollToNext = () => {
    if (isAnimating) return;

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

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        scrollToNext();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAnimating]);

  return (
    <View style={styles.container}>
      {/* Bottom: New image zooms out */}
      <Animated.Image
        source={{ uri: images[currentIndex].uri }}
        style={[
          styles.image,
          { transform: [{ scale }] },
        ]}
      />

      {/* Top: Old image slides down */}
      {isAnimating && (
        <Animated.Image
          source={{ uri: prevImage.uri }}
          style={[
            styles.image,
            { transform: [{ translateY }] },
          ]}
        />
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
