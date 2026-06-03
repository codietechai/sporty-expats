import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, StyleSheet } from "react-native";
import { useWatch, Control, useFormContext } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { EventFormValues } from "@/app/screens/createEvents";
import { getUsers, SelectableUser } from "@/client/endpoints/users/getUsers";

type Props = {
  setActiveTab: (key: string) => void;
  activeTab: string;
  control: Control<EventFormValues>;
  onSubmit?: () => void;
};

const emptyMember = { id: "", name: "", email: "" };

const InviteMembers: React.FC<Props> = ({ setActiveTab, control }) => {
  const { setValue } = useFormContext<EventFormValues>();
  const organizers: string[] = useWatch({ control, name: "organizers" }) ?? [];
  const participantOrganizers: string[] = useWatch({ control, name: "participantOrganizers" }) ?? [];
  const memberDetails = useWatch({ control, name: "memberDetails" }) ?? [];
  const maxAttendees = Number(useWatch({ control, name: "maxAttendees" })) || 0;

  const [users, setUsers] = useState<SelectableUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [activeMemberIndex, setActiveMemberIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    setUsersLoading(true);
    setUsersError(null);
    getUsers()
      .then((items) => {
        if (mounted) setUsers(items);
      })
      .catch(() => {
        if (mounted) setUsersError("Failed to load users.");
      })
      .finally(() => {
        if (mounted) setUsersLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const effectiveMax = Math.max(maxAttendees - participantOrganizers.length, 0);
  const selectedEmails = new Set(memberDetails.map((member) => member.email).filter(Boolean));

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const available = users.filter((user) => !selectedEmails.has(user.email));
    if (!q) return available;
    return available.filter((user) =>
      [user.name, user.username, user.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [search, selectedEmails, users]);

  const setMemberCount = (nextCount: number) => {
    if (nextCount > effectiveMax) return;
    const normalized = Math.max(0, nextCount);
    const nextMembers =
      normalized > memberDetails.length
        ? [...memberDetails, ...Array(normalized - memberDetails.length).fill(emptyMember)]
        : memberDetails.slice(0, normalized);
    setValue("memberDetails", nextMembers, { shouldDirty: true, shouldValidate: true });
  };

  const selectMember = (user: SelectableUser) => {
    if (activeMemberIndex === null) return;
    const nextMembers = [...memberDetails];
    nextMembers[activeMemberIndex] = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    setValue("memberDetails", nextMembers, { shouldDirty: true, shouldValidate: true });
    setActiveMemberIndex(null);
    setSearch("");
  };

  const toggleOrganizerParticipant = (username: string) => {
    const next = participantOrganizers.includes(username)
      ? participantOrganizers.filter((organizer) => organizer !== username)
      : [...participantOrganizers, username];
    setValue("participantOrganizers", next, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Invite Members</Text>
      <Text style={styles.subtitle}>Mark organizers as participants and select members to invite</Text>

      {organizers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>Organizer Participants</Text>
          {organizers.map((organizer) => {
            const selected = participantOrganizers.includes(organizer);
            return (
              <TouchableOpacity
                key={organizer}
                style={styles.checkboxRow}
                onPress={() => toggleOrganizerParticipant(organizer)}
              >
                <Ionicons name={selected ? "checkbox" : "square-outline"} size={22} color={selected ? "#38c177" : "#aaa"} />
                <Text style={styles.checkboxText}>{organizer}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.memberCountContainer}>
        <Text style={styles.label}>How many invites?</Text>
        <View style={styles.memberCountControls}>
          <TouchableOpacity
            style={[styles.memberCountButton, memberDetails.length <= 0 && styles.memberCountButtonDisabled]}
            onPress={() => setMemberCount(memberDetails.length - 1)}
            disabled={memberDetails.length <= 0}
          >
            <Ionicons name="remove" size={16} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.memberCountText}>{memberDetails.length}</Text>
          <TouchableOpacity
            style={[styles.memberCountButton, memberDetails.length >= effectiveMax && styles.memberCountButtonDisabled]}
            onPress={() => setMemberCount(memberDetails.length + 1)}
            disabled={memberDetails.length >= effectiveMax}
          >
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.inviteBadge}>
          <Text style={styles.inviteBadgeText}>{effectiveMax}</Text>
          <Text style={styles.inviteBadgeLabel}>slots</Text>
        </View>
      </View>

      {memberDetails.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={40} color="#666" />
          <Text style={styles.emptyText}>No invited members yet</Text>
        </View>
      ) : (
        <FlatList
          data={memberDetails}
          keyExtractor={(_, index) => String(index)}
          scrollEnabled={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.memberRow} onPress={() => setActiveMemberIndex(index)}>
              <Ionicons name="person-circle-outline" size={22} color="#38c177" />
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{item.name || "Select member"}</Text>
                <Text style={styles.memberEmail}>{item.email || "Tap to choose from users"}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#aaa" />
            </TouchableOpacity>
          )}
        />
      )}

      <Modal transparent visible={activeMemberIndex !== null} animationType="fade" onRequestClose={() => setActiveMemberIndex(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActiveMemberIndex(null)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select member</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search members"
              placeholderTextColor="#999"
              style={styles.searchInput}
              autoCapitalize="none"
            />
            {usersLoading ? (
              <ActivityIndicator color="#38c177" style={{ marginVertical: 20 }} />
            ) : usersError ? (
              <Text style={styles.emptyText}>{usersError}</Text>
            ) : filteredUsers.length === 0 ? (
              <Text style={styles.emptyText}>No members found</Text>
            ) : (
              <ScrollView>
                {filteredUsers.map((user) => (
                  <TouchableOpacity key={user.id} style={styles.optionRow} onPress={() => selectMember(user)}>
                    <Ionicons name="person-circle-outline" size={22} color="#38c177" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionText}>{user.name}</Text>
                      <Text style={styles.optionSubText}>{user.email}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab("ticket_information")}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.continueBtn} onPress={() => setActiveTab("preview_event")}>
          <Text style={styles.continueBtnText}>Preview</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default InviteMembers;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingBottom: 40 },
  sectionTitle: { color: "#4ade80", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  subtitle: { color: "#6B7280", fontSize: 13, marginBottom: 20 },
  section: { marginBottom: 18 },
  label: { color: "#9CA3AF", fontSize: 12, fontWeight: "500", marginBottom: 6 },
  checkboxRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
    borderRadius: 10, padding: 12, marginBottom: 6,
  },
  checkboxText: { color: "#D1D5DB", fontSize: 14, flex: 1 },
  memberCountContainer: {
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
    borderRadius: 10, padding: 16, marginBottom: 18,
  },
  memberCountControls: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  memberCountButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#2a2a2a", borderWidth: 1, borderColor: "#3a3a3a",
    alignItems: "center", justifyContent: "center",
  },
  memberCountButtonDisabled: { opacity: 0.4 },
  memberCountText: { color: "#fff", fontSize: 18, fontWeight: "700", minWidth: 34, textAlign: "center" },
  inviteBadge: {
    position: "absolute", right: 16, top: 16,
    backgroundColor: "rgba(74,222,128,0.08)", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: "#2a2a2a",
  },
  inviteBadgeText: { color: "#4ade80", fontSize: 18, fontWeight: "700" },
  inviteBadgeLabel: { color: "#6B7280", fontSize: 12 },
  emptyState: { alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 34 },
  emptyText: { color: "#6B7280", fontSize: 14, textAlign: "center", paddingVertical: 14 },
  memberRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
    borderRadius: 10, padding: 12, marginBottom: 6,
  },
  memberName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  memberEmail: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end" },
  modalSheet: {
    maxHeight: "82%", backgroundColor: "#111",
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderColor: "#1e1e1e", padding: 16, paddingBottom: 32,
  },
  modalTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 12 },
  searchInput: { borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#1a1a1a", color: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  optionRow: { flexDirection: "row", gap: 10, alignItems: "center", borderRadius: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  optionText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  optionSubText: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  backBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center", backgroundColor: "#1a1a1a" },
  backBtnText: { color: "#9CA3AF", fontWeight: "600", fontSize: 15 },
  continueBtn: { flex: 2, backgroundColor: "#166534", borderRadius: 10, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#4ade80" },
  continueBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
