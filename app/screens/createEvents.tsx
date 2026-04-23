import React from "react";
import { View, Text, TouchableOpacity, StatusBar, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useNavigation } from "@react-navigation/native";
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
import { Alert } from "react-native";

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
  creatorId: string;
};

const CreateEvents = () => {
  const navigation = useNavigation();
  const { userDb } = useUserDb();
  const userId: string = userDb?.data?.id ?? userDb?.id ?? "";

  const { control, handleSubmit, ...methods } = useForm<EventFormValues>({
    defaultValues: {
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
      creatorId: "",
    },
  });

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

    if (!data.title.trim()) { Alert.alert("Validation", "Event title is required."); return; }
    if (!data.category.trim()) { Alert.alert("Validation", "Event category is required."); return; }
    if (!data.location.name.trim()) { Alert.alert("Validation", "Event location is required."); return; }
    if (!data.coverImage.fileUrl) { Alert.alert("Validation", "Cover image is required."); return; }
    if (!data.description.trim()) { Alert.alert("Validation", "Event description is required."); return; }
    if (startDate < now) { Alert.alert("Validation", "Start date cannot be in the past."); return; }
    if (endDate <= startDate) { Alert.alert("Validation", "End date must be after the start date."); return; }
    if (paymentDeadline > startDate) { Alert.alert("Validation", "Payment deadline must be before the start date."); return; }
    if (refundDeadline && refundDeadline >= startDate) { Alert.alert("Validation", "Refund deadline must be before the start date."); return; }
    if (minAttendees < 1) { Alert.alert("Validation", "Minimum attendees must be at least 1."); return; }
    if (maxAttendees < minAttendees) { Alert.alert("Validation", "Maximum attendees must be ≥ minimum attendees."); return; }
    if (availableTickets < 1) { Alert.alert("Validation", "Available tickets must be at least 1."); return; }
    if (availableTickets > maxAttendees) { Alert.alert("Validation", "Available tickets cannot exceed maximum attendees."); return; }
    if (data.isPaidEvent && ticketPrice <= 0) { Alert.alert("Validation", "Ticket price must be > 0 for paid events."); return; }

    try {
      await createEvent({
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
        availableTickets,
        paymentDeadline: toISO(paymentDeadline),
        refundDeadline: refundDeadline ? toISO(refundDeadline) : toISO(endDate),
        isPaidEvent: data.isPaidEvent,
        organizers: data.organizers,
        creatorId: userId,
      });
      Alert.alert("Success", "Event created successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? "Failed to create event.";
      Alert.alert("Error", Array.isArray(msg) ? msg.join("\n") : msg);
    }
  });

  const tabs = [
    { key: "event_information", label: "Event Info", component: Event_Information },
    { key: "image_upload", label: "Image", component: Image_Upload },
    { key: "ticket_information", label: "Tickets", component: TicketInformation },
    { key: "invite_members", label: "Invite", component: InviteMembers },
    { key: "preview_event", label: "Preview", component: PreviewEvent },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Create Event</Text>
            <Text style={styles.headerSub}>Fill in the details below</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        {/* Tabs + content */}
        <FormProvider control={control} handleSubmit={handleSubmit} {...methods}>
          <View style={styles.body}>
            <CreteEventTabsComponent tabs={tabs} control={control} onSubmit={onSubmit} />
          </View>
        </FormProvider>
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
  backBtn: {
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
});
