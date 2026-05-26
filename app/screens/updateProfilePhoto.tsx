import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { addProfilePhoto, getProfilePhoto } from "@/client/endpoints/users/addProfilePhoto";
import { useUserDb } from "../hooks/useUserDb";

const UpdateProfilePhotoScreen = () => {
  const navigation = useNavigation();
  const { userDb, refresh } = useUserDb();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const userId = userDb?.data?.data?.id ?? userDb?.data?.id ?? userDb?.id;

  useEffect(() => {
    if (!userId) return;
    getProfilePhoto(userId)
      .then((res) => { if (res?.data?.fileUrl) setImage(res.data.fileUrl); })
      .catch(() => {});
  }, [userId]);

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
    if (!image) { Alert.alert("No image", "Please select a photo first."); return; }
    if (!userId) { Alert.alert("Error", "User not found."); return; }
    setLoading(true);
    try {
      const filename = `profile_photo_${Math.floor(1000000 + Math.random() * 9000000)}.jpg`;
      await addProfilePhoto(userId, { fileUrl: image, fileType: "Image", filename });
      refresh();
      Alert.alert("Saved", "Profile photo updated successfully.");
    } catch {
      Alert.alert("Error", "Failed to update profile photo.");
    } finally { setLoading(false); }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={s.safe} edges={["top"]}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Profile Photo</Text>
            <Text style={s.headerSub}>Update your profile picture</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        <View style={s.body}>
          {/* Avatar */}
          <View style={s.avatarWrap}>
            <Image
              source={image ? { uri: image } : require("../../assets/images/adaptive-icon.png")}
              style={s.avatar}
              contentFit="cover"
            />
            <TouchableOpacity style={s.avatarEditBtn} onPress={pickImage}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={s.avatarHint}>Tap the camera icon or the box below to change your photo</Text>

          {/* Upload box */}
          <Text style={s.sectionHeader}>Select Photo</Text>
          <TouchableOpacity style={s.uploadBox} onPress={pickImage} activeOpacity={0.7}>
            <View style={s.uploadIconWrap}>
              <Ionicons name="image-outline" size={28} color="#4ade80" />
            </View>
            <Text style={s.uploadTitle}>Tap to select from device</Text>
            <Text style={s.uploadSub}>Supports JPG, PNG, HEIC</Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity
            style={[s.saveBtn, (!image || loading) && s.saveBtnDisabled]}
            onPress={handleUpdate}
            disabled={!image || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={s.saveBtnText}>Save Photo</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
};

export default UpdateProfilePhotoScreen;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0d0d0d" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#1e1e1e", backgroundColor: "#111",
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 11, color: "#6B7280", marginTop: 1 },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 28 },

  // Avatar
  avatarWrap: { alignSelf: "center", marginBottom: 12, position: "relative" },
  avatar: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 2, borderColor: "#2a2a2a",
  },
  avatarEditBtn: {
    position: "absolute", bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#166534", borderWidth: 2, borderColor: "#0d0d0d",
    alignItems: "center", justifyContent: "center",
  },
  avatarHint: { color: "#4B5563", fontSize: 12, textAlign: "center", marginBottom: 24 },

  sectionHeader: {
    fontSize: 11, fontWeight: "700", color: "#4ade80",
    letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, marginLeft: 4,
  },

  // Upload box
  uploadBox: {
    backgroundColor: "#111", borderRadius: 14,
    borderWidth: 1, borderColor: "#1e1e1e",
    borderStyle: "dashed", padding: 28,
    alignItems: "center", gap: 6, marginBottom: 28,
  },
  uploadIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(74,222,128,0.08)",
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  uploadTitle: { color: "#D1D5DB", fontSize: 15, fontWeight: "600" },
  uploadSub: { color: "#4B5563", fontSize: 12 },

  // Save
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#166534", borderRadius: 12, paddingVertical: 14,
    borderWidth: 1, borderColor: "#4ade80",
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
