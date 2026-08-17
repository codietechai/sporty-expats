import React from "react";
import { useRoute } from "@react-navigation/native";
import GroupChatsContent from "./GroupChatsContent";

export default function GroupChatsScreen() {
    const route = useRoute<any>();
    const initialRoomId: string | undefined = route.params?.initialRoomId;

    return <GroupChatsContent initialRoomId={initialRoomId} />;
}
