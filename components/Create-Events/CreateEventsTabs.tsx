import React, { useState } from "react";
import { Alert, View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Control, useFormContext } from "react-hook-form";
import { EventFormValues } from "@/app/screens/createEvents";

type StepProps = {
  control: Control<EventFormValues>;
  setActiveTab: (key: string) => void;
  activeTab: string;
  onSubmit?: () => void;
};

type TabItem = {
  key: string;
  label: string;
  component: React.ComponentType<StepProps>;
};

type Props = {
  tabs: TabItem[];
  control: Control<EventFormValues>;
  onSubmit: () => void;
};

const CreteEventTabsComponent: React.FC<Props> = ({ tabs, control, onSubmit }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const { getValues } = useFormContext<EventFormValues>();
  const activeIndex = tabs.findIndex((tab) => tab.key === activeTab);
  const ActiveComponent = tabs[activeIndex]?.component;

  const validateStep = (stepIndex: number): string | null => {
    const values = getValues();
    const start = values.startDate instanceof Date ? values.startDate : new Date(values.startDate);
    const end = values.endDate instanceof Date ? values.endDate : new Date(values.endDate);
    const payment = values.paymentDeadline instanceof Date ? values.paymentDeadline : new Date(values.paymentDeadline);
    const refund = values.refundDeadline ? new Date(values.refundDeadline) : null;

    if (stepIndex >= 0) {
      if (!values.title.trim()) return "Complete the event title first.";
      if (!values.category.trim()) return "Select an event category first.";
      if (!values.description.trim()) return "Complete the event description first.";
      if (start < new Date()) return "Start date cannot be in the past.";
      if (start >= end) return "End date must be after the start date.";
      if (payment >= start) return "Payment deadline must be before the start date.";
      if (!refund) return "Select a refund notice deadline first.";
      if (refund >= start) return "Refund deadline must be before the start date.";
    }

    if (stepIndex >= 1 && !values.coverImage?.fileUrl) {
      return "Upload a cover image first.";
    }

    if (stepIndex >= 2) {
      const min = Number(values.minAttendees) || 0;
      const max = Number(values.maxAttendees) || 0;
      const tickets = Number(values.availableTickets) || 0;
      const price = Number(values.ticketPrice) || 0;
      if (!values.ticketDescription.trim()) return "Complete the ticket description first.";
      if (!values.organizers.length) return "Select at least one organizer first.";
      if (!values.location.name.trim()) return "Select an event location first.";
      if (!values.location.latitude || !values.location.longitude) return "Choose a suggested location first.";
      if (min < 1) return "Minimum attendees must be at least 1.";
      if (max < min) return "Maximum attendees must be greater than minimum attendees.";
      if (tickets < 1) return "Available tickets must be at least 1.";
      if (tickets > max) return "Available tickets cannot exceed maximum attendees.";
      if (values.isPaidEvent && price <= 0) return "Ticket price must be greater than 0 for paid events.";
    }

    if (stepIndex >= 3) {
      const incompleteInvite = values.memberDetails.some((member) => !member.id || !member.name || !member.email);
      if (incompleteInvite) return "Select a member for every invite slot first.";
    }

    return null;
  };

  const guardedSetActiveTab = (nextKey: string) => {
    const nextIndex = tabs.findIndex((tab) => tab.key === nextKey);
    if (nextIndex <= activeIndex) {
      setActiveTab(nextKey);
      return;
    }

    const blockedBy = validateStep(nextIndex - 1);
    if (blockedBy) {
      Alert.alert("Complete previous step", blockedBy);
      return;
    }
    setActiveTab(nextKey);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.tabShell}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.tabRow}
        >
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.key;
            const isDone = index < activeIndex;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => guardedSetActiveTab(tab.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                  {tab.label}
                </Text>
                {isDone && <Text style={styles.stepDone}>Done</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {ActiveComponent ? (
          <ActiveComponent
            control={control}
            activeTab={activeTab}
            setActiveTab={guardedSetActiveTab}
            onSubmit={onSubmit}
          />
        ) : (
          <Text style={{ color: "#fff" }}>No component found</Text>
        )}
      </View>
    </View>
  );
};

export default CreteEventTabsComponent;

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#0d0d0d" },
  tabShell: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: "#1e1e1e",
    overflow: "hidden",
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  tabItem: {
    justifyContent: "center",
    minWidth: 100,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: "#1e1e1e",
  },
  tabItemActive: { backgroundColor: "rgba(74,222,128,0.07)" },
  stepLabel: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "left",
    lineHeight: 18,
    fontWeight: "500",
  },
  stepLabelActive: { color: "#4ade80", fontWeight: "700" },
  stepDone: { color: "#374151", fontSize: 10, marginTop: 3 },
  content: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1e1e1e",
  },
});
