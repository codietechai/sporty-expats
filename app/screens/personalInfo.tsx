import React, { useEffect, useState } from "react";
import {
  Text,
  TextInput,
  View,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { getNames } from "country-list";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateUser } from "@/client/endpoints/users/updateUser";

export default function PersonalInfo() {
  const countries = getNames().map((country) => ({
    label: country,
    value: country,
  }));

  const [formData, setFormData] = useState({
    username: "",
    title: "",
    firstName: "",
    lastName: "",
    phone: "",
    gender: "",
    language: "",
    visibility: "",
    country: "",
    address: "",
    city: "",
    zipCode: "",
    bio: "",
  });

  const [userId, setUserId] = useState<string | null>(null);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const loadUserData = async () => {
    try {
      const userDetails = await AsyncStorage.getItem("userDetails");
      if (userDetails) {
        const parsed = JSON.parse(userDetails);
        setUserId(parsed.id);

        // Prefill values if available
        setFormData((prev) => ({
          ...prev,
          username: parsed.username || "",
          title: parsed.title || "",
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || "",
          phone: parsed.phone || "",
          gender: parsed.gender || "",
          language: parsed.language || "",
          visibility: parsed.visibility || "",
          country: parsed.country || "",
          address: parsed.address || "",
          city: parsed.city || "",
          zipCode: parsed.zipCode || "",
          bio: parsed.bio || "",
        }));
      }
    } catch (error) {
      console.error("Failed to load user details from AsyncStorage:", error);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const languageOptions = [
    { label: "English", value: "en" },
    { label: "French", value: "fr" },
    { label: "German", value: "de" },
  ];

  const titleOptions = [
    { label: "Mr.", value: "Mr." },
    { label: "Mrs.", value: "Mrs." },
    { label: "Miss", value: "Miss" },
    { label: "Dr.", value: "Dr." },
  ];
  const handlePress = async () => {
    try {
      if (!userId) {
        Alert.alert("Error", "User ID not available");
        return;
      }

      const data = await updateUser(userId, formData);

      if (data.status === 200) {
        Alert.alert("Success", "Details submitted successfully");
      } else {
        Alert.alert("Error", data?.data?.message || "Something went wrong");
      }
    } catch (error: any) {
      console.error("Update failed:", error);
      Alert.alert("Error", error?.message || "An unexpected error occurred");
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: "#171717", height: "100%", padding: 20 }}
    >
      {/* Username */}
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={formData.username}
        onChangeText={(text) => handleChange("username", text)}
        placeholder="Enter your username"
        placeholderTextColor="gray"
      />

      {/* Title */}
      <Text style={styles.label}>Title</Text>
      <View style={styles.pickerWrapper}>
        <RNPickerSelect
          onValueChange={(value) => handleChange("title", value)}
          items={titleOptions}
          placeholder={{ label: "Select your title", value: "" }}
          value={formData.title}
          style={pickerSelectStyles}
        />
      </View>
      {/* First Name */}
      <Text style={styles.label}>First Name</Text>
      <TextInput
        style={styles.input}
        value={formData.firstName}
        onChangeText={(text) => handleChange("firstName", text)}
        placeholder="Enter your first name"
        placeholderTextColor="gray"
      />

      {/* Last Name */}
      <Text style={styles.label}>Last Name</Text>
      <TextInput
        style={styles.input}
        value={formData.lastName}
        onChangeText={(text) => handleChange("lastName", text)}
        placeholder="Enter your last name"
        placeholderTextColor="gray"
      />

      {/* Phone */}
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={formData.phone}
        onChangeText={(text) => handleChange("phone", text)}
        placeholder="Enter your phone number"
        placeholderTextColor="gray"
        keyboardType="phone-pad"
      />

      {/* Gender */}
      <Text style={styles.label}>Gender</Text>
      <TextInput
        style={styles.input}
        value={formData.gender}
        onChangeText={(text) => handleChange("gender", text)}
        placeholder="Enter your gender"
        placeholderTextColor="gray"
      />

      {/* Language Dropdown */}
      <Text style={styles.label}>Language</Text>
      <View style={styles.pickerWrapper}>
        <RNPickerSelect
          onValueChange={(value) => handleChange("language", value)}
          items={languageOptions}
          placeholder={{ label: "Select your language", value: "" }}
          value={formData.language}
          style={pickerSelectStyles}
        />
      </View>

      {/* Visibility */}
      <Text style={styles.label}>Visibility</Text>
      <TextInput
        style={styles.input}
        value={formData.visibility}
        onChangeText={(text) => handleChange("visibility", text)}
        placeholder="Public or Private"
        placeholderTextColor="gray"
      />

      {/* Country Dropdown */}
      <Text style={styles.label}>Country</Text>
      <View style={styles.pickerWrapper}>
        <RNPickerSelect
          onValueChange={(value) => handleChange("country", value)}
          items={countries}
          placeholder={{ label: "Select your country", value: "" }}
          value={formData.country}
          style={{
            inputAndroid: {
              color: "white",
            },
            inputIOS: {
              color: "white",
            },
            placeholder: {
              color: "gray",
            },
          }}
        />
      </View>

      {/* Address */}
      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        value={formData.address}
        onChangeText={(text) => handleChange("address", text)}
        placeholder="Enter your address"
        placeholderTextColor="gray"
      />

      {/* City */}
      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        value={formData.city}
        onChangeText={(text) => handleChange("city", text)}
        placeholder="Enter your city"
        placeholderTextColor="gray"
      />

      {/* Zip Code */}
      <Text style={styles.label}>Zip Code</Text>
      <TextInput
        style={styles.input}
        value={formData.zipCode}
        onChangeText={(text) => handleChange("zipCode", text)}
        placeholder="Enter your zip code"
        placeholderTextColor="gray"
        keyboardType="numeric"
      />

      {/* Bio */}
      <Text style={styles.label}>Bio</Text>
      <TextInput
        multiline
        numberOfLines={4}
        placeholder="Write a short bio"
        placeholderTextColor="gray"
        value={formData.bio}
        onChangeText={(text) => handleChange("bio", text)}
        style={{ ...styles.input, textAlignVertical: "top", minHeight: 150 }}
      />

      {/* Update Button */}
      <Pressable onPress={handlePress} style={styles.button}>
        <Text style={styles.buttonText as any}>Update Details</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = {
  label: {
    color: "white",
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#616161",
    padding: 10,
    color: "white",
    borderRadius: 10,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#616161",
    borderRadius: 10,
  },
  button: {
    backgroundColor: "green",
    borderRadius: 5,
    paddingVertical: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  buttonText: {
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
  },
};

const pickerSelectStyles = {
  inputIOS: {
    color: "white",
  },
  inputAndroid: {
    color: "white",
  },
  placeholder: {
    color: "gray",
  },
};
