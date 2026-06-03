import React, { useState } from "react";
import { ActivityIndicator, Alert, View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Controller, Control } from "react-hook-form";
import { EventFormValues } from "@/app/screens/createEvents";
import InlineAlert from "./InlineAlert";
import { useUserDb } from "@/app/hooks/useUserDb";
import { uploadEventCoverImage } from "@/client/endpoints/events/uploadEventCoverImage";

type Props = {
  setActiveTab: (key: string) => void;
  activeTab: string;
  control: Control<EventFormValues>;
  onSubmit?: () => void;
};

const Image_Upload: React.FC<Props> = ({ setActiveTab, control }) => {
  const { userDb } = useUserDb();
  const currentUser = userDb?.data?.data ?? userDb?.data ?? userDb ?? null;
  const userId = currentUser?.id ?? "";
  const [uploading, setUploading] = useState(false);

  const pickImage = async (onChange: (val: { filename: string; fileUrl: string }) => void) => {
    if (!userId) {
      Alert.alert("Error", "User not found. Please sign in again.");
      return;
    }

    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert("Permission required", "Permission to access media library is required."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const filename = asset.uri.split("/").pop() ?? "cover.jpg";
      const file = {
        uri: asset.uri,
        name: filename,
        type: asset.mimeType ?? "image/jpeg",
      };

      setUploading(true);
      try {
        const uploadedImage = await uploadEventCoverImage(userId, file);
        onChange(uploadedImage);
      } catch (error: any) {
        const message = error?.response?.data?.error ?? error?.message ?? "File upload failed.";
        Alert.alert("Upload failed", Array.isArray(message) ? message.join("\n") : message);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <Controller
      control={control}
      name="coverImage"
      render={({ field: { value, onChange } }) => (
        <View style={styles.container}>
          <Text style={styles.title}>Cover Image</Text>
          <Text style={styles.subtitle}>Upload a high-quality image for your event</Text>

          <TouchableOpacity
            style={[styles.uploadArea, !!value?.fileUrl && styles.uploadAreaFilled]}
            onPress={() => pickImage(onChange)}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {uploading ? (
              <View style={styles.placeholder}>
                <ActivityIndicator color="#38c177" />
                <Text style={styles.uploadText}>Uploading image...</Text>
              </View>
            ) : value?.fileUrl ? (
              <Image source={{ uri: value.fileUrl }} style={styles.preview} resizeMode="cover" />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="cloud-upload-outline" size={48} color="#999" />
                <Text style={styles.uploadText}>Tap to upload image</Text>
                <Text style={styles.uploadHint}>JPG, PNG up to 10MB</Text>
              </View>
            )}
          </TouchableOpacity>

          {value?.fileUrl && (
            <TouchableOpacity style={styles.changeBtn} onPress={() => pickImage(onChange)} disabled={uploading}>
              <Ionicons name="refresh-outline" size={16} color="#aaa" />
              <Text style={styles.changeBtnText}>Change image</Text>
            </TouchableOpacity>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab("event_information")}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.continueBtn, !value?.fileUrl && styles.continueBtnDisabled]}
              onPress={() => {
                if (!value?.fileUrl || uploading) return;
                setActiveTab("ticket_information");
              }}
            >
              <Text style={styles.continueBtnText}>Continue →</Text>
            </TouchableOpacity>
          </View>
          {!value?.fileUrl && (
            <InlineAlert message="Please upload a cover image to continue." />
          )}
        </View>
      )}
    />
  );
};

export default Image_Upload;

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { color: "#4ade80", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  subtitle: { color: "#6B7280", fontSize: 13, marginBottom: 20 },
  uploadArea: {
    borderWidth: 2, borderColor: "#2a2a2a", borderStyle: "dashed",
    borderRadius: 12, height: 200, overflow: "hidden", backgroundColor: "#1a1a1a",
  },
  uploadAreaFilled: { borderStyle: "solid", borderColor: "#4ade80" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  uploadText: { color: "#D1D5DB", fontSize: 15, fontWeight: "600" },
  uploadHint: { color: "#6B7280", fontSize: 12 },
  preview: { width: "100%", height: "100%" },
  changeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, paddingVertical: 8 },
  changeBtnText: { color: "#9CA3AF", fontSize: 13 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: "auto", paddingTop: 24 },
  backBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center", backgroundColor: "#1a1a1a" },
  backBtnText: { color: "#9CA3AF", fontWeight: "600", fontSize: 15 },
  continueBtn: { flex: 2, backgroundColor: "#166534", borderRadius: 10, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#4ade80" },
  continueBtnDisabled: { backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" },
  continueBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
