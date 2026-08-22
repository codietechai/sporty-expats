import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { timeAgo } from '@/helpers/date';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface Viewer {
  id: string;
  name: string;
  imageUrl: string;
  viewedAt: string;
}

interface ViewerBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  viewers: Viewer[];
  viewCount: number;
}

const ViewerBottomSheet: React.FC<ViewerBottomSheetProps> = ({
  visible,
  onClose,
  viewers,
  viewCount,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <View style={styles.bottomSheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>
              {viewCount === 1
                ? 'Seen by 1 person'
                : `Seen by ${viewCount} people`}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {viewers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="eye-off-outline" size={48} color="#666" />
                <Text style={styles.emptyText}>No viewers yet</Text>
              </View>
            ) : (
              viewers.map((viewer) => (
                <View key={viewer.id} style={styles.viewerItem}>
                  <Image
                    source={{ uri: viewer.imageUrl }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                  <View style={styles.viewerInfo}>
                    <Text style={styles.viewerName}>{viewer.name}</Text>
                    <Text style={styles.viewTime}>{timeAgo(viewer.viewedAt)}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginLeft: 24, // Space for close button alignment
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  viewerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  viewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  viewTime: {
    fontSize: 14,
    color: '#666',
  },
});

export default ViewerBottomSheet;