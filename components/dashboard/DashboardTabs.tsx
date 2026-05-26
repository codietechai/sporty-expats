import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

type TabItem = {
  key: string;
  label: string;
  component: React.FC;
};

type Props = {
  tabs: TabItem[];
  setCurrentTab?: React.Dispatch<React.SetStateAction<string>>;
};

const TabsComponent: React.FC<Props> = ({ tabs, setCurrentTab }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const ActiveComponent = tabs.find((tab) => tab.key === activeTab)?.component;

  useEffect(() => {
    setCurrentTab?.(activeTab);
  }, [activeTab]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
        style={styles.tabScroll}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.content}>
        {ActiveComponent ? <ActiveComponent /> : <Text style={{ color: "#fff" }}>No component</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabScroll: { flexGrow: 0, flexShrink: 0 },
  tabRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    gap: 8,
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#071E10",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  tabItemActive: {
    backgroundColor: "#166534",
    borderColor: "#2ecc71",
  },
  tabText: { fontSize: 13, color: "#9CA3AF", fontWeight: "500" },
  tabTextActive: { color: "#fff", fontWeight: "700" },
  content: { flex: 1, paddingTop: 8 },
});

export default TabsComponent;
