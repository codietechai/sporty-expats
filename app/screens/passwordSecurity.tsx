import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Modal, ScrollView, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "@clerk/clerk-expo";

const VERIFICATION_OPTIONS = ["Phone SMS", "Email", "Authenticator App"];

function PasswordField({
  label, value, onChange, placeholder, show, onToggle,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; show: boolean; onToggle: () => void;
}) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#4B5563"
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={onToggle} style={s.eyeBtn} hitSlop={8}>
          <Ionicons name={show ? "eye" : "eye-off"} size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PasswordSecurityScreen() {
  const navigation = useNavigation();
  const { user } = useUser();

  const [verificationMethod, setVerificationMethod] = useState("Phone SMS");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleUpdate = async () => {
    if (!user) { Alert.alert("Error", "User not authenticated."); return; }
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields."); return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match."); return;
    }
    try {
      setLoading(true);
      await user.updatePassword({ newPassword, currentPassword });
      Alert.alert("Success", "Password updated successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error) {
      Alert.alert("Update Failed",
        (error as any)?.[0]?.Error ?? (error as any)?.message ?? "Unknown error."
      );
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
            <Text style={s.headerTitle}>Password & Security</Text>
            <Text style={s.headerSub}>Manage your account security</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Verification */}
          <Text style={s.sectionHeader}>Two-Factor Verification</Text>
          <View style={s.card}>
            <Text style={s.label}>Preferred Method</Text>
            <TouchableOpacity style={s.dropdownBtn} onPress={() => setDropdownVisible(true)}>
              <Text style={s.dropdownBtnText}>{verificationMethod}</Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Password */}
          <Text style={s.sectionHeader}>Change Password</Text>
          <View style={s.card}>
            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter current password"
              show={showCurrent}
              onToggle={() => setShowCurrent(p => !p)}
            />
            <View style={s.divider} />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Enter new password"
              show={showNew}
              onToggle={() => setShowNew(p => !p)}
            />
            <View style={s.divider} />
            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm new password"
              show={showConfirm}
              onToggle={() => setShowConfirm(p => !p)}
            />
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[s.saveBtn, loading && s.saveBtnDisabled]}
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                  <Text style={s.saveBtnText}>Update Password</Text>
                </>
            }
          </TouchableOpacity>
        </ScrollView>

        {/* Dropdown modal */}
        <Modal transparent visible={dropdownVisible} animationType="fade">
          <TouchableOpacity
            style={s.modalOverlay}
            onPress={() => setDropdownVisible(false)}
            activeOpacity={1}
          >
            <View style={s.dropdownMenu}>
              <Text style={s.dropdownMenuTitle}>Select Verification Method</Text>
              {VERIFICATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[s.dropdownItem, verificationMethod === opt && s.dropdownItemActive]}
                  onPress={() => { setVerificationMethod(opt); setDropdownVisible(false); }}
                >
                  <Text style={[s.dropdownItemText, verificationMethod === opt && s.dropdownItemTextActive]}>
                    {opt}
                  </Text>
                  {verificationMethod === opt && (
                    <Ionicons name="checkmark" size={16} color="#4ade80" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </>
  );
}

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
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48 },
  sectionHeader: {
    fontSize: 11, fontWeight: "700", color: "#4ade80",
    letterSpacing: 1, textTransform: "uppercase",
    marginTop: 20, marginBottom: 8, marginLeft: 4,
  },
  card: {
    backgroundColor: "#111", borderRadius: 14,
    borderWidth: 1, borderColor: "#1e1e1e",
    paddingHorizontal: 16, paddingVertical: 12, gap: 0,
  },
  divider: { height: 1, backgroundColor: "#1e1e1e", marginVertical: 10 },
  label: { fontSize: 12, color: "#9CA3AF", fontWeight: "500", marginBottom: 6 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
    borderRadius: 10, paddingHorizontal: 12,
  },
  input: { flex: 1, color: "#fff", fontSize: 14, paddingVertical: 10 },
  eyeBtn: { padding: 4 },
  dropdownBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  dropdownBtnText: { color: "#fff", fontSize: 14 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#166534", borderRadius: 12, paddingVertical: 14,
    marginTop: 24, borderWidth: 1, borderColor: "#4ade80",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center", paddingHorizontal: 32,
  },
  dropdownMenu: {
    backgroundColor: "#111", borderRadius: 14,
    borderWidth: 1, borderColor: "#1e1e1e", overflow: "hidden",
  },
  dropdownMenuTitle: {
    color: "#6B7280", fontSize: 11, fontWeight: "700",
    letterSpacing: 1, textTransform: "uppercase",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
  },
  dropdownItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: "#1e1e1e",
  },
  dropdownItemActive: { backgroundColor: "rgba(74,222,128,0.06)" },
  dropdownItemText: { color: "#D1D5DB", fontSize: 15 },
  dropdownItemTextActive: { color: "#fff", fontWeight: "600" },
});
