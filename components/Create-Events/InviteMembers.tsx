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
  sectionTitle: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: "#aaa", fontSize: 13, marginBottom: 20 },
  section: { marginBottom: 18 },
  label: { color: "#e0e0e0", fontSize: 14, fontWeight: "500", marginBottom: 8 },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#4a4a4a",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  checkboxText: { color: "#ccc", fontSize: 14, flex: 1 },
  memberCountContainer: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#4a4a4a",
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
  },
  memberCountControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  memberCountButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4a4a4a",
    alignItems: "center",
    justifyContent: "center",
  },
  memberCountButtonDisabled: { opacity: 0.45 },
  memberCountText: { color: "#fff", fontSize: 18, fontWeight: "700", minWidth: 34, textAlign: "center" },
  inviteBadge: {
    position: "absolute",
    right: 16,
    top: 16,
    backgroundColor: "#1a3c28",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inviteBadgeText: { color: "#38c177", fontSize: 18, fontWeight: "700" },
  inviteBadgeLabel: { color: "#aaa", fontSize: 12 },
  emptyState: { alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 34 },
  emptyText: { color: "#aaa", fontSize: 14, textAlign: "center", paddingVertical: 14 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#4a4a4a",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  memberName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  memberEmail: { color: "#aaa", fontSize: 12, marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  modalSheet: {
    maxHeight: "82%",
    backgroundColor: "#1f1f1f",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#4a4a4a",
    padding: 16,
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12 },
  searchInput: { borderWidth: 1, borderColor: "#4a4a4a", backgroundColor: "#2a2a2a", color: "#fff", borderRadius: 10, padding: 12, marginBottom: 12 },
  optionRow: { flexDirection: "row", gap: 10, alignItems: "center", borderRadius: 10, padding: 12 },
  optionText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  optionSubText: { color: "#aaa", fontSize: 12, marginTop: 2 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  backBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: "#454746", alignItems: "center", backgroundColor: "#454746" },
  backBtnText: { color: "#ccc", fontWeight: "600", fontSize: 15 },
  continueBtn: { flex: 2, backgroundColor: "#38c177", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  continueBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
