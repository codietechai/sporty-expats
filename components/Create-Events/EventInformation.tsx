import React, { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, StyleSheet } from "react-native";
import { ScrollView } from "react-native";
import { Controller, Control, useWatch } from "react-hook-form";
import { EventFormValues } from "@/app/screens/createEvents";
import DatePickerField from "./DatePickerField";
import InlineAlert from "./InlineAlert";

type Props = {
  setActiveTab: (key: string) => void;
  activeTab: string;
  control: Control<EventFormValues>;
  onSubmit?: () => void;
};

const Event_Information: React.FC<Props> = ({ setActiveTab, control }) => {
  const [error, setError] = useState<string | null>(null);
  const values = useWatch({ control, name: ["title", "category", "startDate", "endDate", "description"] });
  const [title, category, startDate, endDate, description] = values;

  const handleContinue = () => {
    const now = new Date();
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);

    if (!title?.trim()) { setError("Event title is required."); return; }
    if (!category?.trim()) { setError("Event category is required."); return; }
    if (!description?.trim()) { setError("Event description is required."); return; }
    if (start < now) { setError("Start date cannot be in the past."); return; }
    if (end <= start) { setError("End date must be after the start date."); return; }

    setError(null);
    setActiveTab("image_upload");
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Event Information</Text>

      <Controller
        control={control}
        name="title"
        render={({ field: { value, onChange } }) => (
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Event Title</Text>
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="e.g. Sunday Football Match"
              placeholderTextColor="#4B5563"
              style={styles.input}
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="category"
        render={({ field: { value, onChange } }) => (
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Event Category</Text>
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="e.g. Football, Yoga, Running"
              placeholderTextColor="#4B5563"
              style={styles.input}
            />
          </View>
        )}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="startDate"
            render={({ field: { value, onChange } }) => (
              <DatePickerField label="Start Date & Time" value={value} onChange={onChange} mode="datetime" />
            )}
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="endDate"
            render={({ field: { value, onChange } }) => (
              <DatePickerField label="End Date & Time" value={value} onChange={onChange} mode="datetime" />
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="refundDeadline"
        render={({ field: { value, onChange } }) => (
          <DatePickerField
            label="Refund Notice Deadline"
            value={value ? new Date(value) : new Date()}
            onChange={(d) => onChange(d.toISOString())}
            mode="datetime"
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange } }) => (
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Event Description</Text>
            <TextInput
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={5}
              placeholder="Describe your event..."
              placeholderTextColor="#4B5563"
              style={styles.textarea}
              textAlignVertical="top"
            />
          </View>
        )}
      />

      <InlineAlert message={error} />

      <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
        <Text style={styles.continueBtnText}>Continue →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Event_Information;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingBottom: 40 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 20 },
  row: { flexDirection: "row" },
  fieldWrap: { marginBottom: 14 },
  label: { color: "#9CA3AF", fontSize: 13, fontWeight: "500", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#111827",
    padding: 12,
    color: "#fff",
    borderRadius: 10,
    fontSize: 14,
  },
  textarea: {
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#111827",
    padding: 12,
    color: "#fff",
    borderRadius: 10,
    fontSize: 14,
    minHeight: 120,
  },
  continueBtn: {
    backgroundColor: "#166534",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#2ecc71",
  },
  continueBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
