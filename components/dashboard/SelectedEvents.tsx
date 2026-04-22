import {
  GET_SELECTED_EVENTS_BY_ID,
  getSelectedEvents,
} from "@/client/endpoints/posts/selected-events";
import { useUserDb } from "@/app/hooks/useUserDb";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useQuery } from "react-query";
import { useNavigation } from "@react-navigation/native";

const SCREEN_WIDTH = Dimensions.get("window").width;

export type EventLocation = {
  name: string;
  longitude: string;
  latitude: string;
};

export type EventCoverImage = {
  filename: string;
  fileUrl: string;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  minAttendees: number;
  maxAttendees: number;
  category: string;
  ticketPrice: number;
  visibility: string;
  status: string;
  availableTickets: number;
  paymentDeadline: string;
  refundDeadline: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  sourceId: string | null;
  isPaidEvent: boolean;
  organizers: string[];
  version: number;
  rejectionReason: string | null;
  isFavoritedByUser: boolean;
  isBookmarkedByUser: boolean;
  coverImage: EventCoverImage;
  location: EventLocation;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Approved: { label: "Approved", color: "#22c55e", bg: "#14532d33" },
  Pending: { label: "Pending", color: "#fcd34d", bg: "#78350f33" },
  Rejected: { label: "Rejected", color: "#ef4444", bg: "#7f1d1d33" },
};

function getStatusStyle(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG["Pending"];
}

function formatEventTimeRange(startDateStr: string, endDateStr: string): string {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const sameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  const formatDayWithOrdinal = (day: number) => {
    if (day > 3 && day < 21) return `${day}th`;
    switch (day % 10) {
      case 1: return `${day}st`;
      case 2: return `${day}nd`;
      case 3: return `${day}rd`;
      default: return `${day}th`;
    }
  };

  if (sameDay) {
    const datePart = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const startTime = startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase().replace(":00", "");
    const endTime = endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase().replace(":00", "");
    return `${datePart}, ${startTime} - ${endTime}`;
  }

  const startStr = startDate.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).replace(":00", "");
  const endDay = formatDayWithOrdinal(endDate.getDate());
  const endMonth = endDate.toLocaleString("en-US", { month: "short" });
  const endTime = endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).replace(":00", "");
  return `${startStr} - ${endMonth} ${endDay}, ${endTime}`;
}

const SelectedEvents = () => {
  const [eventOptions, setEventOptions] = useState<Event[]>([]);
  const navigation = useNavigation<any>();
  const { userDb, loading: userLoading } = useUserDb();

  const userId: string | undefined = userDb?.data?.id ?? userDb?.id;

  const { data, isLoading } = useQuery(
    [GET_SELECTED_EVENTS_BY_ID, userId],
    () => getSelectedEvents(userId!),
    {
      enabled: !!userId,
      keepPreviousData: false,
      refetchOnWindowFocus: true,
      retry: 0,
    }
  );

  useEffect(() => {
    if (!data) return;

    const raw: any[] = data?.data?.data ?? [];
    const eventValues: Event[] = raw.map((post: any) => ({
      id: post.id,
      title: post.title,
      description: post.description,
      startDate: post.startDate,
      endDate: post.endDate,
      minAttendees: post.minAttendees,
      maxAttendees: post.maxAttendees,
      category: post.category,
      ticketPrice: post.ticketPrice,
      visibility: post.visibility,
      status: post.status,
      availableTickets: post.availableTickets,
      paymentDeadline: post.paymentDeadline,
      refundDeadline: post.refundDeadline,
      creatorId: post.creatorId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      sourceId: post.sourceId,
      isPaidEvent: post.isPaidEvent,
      organizers: post.organizers,
      version: post.version,
      rejectionReason: post.rejectionReason,
      isFavoritedByUser: post.isFavoritedByUser,
      isBookmarkedByUser: post.isBookmarkedByUser,
      coverImage: {
        filename: post.coverImage?.filename,
        fileUrl: post.coverImage?.fileUrl,
      },
      location: {
        name: post.location?.name,
        latitude: post.location?.latitude,
        longitude: post.location?.longitude,
      },
    }));
    setEventOptions(eventValues);
  }, [data]);

  if (userLoading || isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#22c55e" size="large" />
      </View>
    );
  }

  if (eventOptions.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No selected events yet</Text>
        <Text style={styles.emptySubText}>
          Events you bookmark, purchase, or favourite will appear here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Status legend */}
      <View style={styles.legend}>
        {Object.values(STATUS_CONFIG).map(({ label, color }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {eventOptions.map((i, index) => {
        const date = new Date(i.startDate);
        const day = date.getDate();
        const year = date.getFullYear();
        const month = date.toLocaleString("default", { month: "short" });
        const getOrdinal = (n: number) => {
          const s = ["th", "st", "nd", "rd"];
          const v = n % 100;
          return s[(v - 20) % 10] || s[v] || s[0];
        };
        const statusStyle = getStatusStyle(i.status);

        return (
          <TouchableOpacity
            key={index}
            onPress={() => navigation.navigate("EventInfo", { event: i })}
            style={{ padding: 10 }}
          >
            <View style={[styles.card, { borderColor: statusStyle.color, borderWidth: 1.5 }]}>
              <Image
                source={{ uri: i.coverImage?.fileUrl }}
                style={styles.coverImage}
              />
              {/* Status badge */}
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: statusStyle.color }]} />
                <Text style={[styles.statusText, { color: statusStyle.color }]}>
                  {statusStyle.label}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.dateBlock}>
                  <Text style={styles.monthText}>{month}</Text>
                  <Text style={styles.dayText}>{day}{getOrdinal(day)}</Text>
                  <Text style={styles.yearText}>{year}</Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={styles.titleText} numberOfLines={2}>{i.title}</Text>
                  <Text style={styles.descText} numberOfLines={2}>{i.description}</Text>
                  <Text style={styles.timeText}>
                    {formatEventTimeRange(i.startDate, i.endDate)}
                  </Text>
                  {i.rejectionReason ? (
                    <Text style={styles.rejectionText} numberOfLines={2}>
                      Reason: {i.rejectionReason}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyText: { color: "#9ca3af", fontSize: 16, fontWeight: "600" },
  emptySubText: { color: "#6b7280", fontSize: 13, textAlign: "center", maxWidth: 260, lineHeight: 20 },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: "#ffffff0a",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexWrap: "wrap",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: "#9ca3af", fontSize: 12, fontWeight: "500" },
  card: {
    backgroundColor: "#171717",
    borderRadius: 20,
    padding: 12,
    overflow: "hidden",
  },
  coverImage: {
    width: SCREEN_WIDTH - 44,
    height: 200,
    borderRadius: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "700" },
  infoRow: { flexDirection: "row", gap: 14, marginTop: 8, padding: 4 },
  dateBlock: { alignItems: "center", minWidth: 56 },
  monthText: { color: "#22c55e", fontSize: 14, fontWeight: "700", textTransform: "uppercase" },
  dayText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  yearText: { color: "#9ca3af", fontSize: 12 },
  detailBlock: { flex: 1 },
  titleText: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 4 },
  descText: { color: "#9ca3af", fontSize: 13, marginBottom: 4 },
  timeText: { color: "#6b7280", fontSize: 12 },
  rejectionText: { color: "#ef4444", fontSize: 12, marginTop: 4 },
});

export default SelectedEvents;
