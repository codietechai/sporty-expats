import React, { useEffect, useState } from "react";
import {
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateUser } from "@/client/endpoints/users/updateUser";
import { backendClient } from "@/client/backendClient";
import { useUserDb } from "@/app/hooks/useUserDb";
import { getNames } from "country-list";

const countries = getNames().map((c) => ({ label: c, value: c }));

const languageOptions = [
  { label: "English", value: "en" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
];

const titleOptions = [
  { label: "Mr.", value: "Mr." },
  { label: "Mrs.", value: "Mrs." },
  { label: "Miss", value: "Miss" },
  { label: "Dr.", value: "Dr." },
];

const visibilityOptions = [
  { label: "Public", value: "Public" },
  { label: "Private", value: "Private" },
];

const genderOptions = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Non-binary", value: "Non-binary" },
  { label: "Prefer not to say", value: "Prefer not to say" },
];

type FormData = {
  username: string; title: string; firstName: string; lastName: string;
  phone: string; gender: string; language: string; visibility: string;
  country: string; address: string; city: string; zipCode: string; bio: string;
};

// ── Custom dropdown — same height as TextInput ─────────────────────────────

function PickerField({
  label, value, onValueChange, items, placeholder,
}: {
  label?: string;
  value: string;
  onValueChange: (v: string) => void;
  items: { label: string; value: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const display = items.find((i) => i.value === value)?.label ?? "";

  return (
    <>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.input} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={[{ flex: 1, color: display ? "#fff" : "#4B5563", fontSize: 14 }]} numberOfLines={1}>
          {display || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#4B5563" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.optionRow, item.value === value && styles.optionRowActive]}
                  onPress={() => { onValueChange(item.value); setOpen(false); }}
                >
                  <Text style={[styles.optionText, item.value === value && styles.optionTextActive]}>
                    {item.label}
                  </Text>
                  {item.value === value && <Ionicons name="checkmark" size={16} color="#4ade80" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ── Reusable field components ──────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function StyledInput({
  label, value, onChangeText, placeholder, keyboardType, multiline, numberOfLines,
}: {
  label?: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; keyboardType?: any; multiline?: boolean; numberOfLines?: number;
}) {
  return (
    <>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.inputBase, multiline && { minHeight: 100, textAlignVertical: "top" }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#4B5563"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
    </>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function PersonalInfo() {
  const navigation = useNavigation();
  const { userDb, loading: userLoading, refresh } = useUserDb();
  const { user: clerkUser } = useUser();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    username: "",
    title: "",
    firstName: "",
    lastName: "",
    phone: "",
    gender: "",
    language: "",
    visibility: "",
    country: "",
    address: "",
    city: "",
    zipCode: "",
    bio: "",
  });

  const userId: string | null =
    userDb?.data?.data?.id ?? userDb?.data?.id ?? userDb?.id ?? null;

  // Prefill from userDb
  useEffect(() => {
    if (!userDb) return;
    const u = userDb?.data?.data ?? userDb?.data ?? userDb;
    const pd = u?.personalDetails ?? {};
    setFormData({
      username: u?.username ?? "",
      title: pd?.title ?? u?.title ?? "",
      firstName: pd?.firstName ?? u?.firstName ?? "",
      lastName: pd?.lastName ?? u?.lastName ?? "",
      phone: pd?.phone ?? u?.phone ?? "",
      gender: pd?.gender ?? u?.gender ?? "",
      language: pd?.language ?? u?.language ?? "",
      visibility: u?.visibility ?? "",
      country: pd?.country ?? u?.country ?? "",
      address: pd?.address ?? u?.address ?? "",
      city: pd?.city ?? u?.city ?? "",
      zipCode: pd?.zipCode ?? u?.zipCode ?? "",
      bio: u?.bio ?? "",
    });
  }, [userDb]);

  const set = (field: keyof FormData) => (value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    try {
      setSaving(true);

      if (userId) {
        // Existing user — update via PUT
        const res = await updateUser(userId, formData);
        if (res.status === 200) {
          const updated = res.data?.data ?? res.data;
          await AsyncStorage.setItem("userDetails", JSON.stringify(updated));
          refresh();
          Alert.alert("Saved", "Your details have been updated.");
        } else {
          Alert.alert("Error", res?.data?.message ?? "Something went wrong.");
        }
      } else {
        // No user ID yet — create via POST /users/save
        const payload = {
          ...formData,
          email: clerkUser?.primaryEmailAddress?.emailAddress ?? "",
          imageUrl: clerkUser?.imageUrl ?? "",
        };
        const res = await backendClient.post("/users/save", payload);
        if (res.status === 200 || res.status === 201) {
          const { user, personalDetail } = res.data;
          const sessionData = { ...user, personalDetails: personalDetail };
          await AsyncStorage.setItem("userDetails", JSON.stringify(sessionData));
          refresh();
          Alert.alert("Saved", "Your profile has been created.");
        } else {
          Alert.alert("Error", res?.data?.message ?? "Something went wrong.");
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={["top"]}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Personal Information</Text>
            <Text style={styles.headerSub}>Manage your profile details</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        {userLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#4ade80" />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Account */}
            <SectionHeader title="Account" />
            <View style={styles.card}>
              <StyledInput label="Username" value={formData.username} onChangeText={set("username")} placeholder="Enter your username" />
              <View style={styles.divider} />
              <PickerField label="Visibility" value={formData.visibility} onValueChange={set("visibility")} items={visibilityOptions} placeholder="Select visibility" />
            </View>

            {/* Personal */}
            <SectionHeader title="Personal Details" />
            <View style={styles.card}>
              <PickerField label="Title" value={formData.title} onValueChange={set("title")} items={titleOptions} placeholder="Select your title" />
              <View style={styles.divider} />
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <StyledInput label="First Name" value={formData.firstName} onChangeText={set("firstName")} placeholder="First name" />
                </View>
                <View style={styles.halfField}>
                  <StyledInput label="Last Name" value={formData.lastName} onChangeText={set("lastName")} placeholder="Last name" />
                </View>
              </View>
              <View style={styles.divider} />
              <PickerField label="Gender" value={formData.gender} onValueChange={set("gender")} items={genderOptions} placeholder="Select gender" />
              <View style={styles.divider} />
              <StyledInput label="Phone Number" value={formData.phone} onChangeText={set("phone")} placeholder="Enter your phone number" keyboardType="phone-pad" />
              <View style={styles.divider} />
              <PickerField label="Language" value={formData.language} onValueChange={set("language")} items={languageOptions} placeholder="Select your language" />
            </View>

            {/* Location */}
            <SectionHeader title="Location" />
            <View style={styles.card}>
              <PickerField label="Country" value={formData.country} onValueChange={set("country")} items={countries} placeholder="Select your country" />
              <View style={styles.divider} />
              <StyledInput label="Address" value={formData.address} onChangeText={set("address")} placeholder="Enter your address" />
              <View style={styles.divider} />
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <StyledInput label="City" value={formData.city} onChangeText={set("city")} placeholder="City" />
                </View>
                <View style={styles.halfField}>
                  <StyledInput label="Zip Code" value={formData.zipCode} onChangeText={set("zipCode")} placeholder="Zip code" keyboardType="numeric" />
                </View>
              </View>
            </View>

            {/* Bio */}
            <SectionHeader title="About You" />
            <View style={styles.card}>
              <StyledInput label="Bio" value={formData.bio} onChangeText={set("bio")} placeholder="Write a short bio…" multiline numberOfLines={4} />
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0d0d0d" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
    backgroundColor: "#111",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 11, color: "#6B7280", marginTop: 1 },

  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48 },

  // Section
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4ade80",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Card
  card: {
    backgroundColor: "#111",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#1e1e1e",
    marginVertical: 10,
  },

  // Row layout
  row: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },

  // Label
  label: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
    marginBottom: 6,
  },

  // Input — shared by dropdown trigger
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 42,
  },
  // Input — for TextInput (no row layout)
  inputBase: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
    minHeight: 42,
  },

  // Modal dropdown
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#111", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderColor: "#1e1e1e", paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: "#1e1e1e",
  },
  modalTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  optionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#1a1a1a",
  },
  optionRowActive: { backgroundColor: "rgba(74,222,128,0.06)" },
  optionText: { color: "#D1D5DB", fontSize: 15 },
  optionTextActive: { color: "#fff", fontWeight: "600" },

  // Save button
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#166534",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#4ade80",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
