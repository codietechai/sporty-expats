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
          <Ionicons name="image-outline" size={40} color="#999" />
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
        <InfoRow
          icon="ticket-outline"
          label="Available Tickets"
          value={String(Math.max(Number(values.availableTickets || 0) - (values.participantOrganizers?.length ?? 0), 0))}
        />
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

      {values.participantOrganizers && values.participantOrganizers.length > 0 && (
        <View style={styles.descCard}>
          <Text style={styles.descLabel}>Organizer Participants</Text>
          {values.participantOrganizers.map((o, i) => (
            <Text key={i} style={styles.organizerText}>- {o}</Text>
          ))}
        </View>
      )}

      {values.memberDetails && values.memberDetails.length > 0 && (
        <View style={styles.descCard}>
          <Text style={styles.descLabel}>Invited Members</Text>
          {values.memberDetails.map((member) => (
            <Text key={member.email} style={styles.organizerText}>- {member.name} ({member.email})</Text>
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
    <Ionicons name={icon} size={16} color="#2fa566" style={{ marginRight: 8 }} />
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
  </View>
);

export default PreviewEvent;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingBottom: 40 },
  sectionTitle: { color: "#4ade80", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 },
  coverImage: { width: "100%", height: 200, borderRadius: 12, marginBottom: 16 },
  coverPlaceholder: { width: "100%", height: 200, borderRadius: 12, backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  coverPlaceholderText: { color: "#6B7280", marginTop: 8, fontSize: 13 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  badge: { alignSelf: "flex-start", backgroundColor: "rgba(74,222,128,0.08)", borderRadius: 20, borderWidth: 1, borderColor: "#2a2a2a", paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16 },
  badgeText: { color: "#4ade80", fontSize: 12, fontWeight: "600" },
  infoCard: { backgroundColor: "#111", borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#1e1e1e" },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
  infoLabel: { color: "#9CA3AF", fontSize: 13, width: 120 },
  infoValue: { color: "#fff", fontSize: 13, flex: 1 },
  descCard: { backgroundColor: "#111", borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#1e1e1e" },
  descLabel: { color: "#9CA3AF", fontSize: 12, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  descText: { color: "#D1D5DB", fontSize: 14, lineHeight: 22 },
  organizerText: { color: "#D1D5DB", fontSize: 14, marginBottom: 4 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  backBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center", backgroundColor: "#1a1a1a" },
  backBtnText: { color: "#9CA3AF", fontWeight: "600", fontSize: 15 },
  publishBtn: { flex: 2, backgroundColor: "#166534", borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#4ade80" },
  publishBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
