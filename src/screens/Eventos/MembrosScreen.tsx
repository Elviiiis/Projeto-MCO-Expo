"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import {
  onSnapshot,
  doc,
  updateDoc,
  collection,
  deleteDoc,
  increment,
} from "firebase/firestore"
import { db } from "../../../config/firebaseconfig"
import { useRoute } from "@react-navigation/native"
import { getAuth } from "firebase/auth"

interface Member {
  id: string
  name: string
  role: "gestor" | "coordenador" | "aluno"
  profileImage?: string
  joinedAt: Date
}

interface MembrosScreenProps {
  eventId: string
}

const MembrosScreen: React.FC<MembrosScreenProps> = ({ eventId }) => {
  const route = useRoute()
  const [members, setMembers] = useState<Member[]>([])
  const [userRole, setUserRole] = useState<"gestor" | "coordenador" | "aluno" | null>(null)

  useEffect(() => {
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) return

    const memberRef = doc(db, `events/${eventId}/members/${user.uid}`)
    const unsubscribe = onSnapshot(memberRef, (snap) => {
      const data = snap.data()
      if (data?.role) {
        setUserRole(data.role)
      }
    })

    return () => unsubscribe()
  }, [eventId])

  useEffect(() => {
    const membersRef = collection(db, `events/${eventId}/members`)
    const unsubscribe = onSnapshot(membersRef, (snapshot) => {
      const membersList: Member[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name,
          role: data.role,
          profileImage: data.profileImage || null,
          joinedAt: data.joinedAt?.toDate?.() || new Date(),
        }
      })

      setMembers(membersList)
    })

    return () => unsubscribe()
  }, [eventId])

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

  const handlePromoteMember = (member: Member) => {
    if (userRole !== "gestor" && userRole !== "coordenador") return

    const newRole = member.role === "aluno" ? "coordenador" : "aluno"
    const action = newRole === "coordenador" ? "promover" : "rebaixar"

    Alert.alert(
      "Alterar Função",
      `Deseja ${action} ${member.name} ${newRole === "coordenador" ? "para Coordenador" : "para Aluno"}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              const memberRef = doc(db, `events/${eventId}/members/${member.id}`)
              await updateDoc(memberRef, { role: newRole })
              Alert.alert("Sucesso", `${member.name} agora é ${getRoleLabel(newRole)}`)
            } catch (error) {
              console.error("Erro ao atualizar função:", error)
              Alert.alert("Erro", "Não foi possível alterar a função.")
            }
          },
        },
      ]
    )
  }

  const handleRemoveMember = (member: Member) => {
    if (userRole !== "gestor" || member.role === "gestor") return

    Alert.alert("Remover Membro", `Deseja remover ${member.name} do evento?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            const memberRef = doc(db, `events/${eventId}/members/${member.id}`)
            const eventRef = doc(db, `events/${eventId}`)

            await deleteDoc(memberRef)
            await updateDoc(eventRef, {
              memberCount: increment(-1),
            })

            Alert.alert("Confirmado", `${member.name} foi removido do evento`)
          } catch (error) {
            console.error("Erro ao remover membro:", error)
            Alert.alert("Erro", "Não foi possível remover o membro.")
          }
        },
      },
    ])
  }

  const renderMember = ({ item }: { item: Member }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <View style={styles.avatarContainer}>
          {item.profileImage ? (
            <Image source={{ uri: item.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>{item.name}</Text>
          <View style={styles.roleContainer}>
            <Ionicons name={getRoleIcon(item.role)} size={14} color={getRoleColor(item.role)} />
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>{getRoleLabel(item.role)}</Text>
          </View>
          <Text style={styles.joinDate}>Membro desde {item.joinedAt.toLocaleDateString("pt-BR")}</Text>
        </View>
      </View>

      {(userRole === "gestor" || userRole === "coordenador") && item.role !== "gestor" && (
        <View style={styles.memberActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handlePromoteMember(item)}>
            <Ionicons name={item.role === "aluno" ? "arrow-up" : "arrow-down"} size={16} color="#007AFF" />
          </TouchableOpacity>

          {userRole === "gestor" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={() => handleRemoveMember(item)}
            >
              <Ionicons name="trash" size={16} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Membros ({members.length})</Text>
      <View style={styles.roleStats}>
        <View style={styles.roleStat}>
          <Ionicons name="medal" size={16} color="#FF9500" />
          <Text style={styles.roleStatText}>{members.filter((m) => m.role === "gestor").length} Gestor(es)</Text>
        </View>
        <View style={styles.roleStat}>
          <Ionicons name="star" size={16} color="#007AFF" />
          <Text style={styles.roleStatText}>
            {members.filter((m) => m.role === "coordenador").length} Coordenador(es)
          </Text>
        </View>
        <View style={styles.roleStat}>
          <Ionicons name="person" size={16} color="#666" />
          <Text style={styles.roleStatText}>{members.filter((m) => m.role === "aluno").length} Aluno(s)</Text>
        </View>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { backgroundColor: "white", padding: 20, marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 15 },
  roleStats: { flexDirection: "row", justifyContent: "space-between" },
  roleStat: { flexDirection: "row", alignItems: "center" },
  roleStatText: { marginLeft: 5, fontSize: 12, color: "#666" },
  listContainer: { paddingHorizontal: 15 },
  memberCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  memberInfo: { flex: 1, flexDirection: "row", alignItems: "center" },
  avatarContainer: { marginRight: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "white", fontSize: 18, fontWeight: "bold" },
  memberDetails: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 4 },
  roleContainer: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  roleText: { marginLeft: 5, fontSize: 14, fontWeight: "500" },
  joinDate: { fontSize: 12, color: "#999" },
  memberActions: { flexDirection: "row" },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  removeButton: { backgroundColor: "#ffe6e6" },
})

export default MembrosScreen
