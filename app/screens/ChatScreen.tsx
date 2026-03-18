import ChatHeader from "@/components/chat/ChatHeader";
import MessageBubble from "@/components/chat/MessageBubble";
import EventRatingCard from "@/components/chat/EventRatingCard";
import ChatInput from "@/components/chat/ChatInput";
import { Stack } from "expo-router";
import React from "react";
import { View, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const messages = [
  { id: "1", user: "Franca Will", text: "Hey everyone! I am excited about getting up for the day and heading to the beach for a friendly match of Volleyball! It will be a lot of fun.", me: false },
  { id: "4", user: "Franca Will", text: "Hey everyone! I am fun.", me: true },
  { id: "2", user: "James Belt", text: "Hey everyone! I am excited about getting up for the day and heading to the beach for a friendly match of Volleyball! It will be a lot of fun.", me: false },
  { id: "3", user: "You", text: "Hey everyone! I am excited about getting up for the day and heading to the beach for a friendly match of Volleyball! It will be a lot of fun.", me: true },
];

export default function ChatScreen({ navigation }: any) {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView className="flex-1 bg-gray-100">
        <ChatHeader onInfo={() => navigation.navigate("EventInfo")} />

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal:8 }}
          renderItem={({ item, index }) => (
            <>
              <MessageBubble {...item} />
              {index === messages.length - 1 && <EventRatingCard />}
            </>
          )}
        />

        <ChatInput />
      </SafeAreaView>
    </>
  );
}
