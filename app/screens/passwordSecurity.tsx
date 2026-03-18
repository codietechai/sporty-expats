import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";

export default function PasswordSecurityScreen() {
  const { user } = useUser();

  const [verificationMethod, setVerificationMethod] = useState("Phone SMS");
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // State for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUpdate = async () => {
    if (!user) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await user.updatePassword({ newPassword, currentPassword });
      Alert.alert("Success", "Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setVerificationMethod("Phone SMS"); // Reset to default verification method
    } catch (error) {
      console.log("Password update error:", error);
      Alert.alert(
        "Update Failed",
        (error as any)?.[0]?.Error ||
          (error as any)?.message ||
          "Unknown error."
      );
    } finally {
      setLoading(false);
    }
  };

  const dropdownOptions = ["Phone SMS", "Email", "Authenticator App"];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Password And Security</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Preferred Verification</Text>
        <TouchableOpacity
          onPress={() => setDropdownVisible(true)}
          style={styles.dropdown}
        >
          <Text style={styles.dropdownText}>{verificationMethod}</Text>
        </TouchableOpacity>

        <Modal
          transparent={true}
          visible={dropdownVisible}
          animationType="fade"
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setDropdownVisible(false)}
            activeOpacity={1}
          >
            <View style={styles.dropdownMenu}>
              {dropdownOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setVerificationMethod(option);
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Current Password</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor="#888"
            style={[styles.input, { flex: 1 }]}
            secureTextEntry={!showCurrentPassword}
          />
          <TouchableOpacity
            onPress={() => setShowCurrentPassword((prev) => !prev)}
            style={{ marginLeft: 8 }}
          >
            <Ionicons
              name={showCurrentPassword ? "eye" : "eye-off"}
              size={22}
              color="#888"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>New Password</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Type new password"
            placeholderTextColor="#888"
            style={[styles.input, { flex: 1 }]}
            secureTextEntry={!showNewPassword}
          />
          <TouchableOpacity
            onPress={() => setShowNewPassword((prev) => !prev)}
            style={{ marginLeft: 8 }}
          >
            <Ionicons
              name={showNewPassword ? "eye" : "eye-off"}
              size={22}
              color="#888"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor="#888"
            style={[styles.input, { flex: 1 }]}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword((prev) => !prev)}
            style={{ marginLeft: 8 }}
          >
            <Ionicons
              name={showConfirmPassword ? "eye" : "eye-off"}
              size={22}
              color="#888"
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && { backgroundColor: "#888" }]}
        onPress={handleUpdate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Update Changes</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    color: "#ccc",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  dropdown: {
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 12,
  },
  dropdownText: {
    color: "#fff",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
  },
  dropdownMenu: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingVertical: 10,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#444",
  },
  dropdownItemText: {
    color: "#fff",
    fontSize: 16,
  },
  button: {
    marginTop: 30,
    backgroundColor: "#1db954",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
