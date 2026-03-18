import {
  GET_ALL_STORIES,
  getAllStories,
} from "@/client/endpoints/posts/getAllStories";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  Alert,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { useQuery } from "react-query";
import { useAuth, useUser } from "@clerk/clerk-expo";

type GroupedStory = {
  authorId: string;
  name: string;
  imageUrl: string;
  stories: Story[];
};

export type Story = {
  authorId: string;
  id: string;
  file: {
    filename: string;
    fileUrl: string;
  };
  creationTime: string;
  name: string;
  imageUrl: string;
};

const stories: Story[] = [
  {
    authorId: "dummy-author-1",
    id: "1",
    file: {
      filename: "john_doe.jpg",
      fileUrl:
        "https://media.istockphoto.com/id/1223189654/photo/boy-playing-a-game-throwing-rings-outdoors-in-summer-park.jpg?s=612x612&w=0&k=20&c=ecaDpFnnVTbsUbOlqnn3ebNRSuNpbAJIAlwfKdSN23w=",
    },
    creationTime: "12:00 PM",
    name: "john_doe",
    imageUrl: "",
  },
  {
    authorId: "dummy-author-2",
    id: "2",
    file: {
      filename: "jane_doe.jpg",
      fileUrl:
        "https://st3.depositphotos.com/1001201/17455/i/450/depositphotos_174558338-stock-photo-goalkeeper-kicks-the-ball-in.jpgCsR/9k=",
    },
    creationTime: "1:00 PM",
    name: "jane_doe",
    imageUrl: "",
  },
  {
    authorId: "dummy-author-3",
    id: "3",
    file: {
      filename: "alex_smith.jpg",
      fileUrl:
        "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGJhc2tldGJhbGx8ZW58MHx8MHx8fDA%3D",
    },
    creationTime: "2:00 PM",
    name: "alex_smith",
    imageUrl: "",
  },
  {
    authorId: "dummy-author-4",
    id: "4",
    file: {
      filename: "lisa_ray.jpg",
      fileUrl:
        "https://www.shutterstock.com/image-photo/tennis-serve-sport-woman-on-600nw-2262358097.jpg",
    },
    creationTime: "3:00 PM",
    name: "lisa_ray",
    imageUrl: "",
  },
  {
    authorId: "dummy-author-5",
    id: "5",
    file: {
      filename: "emma_ross.jpg",
      fileUrl:
        "https://www.shutterstock.com/image-photo/man-portrait-cricket-player-bat-600nw-2440988429.jpg",
    },
    creationTime: "4:00 PM",
    name: "emma_ross",
    imageUrl: "",
  },
];

export default function Stories() {
  const [selectedStory, setSelectedStory] = useState<any>(null);

  const [storiesOptions, setStoriesOptions] = useState<Story[]>([]);
  const { user } = useUser();
  const { data, refetch } = useQuery([GET_ALL_STORIES], () => getAllStories(), {
    keepPreviousData: false,
    refetchOnWindowFocus: true,
    retry: 0,
  });

  console.log("stories", JSON.stringify(data?.data?.data, null, 2));

  useEffect(() => {
    if (data) {
      const storiesValues: Story[] = [];

      data?.data?.data.forEach((post: any) => {
        storiesValues.push({
          authorId: post.authorId,
          id: post.id,
          file: post.file,
          name: post.name,
          creationTime: post.creationTime,
          imageUrl: post.imageUrl,
        });
      });

      setStoriesOptions(storiesValues);
    }
  }, [data]);

  const openStory = (story: any) => {
    setSelectedStory(story);
  };

  const closeStory = () => {
    setSelectedStory(null);
  };

  const storyListWithUpload = [{ id: "upload", upload: true }, ...stories];

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const groupStoriesByAuthor = (stories: Story[]): GroupedStory[] => {
    const groupedMap = new Map<string, GroupedStory>();
  
    stories.forEach((story) => {
      if (!groupedMap.has(story.authorId)) {
        groupedMap.set(story.authorId, {
          authorId: story.authorId,
          name: story.name,
          imageUrl: story.imageUrl,
          stories: [],
        });
      }
  
      groupedMap.get(story.authorId)!.stories.push(story);
    });
  
    return Array.from(groupedMap.values());
  };
  

  const pickImage = async () => {
    // Request permission
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Permission to access gallery is required!"
      );
      return;
    }

    // Open image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false, // true if you want multi-image
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setSelectedImage(imageUri);
      console.log("Selected Image URI:", imageUri);
    }
  };

  console.log(user?.username);
  return (
    <View style={styles.container}>
      <FlatList
        data={storyListWithUpload}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storyList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          (item as any).upload ? (
            <TouchableOpacity style={styles.uploadStory} onPress={pickImage}>
              {selectedImage ? (
                <>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.avatar}
                  />
                  <Text style={styles.username}>{user?.username}</Text>
                </>
              ) : (
                <Text style={styles.plusIcon}>+</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => openStory(item)}
              style={styles.storyItem}
            >
              <Image
                source={{ uri: (item as any).file.fileUrl }}
                style={styles.avatar}
              />
              <Text style={styles.username}>{(item as any).name}</Text>
            </TouchableOpacity>
          )
        }
      />

      <Modal visible={!!selectedStory} transparent animationType="fade">
        {selectedStory && (
          <TouchableWithoutFeedback onPress={closeStory}>
            <View style={styles.storyModal}>
              <View style={styles.storyContent}>
                <Image
                  source={{ uri: selectedStory.file.fileUrl }}
                  style={styles.fullScreenImage}
                />
                <Text style={styles.storyUsername}>{selectedStory.name}</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    paddingTop: 15,
  },
  storyList: {
    paddingHorizontal: 10,
  },
  storyItem: {
    alignItems: "center",
    marginHorizontal: 7,
  },
  avatar: {
    width: 60,
    height: 80,
    borderRadius: 15,
    borderWidth: 1,
    // borderColor: "#166534",
  },
  username: {
    marginTop: 5,
    fontSize: 12,
    color: "white",
  },
  uploadStory: {
    width: 60,
    height: 80,
    borderRadius: 15,
    borderWidth: 1,
    // borderColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1f2937",
    marginHorizontal: 5,
  },
  plusIcon: {
    fontSize: 32,
    color: "#22c55e",
    fontWeight: "bold",
  },
  storyModal: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  storyContent: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  storyUsername: {
    position: "absolute",
    bottom: 40,
    left: 20,
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
});
