import React from "react";
import { Image, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
const groupData = [
  {
    id: 1,
    name: "Kano Pillars Official Group",
    members: 32,
    notificationCount: 27,
    messages: [
      {
        id: 1,
        user: "Jeremiah Okafor",
        time: "22 mins ago",
        text: "Welcome everyone! Let's have a productive week ahead.",
        avatar:
          "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        id: 2,
        user: "John Bliss",
        time: "25 mins ago",
        text: "Hi team! Excited to be here.",
        avatar:
          "https://randomuser.me/api/portraits/men/45.jpg",
      },
    ],
    groupImage:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBwgu1A5zgPSvfE83nurkuzNEoXs9DMNr8Ww&s",
  },
  {
    id: 2,
    name: "React Native Developers",
    members: 88,
    notificationCount: 15,
    messages: [
      {
        id: 1,
        user: "Linda George",
        time: "1 hour ago",
        text: "Expo vs CLI — what do you prefer and why?",
        avatar:
          "https://randomuser.me/api/portraits/women/12.jpg",
      },
      {
        id: 2,
        user: "Amir Hossain",
        time: "1 hour ago",
        text: "I usually go for bare workflow for flexibility.",
        avatar:
          "https://randomuser.me/api/portraits/men/22.jpg",
      },
    ],
    groupImage:
      "https://cdn.pixabay.com/photo/2019/11/03/20/11/portrait-4599553_1280.jpg",
  },
  {
    id: 3,
    name: "Fitness Enthusiasts",
    members: 54,
    notificationCount: 8,
    messages: [
      {
        id: 1,
        user: "Karen Lee",
        time: "3 hours ago",
        text: "Anyone tried the new HIIT routine posted yesterday?",
        avatar:
          "https://randomuser.me/api/portraits/women/36.jpg",
      },
      {
        id: 2,
        user: "Mark Turner",
        time: "2 hours ago",
        text: "Yes! It’s a killer but effective 💪",
        avatar:
          "https://randomuser.me/api/portraits/men/64.jpg",
      },
    ],
    groupImage:
      "https://cdn.expertphotography.com/wp-content/uploads/2020/08/social-media-profile-photos.jpg",
  },
  {
    id: 4,
    name: "Photography Club",
    members: 120,
    notificationCount: 33,
    messages: [
      {
        id: 1,
        user: "Emily Carson",
        time: "30 mins ago",
        text: "What’s your favorite lens for portraits?",
        avatar:
          "https://randomuser.me/api/portraits/women/52.jpg",
      },
      {
        id: 2,
        user: "Lucas Smith",
        time: "25 mins ago",
        text: "I love my 85mm f/1.4 — absolute magic!",
        avatar:
          "https://randomuser.me/api/portraits/men/28.jpg",
      },
    ],
    groupImage:
      "https://thumbs.dreamstime.com/b/beautiful-smiling-young-woman-profile-looking-down-long-ama-amazing-hair-nature-bright-sunset-summer-background-closeup-119826079.jpg",
  },
  {
    id: 5,
    name: "Bookworms United",
    members: 67,
    notificationCount: 5,
    messages: [
      {
        id: 1,
        user: "Aisha Rami",
        time: "10 mins ago",
        text: "Has anyone finished *The Midnight Library* yet?",
        avatar:
          "https://randomuser.me/api/portraits/women/61.jpg",
      },
      {
        id: 2,
        user: "Daniel Lee",
        time: "5 mins ago",
        text: "Just started chapter 3 — loving it so far.",
        avatar:
          "https://randomuser.me/api/portraits/men/51.jpg",
      },
    ],
    groupImage:
      "https://preview.redd.it/your-coworkers-linkedin-profile-picture-v0-sayv4o4bdcoc1.jpg?width=640&crop=smart&auto=webp&s=c5b36fa442874d5e49f9ce7cfe573c92854f8dc0",
  },
];


const JoinedGroups = () => {
  return (
    <ScrollView contentContainerStyle={{ padding: 0 }}>
      <View style={{ gap: 20 }}>
        {groupData.map((group) => (
          <View
            key={group.id}
            style={{
              backgroundColor: "#171717",
              padding: 20,
              borderRadius: 20,
            }}
          >
            {/* Top Row */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Image
                  source={{ uri: group.groupImage }}
                  width={40}
                  height={40}
                  style={{ borderRadius: 100 }}
                />
                <View>
                  <Text style={{ color: "white" }}>{group.name}</Text>
                  <Text style={{ color: "gray" }}>{group.members} Members</Text>
                </View>
              </View>
              <Text
                style={{
                  backgroundColor: "green",
                  color: "white",
                  borderRadius: 100,
                  padding: 7,
                }}
              >
                {group.notificationCount}
              </Text>
            </View>

            {/* Messages */}
            {group.messages.map((msg) => (
              <View key={msg.id} style={{ marginTop: 30 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 10,
                  }}
                >
                  <Image
                    source={{ uri: msg.avatar }}
                    width={20}
                    height={20}
                    style={{ borderRadius: 100 }}
                  />
                  <Text style={{ color: "white", fontSize: 12 }}>
                    {msg.user}, {msg.time}
                  </Text>
                </View>
                <Text style={{ color: "gray" }}>{msg.text}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default JoinedGroups;
