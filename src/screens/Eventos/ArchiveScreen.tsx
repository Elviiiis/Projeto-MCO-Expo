import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

interface MediaFile {
  id: string;
  type: "image" | "video" | "audio" | "pdf" | "document";
  title: string;
  link: string;
}

const mediaFiles: MediaFile[] = [
  {
    id: "1",
    type: "image",
    title: "Fotos do Evento",
    link: "https://drive.google.com/drive/fotos",
  },
  {
    id: "2",
    type: "video",
    title: "Gravação da Aula",
    link: "https://drive.google.com/drive/videos",
  },
  {
    id: "3",
    type: "audio",
    title: "Trilha Sonora",
    link: "https://drive.google.com/drive/audio",
  },
  {
    id: "4",
    type: "pdf",
    title: "Partitura PDF",
    link: "https://drive.google.com/drive/pdf",
  },
  {
    id: "5",
    type: "document",
    title: "Documentação",
    link: "https://drive.google.com/drive/docs",
  },
];

const getIcon = (type: MediaFile["type"]) => {
  switch (type) {
    case "image":
      return <Ionicons name="image" size={28} color="#007AFF" />;
    case "video":
      return <Ionicons name="videocam" size={28} color="#FF9500" />;
    case "audio":
      return <Ionicons name="musical-notes" size={28} color="#34C759" />;
    case "pdf":
      return <MaterialIcons name="picture-as-pdf" size={28} color="#FF3B30" />;
    case "document":
      return <FontAwesome5 name="file-alt" size={24} color="#8E8E93" />;
    default:
      return null;
  }
};

const MediaFilesScreen: React.FC = () => {
  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      alert("Não foi possível abrir o link.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Arquivos de Mídia</Text>
      </View>
      <FlatList
        contentContainerStyle={styles.listContainer}
        data={mediaFiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.recordCard}
            onPress={() => openLink(item.link)}
          >
            <View style={styles.recordHeader}>
              <Text style={styles.recordTitle}>{item.title}</Text>
              <Text style={styles.recordDate}>Tipo: {item.type}</Text>
            </View>
            <View style={styles.recordStats}>
              <View style={styles.stat}>{getIcon(item.type)}</View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default MediaFilesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  listContainer: {
    padding: 15,
  },
  recordCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: {
    marginBottom: 10,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  recordDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  recordStats: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
  },
});
