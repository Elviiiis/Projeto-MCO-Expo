"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "../../contexts/UserContext"

import { collection, getDocs } from "firebase/firestore"
import { db } from "../../../config/firebaseconfig"
import { useEffect } from "react"
import { onSnapshot } from "firebase/firestore"


interface UserEvent {
  id: string
  name: string
  role: "gestor" | "coordenador" | "aluno"
  color: string
}

const PerfilScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useUser()
const [userEvents, setUserEvents] = useState<UserEvent[]>([])

useEffect(() => {
  if (!user?.id) return;

  const unsubscribe = onSnapshot(collection(db, "events"), async (eventsSnapshot) => {
    const eventsWithUser: UserEvent[] = [];

    // Percorre os eventos para verificar se o usuário está em members
    for (const eventDoc of eventsSnapshot.docs) {
      // Busca subcoleção members do evento
      const membersSnapshot = await getDocs(collection(db, `events/${eventDoc.id}/members`));
      
      // Procura pelo membro que corresponde ao usuário atual
      const userMemberDoc = membersSnapshot.docs.find((m) => m.id === user.id);

      if (userMemberDoc) {
        const memberData = userMemberDoc.data();

        eventsWithUser.push({
          id: eventDoc.id,
          name: eventDoc.data().name || `Evento ${eventDoc.id}`,
          role: memberData.role,
          color:
            memberData.role === "gestor"
              ? "#FF9500"
              : memberData.role === "coordenador"
              ? "#007AFF"
              : "#FF3B30",
        });
      }
    }

    setUserEvents(eventsWithUser);
  });

  // Cleanup para parar a escuta quando componente desmontar ou usuário mudar
return () => unsubscribe();
}, [user]);



  const handleLogout = () => {
    Alert.alert("Sair", "Deseja realmente sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: logout,
      },
    ])
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "gestor":
        return "medal"
      case "coordenador":
        return "star"
      default:
        return "person"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "gestor":
        return "#FF9500"
      case "coordenador":
        return "#007AFF"
      default:
        return "#666"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "gestor":
        return "Gestor"
      case "coordenador":
        return "Coordenador"
      default:
        return "Aluno"
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImageText}>{user?.name?.charAt(0).toUpperCase() || ""}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.editImageButton}>
            <Ionicons name="camera" size={16} color="white" />
          </TouchableOpacity>
        </View>

        <Text style={styles.userName}>{user?.name || ""}</Text>
        <Text style={styles.userEmail}>{user?.email || ""}</Text>

        {!user?.isEmailVerified && (
          <View style={styles.verificationWarning}>
            <Ionicons name="warning" size={16} color="#FF9500" />
            <Text style={styles.verificationText}>Email não verificado</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações Pessoais</Text>

        <TouchableOpacity style={styles.infoItem}>
          <View style={styles.infoItemLeft}>
            <Ionicons name="person" size={20} color="#666" />
            <Text style={styles.infoItemLabel}>Nome</Text>
          </View>
          <View style={styles.infoItemRight}>
            <Text style={styles.infoItemValue}>{user?.name || ""}</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoItem}>
          <View style={styles.infoItemLeft}>
            <Ionicons name="mail" size={20} color="#666" />
            <Text style={styles.infoItemLabel}>Email</Text>
          </View>
          <View style={styles.infoItemRight}>
            <Text style={styles.infoItemValue}>{user?.email || ""}</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoItem}>
          <View style={styles.infoItemLeft}>
            <Ionicons name="card" size={20} color="#666" />
            <Text style={styles.infoItemLabel}>CPF</Text>
          </View>
          <View style={styles.infoItemRight}>
            <Text style={styles.infoItemValue}>{user?.cpf || ""}</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoItem}>
          <View style={styles.infoItemLeft}>
            <Ionicons name="lock-closed" size={20} color="#666" />
            <Text style={styles.infoItemLabel}>Alterar Senha</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meus Eventos ({userEvents.length})</Text>

        {userEvents.map((event) => (
          <TouchableOpacity key={event.id} style={styles.eventItem}>
            <View style={[styles.eventColor, { backgroundColor: event.color }]} />
            <View style={styles.eventInfo}>
              <Text style={styles.eventName}>{event.name}</Text>
              <View style={styles.eventRole}>
                <Ionicons name={getRoleIcon(event.role)} size={14} color={getRoleColor(event.role)} />
                <Text style={[styles.eventRoleText, { color: getRoleColor(event.role) }]}>
                  {getRoleLabel(event.role)}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configurações</Text>

        <TouchableOpacity style={styles.infoItem}>
          <View style={styles.infoItemLeft}>
            <Ionicons name="notifications" size={20} color="#666" />
            <Text style={styles.infoItemLabel}>Notificações</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoItem}>
          <View style={styles.infoItemLeft}>
            <Ionicons name="help-circle" size={20} color="#666" />
            <Text style={styles.infoItemLabel}>Ajuda e Suporte</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoItem}>
          <View style={styles.infoItemLeft}>
            <Ionicons name="information-circle" size={20} color="#666" />
            <Text style={styles.infoItemLabel}>Sobre o App</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color="#FF3B30" />
        <Text style={styles.logoutText}>Sair da Conta</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>MCO - Movimento Cultura Oeste</Text>
        <Text style={styles.footerVersion}>Versão 1.0.0</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    alignItems: "center",
    padding: 30,
    paddingTop: 50,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageText: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007AFF",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
  },
  verificationWarning: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#fff3cd",
    borderRadius: 20,
  },
  verificationText: {
    marginLeft: 5,
    fontSize: 12,
    color: "#FF9500",
    fontWeight: "500",
  },
  section: {
    backgroundColor: "white",
    marginTop: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoItemLabel: {
    marginLeft: 15,
    fontSize: 16,
    color: "#333",
  },
  infoItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoItemValue: {
    fontSize: 16,
    color: "#666",
    marginRight: 10,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  eventColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 15,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  eventRole: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventRoleText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    marginTop: 20,
    paddingVertical: 15,
  },
  logoutText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
    padding: 30,
  },
  footerText: {
    fontSize: 14,
    color: "#999",
    marginBottom: 5,
  },
  footerVersion: {
    fontSize: 12,
    color: "#ccc",
  },
})

export default PerfilScreen
