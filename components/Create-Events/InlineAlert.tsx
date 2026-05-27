import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
    message: string | null;
    type?: "error" | "success";
};

const InlineAlert: React.FC<Props> = ({ message, type = "error" }) => {
    if (!message) return null;
    const isError = type === "error";
    return (
        <View style={[styles.container, isError ? styles.errorBg : styles.successBg]}>
            <Ionicons
                name={isError ? "alert-circle-outline" : "checkmark-circle-outline"}
                size={16}
                color={isError ? "#f56565" : "#38c177"}
                style={{ marginRight: 8 }}
            />
            <Text style={[styles.text, isError ? styles.errorText : styles.successText]}>{message}</Text>
        </View>
    );
};

export default InlineAlert;

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 12,
        borderWidth: 1,
    },
    errorBg: { backgroundColor: "#2a2a2a", borderColor: "#f56565" },
    successBg: { backgroundColor: "#2a2a2a", borderColor: "#38c177" },
    text: { fontSize: 13, flex: 1, lineHeight: 18 },
    errorText: { color: "#f56565" },
    successText: { color: "#38c177" },
});
