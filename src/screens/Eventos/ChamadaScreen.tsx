"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore"
import { db } from "../../../config/firebaseconfig"

interface AttendanceRecord {
  id: string
  date: string
  title: string
  attendances: { [memberId: string]: "presente" | "falta" | "pendente" }
}

interface Member {
  id: string
  name: string
  role: "gestor" | "coordenador" | "aluno"
}

interface ChamadaScreenProps {
  eventId: string
}

const ChamadaScreen: React.FC<ChamadaScreenProps> = ({ eventId }) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newActivityTitle, setNewActivityTitle] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)

  // Escutar membros em tempo real
  useEffect(() => {
    if (!eventId) return

    const membersCol = collection(db, "events", eventId, "members")
    const unsubscribe = onSnapshot(membersCol, (snapshot) => {
      const membersData: Member[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || "Sem nome",
          role: data.role || "aluno",
        }
      })
      setMembers(membersData)
    })

    return () => unsubscribe()
  }, [eventId])

  // Escutar registros de chamada (attendances) em tempo real, ordenados pela data decrescente
  useEffect(() => {
    if (!eventId) return

    const attendancesCol = collection(db, "events", eventId, "attendances")
    const q = query(attendancesCol, orderBy("date", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: AttendanceRecord[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          date: data.date,
          title: data.title,
          attendances: data.attendances || {},
        }
      })
      setAttendanceRecords(records)
    })

    return () => unsubscribe()
  }, [eventId])

  const createNewActivity = async () => {
    if (!newActivityTitle.trim()) {
      Alert.alert("Erro", "Digite o título da atividade")
      return
    }
    if (!eventId) {
      Alert.alert("Erro", "Evento inválido")
      return
    }

    try {
      // Inicializa o objeto de presenças com todos os membros como "pendente"
      const initialAttendances: { [key: string]: "presente" | "falta" | "pendente" } = {}
      members.forEach((member) => {
        initialAttendances[member.id] = "pendente"
      })

      const newRecord = {
        date: new Date().toISOString(),
        title: newActivityTitle.trim(),
        attendances: initialAttendances,
      }

      const attendancesCol = collection(db, "events", eventId, "attendances")
      const docRef = await addDoc(attendancesCol, newRecord)

      // Seleciona a nova atividade criada
      setSelectedRecord({ ...newRecord, id: docRef.id })
      setNewActivityTitle("")
      setShowCreateModal(false)
    } catch (error) {
      console.error("Erro ao criar nova atividade:", error)
      Alert.alert("Erro", "Não foi possível criar a atividade.")
    }
  }

  const updateAttendance = async (
    recordId: string,
    memberId: string,
    status: "presente" | "falta",
  ) => {
    if (!eventId) return

    try {
      const attendanceDocRef = doc(db, "events", eventId, "attendances", recordId)
      // Atualiza o campo attendances.memberId para o novo status
      await updateDoc(attendanceDocRef, {
        [`attendances.${memberId}`]: status,
      })
    } catch (error) {
      console.error("Erro ao atualizar presença:", error)
      Alert.alert("Erro", "Não foi possível atualizar a presença.")
    }
  }

  const getAttendanceStats = (record: AttendanceRecord) => {
    const attendances = Object.values(record.attendances)
    const presente = attendances.filter((a) => a === "presente").length
    const falta = attendances.filter((a) => a === "falta").length
    const pendente = attendances.filter((a) => a === "pendente").length

    return { presente, falta, pendente }
  }

  const getMemberStats = (memberId: string) => {
    let totalPresente = 0
    let totalFalta = 0
    let totalAtividades = 0

    attendanceRecords.forEach((record) => {
      const status = record.attendances[memberId]
      if (status === "presente") totalPresente++
      else if (status === "falta") totalFalta++
      if (status !== "pendente") totalAtividades++
    })

    const percentual = totalAtividades > 0 ? (totalPresente / totalAtividades) * 100 : 0
    return { totalPresente, totalFalta, percentual: Math.round(percentual) }
  }

  const renderAttendanceRecord = ({ item }: { item: AttendanceRecord }) => {
    const stats = getAttendanceStats(item)
    const isPending = stats.pendente > 0

    return (
      <TouchableOpacity
        style={[styles.recordCard, isPending && styles.recordCardPending]}
        onPress={() => setSelectedRecord(item)}
      >
        <View style={styles.recordHeader}>
          <Text style={styles.recordTitle}>{item.title}</Text>
          <Text style={styles.recordDate}>{new Date(item.date).toLocaleDateString("pt-BR")}</Text>
        </View>

        <View style={styles.recordStats}>
          <View style={styles.stat}>
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <Text style={styles.statText}>{stats.presente}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="close-circle" size={16} color="#FF3B30" />
            <Text style={styles.statText}>{stats.falta}</Text>
          </View>
          {stats.pendente > 0 && (
            <View style={styles.stat}>
              <Ionicons name="time" size={16} color="#FF9500" />
              <Text style={styles.statText}>{stats.pendente}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const renderMemberAttendance = ({ item }: { item: Member }) => {
    if (!selectedRecord) return null

    const status = selectedRecord.attendances[item.id]
    const stats = getMemberStats(item.id)

    return (
      <View style={styles.memberAttendanceCard}>
        <View style={styles.memberAttendanceInfo}>
          <Text style={styles.memberAttendanceName}>{item.name}</Text>
          <Text style={styles.memberAttendanceStats}>
            {stats.percentual}% de presença ({stats.totalPresente}/{stats.totalPresente + stats.totalFalta})
          </Text>
        </View>

        <View style={styles.attendanceButtons}>
          <TouchableOpacity
            style={[
              styles.attendanceButton,
              styles.presentButton,
              status === "presente" && styles.attendanceButtonActive,
            ]}
            onPress={() => selectedRecord && updateAttendance(selectedRecord.id, item.id, "presente")}
          >
            <Ionicons name="checkmark" size={20} color={status === "presente" ? "white" : "#34C759"} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.attendanceButton, styles.absentButton, status === "falta" && styles.attendanceButtonActive]}
            onPress={() => selectedRecord && updateAttendance(selectedRecord.id, item.id, "falta")}
          >
            <Ionicons name="close" size={20} color={status === "falta" ? "white" : "#FF3B30"} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (selectedRecord) {
    return (
      <View style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedRecord(null)}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.detailHeaderInfo}>
            <Text style={styles.detailTitle}>{selectedRecord.title}</Text>
            <Text style={styles.detailDate}>{new Date(selectedRecord.date).toLocaleDateString("pt-BR")}</Text>
          </View>
        </View>

        <FlatList
          data={members}
          renderItem={renderMemberAttendance}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Controle de Presença</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={attendanceRecords}
        renderItem={renderAttendanceRecord}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Atividade</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Ensaio, Aula de Técnica, etc."
              value={newActivityTitle}
              onChangeText={setNewActivityTitle}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalCreateButton} onPress={createNewActivity}>
                <Text style={styles.modalCreateText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

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
  createButton: {
    backgroundColor: "#007AFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
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
  recordCardPending: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
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
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  statText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#666",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    marginRight: 15,
  },
  detailHeaderInfo: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  detailDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  memberAttendanceCard: {
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
  memberAttendanceInfo: {
    flex: 1,
  },
  memberAttendanceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  memberAttendanceStats: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  attendanceButtons: {
    flexDirection: "row",
  },
  attendanceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    borderWidth: 2,
  },
  presentButton: {
    borderColor: "#34C759",
    backgroundColor: "white",
  },
  absentButton: {
    borderColor: "#FF3B30",
    backgroundColor: "white",
  },
  attendanceButtonActive: {
    backgroundColor: "#34C759",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    padding: 15,
    alignItems: "center",
    marginRight: 10,
  },
  modalCancelText: {
    color: "#666",
    fontSize: 16,
  },
  modalCreateButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 10,
  },
  modalCreateText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default ChamadaScreen
