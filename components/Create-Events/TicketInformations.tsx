import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, StyleSheet } from "react-native";
import { ScrollView } from "react-native";
import { Controller, Control, useWatch } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { EventFormValues } from "@/app/screens/createEvents";
import DatePickerField from "./DatePickerField";
import InlineAlert from "./InlineAlert";

type Props = {
  setActiveTab: (key: string) => void;
  activeTab: string;
  control: Control<EventFormValues>;
  onSubmit?: () => void;
};

const TicketInformation: React.FC<Props> = ({ setActiveTab, control }) => {
  const [error, setError] = useState<string | null>(null);
  const values = useWatch({
    control,
    name: ["minAttendees", "maxAttendees", "availableTickets", "location.name", "isPaidEvent", "ticketPrice", "startDate", "paymentDeadline"],
  });
  const [minAttendees, maxAttendees, availableTickets, locationName, isPaidEvent, ticketPrice, startDate, paymentDeadline] = values;

  const handleContinue = () => {
    const min = Number(minAttendees) || 0;
    const max = Number(maxAttendees) || 0;
    const tickets = Number(availableTickets) || 0;
    const price = Number(ticketPrice) || 0;
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const deadline = paymentDeadline instanceof Date ? paymentDeadline : new Date(paymentDeadline);

    if (!locationName?.trim()) { setError("Event location is required."); return; }
    if (min < 1) { setError("Minimum attendees must be at least 1."); return; }
    if (max < min) { setError("Maximum attendees must be ≥ minimum attendees."); return; }
    if (tickets < 1) { setError("Available tickets must be at least 1."); return; }
    if (tickets > max) { setError("Available tickets cannot exceed maximum attendees."); return; }
    if (isPaidEvent && price <= 0) { setError("Ticket price must be greater than 0 for paid events."); return; }
    if (deadline > start) { setError("Payment deadline must be before the start date."); return; }

    setError(null);
    setActiveTab("invite_members");
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Ticket & Additional Info</Text>

      {/* Paid / Free toggle */}
      <Controller
        control={control}
        name="isPaidEvent"
        render={({ field: { value, onChange } }) => (
          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggleBtn, !value && styles.toggleBtnActive]} onPress={() => onChange(false)}>
              <Ionicons name="gift-outline" size={16} color={!value ? "#fff" : "#6B7280"} />
              <Text style={[styles.toggleText, !value && styles.toggleTextActive]}>Free</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, value && styles.toggleBtnActive]} onPress={() => onChange(true)}>
              <Ionicons name="card-outline" size={16} color={value ? "#fff" : "#6B7280"} />
              <Text style={[styles.toggleText, value && styles.toggleTextActive]}>Paid</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Controller
        control={control}
        name="isPaidEvent"
        render={({ field: { value } }) =>
          value ? (
            <Controller
              control={control}
              name="ticketPrice"
              render={({ field: { value: price, onChange } }) => (
                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Ticket Price (€)</Text>
                  <TextInput value={price} onChangeText={onChange} placeholder="e.g. 15.00" placeholderTextColor="#4B5563" keyboardType="numeric" style={styles.input} />
                </View>
              )}
            />
          ) : <></>
        }
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="minAttendees"
            render={({ field: { value, onChange } }) => (
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Min Attendees</Text>
                <TextInput value={value} onChangeText={onChange} placeholder="e.g. 5" placeholderTextColor="#4B5563" keyboardType="numeric" style={styles.input} />
              </View>
            )}
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="maxAttendees"
            render={({ field: { value, onChange } }) => (
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Max Attendees</Text>
                <TextInput value={value} onChangeText={onChange} placeholder="e.g. 50" placeholderTextColor="#4B5563" keyboardType="numeric" style={styles.input} />
              </View>
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="availableTickets"
        render={({ field: { value, onChange } }) => (
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Available Tickets</Text>
            <TextInput value={value} onChangeText={onChange} placeholder="e.g. 100" placeholderTextColor="#4B5563" keyboardType="numeric" style={styles.input} />
          </View>
        )}
      />

      <Controller
        control={control}
        name="location.name"
        render={({ field: { value, onChange } }) => (
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Event Location</Text>
            <TextInput value={value} onChangeText={onChange} placeholder="City, Venue name" placeholderTextColor="#4B5563" style={styles.input} />
          </View>
        )}
      />

      <Controller
        control={control}
        name="visibility"
        render={({ field: { value, onChange } }) => (
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Visibility</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity style={[styles.toggleBtn, value === "Public" && styles.toggleBtnActive]} onPress={() => onChange("Public")}>
                <Ionicons name="globe-outline" size={16} color={value === "Public" ? "#fff" : "#6B7280"} />
                <Text style={[styles.toggleText, value === "Public" && styles.toggleTextActive]}>Public</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, value === "Private" && styles.toggleBtnActive]} onPress={() => onChange("Private")}>
                <Ionicons name="lock-closed-outline" size={16} color={value === "Private" ? "#fff" : "#6B7280"} />
                <Text style={[styles.toggleText, value === "Private" && styles.toggleTextActive]}>Private</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Controller
        control={control}
        name="paymentDeadline"
        render={({ field: { value, onChange } }) => (
          <DatePickerField label="Payment Deadline" value={value} onChange={onChange} mode="datetime" />
        )}
      />

      <InlineAlert message={error} />

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab("image_upload")}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default TicketInformation;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingBottom: 40 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 20 },
  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  toggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#111827" },
  toggleBtnActive: { backgroundColor: "#166534", borderColor: "#2ecc71" },
  toggleText: { color: "#6B7280", fontWeight: "600", fontSize: 14 },
  toggleTextActive: { color: "#fff" },
  row: { flexDirection: "row" },
  fieldWrap: { marginBottom: 14 },
  label: { color: "#9CA3AF", fontSize: 13, fontWeight: "500", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#111827", padding: 12, color: "#fff", borderRadius: 10, fontSize: 14 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  backBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center" },
  backBtnText: { color: "#9CA3AF", fontWeight: "600", fontSize: 15 },
  continueBtn: { flex: 2, backgroundColor: "#166534", borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#2ecc71" },
  continueBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
