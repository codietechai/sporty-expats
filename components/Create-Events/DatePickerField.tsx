import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform, Modal, StyleSheet } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";

type Props = {
    label: string;
    value: Date;
    onChange: (date: Date) => void;
    mode?: "date" | "datetime";
    minimumDate?: Date;
};

export default function DatePickerField({ label, value, onChange, mode = "datetime", minimumDate }: Props) {
    const [show, setShow] = useState(false);
    // On Android we show date then time pickers sequentially
    const [androidStep, setAndroidStep] = useState<"date" | "time">("date");
    const [tempDate, setTempDate] = useState<Date>(value);

    const formatted = mode === "date"
        ? dayjs(value).format("MMM D, YYYY")
        : dayjs(value).format("MMM D, YYYY · HH:mm");

    const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
        if (!selected || event.type === "dismissed") {
            setShow(false);
            return;
        }

        if (Platform.OS === "android") {
            if (mode === "datetime" && androidStep === "date") {
                // Save date part, now show time picker
                setTempDate(selected);
                setAndroidStep("time");
            } else {
                // Merge date from tempDate with time from selected (android datetime flow)
                if (mode === "datetime" && androidStep === "time") {
                    const merged = new Date(tempDate);
                    merged.setHours(selected.getHours(), selected.getMinutes());
                    onChange(merged);
                } else {
                    onChange(selected);
                }
                setShow(false);
                setAndroidStep("date");
            }
        } else {
            // iOS: single picker handles both
            onChange(selected);
        }
    };

    const open = () => {
        setTempDate(value);
        setAndroidStep("date");
        setShow(true);
    };

    return (
        <View style={styles.wrap}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity style={styles.trigger} onPress={open} activeOpacity={0.7}>
                <Ionicons name="calendar-outline" size={16} color="#2ecc71" />
                <Text style={styles.triggerText}>{formatted}</Text>
                <Ionicons name="chevron-down" size={14} color="#4B5563" />
            </TouchableOpacity>

            {/* iOS: modal spinner */}
            {Platform.OS === "ios" && show && (
                <Modal transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalSheet}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{label}</Text>
                                <TouchableOpacity onPress={() => setShow(false)}>
                                    <Text style={styles.doneBtn}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={value}
                                mode={mode}
                                display="spinner"
                                onChange={handleChange}
                                minimumDate={minimumDate}
                                textColor="#fff"
                                themeVariant="dark"
                            />
                        </View>
                    </View>
                </Modal>
            )}

            {/* Android: inline native picker */}
            {Platform.OS === "android" && show && (
                <DateTimePicker
                    value={androidStep === "time" ? tempDate : value}
                    mode={mode === "datetime" ? androidStep : mode}
                    display="default"
                    onChange={handleChange}
                    minimumDate={minimumDate}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { marginBottom: 14 },
    label: {
        color: "#9CA3AF",
        fontSize: 13,
        fontWeight: "500",
        marginBottom: 6,
    },
    trigger: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 1,
        borderColor: "#2a2a2a",
        backgroundColor: "#111827",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 13,
    },
    triggerText: {
        flex: 1,
        color: "#fff",
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    modalSheet: {
        backgroundColor: "#111827",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 32,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#1f2937",
    },
    modalTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
    doneBtn: { color: "#2ecc71", fontSize: 15, fontWeight: "700" },
});
