import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Sidebar from './Sidebar';
import { useDrawer } from '@/contexts/DrawerContext';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;

export default function RootCustomDrawer() {
  const { isDrawerOpen, closeDrawer } = useDrawer();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isDrawerOpen ? 0 : -DRAWER_WIDTH,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: isDrawerOpen ? 1 : 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const fakeProps = {
    navigation: { navigate: () => {}, dispatch: () => {}, goBack: () => {} } as any,
    state: {
      type: 'drawer' as const,
      key: 'drawer',
      index: 0,
      routeNames: [],
      routes: [],
      stale: false as false,
      preloadedRouteKeys: [],
      default: 'closed' as const,
      history: [],
    },
    descriptors: {} as any,
    progress: { interpolate: () => 0 } as any,
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
        pointerEvents={isDrawerOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeDrawer} activeOpacity={1} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <Sidebar {...fakeProps} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#18181A',
  },
});
