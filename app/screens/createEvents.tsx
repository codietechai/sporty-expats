import React from "react";
import { View, Alert, StatusBar } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useForm, FormProvider } from "react-hook-form";
import Header from "@/components/Header";
import CreteEventTabsComponent from "@/components/Create-Events/CreateEventsTabs";
import Event_Information from "@/components/Create-Events/EventInformation";
import Image_Upload from "@/components/Create-Events/ImageUpload";
import TicketInformation from "@/components/Create-Events/TicketInformations";
import InviteMembers from "@/components/Create-Events/InviteMembers";
import PreviewEvent from "@/components/Create-Events/PreviewEvent";
import { createEvent } from "@/client/endpoints/events/createEvent";
import { getUserDetailsByClerkId } from "@/client/endpoints/users/getUserDetailsByClerkId";
import { useUser } from "@clerk/clerk-expo";
export type EventFormValues = {
  title: string;
  description: string;

  coverImage: {
    filename: string;
    fileUrl: string;
  };

  startDate: Date;
  endDate: Date;

  location: {
    name: string;
    latitude: string;
    longitude: string;
  };

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
  const router = useRouter();
    const { user } = useUser(); // ✅ move hook here

  const { control, handleSubmit, ...methods } = useForm<EventFormValues>({
    defaultValues: {
      title: "",
      description: "",

      coverImage: {
        filename: "",
        fileUrl: "",
      },

      startDate: new Date(),
      endDate: new Date(),

      location: {
        name: "",
        latitude: "",
        longitude: "",
      },

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

    if (!data.title.trim()) {
      Alert.alert("Validation", "Event title is required.");
      return;
    }
    if (!data.category.trim()) {
      Alert.alert("Validation", "Event category is required.");
      return;
    }
    if (!data.location.name.trim()) {
      Alert.alert("Validation", "Event location is required.");
      return;
    }
    if (!data.coverImage.fileUrl) {
      Alert.alert("Validation", "Cover image is required.");
      return;
    }
    if (!data.description.trim()) {
      Alert.alert("Validation", "Event description is required.");
      return;
    }

    if (startDate < now) {
      Alert.alert("Validation", "Start date cannot be in the past.");
      return;
    }
    if (endDate <= startDate) {
      Alert.alert("Validation", "End date must be after the start date.");
      return;
    }
    if (paymentDeadline > startDate) {
      Alert.alert(
        "Validation",
        "Payment deadline must be before the start date.",
      );
      return;
    }
    if (refundDeadline && refundDeadline >= startDate) {
      Alert.alert(
        "Validation",
        "Refund deadline must be before the start date.",
      );
      return;
    }

    if (minAttendees < 1) {
      Alert.alert("Validation", "Minimum attendees must be at least 1.");
      return;
    }
    if (maxAttendees < minAttendees) {
      Alert.alert(
        "Validation",
        "Maximum attendees must be greater than or equal to minimum attendees.",
      );
      return;
    }
    if (availableTickets < 1) {
      Alert.alert("Validation", "Available tickets must be at least 1.");
      return;
    }
    if (availableTickets > maxAttendees) {
      Alert.alert(
        "Validation",
        "Available tickets cannot exceed maximum attendees.",
      );
      return;
    }
    if (data.isPaidEvent && ticketPrice <= 0) {
      Alert.alert(
        "Validation",
        "Ticket price must be greater than 0 for paid events.",
      );
      return;
    }
    console.log(192)
    let creatorId: string;
    try {
      console.log(195)

      console.log("user 195",user);
      const me: any = await getUserDetailsByClerkId(user?.id as string);
      console.log("me :>> ", JSON.stringify(me.data,null,2));
      creatorId = me.data.id;
    } catch(e) {
      console.log(e)
      Alert.alert(
        "Error",
        "something went wrong with getUserDetailsByClerkId",
      );
      return;
    }

    try {
      const res = await createEvent({
        title: data.title,
        description: data.description,
        coverImage: {
          filename: data.coverImage.filename,
          fileUrl: "https://example.com/images/football-match.jpg",
        },
        location: {
          name: data.location.name,
          latitude: data.location.latitude || "0",
          longitude: data.location.longitude || "0",
        },
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
        organizers: ["69b8d9115c4b424bc85783a8"],
        creatorId: creatorId,
      });
      console.log("res :>> ", JSON.stringify(res, null, 2));
      Alert.alert("Success", "Event created successfully!");
      router.back();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        "Failed to create event. Please try again.";
      console.log(
        "Create event error response:",
        JSON.stringify(err?.response?.data, null, 2),
      );
      Alert.alert("Error", Array.isArray(msg) ? msg.join("\n") : msg);
    }
  });

  const tabs = [
    {
      key: "event_information",
      label: "Event Information",
      component: Event_Information,
    },
    {
      key: "image_upload",
      label: "Image Upload",
      component: Image_Upload,
    },
    {
      key: "ticket_information",
      label: "Ticket & Additional Info",
      component: TicketInformation,
    },
    {
      key: "invite_members",
      label: "Invite Members",
      component: InviteMembers,
    },
    {
      key: "preview_event",
      label: "Preview Event",
      component: PreviewEvent,
    },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />

      <Stack.Screen options={{ headerShown: false }} />
      <FormProvider control={control} handleSubmit={handleSubmit} {...methods}>
        <View style={{ flex: 1, backgroundColor: "black" }}>
          <Header />
          <View style={{ flex: 1 }}>
            <CreteEventTabsComponent
              tabs={tabs}
              control={control}
              onSubmit={onSubmit}
            />
          </View>
        </View>
      </FormProvider>
    </>
  );
};

export default CreateEvents;
