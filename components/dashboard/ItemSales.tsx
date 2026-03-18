import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "react-query";
import {
  GET_SELECTED_EVENTS_BY_ID,
  getSelectedEvents,
} from "@/client/endpoints/posts/selected-events";
import Svg, { Path } from "react-native-svg";

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

const ItemSales = () => {
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
                  paddingBottom: 30,
                }}
              >
                <Image
                  // source={{ uri: i.coverImage.fileUrl }}
                  source={{ uri: 'https://content.jdmagicbox.com/comp/def_content/gymnastic-classes/dzyoq2srbz-gymnastic-classes-3-xhvno.jpg' }}
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
                      gap: 15,
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
                            style={{ fontSize: 20 }}
                            className="font-oswald"
                          >
                            {/* <Text style={{ color: "green" }}>{month} </Text> */}
                            <Text style={{ color: "green" }}>Condition: </Text>
                          </Text>
                          <Text
                            style={{ color: "white", fontSize: 20 }}
                            className="font-oswald"
                          >
                            {/* {year} */}
                            Brand New
                          </Text>
                        </View>
                      </Text>
                    </View>
                    <View>
                      <Text
                        style={{
                          color: "white",
                          fontSize: 20,
                          marginTop: 8,
                          display: "flex",
                          flexWrap: "wrap",
                          maxWidth: 200,
                        }}
                      >
                        {/* {i.title} */}
                        Item Name Can Take Up To Two Lines
                      </Text>
                      {/* <Text style={{ color: "gray" }}>{i.description}</Text> */}
                      <Text
                        style={{
                          color: "gray",
                          display: "flex",
                          flexWrap: "wrap",
                          maxWidth: 200,
                          marginTop: 5,
                        }}
                      >
                        Description: can take up to two lines. Continues on the
                        full view...
                      </Text>
                      {new Date(i.endDate) <= new Date() && (
                        <Text
                          style={{
                            color: "gray",
                            flexWrap: "wrap",
                            flexShrink: 1,
                            paddingTop: 5,
                            maxWidth: 170, // or whatever width fits your layout
                          }}
                        >
                          6 months old. 13 views.
                        </Text>
                      )}
                        <View style={{display:'flex',flexDirection:'row',gap:5,marginTop:5}}> 
                        <Svg
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="green"
                          width={20}
                          height={20}
                        >
                          <Path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                          />
                        </Svg>
                        <View style={{display:'flex',flexDirection:'row',gap:2}}> 
                        <Text style={{color:'green'}}>Price:</Text>
                        <Text style={{color:'white'}}>$300</Text>

                        </View>
                      </View>
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

export default ItemSales;
