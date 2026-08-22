import React, { useCallback } from "react";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import GroupChatsContent from "./GroupChatsContent";

export default function GroupChatsScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();

    // Drawer screens keep their route.params alive across navigations.
    // When the user taps "Group Chats" from the sidebar (no initialRoomId),
    // we must clear the stale param so GroupChatsContent resets to the list.
    useFocusEffect(
        useCallback(() => {
            // If this focus was triggered without a fresh initialRoomId param,
            // wipe the stale one so the list view is always shown.
            if (!route.params?.initialRoomId) {
                navigation.setParams({ initialRoomId: undefined });
            }
        }, [])
    );

    const initialRoomId: string | undefined = route.params?.initialRoomId;

    return <GroupChatsContent initialRoomId={initialRoomId} />;
}
