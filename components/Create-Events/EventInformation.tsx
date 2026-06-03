import React, { useState } from "react";
import { Modal, Text, TextInput, View, TouchableOpacity, StyleSheet } from "react-native";
import { ScrollView } from "react-native";
import { Controller, Control, useWatch } from "react-hook-form";
import { EventFormValues } from "@/app/screens/createEvents";
import DatePickerField from "./DatePickerField";
import InlineAlert from "./InlineAlert";
import { categoriesList } from "./categories";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  setActiveTab: (key: string) => void;
  activeTab: string;
  control: Control<EventFormValues>;
  onSubmit?: () => void;
};

const Event_Information: React.FC<Props> = ({ setActiveTab, control }) => {
  const [error, setError] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const values = useWatch({ control, name: ["title", "category", "startDate", "endDate", "refundDeadline", "paymentDeadline", "description"] });
  const [title, category, startDate, endDate, refundDeadline, paymentDeadline, description] = values;

  const handleContinue = () => {
    const now = new Date();
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    const refund = refundDeadline ? new Date(refundDeadline) : null;
    const payment = paymentDeadline instanceof Date ? paymentDeadline : new Date(paymentDeadline);

    if (!title?.trim()) { setError("Event title is required."); return; }
    if (!category?.trim()) { setError("Event category is required."); return; }
    if (!startDate) { setError("Start date is required."); return; }
    if (!endDate) { setError("End date is required."); return; }
    if (!refundDeadline) { setError("Refund notice deadline is required."); return; }
    if (!paymentDeadline) { setError("Payment deadline is required."); return; }
    if (!description?.trim()) { setError("Event description is required."); return; }
    if (start < now) { setError("Start date cannot be in the past."); return; }
    if (start >= end) { setError("End date must be after the start date."); return; }
    if (refund && refund >= start) { setError("Refund deadline must be before the start date."); return; }
    if (payment >= start) { setError("Payment deadline must be before the start date."); return; }

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
              placeholderTextColor="#999"
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
            <TouchableOpacity style={styles.selectTrigger} onPress={() => setCategoryOpen(true)} activeOpacity={0.75}>
              <Text style={[styles.selectText, !value && styles.placeholder]}>
                {value || "Select a category"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#aaa" />
            </TouchableOpacity>
            <Modal transparent visible={categoryOpen} animationType="fade" onRequestClose={() => setCategoryOpen(false)}>
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCategoryOpen(false)}>
                <View style={styles.modalSheet}>
                  <Text style={styles.modalTitle}>Select a category</Text>
                  <ScrollView>
                    {categoriesList.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={[styles.optionRow, value === item && styles.optionRowActive]}
                        onPress={() => {
                          onChange(item);
                          setCategoryOpen(false);
                        }}
                      >
                        <Text style={[styles.optionText, value === item && styles.optionTextActive]}>{item}</Text>
                        {value === item && <Ionicons name="checkmark" size={18} color="#38c177" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        )}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="startDate"
            render={({ field: { value, onChange } }) => (
              <DatePickerField label="Start Date & Time" value={value} onChange={onChange} mode="datetime" minimumDate={new Date()} />
            )}
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="endDate"
            render={({ field: { value, onChange } }) => {
              // minimum is 1 minute after startDate so same-day earlier times are blocked
              const minEnd = startDate
                ? new Date(new Date(startDate).getTime() + 60 * 1000)
                : new Date();
              return (
                <DatePickerField
                  label="End Date & Time"
                  value={value}
                  onChange={onChange}
                  mode="datetime"
                  minimumDate={minEnd}
                />
              );
            }}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="paymentDeadline"
        render={({ field: { value, onChange } }) => (
          <DatePickerField
            label="Payment Deadline"
            value={value}
            onChange={onChange}
            mode="datetime"
            minimumDate={new Date()}
          />
        )}
      />

      <Controller
        control={control}
        name="refundDeadline"
        render={({ field: { value, onChange } }) => (
          <DatePickerField
            label="Refund Notice Deadline"
            value={value ? new Date(value) : new Date()}
            onChange={(d) => onChange(d.toISOString())}
            mode="datetime"
            minimumDate={new Date()}
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
              placeholderTextColor="#999"
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
  sectionTitle: { color: "#4ade80", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 },
  row: { flexDirection: "row" },
  fieldWrap: { marginBottom: 14 },
  label: { color: "#9CA3AF", fontSize: 12, fontWeight: "500", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    borderRadius: 10,
    fontSize: 14,
    minHeight: 42,
  },
  selectTrigger: {
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { color: "#fff", fontSize: 14, flex: 1 },
  placeholder: { color: "#4B5563" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    maxHeight: "70%",
    backgroundColor: "#111",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    padding: 16,
    paddingBottom: 32,
  },
  modalTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 12 },
  optionRow: {
    minHeight: 46,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  optionRowActive: { backgroundColor: "rgba(74,222,128,0.06)" },
  optionText: { color: "#D1D5DB", fontSize: 14 },
  optionTextActive: { color: "#4ade80", fontWeight: "700" },
  textarea: {
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    borderRadius: 10,
    fontSize: 14,
    minHeight: 120,
  },
  continueBtn: {
    backgroundColor: "#166534",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#4ade80",
  },
  continueBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
