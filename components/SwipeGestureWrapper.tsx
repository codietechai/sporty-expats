import React from 'react';
import { View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useDrawer } from '@/contexts/DrawerContext';

interface SwipeGestureWrapperProps {
  children: React.ReactNode;
  style?: any;
}

const SwipeGestureWrapper: React.FC<SwipeGestureWrapperProps> = ({ children, style }) => {
  const { openDrawer } = useDrawer();

  const handleSwipeGesture = (event: any) => {
    try {
      const { nativeEvent } = event;
      
      // Check if it's a right swipe (positive velocityX) and sufficient distance
      if (nativeEvent.state === State.END) {
        const { velocityX, translationX } = nativeEvent;
        
        // Right swipe with good velocity and distance
        if (velocityX > 500 && translationX > 100) {
          console.log('Right swipe gesture detected, opening drawer');
          openDrawer();
        }
      }
    } catch (error) {
      console.error('Error handling swipe gesture:', error);
    }
  };

  // Fallback to regular View if gesture handler fails
  try {
    return (
      <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
        <Animated.View style={style || { flex: 1 }}>
          {children}
        </Animated.View>
      </PanGestureHandler>
    );
  } catch (error) {
    console.warn('PanGestureHandler failed, falling back to regular View:', error);
    return (
      <View style={style || { flex: 1 }}>
        {children}
      </View>
    );
  }
};

export default SwipeGestureWrapper;