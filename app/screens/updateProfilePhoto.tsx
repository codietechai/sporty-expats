// screens/UpdateProfilePhotoScreen.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator, // <-- Add this import
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  addProfilePhoto,
  getProfilePhoto,
} from "@/client/endpoints/users/addProfilePhoto";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
import { useUserDb } from "../hooks/useUserDb";

const UpdateProfilePhotoScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // <-- Add loading state
  const { userDb, refresh } = useUserDb();

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      try {
        const res = await getProfilePhoto(userDb?.id);
        if (res) {
          // console.log("Fetched profile photo is Present", res.data.fileUrl);
          setImage(res.data.fileUrl);
        }
      } catch (error) {}
    };
    fetchProfilePhoto();
  }, [userDb]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    if (!image) {
      console.warn("No image selected");
      return;
    }
    setLoading(true); // <-- Start loading
    const randomNum = Math.floor(1000000 + Math.random() * 9000000);
    const filename = `profile_photo_${randomNum}.jpg`;
    const data = {
      fileUrl: image,
      fileType: "Image",
      filename: filename,
    };
    try {
      const res = await addProfilePhoto(userDb?.id, data);
      refresh(); // Refresh user data after update
      console.log("Profile photo updated:", res.data);
    } catch (error) {
      console.error("Failed to update profile photo:", error);
    } finally {
      setLoading(false); // <-- Stop loading
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Photo</Text>

      <View style={styles.profileContainer}>
        <Image
          source={
            image
              ? { uri: image }
              : require("../../assets/images/adaptive-icon.png")
          }
          style={styles.avatar}
        />
      </View>

      <TouchableOpacity onPress={pickImage} style={styles.uploadBox}>
        <Text style={styles.uploadText}>Tap to select photo from device</Text>
        <Text style={styles.supportedText}>Supports JPG, PNG, HEIC</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && { backgroundColor: "#888" }]}
        onPress={handleUpdate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Update Changes</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default UpdateProfilePhotoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 24,
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderColor: "#888",
    borderWidth: 2,
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: "#444",
    borderStyle: "dashed",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 30,
    backgroundColor: "#1e1e1e",
  },
  uploadText: {
    color: "#3ED598",
    fontSize: 16,
    fontWeight: "500",
  },
  supportedText: {
    fontSize: 12,
    color: "#ccc",
    marginTop: 4,
  },
  button: {
    backgroundColor: "#1db954",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
