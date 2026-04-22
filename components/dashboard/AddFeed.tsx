import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { createPost } from "@/client/endpoints/posts/createPost";
import { useUserDb } from "@/app/hooks/useUserDb";
import { useNavigation } from "@react-navigation/native";

type Privacy = "Public" | "Private";

interface PickedFile {
  uri: string;
  name: string;
  type: string;
}

const MAX_FILES = 4;

const AddFeedForm = () => {
  const navigation = useNavigation<any>();
  const { userDb } = useUserDb();
  const userId: string | undefined = userDb?.data?.id ?? userDb?.id;

  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("Public");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Image picker ────────────────────────────────────────────────────────────
  const pickImages = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission required", "Please allow media access to continue.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const remaining = MAX_FILES - files.length;
      if (remaining <= 0) {
        Alert.alert("Limit reached", `You can upload a maximum of ${MAX_FILES} images.`);
        return;
      }
      const picked: PickedFile[] = result.assets.slice(0, remaining).map((a) => ({
        uri: a.uri,
        name: a.fileName ?? a.uri.split("/").pop() ?? "image.jpg",
        type: a.mimeType ?? "image/jpeg",
      }));
      setFiles((prev) => [...prev, ...picked]);
    }
  };

  const removeFile = (uri: string) =>
    setFiles((prev) => prev.filter((f) => f.uri !== uri));

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert("Error", "User not found. Please sign in again.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Validation", "Please enter a description.");
      return;
    }

    setLoading(true);
    try {
      await createPost(userId, { description: description.trim(), privacy, files });
      Alert.alert("Success", "Post published!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? "Something went wrong.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    if (description.trim() || files.length > 0) {
      Alert.alert("Discard post?", "Your changes will be lost.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => navigation.goBack(),
        },
      ]);
    } else {
      navigation.goBack();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.pageTitle}>New Post</Text>

      {/* ── Post-to section (My Feed / Story) ── */}
      <View style={styles.sectionCard}>
        <CheckRow label="My Feed" checked={true} onPress={() => { }} disabled />
        <CheckRow label="Story" checked={false} onPress={() => { }} disabled />
      </View>

      {/* ── Post details card ── */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Post Details</Text>

        <Text style={styles.fieldLabel}>Description</Text>
        <View style={styles.textAreaWrap}>
          <TextInput
            style={styles.textArea}
            placeholder="What's on your mind?"
            placeholderTextColor="#6b7280"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          {/* Media attach button */}
          <TouchableOpacity style={styles.attachBtn} onPress={pickImages}>
            <Ionicons name="image-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Image previews */}
        {files.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.previewScroll}
          >
            {files.map((f) => (
              <View key={f.uri} style={styles.previewWrap}>
                <TouchableOpacity onPress={() => setPreviewUri(f.uri)}>
                  <Image source={{ uri: f.uri }} style={styles.previewThumb} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeFile(f.uri)}
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {files.length < MAX_FILES && (
              <TouchableOpacity style={styles.addMoreBtn} onPress={pickImages}>
                <Ionicons name="add" size={24} color="#6b7280" />
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {/* Privacy selector */}
        <View style={styles.privacyRow}>
          <Text style={styles.fieldLabel}>Post Privacy:</Text>
          <View style={styles.privacyToggle}>
            {(["Public", "Private"] as Privacy[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.privacyOption, privacy === p && styles.privacyOptionActive]}
                onPress={() => setPrivacy(p)}
              >
                <Ionicons
                  name={p === "Public" ? "globe-outline" : "lock-closed-outline"}
                  size={14}
                  color={privacy === p ? "#fff" : "#9ca3af"}
                />
                <Text style={[styles.privacyText, privacy === p && styles.privacyTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* ── Action buttons ── */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard} disabled={loading}>
          <Text style={styles.discardText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.publishBtn, loading && styles.publishBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.publishText}>Publish</Text>
          }
        </TouchableOpacity>
      </View>

      {/* ── Full-screen image preview modal ── */}
      <Modal visible={!!previewUri} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() => setPreviewUri(null)}
        >
          <Image
            source={{ uri: previewUri! }}
            style={styles.fullImage}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.modalClose} onPress={() => setPreviewUri(null)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

// ── CheckRow helper ────────────────────────────────────────────────────────────
function CheckRow({
  label, checked, onPress, disabled,
}: {
  label: string; checked: boolean; onPress: () => void; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={cr.row}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[cr.box, checked && cr.boxChecked]}>
        {checked && <Ionicons name="checkmark" size={13} color="#fff" />}
      </View>
      <Text style={cr.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const cr = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 14 },
  box: {
    width: 22, height: 22, borderRadius: 4,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  boxChecked: { backgroundColor: "#166534", borderColor: "#2ecc71" },
  label: { color: "#fff", fontSize: 14, fontWeight: "600" },
});

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#0d0d0d" },
  container: { padding: 16, paddingBottom: 40, gap: 16 },

  pageTitle: { color: "#fff", fontSize: 24, fontWeight: "700" },

  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  detailsCard: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  fieldLabel: { color: "#9ca3af", fontSize: 13, fontWeight: "500" },

  textAreaWrap: { position: "relative" },
  textArea: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    paddingBottom: 44,
    color: "#fff",
    fontSize: 14,
    minHeight: 160,
    backgroundColor: "transparent",
  },
  attachBtn: {
    position: "absolute",
    bottom: 12,
    left: 12,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  previewScroll: { marginTop: 4 },
  previewWrap: { position: "relative", marginRight: 10 },
  previewThumb: { width: 80, height: 80, borderRadius: 8 },
  removeBtn: {
    position: "absolute", top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#ef4444",
    alignItems: "center", justifyContent: "center",
  },
  addMoreBtn: {
    width: 80, height: 80, borderRadius: 8,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)",
    borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
  },

  privacyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  privacyToggle: { flexDirection: "row", gap: 8 },
  privacyOption: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  privacyOptionActive: { backgroundColor: "#166534", borderColor: "#2ecc71" },
  privacyText: { color: "#9ca3af", fontSize: 13 },
  privacyTextActive: { color: "#fff", fontWeight: "600" },

  actions: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  discardBtn: {
    paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 12, borderWidth: 1, borderColor: "#2ecc71",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  discardText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  publishBtn: {
    paddingVertical: 12, paddingHorizontal: 32,
    borderRadius: 12, backgroundColor: "#166534",
    borderWidth: 1, borderColor: "#2ecc71",
    minWidth: 100, alignItems: "center",
  },
  publishBtnDisabled: { opacity: 0.6 },
  publishText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  modalBg: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center", alignItems: "center",
  },
  fullImage: { width: "100%", height: "80%" },
  modalClose: {
    position: "absolute", top: 50, right: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center",
  },
});

export default AddFeedForm;
