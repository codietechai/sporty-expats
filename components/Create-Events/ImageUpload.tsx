import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Controller, Control } from "react-hook-form";
import { EventFormValues } from "@/app/screens/createEvents";
import InlineAlert from "./InlineAlert";

type Props = {
  setActiveTab: (key: string) => void;
  activeTab: string;
  control: Control<EventFormValues>;
  onSubmit?: () => void;
};

const Image_Upload: React.FC<Props> = ({ setActiveTab, control }) => {
  const pickImage = async (onChange: (val: { filename: string; fileUrl: string }) => void) => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { alert("Permission to access media library is required."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const filename = asset.uri.split("/").pop() ?? "cover.jpg";
      onChange({ filename, fileUrl: asset.uri });
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
            activeOpacity={0.8}
          >
            {value?.fileUrl ? (
              <Image source={{ uri: value.fileUrl }} style={styles.preview} resizeMode="cover" />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="cloud-upload-outline" size={48} color="#2ecc71" />
                <Text style={styles.uploadText}>Tap to upload image</Text>
                <Text style={styles.uploadHint}>JPG, PNG up to 10MB</Text>
              </View>
            )}
          </TouchableOpacity>

          {value?.fileUrl && (
            <TouchableOpacity style={styles.changeBtn} onPress={() => pickImage(onChange)}>
              <Ionicons name="refresh-outline" size={16} color="#9CA3AF" />
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
                if (!value?.fileUrl) return;
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
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: "#6B7280", fontSize: 13, marginBottom: 20 },
  uploadArea: {
    borderWidth: 2,
    borderColor: "#2a2a2a",
    borderStyle: "dashed",
    borderRadius: 16,
    height: 220,
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  uploadAreaFilled: { borderStyle: "solid", borderColor: "#166534" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  uploadText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  uploadHint: { color: "#4B5563", fontSize: 12 },
  preview: { width: "100%", height: "100%" },
  changeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, paddingVertical: 8 },
  changeBtnText: { color: "#9CA3AF", fontSize: 13 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: "auto", paddingTop: 24 },
  backBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center" },
  backBtnText: { color: "#9CA3AF", fontWeight: "600", fontSize: 15 },
  continueBtn: { flex: 2, backgroundColor: "#166534", borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#2ecc71" },
  continueBtnDisabled: { backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" },
  continueBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
