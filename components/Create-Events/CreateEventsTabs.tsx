import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Control } from "react-hook-form";
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

  const activeIndex = tabs.findIndex((t) => t.key === activeTab);
  const ActiveComponent = tabs[activeIndex]?.component;

  return (
    <View style={{ flex: 1 }}>
      {/* Step indicator */}
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
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              {/* connector line */}
              {index > 0 && (
                <View style={[styles.connector, isDone && styles.connectorDone]} />
              )}
              <View style={[
                styles.stepCircle,
                isActive && styles.stepCircleActive,
                isDone && styles.stepCircleDone,
              ]}>
                {isDone
                  ? <Text style={styles.stepCheck}>✓</Text>
                  : <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>{index + 1}</Text>
                }
              </View>
              <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((activeIndex + 1) / tabs.length) * 100}%` }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {ActiveComponent ? (
          <ActiveComponent control={control} activeTab={activeTab} setActiveTab={setActiveTab} onSubmit={onSubmit} />
        ) : (
          <Text style={{ color: "white" }}>No component found</Text>
        )}
      </View>
    </View>
  );
};

export default CreteEventTabsComponent;

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: "center",
    marginRight: 8,
    position: "relative",
    minWidth: 64,
  },
  connector: {
    position: "absolute",
    top: 14,
    right: "50%",
    left: "-50%",
    height: 2,
    backgroundColor: "#1f2937",
    zIndex: 0,
  },
  connectorDone: { backgroundColor: "#166534" },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  stepCircleActive: {
    backgroundColor: "#166534",
    borderColor: "#2ecc71",
  },
  stepCircleDone: {
    backgroundColor: "#14532d",
    borderColor: "#166534",
  },
  stepNumber: { color: "#6B7280", fontWeight: "700", fontSize: 13 },
  stepNumberActive: { color: "#fff" },
  stepCheck: { color: "#2ecc71", fontWeight: "700", fontSize: 13 },
  stepLabel: {
    marginTop: 6,
    fontSize: 10,
    color: "#4B5563",
    textAlign: "center",
    maxWidth: 64,
  },
  stepLabelActive: { color: "#2ecc71", fontWeight: "600" },

  progressTrack: {
    height: 2,
    backgroundColor: "#1f2937",
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: 2,
    backgroundColor: "#2ecc71",
    borderRadius: 2,
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
