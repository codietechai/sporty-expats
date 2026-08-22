import i18n from "@/translations/i18n";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import { useUserDb } from "@/app/hooks/useUserDb";
import {
  submitComplaint,
  ComplaintType,
} from "@/client/endpoints/complaints/submitComplaint";
import { Stack } from "expo-router";

// ── Category config ────────────────────────────────────────────────────────────

type CategoryConfig = {
  id: ComplaintType;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  hasIdentifier: boolean;
  identifierLabelKey?: string;
  identifierPlaceholderKey?: string;
  hasTitleInput: boolean;
  messagePlaceholderKey: string;
};

const CATEGORIES: CategoryConfig[] = [
  {
    id: "Payment",
    labelKey: "Funding/PaymentError",
    icon: "card-outline",
    hasIdentifier: false,
    hasTitleInput: true,
    messagePlaceholderKey: "ProvideTransactionDetails",
  },
  {
    id: "EventRegistration",
    labelKey: "EventRegistration",
    icon: "calendar-outline",
    hasIdentifier: true,
    hasTitleInput: false,
    identifierLabelKey: "ProvideEventIdentifier",
    identifierPlaceholderKey: "Name/ID/URL of the event",
    messagePlaceholderKey: "IncludeAnyInformationYouThinkTheAdminWillNeedToAddressTheIssue",
  },
  {
    id: "RefundRequest",
    labelKey: "RefundRequest",
    icon: "refresh-outline",
    hasIdentifier: false,
    hasTitleInput: true,
    messagePlaceholderKey: "PleaseMentionAnyDetailsThatWouldBeNecessaryToProcessYourRequest",
  },
  {
    id: "OffensiveContent",
    labelKey: "OffensiveContent",
    icon: "flag-outline",
    hasIdentifier: true,
    hasTitleInput: false,
    identifierLabelKey: "ProvideContentIdentifier",
    identifierPlaceholderKey: "Name/ID/URL of the Content",
    messagePlaceholderKey: "IncludeAnyInformationYouThinkTheAdminWillNeedToAddressTheIssue",
  },
  {
    id: "EventCreation",
    labelKey: "EventCreation",
    icon: "add-circle-outline",
    hasIdentifier: true,
    hasTitleInput: false,
    identifierLabelKey: "ProvideEventIdentifier",
    identifierPlaceholderKey: "Name/ID/URL of the event",
    messagePlaceholderKey: "IncludeAnyInformationYouThinkTheAdminWillNeedToAddressTheIssue",
  },
  {
    id: "ReportUser",
    labelKey: "ReportUser",
    icon: "person-remove-outline",
    hasIdentifier: false,
    hasTitleInput: true,
    messagePlaceholderKey: "IncludeAnyInformationYouThinkTheAdminWillNeedToAddressTheIssue",
  },
];

function t(key: string): string {
  return i18n.t(`ReportToAdmin.${key}`);
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ContactUs() {
  const navigation = useNavigation<any>();
  const drawer = navigation.getParent() as DrawerNavigationProp<any> | undefined;

  const { userDb } = useUserDb();
  const currentUserId: string =
    userDb?.data?.id ?? userDb?.id ?? userDb?.data?.data?.id ?? "";

  const [activeCategory, setActiveCategory] = useState<ComplaintType>("Payment");
  const [title, setTitle] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCat = CATEGORIES.find((c) => c.id === activeCategory)!;

  const handleCategoryChange = (id: ComplaintType) => {
    if (id === activeCategory) return;
    setActiveCategory(id);
    setTitle("");
    setIdentifier("");
    setMessage("");
    setError(null);
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError(i18n.t("ReportToAdmin.EmptyMessage"));
      return;
    }
    if (!currentUserId) {
      setError("You must be logged in to contact admin.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitComplaint({
        title: activeCat.hasTitleInput ? title.trim() : identifier.trim(),
        description: message.trim(),
        type: activeCategory,
        status: "Pending",
        priority: "Medium",
        userId: currentUserId,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
        err?.message ??
        i18n.t("ReportToAdmin.SomethingWrong"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle("");
    setIdentifier("");
    setMessage("");
    setError(null);
    setSubmitted(false);
  };

  return (
    <>
      {/* Tell expo-router / drawer not to render its own header */}
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.menuBtn}
            onPress={() => drawer?.openDrawer?.()}
            hitSlop={8}
          >
            <Ionicons name="menu" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>{t("ContactAdmin")}</Text>
          </View>
          {/* spacer to keep title centred */}
          <View style={{ width: 38 }} />
        </View>

        {/* ── Info banner ── */}
        <View style={s.infoBanner}>
          <Ionicons name="information-circle-outline" size={15} color="#2ecc71" />
          <Text style={s.infoText}>{t("ComplaintInfoTag")}</Text>
        </View>

        {/* ── Category chips — horizontal scroll ── */}
        <View style={s.chipsSection}>
          <FlatList
            horizontal
            data={CATEGORIES}
            keyExtractor={(c) => c.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipsContent}
            renderItem={({ item: cat }) => {
              const isActive = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  style={[s.chip, isActive && s.chipActive]}
                  onPress={() => handleCategoryChange(cat.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={cat.icon}
                    size={14}
                    color={isActive ? "#2ecc71" : "#6B7280"}
                  />
                  <Text style={[s.chipText, isActive && s.chipTextActive]}>
                    {t(cat.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* ── Form ── */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          {submitted ? (
            /* ── Success ── */
            <View style={s.successBlock}>
              <View style={s.successIconWrap}>
                <Ionicons name="checkmark-circle" size={64} color="#2ecc71" />
              </View>
              <Text style={s.successTitle}>{t("ReportSent")}</Text>
              <Text style={s.successMsg}>{t("ReportingUserSuccessful")}</Text>
              <TouchableOpacity style={s.submitBtn} onPress={handleReset}>
                <Text style={s.submitBtnText}>Submit Another</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitBtn, s.outlineBtn]}
                onPress={() => navigation.navigate("Dashboard")}
              >
                <Text style={s.outlineBtnText}>{t("GoToDashboard")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={s.formContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Active category heading */}
              <View style={s.formHeadingRow}>
                <Ionicons name={activeCat.icon} size={18} color="#2ecc71" />
                <Text style={s.formHeading}>{t(activeCat.labelKey)}</Text>
              </View>

              {/* Title input */}
              {activeCat.hasTitleInput && (
                <>
                  <Text style={s.label}>Complaint Title</Text>
                  <TextInput
                    style={s.input}
                    value={title}
                    onChangeText={(v) => { setTitle(v); setError(null); }}
                    placeholder="Enter a title for your complaint"
                    placeholderTextColor="#6b7280"
                    returnKeyType="next"
                  />
                </>
              )}

              {/* Identifier field */}
              {activeCat.hasIdentifier && (
                <>
                  <Text style={s.label}>{t(activeCat.identifierLabelKey!)}</Text>
                  <TextInput
                    style={s.input}
                    value={identifier}
                    onChangeText={(v) => { setIdentifier(v); setError(null); }}
                    placeholder={t(activeCat.identifierPlaceholderKey!)}
                    placeholderTextColor="#6b7280"
                    returnKeyType="next"
                  />
                </>
              )}

              {/* Message */}
              <Text style={s.label}>{t("TypeYourMessage")}</Text>
              <TextInput
                style={s.textarea}
                value={message}
                onChangeText={(v) => { setMessage(v); setError(null); }}
                placeholder={t(activeCat.messagePlaceholderKey)}
                placeholderTextColor="#6b7280"
                multiline
                textAlignVertical="top"
              />

              {/* Error */}
              {!!error && (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle-outline" size={15} color="#ef4444" />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[s.submitBtn, submitting && s.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={16} color="#fff" />
                    <Text style={s.submitBtnText}>{t("SendMessage")}</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0d0d0d" },

  // Header — single, clean bar matching all other screens
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
    backgroundColor: "#111",
  },
  menuBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },

  // Info banner
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(46,204,113,0.07)",
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.18)",
    borderRadius: 10,
  },
  infoText: { flex: 1, color: "#9CA3AF", fontSize: 12, lineHeight: 17 },

  // Category chips
  chipsSection: {
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    paddingVertical: 10,
  },
  chipsContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#1a1a1a",
  },
  chipActive: {
    borderColor: "#2ecc71",
    backgroundColor: "rgba(22,101,52,0.18)",
  },
  chipText: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  chipTextActive: { color: "#2ecc71", fontWeight: "700" },

  // Form
  formContent: { padding: 20, paddingBottom: 48 },

  formHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 22,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  formHeading: { fontSize: 16, fontWeight: "700", color: "#fff" },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D1D5DB",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#fff",
    fontSize: 14,
    marginBottom: 20,
  },
  textarea: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#fff",
    fontSize: 14,
    minHeight: 150,
    marginBottom: 20,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { flex: 1, color: "#ef4444", fontSize: 13, lineHeight: 18 },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#15803d",
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2ecc71",
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  outlineBtn: {
    backgroundColor: "transparent",
    borderColor: "#2a2a2a",
  },
  outlineBtnText: { color: "#9CA3AF", fontWeight: "600", fontSize: 14 },

  // Success
  successBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  successIconWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "rgba(46,204,113,0.1)",
    borderWidth: 1, borderColor: "rgba(46,204,113,0.25)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  successMsg: {
    fontSize: 14, color: "#9CA3AF",
    textAlign: "center", lineHeight: 22,
  },
});
