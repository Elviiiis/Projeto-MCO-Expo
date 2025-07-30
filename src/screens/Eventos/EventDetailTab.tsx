import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";

import MuralScreen from "./MuralScreen";
import MembrosScreen from "./MembrosScreen";
import ChamadaScreen from "./ChamadaScreen";
import ArchiveScreen from "./ArchiveScreen";

interface EventDetailTabsProps {
  eventId: string;
}

const tabs = [
  { key: "Mural", title: "Mural" },
  { key: "Membros", title: "Membros" },
  { key: "Chamada", title: "Chamada" },
  { key: "Arquivos", title: "Arquivos" },
];

const screenWidth = Dimensions.get("window").width;

const EventDetailTabs: React.FC<EventDetailTabsProps> = ({ eventId }) => {
  const [activeTab, setActiveTab] = useState("Mural");

  const renderContent = () => {
    switch (activeTab) {
      case "Mural":
        return <MuralScreen eventId={eventId} />;
      case "Membros":
        return <MembrosScreen eventId={eventId} />
      case "Chamada":
        return <ChamadaScreen eventId={eventId} />;
      case "Arquivos":
        return <ArchiveScreen eventId={eventId} />;
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Barra de abas */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTabButton,
              // Largura igual pra cada botão (divide largura total pelo número de abas)
              { width: screenWidth / tabs.length },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab.key && styles.activeTabButtonText,
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conteúdo da aba */}
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tabButton: {
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomColor: "#007AFF",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
  },
  activeTabButtonText: {
    color: "#007AFF",
  },
});

export default EventDetailTabs;
