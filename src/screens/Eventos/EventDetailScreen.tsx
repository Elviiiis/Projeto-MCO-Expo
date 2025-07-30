"use client"

import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import LoadingScreen from "../../utils/LoadingScreen"
import EventDetailTabs from "./EventDetailTab"

import { useUser } from "../../contexts/UserContext"
import { doc, setDoc, updateDoc, increment, serverTimestamp, getDoc, deleteDoc, onSnapshot } from "firebase/firestore"
import { db } from "../../../config/firebaseconfig"

const EventDetailScreen: React.FC<EventDetailScreenProps> = ({ route, navigation }) => {
  const { event: eventParam } = route.params

  // Estado local do evento que será atualizado em tempo real
  const [event, setEvent] = useState(eventParam)
  const [userRole, setUserRole] = useState<"gestor" | "coordenador" | "aluno">("aluno")
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(true)

  const { user } = useUser()

  // Listener para atualização em tempo real dos dados do evento
  useEffect(() => {
    const eventRef = doc(db, "events", eventParam.id)
    const unsubscribe = onSnapshot(eventRef, (docSnap) => {
      if (docSnap.exists()) {
        setEvent({ id: docSnap.id, ...docSnap.data() })
      }
    })
    return () => unsubscribe()
  }, [eventParam.id])

  // Verifica se o usuário é membro e qual sua função
  useEffect(() => {
    const checkMembership = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      const memberRef = doc(db, "events", eventParam.id, "members", user.id)
      const memberSnap = await getDoc(memberRef)
      if (memberSnap.exists()) {
        setIsMember(true)
        const memberData = memberSnap.data()
        setUserRole(memberData.role || "aluno")
      } else {
        setIsMember(false)
      }
      setLoading(false)
    }
    checkMembership()
  }, [eventParam.id, user])

  // Função para adicionar usuário ao evento no Firestore
  const addMemberToEvent = async () => {
    if (!user) {
      Alert.alert("Erro", "Você precisa estar logado para participar do evento.")
      return
    }

    if ((event.memberCount ?? 0) >= event.maxMembers) {
      Alert.alert("Evento Lotado", "Este evento já atingiu o número máximo de membros.")
      return
    }

    try {
      const memberRef = doc(db, "events", event.id, "members", user.id)
      await setDoc(memberRef, {
        name: user.name,
        role: "aluno",
        profileImage: user.profileImage ?? null,
        joinedAt: serverTimestamp(),
        email: user.email,
        cpf: user.cpf,
      })

      const eventRef = doc(db, "events", event.id)
      await updateDoc(eventRef, {
        memberCount: increment(1),
      })

      setIsMember(true)
      Alert.alert("Sucesso", "Você agora faz parte deste evento!")
    } catch (error) {
      console.error("Erro ao entrar no evento:", error)
      Alert.alert("Erro", "Não foi possível participar do evento. Tente novamente.")
    }
  }

  const handleJoinEvent = () => {
    Alert.alert("Participar do Evento", `Deseja participar do evento "${event.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Participar",
        onPress: addMemberToEvent,
      },
    ])
  }

  const handleLeaveEvent = () => {
    Alert.alert("Sair do Evento", `Deseja sair do evento "${event.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            if (!user) return

            const memberRef = doc(db, "events", event.id, "members", user.id)
            await deleteDoc(memberRef)

            const eventRef = doc(db, "events", event.id)
            await updateDoc(eventRef, {
              memberCount: increment(-1),
            })

            setIsMember(false)
            Alert.alert("Confirmado", "Você saiu do evento.")
          } catch (error) {
            console.error("Erro ao sair do evento:", error)
            Alert.alert("Erro", "Não foi possível sair do evento. Tente novamente.")
          }
        },
      },
    ])
  }

  const handleDeleteEvent = () => {
    Alert.alert(
      "Excluir Evento",
      `Tem certeza que deseja excluir o evento "${event.name}"? Essa ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const eventRef = doc(db, "events", event.id)
              await deleteDoc(eventRef)

              Alert.alert("Evento excluído com sucesso!")
              navigation.goBack()
            } catch (error) {
              console.error("Erro ao excluir o evento:", error)
              Alert.alert("Erro", "Não foi possível excluir o evento. Tente novamente.")
            }
          },
        },
      ]
    )
  }

  const EventHeader = () => (
    <View style={styles.header}>
      {event.image ? (
        <Image source={{ uri: event.image }} style={styles.eventImage} />
      ) : (
        <View style={[styles.eventImage, { backgroundColor: event.color }]} />
      )}

      <View style={styles.eventInfo}>
        <Text style={styles.eventName}>{event.name}</Text>
        <Text style={styles.eventCategory}>{event.category}</Text>
        <Text style={styles.memberCount}>
          {event.memberCount ?? 0}/{event.maxMembers} membros
        </Text>
      </View>

      {!isMember ? (
        <TouchableOpacity style={styles.joinButton} onPress={handleJoinEvent}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.joinButtonText}>Participar</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveEvent}>
            <Ionicons name="exit-outline" size={20} color="#FF3B30" />
            <Text style={styles.leaveButtonText}>Sair</Text>
          </TouchableOpacity>

          {userRole === "gestor" && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteEvent}>
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )

  if (loading) {
    return <LoadingScreen />
  }

  if (!isMember) {
    return (
      <View style={styles.container}>
        <EventHeader />
        <View style={styles.notMemberContainer}>
          <Ionicons name="lock-closed" size={60} color="#ccc" />
          <Text style={styles.notMemberText}>
            Você precisa participar do evento para acessar o conteúdo
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <EventHeader />
      <EventDetailTabs eventId={event.id} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  eventImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  eventInfo: {
    flex: 1,
    marginLeft: 15,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  eventCategory: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  memberCount: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  joinButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    color: "white",
    marginLeft: 5,
    fontWeight: "bold",
  },
  leaveButton: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FF3B30",
    marginRight: 10,
  },
  leaveButtonText: {
    color: "#FF3B30",
    marginLeft: 5,
    fontWeight: "bold",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  notMemberContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  notMemberText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
})

export default EventDetailScreen
