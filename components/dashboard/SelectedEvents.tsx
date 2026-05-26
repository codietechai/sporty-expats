import { GET_SELECTED_EVENTS_BY_ID, getSelectedEvents } from "@/client/endpoints/posts/selected-events";
import { useUserDb } from "@/app/hooks/useUserDb";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated, Dimensions, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { useQuery } from "react-query";
import { useNavigation } from "@react-navigation/native";

const SCREEN_WIDTH = Dimensions.get("window").width;

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventLocation = { name: string; longitude: string; latitude: string };
export type EventCoverImage = { filename: string; fileUrl: string };
export type Event = {
  id: string; title: string; description: string;
  startDate: string; endDate: string;
  minAttendees: number; maxAttendees: number;
  category: string; ticketPrice: number; visibility: string;
  status: string; availableTickets: number;
  paymentDeadline: string; refundDeadline: number;
  creatorId: string; createdAt: string; updatedAt: string;
  sourceId: string | null; isPaidEvent: boolean;
  organizers: string[]; version: number;
  rejectionReason: string | null;
  isFavoritedByUser: boolean; isBookmarkedByUser: boolean;
  coverImage: EventCoverImage; location: EventLocation;
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  Approved: { label: "Approved", color: "#4ade80", bg: "rgba(74,222,128,0.1)", icon: "checkmark-circle" },
  Pending:  { label: "Pending",  color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  icon: "time" },
  Rejected: { label: "Rejected", color: "#f87171", bg: "rgba(248,113,113,0.1)", icon: "close-circle" },
};
function getStatus(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG["Pending"];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function formatRange(start: string, end: string) {
  const s = new Date(start), e = new Date(end);
  const sameDay = s.toDateString() === e.toDateString();
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      .toLowerCase().replace(":00", "");
  if (sameDay) {
    return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${fmt(s)} – ${fmt(e)}`;
  }
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Shimmer({ style }: { style: any }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[{ backgroundColor: "#1a1a1a", borderRadius: 8 }, style, { opacity }]} />;
}

function EventCardSkeleton() {
  return (
    <View style={sk.card}>
      <Shimmer style={sk.image} />
      <View style={sk.body}>
        <View style={sk.row}>
          <Shimmer style={sk.dateBlock} />
          <View style={sk.lines}>
            <Shimmer style={sk.lineTitle} />
            <Shimmer style={sk.lineMed} />
            <Shimmer style={sk.lineShort} />
          </View>
        </View>
        <Shimmer style={sk.badge} />
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  card: {
    backgroundColor: "#111", borderRadius: 16,
    borderWidth: 1, borderColor: "#1e1e1e",
    marginHorizontal: 12, marginBottom: 12, overflow: "hidden",
  },
  image: { width: "100%", height: 180, borderRadius: 0 },
  body: { padding: 14, gap: 12 },
  row: { flexDirection: "row", gap: 14 },
  dateBlock: { width: 52, height: 64, borderRadius: 10 },
  lines: { flex: 1, gap: 8, justifyContent: "center" },
  lineTitle: { height: 14, width: "70%" },
  lineMed: { height: 10, width: "90%" },
  lineShort: { height: 10, width: "50%" },
  badge: { height: 26, width: 90, borderRadius: 20 },
});

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  const date = new Date(event.startDate);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" }).toUpperCase();
  const year = date.getFullYear();
  const st = getStatus(event.status);

  return (
    <TouchableOpacity style={ec.card} onPress={onPress} activeOpacity={0.85}>
      {/* Cover image */}
      <View style={ec.imageWrap}>
        <Image source={{ uri: event.coverImage?.fileUrl }} style={ec.image} contentFit="cover" />
        {/* Category pill */}
        {event.category ? (
          <View style={ec.categoryPill}>
            <Text style={ec.categoryText}>{event.category}</Text>
          </View>
        ) : null}
        {/* Paid / Free badge */}
        <View style={ec.pricePill}>
          {event.isPaidEvent
            ? <Text style={ec.priceText}>€{event.ticketPrice}</Text>
            : <Text style={ec.priceText}>Free</Text>
          }
        </View>
      </View>

      {/* Body */}
      <View style={ec.body}>
        {/* Date + info */}
        <View style={ec.infoRow}>
          <View style={ec.dateBlock}>
            <Text style={ec.dateMonth}>{month}</Text>
            <Text style={ec.dateDay}>{day}{ordinal(day)}</Text>
            <Text style={ec.dateYear}>{year}</Text>
          </View>
          <View style={ec.details}>
            <Text style={ec.title} numberOfLines={2}>{event.title}</Text>
            {event.location?.name ? (
              <View style={ec.locationRow}>
                <Ionicons name="location-outline" size={12} color="#6B7280" />
                <Text style={ec.locationText} numberOfLines={1}>{event.location.name}</Text>
              </View>
            ) : null}
            <Text style={ec.timeText}>{formatRange(event.startDate, event.endDate)}</Text>
          </View>
        </View>

        {/* Footer row */}
        <View style={ec.footer}>
          <View style={[ec.statusBadge, { backgroundColor: st.bg }]}>
            <Ionicons name={st.icon} size={12} color={st.color} />
            <Text style={[ec.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
          <View style={ec.ticketsRow}>
            <Ionicons name="ticket-outline" size={12} color="#6B7280" />
            <Text style={ec.ticketsText}>{event.availableTickets} left</Text>
          </View>
        </View>

        {/* Rejection reason */}
        {event.rejectionReason ? (
          <View style={ec.rejectionBox}>
            <Ionicons name="alert-circle-outline" size={13} color="#f87171" />
            <Text style={ec.rejectionText} numberOfLines={2}>{event.rejectionReason}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const ec = StyleSheet.create({
  card: {
    backgroundColor: "#111", borderRadius: 16,
    borderWidth: 1, borderColor: "#1e1e1e",
    marginHorizontal: 12, marginBottom: 12, overflow: "hidden",
  },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 180 },
  categoryPill: {
    position: "absolute", top: 10, left: 10,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  categoryText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  pricePill: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: "#166534", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: "#4ade80",
  },
  priceText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  body: { padding: 14, gap: 12 },
  infoRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  dateBlock: {
    width: 52, alignItems: "center",
    backgroundColor: "#1a1a1a", borderRadius: 10,
    paddingVertical: 8, borderWidth: 1, borderColor: "#2a2a2a",
  },
  dateMonth: { color: "#4ade80", fontSize: 11, fontWeight: "700" },
  dateDay: { color: "#fff", fontSize: 20, fontWeight: "800", lineHeight: 24 },
  dateYear: { color: "#6B7280", fontSize: 10 },
  details: { flex: 1, gap: 4 },
  title: { color: "#fff", fontSize: 15, fontWeight: "700", lineHeight: 20 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  locationText: { color: "#6B7280", fontSize: 12, flex: 1 },
  timeText: { color: "#4B5563", fontSize: 11 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  ticketsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ticketsText: { color: "#6B7280", fontSize: 12 },
  rejectionBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    backgroundColor: "rgba(248,113,113,0.08)", borderRadius: 8,
    padding: 10, borderWidth: 1, borderColor: "rgba(248,113,113,0.2)",
  },
  rejectionText: { color: "#f87171", fontSize: 12, flex: 1, lineHeight: 17 },
});

// ─── Main component ───────────────────────────────────────────────────────────

const SelectedEvents = () => {
  const [eventOptions, setEventOptions] = useState<Event[]>([]);
  const navigation = useNavigation<any>();
  const { userDb, loading: userLoading } = useUserDb();
  const userId: string | undefined = userDb?.data?.id ?? userDb?.id;

  const { data, isLoading } = useQuery(
    [GET_SELECTED_EVENTS_BY_ID, userId],
    () => getSelectedEvents(userId!),
    { enabled: !!userId, keepPreviousData: false, refetchOnWindowFocus: true, retry: 0 }
  );

  useEffect(() => {
    if (!data) return;
    const raw: any[] = data?.data?.data ?? [];
    setEventOptions(raw.map((post: any) => ({
      id: post.id, title: post.title, description: post.description,
      startDate: post.startDate, endDate: post.endDate,
      minAttendees: post.minAttendees, maxAttendees: post.maxAttendees,
      category: post.category, ticketPrice: post.ticketPrice,
      visibility: post.visibility, status: post.status,
      availableTickets: post.availableTickets, paymentDeadline: post.paymentDeadline,
      refundDeadline: post.refundDeadline, creatorId: post.creatorId,
      createdAt: post.createdAt, updatedAt: post.updatedAt,
      sourceId: post.sourceId, isPaidEvent: post.isPaidEvent,
      organizers: post.organizers, version: post.version,
      rejectionReason: post.rejectionReason,
      isFavoritedByUser: post.isFavoritedByUser,
      isBookmarkedByUser: post.isBookmarkedByUser,
      coverImage: { filename: post.coverImage?.filename, fileUrl: post.coverImage?.fileUrl },
      location: { name: post.location?.name, latitude: post.location?.latitude, longitude: post.location?.longitude },
    })));
  }, [data]);

  if (userLoading || isLoading) {
    return (
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}>
        {[1, 2, 3].map((i) => <EventCardSkeleton key={i} />)}
      </ScrollView>
    );
  }

  if (eventOptions.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="calendar-outline" size={36} color="#374151" />
        </View>
        <Text style={styles.emptyTitle}>No events yet</Text>
        <Text style={styles.emptySub}>Events you register for or bookmark will appear here.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
      {eventOptions.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onPress={() => navigation.navigate("EventInfo", { event })}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  empty: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingTop: 80, paddingHorizontal: 40, gap: 10,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { color: "#D1D5DB", fontSize: 16, fontWeight: "700" },
  emptySub: { color: "#6B7280", fontSize: 13, textAlign: "center", lineHeight: 20 },
});

export default SelectedEvents;
