import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

type TabItem = {
  key: string;
  label: string;
  component: React.FC;
};

type Props = {
  tabs: TabItem[];
  setCurrentTab?: React.Dispatch<React.SetStateAction<string>>;
};

const TabsComponent: React.FC<Props> = ({ tabs,setCurrentTab }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const ActiveComponent = tabs.find(tab => tab.key === activeTab)?.component;

  useEffect(() => {

    setCurrentTab!(activeTab)


  }, [activeTab])
  
  return (
    <View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tabItem,
              activeTab === tab.key && styles.activeTabItem,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Render Active Tab Content */}
      <View style={styles.contentContainer}>
        {ActiveComponent ? <ActiveComponent /> : <Text>No component found</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabRow: {
    paddingHorizontal: 10,
    // paddingVertical: 12,
    alignItems: 'center',
    color:'#ffff'

  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#071E10',
  },
  activeTabItem: {
    backgroundColor: '#166534',
  },
  tabText: {
    fontSize: 14,
    color:'white'
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  contentContainer: {
    // flex: 1,
    padding: 20,
    color:'white',
    height:'90%',
  },
});

export default TabsComponent;
