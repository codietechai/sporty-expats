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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import RNPickerSelect from "react-native-picker-select";
import { getNames } from "country-list";
import { updateUser } from "@/client/endpoints/users/updateUser";
import { useUserDb } from "@/app/hooks/useUserDb";

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
  username: string;
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  language: string;
  visibility: string;
  country: string;
  address: string;
  city: string;
  zipCode: string;
  bio: string;
};

// ── Reusable field components ──────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.label}>{label}</Text>;
}

function StyledInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
}) {
  return (
    <TextInput
      style={[styles.input, multiline && { minHeight: 100, textAlignVertical: "top" }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#4B5563"
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
    />
  );
}

function PickerField({
  value,
  onValueChange,
  items,
  placeholder,
}: {
  value: string;
  onValueChange: (v: string) => void;
  items: { label: string; value: string }[];
  placeholder: string;
}) {
  return (
    <View style={styles.pickerWrapper}>
      <RNPickerSelect
        onValueChange={onValueChange}
        items={items}
        placeholder={{ label: placeholder, value: "" }}
        value={value}
        style={pickerStyles}
      />
      <Ionicons name="chevron-down" size={16} color="#4B5563" style={styles.pickerChevron} />
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function PersonalInfo() {
  const navigation = useNavigation();
  const { userDb, loading: userLoading } = useUserDb();
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
    if (!userId) {
      Alert.alert("Error", "User ID not available.");
      return;
    }
    try {
      setSaving(true);
      const res = await updateUser(userId, formData);
      if (res.status === 200) {
        Alert.alert("Saved", "Your details have been updated.");
      } else {
        Alert.alert("Error", res?.data?.message ?? "Something went wrong.");
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
              <FieldLabel label="Username" />
              <StyledInput
                value={formData.username}
                onChangeText={set("username")}
                placeholder="Enter your username"
              />
              <View style={styles.divider} />
              <FieldLabel label="Visibility" />
              <PickerField
                value={formData.visibility}
                onValueChange={set("visibility")}
                items={visibilityOptions}
                placeholder="Select visibility"
              />
            </View>

            {/* Personal */}
            <SectionHeader title="Personal Details" />
            <View style={styles.card}>
              <FieldLabel label="Title" />
              <PickerField
                value={formData.title}
                onValueChange={set("title")}
                items={titleOptions}
                placeholder="Select your title"
              />
              <View style={styles.divider} />
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <FieldLabel label="First Name" />
                  <StyledInput
                    value={formData.firstName}
                    onChangeText={set("firstName")}
                    placeholder="First name"
                  />
                </View>
                <View style={styles.halfField}>
                  <FieldLabel label="Last Name" />
                  <StyledInput
                    value={formData.lastName}
                    onChangeText={set("lastName")}
                    placeholder="Last name"
                  />
                </View>
              </View>
              <View style={styles.divider} />
              <FieldLabel label="Gender" />
              <PickerField
                value={formData.gender}
                onValueChange={set("gender")}
                items={genderOptions}
                placeholder="Select gender"
              />
              <View style={styles.divider} />
              <FieldLabel label="Phone Number" />
              <StyledInput
                value={formData.phone}
                onChangeText={set("phone")}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
              <View style={styles.divider} />
              <FieldLabel label="Language" />
              <PickerField
                value={formData.language}
                onValueChange={set("language")}
                items={languageOptions}
                placeholder="Select your language"
              />
            </View>

            {/* Location */}
            <SectionHeader title="Location" />
            <View style={styles.card}>
              <FieldLabel label="Country" />
              <PickerField
                value={formData.country}
                onValueChange={set("country")}
                items={countries}
                placeholder="Select your country"
              />
              <View style={styles.divider} />
              <FieldLabel label="Address" />
              <StyledInput
                value={formData.address}
                onChangeText={set("address")}
                placeholder="Enter your address"
              />
              <View style={styles.divider} />
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <FieldLabel label="City" />
                  <StyledInput
                    value={formData.city}
                    onChangeText={set("city")}
                    placeholder="City"
                  />
                </View>
                <View style={styles.halfField}>
                  <FieldLabel label="Zip Code" />
                  <StyledInput
                    value={formData.zipCode}
                    onChangeText={set("zipCode")}
                    placeholder="Zip code"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Bio */}
            <SectionHeader title="About You" />
            <View style={styles.card}>
              <FieldLabel label="Bio" />
              <StyledInput
                value={formData.bio}
                onChangeText={set("bio")}
                placeholder="Write a short bio…"
                multiline
                numberOfLines={4}
              />
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

  // Input
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
  },

  // Picker
  pickerWrapper: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 10,
    justifyContent: "center",
    position: "relative",
  },
  pickerChevron: {
    position: "absolute",
    right: 12,
    pointerEvents: "none",
  },

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

const pickerStyles = {
  inputIOS: {
    color: "#fff",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingRight: 32,
  },
  inputAndroid: {
    color: "#fff",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingRight: 32,
  },
  placeholder: { color: "#4B5563" },
};
