import React from 'react';
import { View, Image, FlatList, StyleSheet, Dimensions } from 'react-native';

type MediaItem = {
  id: string;
  fileUrl: string;
};

type Props = {
  media: MediaItem[];
};

const MediaGallery: React.FC<Props> = ({ media }) => {
  const screenWidth = Dimensions.get('window').width;
  const imageSize = screenWidth / 3;

  console.log(media)
  return (
    <FlatList
      data={media}
      keyExtractor={(item) => item.id}
      numColumns={3}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <View style={[styles.imageWrapper, { width: imageSize, height: imageSize }]}>
          <Image source={{ uri: item.fileUrl }} style={styles.image} />
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 1,
  },
  imageWrapper: {
    margin: 1,
    backgroundColor: '#333',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default MediaGallery;
