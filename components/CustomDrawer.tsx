import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import Sidebar from './Sidebar';
import { DrawerNavigationState, ParamListBase } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';

const { width } = Dimensions.get('window');

interface CustomDrawerProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

const CustomDrawer: React.FC<CustomDrawerProps> = ({ visible, onClose, navigation }) => {
  const { isSignedIn } = useAuth();
  
  console.log('CustomDrawer: Rendering with visible =', visible, 'isSignedIn =', isSignedIn);
  
  const drawerState: DrawerNavigationState<ParamListBase> = {
    type: 'drawer',
    key: 'drawer',
    index: 0,
    routeNames: isSignedIn ? ['Dashboard', 'Events', 'Market'] : ['Home', 'Events', 'Market'],
    routes: isSignedIn ? [
      { key: 'Dashboard', name: 'Dashboard', params: undefined },
      { key: 'Events', name: 'Events', params: undefined },
      { key: 'Market', name: 'Market', params: undefined }
    ] : [
      { key: 'Home', name: 'Home', params: undefined },
      { key: 'Events', name: 'Events', params: undefined },
      { key: 'Market', name: 'Market', params: undefined }
    ],
    stale: false,
    preloadedRouteKeys: [],
    default: 'closed',
    history: []
  };

  if (!visible) {
    console.log('CustomDrawer: Not visible, not rendering');
    return null;
  }

  console.log('CustomDrawer: Rendering modal with drawer state:', drawerState);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.drawerContainer}>
          <Sidebar 
            navigation={navigation}
            state={drawerState}
            descriptors={{}}
          />
        </View>
        <TouchableOpacity 
          style={styles.backdrop} 
          onPress={onClose}
          activeOpacity={1}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerContainer: {
    width: width * 0.8,
    backgroundColor: '#18181A',
    height: '100%',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default CustomDrawer;