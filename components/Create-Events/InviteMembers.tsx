import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useWatch, Control, useFormContext } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { EventFormValues } from "@/app/screens/createEvents";

type Props = {
  setActiveTab: (key: string) => void;
  activeTab: string;
  control: Control<EventFormValues>;
  onSubmit?: () => void;
};

const InviteMembers: React.FC<Props> = ({ setActiveTab, control }) => {
  const [input, setInput] = useState("");
  const { setValue } = useFormContext<EventFormValues>();
  const organizers: string[] = useWatch({ control, name: "organizers" }) ?? [];

  const addOrganizer = () => {
    const trimmed = input.trim();
    if (!trimmed || organizers.includes(trimmed)) { setInput(""); return; }
    setValue("organizers", [...organizers, trimmed]);
    setInput("");
  };

  const removeOrganizer = (email: string) => {
    setValue("organizers", organizers.filter((o) => o !== email));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Invite Members</Text>
      <Text style={styles.subtitle}>Add organizers by email or username</Text>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Email or username"
          placeholderTextColor="#4B5563"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          onSubmitEditing={addOrganizer}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={addOrganizer}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {organizers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={40} color="#374151" />
          <Text style={styles.emptyText}>No organizers added yet</Text>
        </View>
      ) : (
        <FlatList
          data={organizers}
          keyExtractor={(item) => item}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.chip}>
              <Ionicons name="person-circle-outline" size={20} color="#2ecc71" />
              <Text style={styles.chipText} numberOfLines={1}>{item}</Text>
              <TouchableOpacity onPress={() => removeOrganizer(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}
          style={styles.list}
        />
      )}

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab("ticket_information")}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.continueBtn} onPress={() => setActiveTab("preview_event")}>
          <Text style={styles.continueBtnText}>Preview →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InviteMembers;

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: "#6B7280", fontSize: 13, marginBottom: 20 },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#111827", padding: 12, color: "#fff", borderRadius: 10, fontSize: 14 },
  addBtn: { width: 48, height: 48, backgroundColor: "#166534", borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2ecc71" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 40 },
  emptyText: { color: "#374151", fontSize: 14 },
  list: { flex: 1 },
  chip: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#111827", borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#1f2937" },
  chipText: { flex: 1, color: "#D1D5DB", fontSize: 14 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: "auto", paddingTop: 24 },
  backBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center" },
  backBtnText: { color: "#9CA3AF", fontWeight: "600", fontSize: 15 },
  continueBtn: { flex: 2, backgroundColor: "#166534", borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#2ecc71" },
  continueBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
