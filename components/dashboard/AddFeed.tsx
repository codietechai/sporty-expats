import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Svg, { Path } from "react-native-svg";
import { createPost } from "@/client/endpoints/posts/createPost";
import { useUser } from "@clerk/clerk-expo";

const AddFeedForm = () => {
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [MyFeedChecked, setMyFeedChecked] = useState(false);
  const [MyStoryChecked, setMyStoryChecked] = useState(false);

const { user } = useUser();
const userId = user?.id;
  const pickImages = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Please allow media access to continue.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      const uris = result.assets.map((asset) => asset.uri);
      setImageUris((prevUris) => [...prevUris, ...uris]);
    }
  };

  const removeImage = (uriToRemove: string) => {
    setImageUris((prevUris) => prevUris.filter((uri) => uri !== uriToRemove));
  };

  const addPost = async () => {
    try {
      if (!description.trim()) {
        Alert.alert("Validation", "Please enter a description.");
        return;
      }

      if (imageUris.length === 0) {
        Alert.alert("Validation", "Please select at least one image.");
        return;
      }

      const files = imageUris.map((uri) => ({
        fileUrl: uri,
        fileType: "Image",
        filename: uri.split("/").pop() || "image.jpg",
      }));

      const payload = {
        description: description.trim(),
        privacy: "Public",
        sourceId: null,
        files,
      };

      await createPost(userId as string,payload);

      Alert.alert("Success", "Post published!");
      setDescription("");
      setImageUris([]);
      setMyFeedChecked(false);
      setMyStoryChecked(false);
    } catch (err) {
      console.error("Error creating post:", err);
      Alert.alert("Error", "Something went wrong while publishing the post.");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ color: "white", fontSize: 30 }} className="font-oswald">New Post</Text>

      <View style={{ display: "flex", flexDirection: "row", gap: 20 }}>
        <TouchableOpacity
          onPress={() => setMyStoryChecked(!MyStoryChecked)}
          style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}
        >
          <View style={checkboxStyle(MyStoryChecked) as any} >
            {MyStoryChecked && <Text style={checkText}>✓</Text>}
          </View>
          <Text style={{ color: "white" }}>My Story</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMyFeedChecked(!MyFeedChecked)}
          style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}
        >
          <View style={checkboxStyle(MyFeedChecked) as any}>
            {MyFeedChecked && <Text style={checkText}>✓</Text>}
          </View>
          <Text style={{ color: "white" }}>My Feed</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 30 }}>
        <Text style={{ color: "white", fontSize: 20 }}>Post Details :</Text>

        <Text style={{ color: "white", marginTop: 10, marginBottom: 10 }}>Caption </Text>
        <TextInput
          multiline
          numberOfLines={4}
          placeholder="Type here"
          placeholderTextColor="gray"
          value={description}
          onChangeText={setDescription}
          style={{
            borderWidth: 1,
            borderColor: "gray",
            padding: 10,
            color: "white",
            borderRadius: 10,
            textAlignVertical: "top",
            minHeight: 200,
          }}
        />
      </View>

      <TouchableOpacity style={styles.cameraButton} onPress={pickImages} activeOpacity={0.8}>
        <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ffffff" width={20} height={20}>
          <Path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
          />
          <Path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
        </Svg>
      </TouchableOpacity>

      {imageUris.length > 0 && (
        <ScrollView horizontal style={{ marginTop: 20 }} showsHorizontalScrollIndicator={false}>
          {imageUris.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <TouchableOpacity onPress={() => setSelectedImage(uri)}>
                <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(uri)}>
                <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ffffff" width={20} height={20}>
                  <Path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </Svg>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.continueButton} activeOpacity={0.8} onPress={addPost}>
        <Text style={{ color: "white", fontSize: 16 }}>Publish</Text>
      </TouchableOpacity>

      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <TouchableOpacity style={styles.fullScreenContainer} onPress={() => setSelectedImage(null)} activeOpacity={1}>
            <Image source={{ uri: selectedImage! }} style={styles.fullScreenImage} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const checkboxStyle = (checked: boolean) => ({
  height: 20,
  width: 20,
  borderWidth: 2,
  borderColor: "#ccc",
  marginRight: 10,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: checked ? "green" : "transparent",
});

const checkText = {
  color: "white",
  fontSize: 14,
};

const styles = StyleSheet.create({
  cameraButton: {
    backgroundColor: "#333",
    width: 40,
    height: 40,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  imageWrapper: {
    position: "relative",
    marginRight: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  continueButton: {
    backgroundColor: "green",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 5,
    marginTop: 30,
    alignSelf: "center",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  fullScreenImage: {
    width: "100%",
    height: "80%",
  },
});

export default AddFeedForm;
