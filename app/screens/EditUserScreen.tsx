import React from "react";
import {
    View,
    Text,
    Image,
    Pressable,
    StyleSheet,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import Input from "@/components/common/input";
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";

export default function EditUserScreen() {
    const navigation = useNavigation();
    const drawer = navigation.getParent<DrawerNavigationProp<any>>();

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <Pressable style={styles.menuBtn} onPress={() => drawer?.openDrawer?.()}>
                        <Ionicons name="menu" size={22} color="#1a1a1a" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Edit User Details</Text>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView contentContainerStyle={styles.container}>
                    <View style={styles.card}>
                        <View style={styles.avatarSection}>
                            <Image
                                source={{ uri: "https://i.pravatar.cc/150?img=5" }}
                                style={styles.avatar}
                            />
                        </View>
                        <Text style={styles.sectionTitle}>Personal Details</Text>
                        <View style={styles.row}>
                            <Input label="Name" placeholder="Lucy Jane" />
                            <Input label="Email" placeholder="lucyjane@mail.com" />
                        </View>

                        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                            Other Details
                        </Text>

                        <View style={styles.row}>
                            <Input label="Designation" placeholder="Client" />
                            <Input label="Team" placeholder="Accounting" />
                            <Input label="Role" placeholder="User" />
                        </View>

                        <View style={styles.buttonContainer}>
                            <Pressable style={styles.saveButton}>
                                <Text style={styles.saveText}>Save Changes</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}



const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    header: {
        height: 56,
        justifyContent: "space-between",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        backgroundColor: "#FFFFFF",
    },
    menuBtn: {
        width: 36, height: 36,
        alignItems: "center", justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1a1a1a",
    },
    container: {
        padding: 20,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
    },
    avatarSection: {
        alignItems: "flex-start",
        marginBottom: 24,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 12,
    },
    row: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
    },
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
    buttonContainer: {
        alignItems: "flex-end",
        marginTop: 16,
    },
    saveButton: {
        backgroundColor: "#E5E7EB",
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 6,
    },
    saveText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#1a1a1a",
    },
});
