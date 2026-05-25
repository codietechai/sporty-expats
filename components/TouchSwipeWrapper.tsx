import React from 'react';
import { View, PanResponder } from 'react-native';
import { useDrawer } from '@/contexts/DrawerContext';

interface TouchSwipeWrapperProps {
  children: React.ReactNode;
  style?: any;
}

const TouchSwipeWrapper: React.FC<TouchSwipeWrapperProps> = ({ children, style }) => {
  const { openDrawer } = useDrawer();

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to horizontal swipes that start from the left edge
      const { dx, dy } = gestureState;
      const { locationX } = evt.nativeEvent;
      
      // Start from left edge (within 50px) and horizontal swipe
      return locationX < 50 && Math.abs(dx) > Math.abs(dy) && dx > 0;
    },
    
    onPanResponderMove: (evt, gestureState) => {
      // Optional: Add visual feedback during swipe
    },
    
    onPanResponderRelease: (evt, gestureState) => {
      const { dx, vx } = gestureState;
      
      // Right swipe with sufficient distance or velocity
      if ((dx > 100 && vx > 0.5) || vx > 1.5) {
        console.log('Touch swipe gesture detected, opening drawer');
        openDrawer();
      }
    },
  });

  return (
    <View style={style || { flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

export default TouchSwipeWrapper;