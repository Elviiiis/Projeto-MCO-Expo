import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      {/* Ícone animado */}
      <Ionicons name="reload-circle" size={80} color="#007AFF" style={styles.icon} />
      
      {/* Texto */}
      <Text style={styles.text}>Carregando, por favor aguarde...</Text>

      {/* Spinner padrão do React Native (opcional) */}
      <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    // Você pode animar usando Reanimated ou Animated se quiser futuramente
  },
  text: {
    fontSize: 18,
    color: "#007AFF",
    marginTop: 15,
    fontWeight: "600",
  },
});

export default LoadingScreen;
