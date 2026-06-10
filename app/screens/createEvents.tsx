import React, { useState } from "react";
import { View, Text, TouchableOpacity, StatusBar, StyleSheet, Modal } from "react-native";
import { Stack } from "expo-router";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useUserDb } from "@/app/hooks/useUserDb";
import { useForm, FormProvider } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import CreteEventTabsComponent from "@/components/Create-Events/CreateEventsTabs";
import Event_Information from "@/components/Create-Events/EventInformation";
import Image_Upload from "@/components/Create-Events/ImageUpload";
import TicketInformation from "@/components/Create-Events/TicketInformations";
import InviteMembers from "@/components/Create-Events/InviteMembers";
import PreviewEvent from "@/components/Create-Events/PreviewEvent";
import { createEvent } from "@/client/endpoints/events/createEvent";
import type { Event } from "@/client/endpoints/events/types";
import { getErrorMessage } from "@/helpers/getErrorMessage";
import { showToast } from "@/components/common/Toast";

export type EventFormValues = {
  title: string;
  description: string;
  coverImage: { filename: string; fileUrl: string };
  startDate: Date;
  endDate: Date;
  location: { name: string; latitude: string; longitude: string };
  minAttendees: string;
  maxAttendees: string;
  category: string;
  ticketPrice: string;
  visibility: "Public" | "Private";
  availableTickets: string;
  paymentDeadline: Date;
  refundDeadline: string;
  isPaidEvent: boolean;
  organizers: string[];
  participantOrganizers: string[];
  memberDetails: { id: string; name: string; email: string }[];
  ticketDescription: string;
  eventURL: string;
  creatorId: string;
};

const getDefaultEventValues = (): EventFormValues => ({
  title: "",
  description: "",
  coverImage: { filename: "", fileUrl: "" },
  startDate: new Date(),
  endDate: new Date(),
  location: { name: "", latitude: "", longitude: "" },
  minAttendees: "",
  maxAttendees: "",
  category: "",
  ticketPrice: "",
  visibility: "Public",
  availableTickets: "",
  paymentDeadline: new Date(),
  refundDeadline: "",
  isPaidEvent: false,
  organizers: [],
  participantOrganizers: [],
  memberDetails: [],
  ticketDescription: "",
  eventURL: "",
  creatorId: "",
});

const CreateEvents = () => {
  const navigation = useNavigation();
  const { userDb } = useUserDb();
  const currentUser = userDb?.data?.data ?? userDb?.data ?? userDb ?? null;
  const userId: string = currentUser?.id ?? "";
  const role = currentUser?.role;
  const verified = role === "Admin" || role === "Host";
  const [proceedToCreateEvent, setProceedToCreateEvent] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const [publishedEvent, setPublishedEvent] = useState<Event | null>(null);

  const formMethods = useForm<EventFormValues>({
    defaultValues: getDefaultEventValues(),
  });
  const { control, handleSubmit, reset } = formMethods;

  const toISO = (d: Date | string | undefined): string => {
    if (!d) return new Date().toISOString();
    return d instanceof Date ? d.toISOString() : d;
  };

  const onSubmit = handleSubmit(async (data) => {
    const now = new Date();
    const startDate =
      data.startDate instanceof Date
        ? data.startDate
        : new Date(data.startDate);
    const endDate =
      data.endDate instanceof Date ? data.endDate : new Date(data.endDate);
    const paymentDeadline =
      data.paymentDeadline instanceof Date
        ? data.paymentDeadline
        : new Date(data.paymentDeadline);
    const refundDeadline = data.refundDeadline
      ? new Date(data.refundDeadline)
      : null;
    const minAttendees = Number(data.minAttendees) || 0;
    const maxAttendees = Number(data.maxAttendees) || 0;
    const availableTickets = Number(data.availableTickets) || 0;
    const ticketPrice = Number(data.ticketPrice) || 0;

    if (!data.title.trim()) { showToast("Event title is required.", "warning"); return; }
    if (!data.category.trim()) { showToast("Event category is required.", "warning"); return; }
    if (!data.location.name.trim()) { showToast("Event location is required.", "warning"); return; }
    if (!data.coverImage.fileUrl) { showToast("Cover image is required.", "warning"); return; }
    if (!data.description.trim()) { showToast("Event description is required.", "warning"); return; }
    if (!data.ticketDescription.trim()) { showToast("Ticket description is required.", "warning"); return; }
    if (!data.organizers.length) { showToast("Please add at least one organizer.", "warning"); return; }
    if (startDate < now) { showToast("Start date cannot be in the past.", "warning"); return; }
    if (endDate <= startDate) { showToast("End date must be after the start date.", "warning"); return; }
    if (paymentDeadline >= startDate) { showToast("Payment deadline must be before the start date.", "warning"); return; }
    if (refundDeadline && refundDeadline >= startDate) { showToast("Refund deadline must be before the start date.", "warning"); return; }
    if (minAttendees < 1) { showToast("Minimum attendees must be at least 1.", "warning"); return; }
    if (maxAttendees < minAttendees) { showToast("Maximum attendees must be ≥ minimum attendees.", "warning"); return; }
    if (availableTickets < 1) { showToast("Available tickets must be at least 1.", "warning"); return; }
    if (availableTickets > maxAttendees) { showToast("Available tickets cannot exceed maximum attendees.", "warning"); return; }
    if (!verified && data.isPaidEvent) { showToast("Only hosts and admins can create paid events.", "warning"); return; }
    if (data.isPaidEvent && ticketPrice <= 0) { showToast("Ticket price must be > 0 for paid events.", "warning"); return; }
    const adjustedAvailableTickets = availableTickets - data.participantOrganizers.length;
    if (adjustedAvailableTickets < 1) { showToast("Available tickets must stay at least 1 after organizer participants.", "warning"); return; }

    try {
      const createdEvent = await createEvent({
        title: data.title,
        description: data.description,
        coverImage: { filename: data.coverImage.filename, fileUrl: data.coverImage.fileUrl },
        location: { name: data.location.name, latitude: data.location.latitude || "0", longitude: data.location.longitude || "0" },
        startDate: toISO(startDate),
        endDate: toISO(endDate),
        minAttendees,
        maxAttendees,
        category: data.category,
        ticketPrice,
        visibility: data.visibility,
        availableTickets: adjustedAvailableTickets,
        paymentDeadline: toISO(paymentDeadline),
        refundDeadline: refundDeadline ? toISO(refundDeadline) : toISO(endDate),
        isPaidEvent: data.isPaidEvent,
        organizers: data.organizers,
        participantOrganizers: data.participantOrganizers,
        memberDetails: data.memberDetails,
        creatorId: userId,
      });
      console.log("Event created successfully:", createdEvent.id);
      reset(getDefaultEventValues());
      setFormResetKey((key) => key + 1);
      setPublishedEvent(createdEvent);
    } catch (err: any) {
      showToast(getErrorMessage(err, "Failed to create event."), "error");
    }
  });

  const tabs = [
    { key: "event_information", label: "Event Info", component: Event_Information },
    { key: "image_upload", label: "Image", component: Image_Upload },
    { key: "ticket_information", label: "Tickets", component: TicketInformation },
    { key: "invite_members", label: "Invite", component: InviteMembers },
    { key: "preview_event", label: "Preview", component: PreviewEvent },
  ];

  if (role === "Member" && !proceedToCreateEvent) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.memberGate}>
          <Text style={styles.memberGateText}>
            Members can continue creating free events. Verify your profile to create paid events.
          </Text>
          <TouchableOpacity
            style={styles.memberGatePrimary}
            onPress={() => navigation.navigate("profile" as never)}
          >
            <Text style={styles.memberGatePrimaryText}>Verify</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.memberGateSecondary}
            onPress={() => setProceedToCreateEvent(true)}
          >
            <Text style={styles.memberGateSecondaryText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuBtn} hitSlop={8}>
            <Ionicons name="menu" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Create Event</Text>
            <Text style={styles.headerSub}>Fill in the details below</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
        <FormProvider {...formMethods}>
          <View style={styles.body}>
            <CreteEventTabsComponent
              key={formResetKey}
              tabs={tabs}
              control={control}
              onSubmit={onSubmit}
            />
          </View>
        </FormProvider>

        <Modal
          visible={!!publishedEvent}
          transparent
          animationType="fade"
          onRequestClose={() => setPublishedEvent(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successModal}>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={42} color="#2fa566" />
              </View>
              <Text style={styles.successTitle}>Event published</Text>
              <Text style={styles.successText}>
                Your event was created successfully. You can track its approval status in My Events.
              </Text>
              {publishedEvent?.title ? (
                <Text style={styles.successEventName} numberOfLines={2}>
                  {publishedEvent.title}
                </Text>
              ) : null}
              <TouchableOpacity
                style={styles.successPrimary}
                onPress={() => {
                  setPublishedEvent(null);
                  navigation.navigate("My Events" as never);
                }}
              >
                <Text style={styles.successPrimaryText}>View My Events</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.successSecondary}
                onPress={() => setPublishedEvent(null)}
              >
                <Text style={styles.successSecondaryText}>Create Another</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
};

export default CreateEvents;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0d0d0d" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
    backgroundColor: "#111",
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 11, color: "#6B7280", marginTop: 1 },
  body: { flex: 1, backgroundColor: "#0d0d0d" },
  memberGate: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 14,
    backgroundColor: "#0d0d0d",
  },
  memberGateText: {
    color: "#ccc",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 10,
  },
  memberGatePrimary: {
    backgroundColor: "#2fa566",
    borderColor: "#2fa566",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  memberGatePrimaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  memberGateSecondary: {
    backgroundColor: "#454746",
    borderColor: "#555",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  memberGateSecondaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  successModal: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 18,
    backgroundColor: "#1f1f1f",
    borderWidth: 1,
    borderColor: "#2fa56655",
    padding: 22,
    alignItems: "center",
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2fa5661f",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  successTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  successText: {
    color: "#cfcfcf",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  successEventName: {
    color: "#2fa566",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 18,
  },
  successPrimary: {
    width: "100%",
    backgroundColor: "#2fa566",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
  },
  successPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  successSecondary: {
    width: "100%",
    backgroundColor: "#454746",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#555",
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  successSecondaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
