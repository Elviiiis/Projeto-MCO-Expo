"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  FlatList,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { db } from "../../config/firebaseconfig"
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore"
import { useUser } from "../contexts/UserContext"

import type { Post } from "../screens/Feed/FeedScreen"

interface Comment {
  id: string
  authorName: string
  authorImage?: string | null
  content: string
  createdAt: any
}

interface PostItemProps {
  post: Post
  canComment: boolean
}

const PostItem: React.FC<PostItemProps> = ({ post, canComment }) => {
  const { user } = useUser()
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [postingComment, setPostingComment] = useState(false)

  // Função para formatar data como "x minutos atrás", etc (reuso da sua função)
  const formatTimeAgo = (date: any) => {
    if (!date) return ""
    const d = date.toDate ? date.toDate() : new Date(date)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - d.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "agora"
    if (diffInMinutes < 60) return `${diffInMinutes}m`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d`
  }

  // Load comments in realtime from Firestore
  useEffect(() => {
    if (!post.id || !post.eventId) return

    const commentsRef = collection(db, "events", post.eventId, "posts", post.id, "comments")
    const q = query(commentsRef, orderBy("createdAt", "asc"))

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const loadedComments: Comment[] = []
      querySnapshot.forEach((doc) => {
        loadedComments.push({ id: doc.id, ...doc.data() } as Comment)
      })
      setComments(loadedComments)
      setLoadingComments(false)
    })

    return () => unsubscribe()
  }, [post])

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert("Erro", "Digite um comentário válido")
      return
    }
    if (!user) {
      Alert.alert("Erro", "Usuário não autenticado")
      return
    }

    setPostingComment(true)
    try {
      const commentsRef = collection(db, "events", post.eventId, "posts", post.id, "comments")

      await addDoc(commentsRef, {
        authorName: user.name || "Usuário sem nome",
        authorImage: user.profileImage || null,
        content: newComment.trim(),
        createdAt: serverTimestamp(),
      })

      setNewComment("")
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error)
      Alert.alert("Erro ao adicionar comentário. Tente novamente.")
    }
    setPostingComment(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventName}>{post.eventName}</Text>
          <View style={styles.postType}>
            <Ionicons
              name={post.isPublic ? "megaphone" : "lock-closed"}
              size={12}
              color={post.isPublic ? "#007AFF" : "#666"}
            />
            <Text style={[styles.postTypeText, post.isPublic && styles.postTypePublic]}>
              {post.isPublic ? "Público" : "Membros"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.authorInfo}>
        <View style={styles.authorAvatar}>
          {post.authorImage ? (
            <Image source={{ uri: post.authorImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{post.authorName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.authorDetails}>
          <Text style={styles.authorName}>{post.authorName}</Text>
          <Text style={styles.postTime}>{formatTimeAgo(post.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.content}>{post.content}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowComments(!showComments)}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#666" />
          <Text style={styles.actionText}>
            {comments.length > 0 ? comments.length : "Comentar"}
          </Text>
        </TouchableOpacity>
      </View>

      {showComments && (
        <View style={styles.commentsSection}>
          {loadingComments ? (
            <Text>Carregando comentários...</Text>
          ) : (
            <>
              {comments.length === 0 && <Text>Nenhum comentário ainda.</Text>}

              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View key={item.id} style={styles.comment}>
                    <View style={styles.commentAvatar}>
                      {item.authorImage ? (
                        <Image source={{ uri: item.authorImage }} style={styles.commentAvatarImage} />
                      ) : (
                        <View style={styles.commentAvatarPlaceholder}>
                          <Text style={styles.commentAvatarText}>
                            {item.authorName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.commentContent}>
                      <Text style={styles.commentAuthor}>{item.authorName}</Text>
                      <Text style={styles.commentText}>{item.content}</Text>
                      <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt)}</Text>
                    </View>
                  </View>
                )}
                style={{ maxHeight: 200 }}
              />
            </>
          )}

          {/* Campo para comentar aparece só se o usuário puder */}
          {canComment && (
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Escreva um comentário..."
                value={newComment}
                onChangeText={setNewComment}
                editable={!postingComment}
              />
              <TouchableOpacity
                style={[styles.commentButton, postingComment && { opacity: 0.6 }]}
                onPress={handleAddComment}
                disabled={postingComment}
              >
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

// Seus estilos originais permanecem, só inclui estilos novos para comentários:

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    marginBottom: 10,
  },
  eventInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007AFF",
  },
  postType: {
    flexDirection: "row",
    alignItems: "center",
  },
  postTypeText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#666",
  },
  postTypePublic: {
    color: "#007AFF",
    fontWeight: "500",
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  authorAvatar: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  postTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
    marginBottom: 15,
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  commentsSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  comment: {
    flexDirection: "row",
    marginBottom: 12,
  },
  commentAvatar: {
    marginRight: 10,
  },
  commentAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  commentAvatarText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: "#999",
  },
  addCommentContainer: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 20,
    marginLeft: 8,
  },
})

export default PostItem
