import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useWatch, Control } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { EventFormValues } from "@/app/screens/createEvents";

type Props = {
  setActiveTab: (key: string) => void;
  activeTab: string;
  control: Control<EventFormValues>;
  onSubmit?: () => void;
};

const PreviewEvent: React.FC<Props> = ({ setActiveTab, control, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const values = useWatch({ control });

  const fmt = (d: Date | string | undefined) => {
    if (!d) return "—";
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  };

  const handlePublish = async () => {
    if (!onSubmit) return;
    setLoading(true);
    try {
      await onSubmit();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Preview Event</Text>

      {/* Cover image */}
      {values.coverImage?.fileUrl ? (
        <Image source={{ uri: values.coverImage.fileUrl }} style={styles.coverImage} resizeMode="cover" />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Ionicons name="image-outline" size={40} color="#4B5563" />
          <Text style={styles.coverPlaceholderText}>No cover image</Text>
        </View>
      )}

      {/* Title & category */}
      <Text style={styles.title}>{values.title || "Untitled Event"}</Text>
      {values.category ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{values.category}</Text>
        </View>
      ) : null}

      {/* Info rows */}
      <View style={styles.infoCard}>
        <InfoRow icon="calendar-outline" label="Start" value={fmt(values.startDate)} />
        <InfoRow icon="calendar-outline" label="End" value={fmt(values.endDate)} />
        <InfoRow icon="location-outline" label="Location" value={values.location?.name || "—"} />
        <InfoRow icon="eye-outline" label="Visibility" value={values.visibility || "Public"} />
        <InfoRow icon="people-outline" label="Attendees" value={`${values.minAttendees || 0} – ${values.maxAttendees || 0}`} />
        <InfoRow icon="ticket-outline" label="Available Tickets" value={String(values.availableTickets || 0)} />
        {values.isPaidEvent && (
          <InfoRow icon="card-outline" label="Ticket Price" value={`€${values.ticketPrice || 0}`} />
        )}
        {!values.isPaidEvent && (
          <InfoRow icon="gift-outline" label="Ticket Price" value="Free" />
        )}
        <InfoRow icon="time-outline" label="Payment Deadline" value={fmt(values.paymentDeadline)} />
        <InfoRow icon="refresh-outline" label="Refund Deadline" value={fmt(values.refundDeadline)} />
      </View>

      {/* Description */}
      {values.description ? (
        <View style={styles.descCard}>
          <Text style={styles.descLabel}>Description</Text>
          <Text style={styles.descText}>{values.description}</Text>
        </View>
      ) : null}

      {/* Organizers */}
      {values.organizers && values.organizers.length > 0 && (
        <View style={styles.descCard}>
          <Text style={styles.descLabel}>Organizers</Text>
          {values.organizers.map((o, i) => (
            <Text key={i} style={styles.organizerText}>• {o}</Text>
          ))}
        </View>
      )}

      {/* Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab("invite_members")}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.publishBtn} onPress={handlePublish} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.publishBtnText}>Publish Event</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const InfoRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={16} color="#2ecc71" style={{ marginRight: 8 }} />
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
  </View>
);

export default PreviewEvent;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingBottom: 40 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 16 },
  coverImage: { width: "100%", height: 180, borderRadius: 14, marginBottom: 16 },
  coverPlaceholder: { width: "100%", height: 180, borderRadius: 14, backgroundColor: "#111827", borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  coverPlaceholderText: { color: "#4B5563", marginTop: 8, fontSize: 13 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  badge: { alignSelf: "flex-start", backgroundColor: "#14532d", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16, borderWidth: 1, borderColor: "#166534" },
  badgeText: { color: "#2ecc71", fontSize: 12, fontWeight: "600" },
  infoCard: { backgroundColor: "#111827", borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#1f2937" },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  infoLabel: { color: "#9CA3AF", fontSize: 13, width: 120 },
  infoValue: { color: "#fff", fontSize: 13, flex: 1 },
  descCard: { backgroundColor: "#111827", borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#1f2937" },
  descLabel: { color: "#9CA3AF", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  descText: { color: "#D1D5DB", fontSize: 14, lineHeight: 22 },
  organizerText: { color: "#D1D5DB", fontSize: 14, marginBottom: 4 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  backBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center" },
  backBtnText: { color: "#9CA3AF", fontWeight: "600", fontSize: 15 },
  publishBtn: { flex: 2, backgroundColor: "#166534", borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#2ecc71" },
  publishBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
