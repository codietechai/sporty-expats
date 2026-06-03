import { StyleSheet, Text, TextInput, View } from "react-native";
import React from 'react'

export default function Input({
    label,
    placeholder,
}: {
    label: string;
    placeholder: string;
}) {
    return (
        <View style={styles.inputWrapper}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                style={styles.input}
            />
        </View>
    );
}

const styles = StyleSheet.create({

    inputWrapper: {
        flex: 1,
        minWidth: "45%",
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 6,
    },
    input: {
        height: 42,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        backgroundColor: "#F9FAFB",
        color: "#1a1a1a",
    },

});