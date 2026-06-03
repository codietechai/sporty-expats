import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Text, TextInput, View, TouchableOpacity, StyleSheet } from "react-native";
import { ScrollView } from "react-native";
import { Controller, Control, useFormContext, useWatch } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { EventFormValues } from "@/app/screens/createEvents";
import InlineAlert from "./InlineAlert";
import { getUsers, SelectableUser } from "@/client/endpoints/users/getUsers";
import { LocationSuggestion, searchLocations } from "@/client/endpoints/location/searchLocations";

type Props = {
  setActiveTab: (key: string) => void;
  activeTab: string;
  control: Control<EventFormValues>;
  onSubmit?: () => void;
};

const TicketInformation: React.FC<Props> = ({ setActiveTab, control }) => {
  const [error, setError] = useState<string | null>(null);
  const [organizerOpen, setOrganizerOpen] = useState(false);
  const [organizerSearch, setOrganizerSearch] = useState("");
  const [users, setUsers] = useState<SelectableUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationFocused, setLocationFocused] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const { setValue } = useFormContext<EventFormValues>();
  const values = useWatch({
    control,
    name: ["minAttendees", "maxAttendees", "availableTickets", "location.name", "location.latitude", "location.longitude", "isPaidEvent", "ticketPrice", "startDate", "paymentDeadline", "organizers", "ticketDescription", "participantOrganizers"],
  });
  const [minAttendees, maxAttendees, availableTickets, locationName, locationLatitude, locationLongitude, isPaidEvent, ticketPrice, startDate, paymentDeadline, organizers = [], ticketDescription, participantOrganizers = []] = values;

  useEffect(() => {
    let mounted = true;
    setUsersLoading(true);
    setUsersError(null);
    getUsers()
      .then((items) => {
        if (mounted) setUsers(items);
      })
      .catch(() => {
        if (mounted) setUsersError("Failed to load organizers.");
      })
      .finally(() => {
        if (mounted) setUsersLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setLocationQuery(locationName ?? "");
  }, [locationName]);

  useEffect(() => {
    const query = locationQuery.trim();
    if (!locationFocused || query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    let mounted = true;
    const timer = setTimeout(() => {
      setLocationLoading(true);
      searchLocations(query)
        .then((items) => {
          if (mounted) setLocationSuggestions(items);
        })
        .catch(() => {
          if (mounted) setLocationSuggestions([]);
        })
        .finally(() => {
          if (mounted) setLocationLoading(false);
        });
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [locationFocused, locationQuery]);

  const filteredUsers = useMemo(() => {
    const q = organizerSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      [user.name, user.username, user.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [organizerSearch, users]);

  const toggleOrganizer = (username: string) => {
    if (!username) return;
    if (organizers.includes(username)) {
      removeOrganizer(username);
    } else {
      setValue("organizers", [...organizers, username], { shouldDirty: true, shouldValidate: true });
    }
  };

  const removeOrganizer = (username: string) => {
    setValue("organizers", organizers.filter((organizer) => organizer !== username), { shouldDirty: true, shouldValidate: true });
    setValue("participantOrganizers", participantOrganizers.filter((organizer) => organizer !== username), { shouldDirty: true, shouldValidate: true });
  };

  const handleContinue = () => {
    const min = Number(minAttendees) || 0;
    const max = Number(maxAttendees) || 0;
    const tickets = Number(availableTickets) || 0;
    const price = Number(ticketPrice) || 0;
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const deadline = paymentDeadline instanceof Date ? paymentDeadline : new Date(paymentDeadline);

    if (!locationName?.trim()) { setError("Event location is required."); return; }
    if (!locationLatitude || !locationLongitude) { setError("Please select a location from suggestions."); return; }
    if (!ticketDescription?.trim()) { setError("Ticket description is required."); return; }
    if (!organizers.length) { setError("Please add at least one organizer."); return; }
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
              <Ionicons name="gift-outline" size={16} color={!value ? "#fff" : "#aaa"} />
              <Text style={[styles.toggleText, !value && styles.toggleTextActive]}>Free</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, value && styles.toggleBtnActive]} onPress={() => onChange(true)}>
              <Ionicons name="card-outline" size={16} color={value ? "#fff" : "#aaa"} />
              <Text style={[styles.toggleText, value && styles.toggleTextActive]}>Paid</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Controller
        control={control}
        name="ticketDescription"
        render={({ field: { value, onChange } }) => (
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Ticket Description</Text>
            <TextInput
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={4}
              placeholder="Describe the ticket or participation details"
              placeholderTextColor="#999"
              style={styles.textarea}
              textAlignVertical="top"
            />
          </View>
        )}
      />

      <View style={styles.fieldWrap}>
        <Text style={styles.label}>Organizers</Text>
        <TouchableOpacity style={styles.selectTrigger} onPress={() => setOrganizerOpen(true)} activeOpacity={0.75}>
          <Text style={[styles.selectText, organizers.length === 0 && styles.placeholder]} numberOfLines={1}>
            {organizers.length ? `${organizers.length} organizer${organizers.length === 1 ? "" : "s"} selected` : "Select organizers"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#aaa" />
        </TouchableOpacity>
        <View style={styles.chipWrap}>
          {organizers.map((organizer) => (
            <View key={organizer} style={styles.chip}>
              <Ionicons name="person-circle-outline" size={20} color="#38c177" />
              <Text style={styles.chipText} numberOfLines={1}>{organizer}</Text>
              <TouchableOpacity onPress={() => removeOrganizer(organizer)} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#aaa" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <Modal transparent visible={organizerOpen} animationType="fade" onRequestClose={() => setOrganizerOpen(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOrganizerOpen(false)}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Select organizers</Text>
              <TextInput
                value={organizerSearch}
                onChangeText={setOrganizerSearch}
                placeholder="Search organizers"
                placeholderTextColor="#999"
                style={styles.searchInput}
                autoCapitalize="none"
              />
              {usersLoading ? (
                <ActivityIndicator color="#38c177" style={{ marginVertical: 20 }} />
              ) : usersError ? (
                <Text style={styles.emptyText}>{usersError}</Text>
              ) : filteredUsers.length === 0 ? (
                <Text style={styles.emptyText}>No organizers found</Text>
              ) : (
                <ScrollView>
                  {filteredUsers.map((user) => {
                    const selected = organizers.includes(user.username);
                    return (
                      <TouchableOpacity
                        key={user.id}
                        style={[styles.optionRow, selected && styles.optionRowActive]}
                        onPress={() => toggleOrganizer(user.username)}
                      >
                        <Ionicons name={selected ? "checkbox" : "square-outline"} size={22} color={selected ? "#38c177" : "#aaa"} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.optionText}>{user.username}</Text>
                          <Text style={styles.optionSubText}>{user.name} ({user.email})</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
              <TouchableOpacity style={styles.doneBtn} onPress={() => setOrganizerOpen(false)}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      <Controller
        control={control}
        name="eventURL"
        render={({ field: { value, onChange } }) => (
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Event URL</Text>
            <TextInput value={value} onChangeText={onChange} placeholder="Optional event URL" placeholderTextColor="#999" autoCapitalize="none" style={styles.input} />
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
                  <TextInput value={price} onChangeText={onChange} placeholder="e.g. 15.00" placeholderTextColor="#999" keyboardType="numeric" style={styles.input} />
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
                <TextInput value={value} onChangeText={onChange} placeholder="e.g. 5" placeholderTextColor="#999" keyboardType="numeric" style={styles.input} />
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
                <TextInput value={value} onChangeText={onChange} placeholder="e.g. 50" placeholderTextColor="#999" keyboardType="numeric" style={styles.input} />
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
            <TextInput value={value} onChangeText={onChange} placeholder="e.g. 100" placeholderTextColor="#999" keyboardType="numeric" style={styles.input} />
          </View>
        )}
      />

      <View style={styles.fieldWrap}>
        <Text style={styles.label}>Event Location</Text>
        <View style={styles.locationWrap}>
          <TextInput
            value={locationQuery}
            onChangeText={(text) => {
              setLocationQuery(text);
              setValue("location.name", text, { shouldDirty: true, shouldValidate: true });
              setValue("location.latitude", "", { shouldDirty: true, shouldValidate: true });
              setValue("location.longitude", "", { shouldDirty: true, shouldValidate: true });
            }}
            onFocus={() => setLocationFocused(true)}
            placeholder="Search for a location"
            placeholderTextColor="#999"
            style={styles.input}
          />
          {locationFocused && locationQuery.trim().length >= 3 && (
            <View style={styles.suggestionsBox}>
              {locationLoading ? (
                <ActivityIndicator color="#38c177" style={{ marginVertical: 12 }} />
              ) : locationSuggestions.length === 0 ? (
                <Text style={styles.emptyText}>No locations found</Text>
              ) : (
                locationSuggestions.slice(0, 6).map((item) => (
                  <TouchableOpacity
                    key={String(item.place_id)}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setValue("location.name", item.display_name, { shouldDirty: true, shouldValidate: true });
                      setValue("location.latitude", item.lat, { shouldDirty: true, shouldValidate: true });
                      setValue("location.longitude", item.lon, { shouldDirty: true, shouldValidate: true });
                      setLocationQuery(item.display_name);
                      setLocationFocused(false);
                      setLocationSuggestions([]);
                    }}
                  >
                    <Ionicons name="location-outline" size={16} color="#38c177" />
                    <Text style={styles.suggestionText}>{item.display_name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>
      </View>

      <Controller
        control={control}
        name="visibility"
        render={({ field: { value, onChange } }) => (
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Visibility</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity style={[styles.toggleBtn, value === "Public" && styles.toggleBtnActive]} onPress={() => onChange("Public")}>
                <Ionicons name="globe-outline" size={16} color={value === "Public" ? "#fff" : "#aaa"} />
                <Text style={[styles.toggleText, value === "Public" && styles.toggleTextActive]}>Public</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, value === "Private" && styles.toggleBtnActive]} onPress={() => onChange("Private")}>
                <Ionicons name="lock-closed-outline" size={16} color={value === "Private" ? "#fff" : "#aaa"} />
                <Text style={[styles.toggleText, value === "Private" && styles.toggleTextActive]}>Private</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  sectionTitle: { color: "#4ade80", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 },
  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  toggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#1a1a1a" },
  toggleBtnActive: { backgroundColor: "#166534", borderColor: "#4ade80" },
  toggleText: { color: "#6B7280", fontWeight: "600", fontSize: 14 },
  toggleTextActive: { color: "#fff" },
  row: { flexDirection: "row" },
  fieldWrap: { marginBottom: 14 },
  label: { color: "#9CA3AF", fontSize: 12, fontWeight: "500", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#1a1a1a", paddingHorizontal: 12, paddingVertical: 10, color: "#fff", borderRadius: 10, fontSize: 14, minHeight: 42 },
  inputFlex: { flex: 1, borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#1a1a1a", paddingHorizontal: 12, paddingVertical: 10, color: "#fff", borderRadius: 10, fontSize: 14, minHeight: 42 },
  selectTrigger: {
    borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#1a1a1a",
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
    minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  selectText: { color: "#fff", fontSize: 14, flex: 1 },
  placeholder: { color: "#4B5563" },
  chipWrap: { marginTop: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1a1a1a", borderRadius: 10, borderWidth: 1, borderColor: "#2a2a2a", paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6 },
  chipText: { flex: 1, color: "#D1D5DB", fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end" },
  modalSheet: {
    maxHeight: "82%", backgroundColor: "#111",
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderColor: "#1e1e1e", padding: 16, paddingBottom: 32,
  },
  modalTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 12 },
  searchInput: { borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#1a1a1a", color: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  locationWrap: { position: "relative", zIndex: 10 },
  suggestionsBox: {
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 10, marginTop: 6, overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#2a2a2a",
  },
  suggestionText: { color: "#D1D5DB", fontSize: 13, lineHeight: 18, flex: 1 },
  optionRow: { flexDirection: "row", gap: 10, alignItems: "center", borderRadius: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  optionRowActive: { backgroundColor: "rgba(74,222,128,0.06)" },
  optionText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  optionSubText: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  emptyText: { color: "#6B7280", textAlign: "center", paddingVertical: 18 },
  doneBtn: { marginTop: 12, backgroundColor: "#166534", borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: "#4ade80" },
  doneBtnText: { color: "#fff", fontWeight: "700" },
  textarea: { borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#1a1a1a", paddingHorizontal: 12, paddingVertical: 10, color: "#fff", borderRadius: 10, fontSize: 14, minHeight: 100 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  backBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center", backgroundColor: "#1a1a1a" },
  backBtnText: { color: "#9CA3AF", fontWeight: "600", fontSize: 15 },
  continueBtn: { flex: 2, backgroundColor: "#166534", borderRadius: 10, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#4ade80" },
  continueBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
