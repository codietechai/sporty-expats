import {
  GET_ALL_POSTS,
  getAllPosts,
} from "@/client/endpoints/posts/getAllPosts";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useQuery } from "react-query";
import { timeAgo } from "@/helpers/date";
import { likePost } from "@/client/endpoints/posts/likePost";
import {
  GET_SELECTED_EVENTS_BY_ID,
  getSelectedEvents,
} from "@/client/endpoints/posts/selected-events";

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

const SelectedEvents = () => {
  const [eventOptions, setEventOptions] = useState<Event[]>([]);

  const { data, refetch } = useQuery(
    [GET_SELECTED_EVENTS_BY_ID],
    () => getSelectedEvents(),
    {
      keepPreviousData: false,
      refetchOnWindowFocus: true,
      retry: 0,
    }
  );


  useEffect(() => {
    if (data) {
      const eventValues: Event[] = [];

      data?.data?.data.forEach((post: any) => {
        eventValues.push({
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
            filename: post.coverImage.filename,
            fileUrl: post.coverImage.fileUrl,
          },
          location: {
            name: post.location.name,
            latitude: post.location.latitude,
            longitude: post.location.longitude,
          },
        });
      });

      setEventOptions(eventValues);
    }
  }, [data]);

  console.log(JSON.stringify(eventOptions, null, 2));

  function formatEventTimeRange(
    startDateStr: string,
    endDateStr: string
  ): string {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const sameDay =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate();

    const formatDate = (date: Date, includeTime = true) => {
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
      };
      const datePart = date.toLocaleDateString("en-US", options);
      const timePart = date
        .toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .toLowerCase()
        .replace(":00", ""); // remove :00 if needed

      return includeTime ? `${datePart}, ${timePart}` : datePart;
    };

    const formatDayWithOrdinal = (day: number) => {
      if (day > 3 && day < 21) return `${day}th`;
      switch (day % 10) {
        case 1:
          return `${day}st`;
        case 2:
          return `${day}nd`;
        case 3:
          return `${day}rd`;
        default:
          return `${day}th`;
      }
    };

    if (sameDay) {
      const start = formatDate(startDate).replace(",", "");


      const end = endDate
        .toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .toLowerCase()
        .replace(":00", "");

      return `${start} - ${end}`;
    } else {
      const start = `${startDate
        .toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .replace(", ", " ")
        // .toLowerCase()
        .replace(":00", "")}`;

      const endDay = formatDayWithOrdinal(endDate.getDate());
      const endMonth = endDate.toLocaleString("en-US", { month: "short" });
      const endTime = endDate
        .toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        // .toLowerCase()
        .replace(":00", "");

      return `${start} - ${endMonth} ${endDay}, ${endTime}`;
    }
  }

  return (
    <ScrollView>
      {eventOptions
        .filter((i) => i.visibility === "Public" && i.status === "Approved")
        .map((i, index) => {
          const date = new Date(i.startDate);
          const day = date.getDate();
          const year = date.getFullYear();
          const month = date.toLocaleString("default", { month: "short" });

          const getOrdinal = (n: number) => {
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            return s[(v - 20) % 10] || s[v] || s[0];
          };

          return (
            <View
              key={index}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: 10,
              }}
            >
              <View
                style={{
                  backgroundColor: "#171717",
                  borderRadius: 20,
                  padding: 12,
                }}
              >
                <Image
                  source={{ uri: i.coverImage.fileUrl }}
                  style={{ width: 300, height: 300, borderRadius: 20 }}
                />
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 20,
                  }}
                >
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      padding: 4,
                      gap: 20,
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          flexDirection: "row",
                        }}
                      >
                        <View style={{ flexDirection: "column" }}>
                          <Text
                            style={{ fontSize: 30 }}
                            className="font-oswald"
                          >
                            <Text style={{ color: "green" }}>{month} </Text>
                            <Text style={{ color: "white" }}>
                              {day}
                              {getOrdinal(day)}
                            </Text>
                          </Text>
                          <Text
                            style={{ color: "white", fontSize: 30 }}
                            className="font-oswald"
                          >
                            {year}
                          </Text>
                        </View>
                      </Text>
                    </View>
                    <View>
                      <Text
                        style={{ color: "white", fontSize: 20, marginTop: 8 }}
                      >
                        {i.title}
                      </Text>
                      <Text style={{ color: "gray" }}>{i.description}</Text>
                      {new Date(i.endDate) <= new Date() && (
                        <Text
                          style={{
                            color: "gray",
                            flexWrap: "wrap",
                            flexShrink: 1,
                            paddingTop:5,
                            maxWidth: 170, // or whatever width fits your layout
                          }}
                        >
                          {formatEventTimeRange(i.startDate, i.endDate)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderImage: {
    width: 340,
    height: 250,
    borderRadius: 10,
    marginRight: 10,
  },
});

export default SelectedEvents;
