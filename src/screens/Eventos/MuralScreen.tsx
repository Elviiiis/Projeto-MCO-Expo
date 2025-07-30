import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  Image,
  Switch,
} from "react-native"
import { Ionicons, Feather } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  query,
  orderBy,
  deleteDoc,
} from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db } from "../../../config/firebaseconfig"
import { useUser } from "../../contexts/UserContext"

const storage = getStorage()

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

interface MuralScreenProps {
  eventId: string
}

interface Post {
  id: string
  content: string
  authorName: string
  authorId: string
  createdAt: any
  imageUrl?: string
  isPublic?: boolean
}

interface Comment {
  id: string
  content: string
  authorName: string
  authorId?: string
  createdAt: any
}

const MuralScreen: React.FC<MuralScreenProps> = ({ eventId }) => {
  const { user } = useUser()
  const [posts, setPosts] = useState<Post[]>([])
  const [postContent, setPostContent] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [role, setRole] = useState<"aluno" | "coordenador" | "gestor" | "">("")
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [membersMap, setMembersMap] = useState<Record<string, { role: string }>>({})

  // Busca membros e seta role do usuário
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(collection(db, `events/${eventId}/members`), (snapshot) => {
      const map: Record<string, { role: string }> = {}
      snapshot.forEach((doc) => {
        const data = doc.data()
        map[doc.id] = { role: data.role }
      })
      setMembersMap(map)

      if (map[user.id]) {
        setRole(map[user.id].role as "aluno" | "coordenador" | "gestor")
      } else {
        setRole("aluno")
      }
    })
    return () => unsub()
  }, [eventId, user])

  // Busca posts
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "events", eventId, "posts"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const fetchedPosts: Post[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Post),
        }))
        setPosts(fetchedPosts)
      }
    )
    return () => unsubscribe()
  }, [eventId])

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    })
    if (!result.canceled && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri)
    }
  }

  const handleCreatePost = async () => {
    if (!postContent.trim() && !selectedImage) return

    try {
      let imageUrl = ""

      if (selectedImage) {
        const response = await fetch(selectedImage)
        const blob = await response.blob()
        const imageRef = ref(storage, `events/${eventId}/posts/${Date.now()}.jpg`)
        await uploadBytes(imageRef, blob)
        imageUrl = await getDownloadURL(imageRef)
      }

      await addDoc(collection(db, "events", eventId, "posts"), {
        content: postContent.trim(),
        authorName: user?.name || "Anônimo",
        createdAt: serverTimestamp(),
        authorId: user?.id,
        imageUrl,
        isPublic,
      })
      setPostContent("")
      setSelectedImage(null)
      setIsPublic(true) // resetar para público depois de postar
    } catch (error) {
      Alert.alert("Erro ao postar", String(error))
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, "events", eventId, "posts", postId))
      setModalVisible(false)
    } catch (error) {
      Alert.alert("Erro ao deletar", String(error))
    }
  }

  const CommentSection: React.FC<{ postId: string }> = ({ postId }) => {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState("")

    useEffect(() => {
      const unsubscribe = onSnapshot(
        query(collection(db, "events", eventId, "posts", postId, "comentarios"), orderBy("createdAt", "asc")),
        (snapshot) => {
          const fetchedComments = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Comment),
          }))
          setComments(fetchedComments)
        }
      )
      return () => unsubscribe()
    }, [postId])

    const handleAddComment = async () => {
      if (!newComment.trim()) return

      try {
        await addDoc(collection(db, "events", eventId, "posts", postId, "comentarios"), {
          content: newComment.trim(),
          authorName: user?.name || "Anônimo",
          createdAt: serverTimestamp(),
          authorId: user?.id,
        })
        setNewComment("")
      } catch (error) {
        Alert.alert("Erro ao comentar", String(error))
      }
    }

    return (
      <View style={{ marginTop: 10 }}>
        {comments.map((comment) => (
          <View key={comment.id} style={styles.comment}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <Text style={styles.commentAuthor}>{comment.authorName}</Text>
              {membersMap[comment.authorId || ""]?.role && (
                <Ionicons
                  name={getRoleIcon(membersMap[comment.authorId || ""]?.role || "")}
                  size={14}
                  color={getRoleColor(membersMap[comment.authorId || ""]?.role || "")}
                  style={{ marginLeft: 6 }}
                />
              )}
            </View>

            <Text>{comment.content}</Text>
          </View>
        ))}

        <TextInput
          style={styles.input}
          placeholder="Comentar..."
          value={newComment}
          onChangeText={setNewComment}
        />
        <Button title="Enviar Comentário" onPress={handleAddComment} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {(role === "coordenador" || role === "gestor") && (
        <View style={styles.postBox}>
          <TextInput
            placeholder="Escreva um post..."
            style={styles.input}
            multiline
            value={postContent}
            onChangeText={setPostContent}
          />
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              thumbColor={isPublic ? "#007AFF" : "#ccc"}
            />
            <Text style={{ marginLeft: 8, fontSize: 16 }}>Post público</Text>
          </View>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={{ width: "100%", height: 200, borderRadius: 8, marginBottom: 10 }}
              resizeMode="cover"
            />
          )}
          <View style={styles.buttonContainer}>
            <Button title="Selecionar Imagem" onPress={pickImage} />
            <Button title="Publicar" onPress={handleCreatePost} />
          </View>
        </View>
      )}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <Text style={styles.postAuthor}>{item.authorName}</Text>
                  {membersMap[item.authorId]?.role && (
                    <Ionicons
                      name={getRoleIcon(membersMap[item.authorId].role)}
                      size={14}
                      color={getRoleColor(membersMap[item.authorId].role)}
                      style={{ marginLeft: 6 }}
                    />
                  )}
                </View>
                {item.isPublic === false && (
                  <Text style={{ color: "#999", fontSize: 12, marginBottom: 6 }}>🔒 Post privado</Text>
                )}
                <Text style={styles.postContent}>{item.content}</Text>
                {item.imageUrl && (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: "100%", height: 200, borderRadius: 8, marginTop: 8 }}
                    resizeMode="cover"
                  />
                )}
              </View>
              {(item.authorId === user?.id || role === "gestor" || role === "coordenador") && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedPostId(item.id)
                    setModalVisible(true)
                  }}
                >
                  <Feather name="more-vertical" size={22} color="#555" />
                </TouchableOpacity>
              )}
            </View>
            <CommentSection postId={item.id} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => {
                if (selectedPostId) handleDeletePost(selectedPostId)
              }}
              style={styles.modalOption}
            >
              <Feather name="trash" size={18} color="red" />
              <Text style={{ marginLeft: 10, color: "red" }}>Excluir Postagem</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={[styles.modalOption, { marginTop: 10 }]}
            >
              <Feather name="x-circle" size={18} color="#333" />
              <Text style={{ marginLeft: 10 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 12,
  },
  postBox: {
    marginBottom: 15,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    elevation: 3,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: "white",
    fontSize: 16,
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    borderRadius: 20,
    backgroundColor: "#007AFF",
  },
  postContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  postAuthor: {
    fontWeight: "700",
    fontSize: 16,
    color: "#007AFF",
    marginBottom: 4,
  },
  postContent: {
    fontSize: 15,
    color: "#333",
    marginBottom: 10,
  },
  comment: {
    backgroundColor: "#e6f0ff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  commentAuthor: {
    fontWeight: "600",
    color: "#0051a8",
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    width: "80%",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
  },
})

export default MuralScreen
