import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={styles.drawerContainer}>
          <Sidebar 
            navigation={navigation}
            state={drawerState}
            descriptors={{}}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: width * 0.8,
    backgroundColor: '#18181A',
    height: '100%',
  },
});

export default CustomDrawer;