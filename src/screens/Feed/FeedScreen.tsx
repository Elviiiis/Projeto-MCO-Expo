"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Animated,
} from "react-native"
import { AntDesign } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useUser } from "../../contexts/UserContext"
import PostItem from "../../components/PostItem"
import { db } from "../../../config/firebaseconfig"
import {
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore"
import CommentsList from "./commentsList"

export interface Post {
  id: string
  eventId: string
  eventName: string
  authorName: string
  authorImage?: string
  content: string
  isPublic: boolean
  createdAt: Date
  comments: any[]
}

export interface ShortEvent {
  id: string
  name: string
  image?: string
  color?: string
}

const FeedScreen: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [publicEvents, setPublicEvents] = useState<ShortEvent[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useUser()
  const navigation = useNavigation<any>()

  const scrollY = useRef(new Animated.Value(0)).current
  const flatListRef = useRef<FlatList>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 0],
    extrapolate: "clamp",
  })

  const loadUserEvents = async () => {
    if (!user?.id) return

    const eventsWithUser: ShortEvent[] = []
    const eventsSnapshot = await getDocs(collection(db, "events"))

    for (const eventDoc of eventsSnapshot.docs) {
      const membersSnapshot = await getDocs(
        collection(db, `events/${eventDoc.id}/members`)
      )
      const userMemberDoc = membersSnapshot.docs.find((m) => m.id === user.id)

      if (userMemberDoc) {
        const data = eventDoc.data()
        eventsWithUser.push({
          id: eventDoc.id,
          name: data.name || `Evento ${eventDoc.id}`,
          image: data.image || undefined,
          color: data.color || "#ccc",
        })
      }
    }

    setPublicEvents(eventsWithUser)
  }

  const loadPosts = async () => {
    try {
      const muralQuery = query(
        collectionGroup(db, "posts"),
        where("isPublic", "==", true)
      )

      const muralSnap = await getDocs(muralQuery)
      const postsData: Post[] = []

      for (const muralDoc of muralSnap.docs) {
        const muralData = muralDoc.data()
        const pathSegments = muralDoc.ref.path.split("/")
        const eventId = pathSegments[1]
        const eventRef = doc(db, "events", eventId)
        const eventSnap = await getDoc(eventRef)
        const eventName = eventSnap.exists()
          ? eventSnap.data().name
          : "Evento Desconhecido"

        postsData.push({
          id: muralDoc.id,
          eventId,
          eventName,
          authorName: muralData.authorName || "Anônimo",
          authorImage: muralData.authorImage || undefined,
          content: muralData.content || "",
          createdAt: muralData.createdAt?.toDate?.() || new Date(),
          isPublic: muralData.isPublic,
          comments: [],
        })
      }

      postsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setPosts(postsData)
    } catch (error) {
      console.error("Erro ao carregar posts do mural:", error)
    }
  }

  useEffect(() => {
    loadUserEvents()
    loadPosts()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadUserEvents()
    await loadPosts()
    setRefreshing(false)
  }

  const renderPost = ({ item }: { item: Post }) => (
    <PostItem post={item} onCommentPress={() => {}} />
  )
  

  const EventsHeader = () => (
    <View style={styles.eventsHeader}>
      <FlatList
        data={publicEvents}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.eventIconContainer}
            onPress={() =>
              navigation.navigate("Eventos", {
                screen: "EventDetail",
                params: { event: item },
              })
            }
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.eventIcon} />
            ) : (
              <View
                style={[
                  styles.eventIcon,
                  styles.defaultIcon,
                  { backgroundColor: item.color || "#ccc" },
                ]}
              >
                <Text style={styles.eventIconText}>{item.name[0]}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  )

  const ListHeader = () => (
    <Animated.View style={[styles.header, { height: headerHeight }]}>
      <Text style={styles.title}>Feed MCO</Text>
      <Text style={styles.subtitle}>Bem-vindo, {user?.name}!</Text>
      <EventsHeader />
    </Animated.View>
  )

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y
    setShowScrollTop(offsetY > 250)
  }

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={posts}
        ListHeaderComponent={ListHeader}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
            listener: handleScroll,
          }
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollToTopButton}
          onPress={() =>
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
          }
        >
          <AntDesign name="arrowup" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 100,
  },
  scrollToTopButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 30,
    elevation: 4,
  },
  eventsHeader: {
    marginTop: 10,
    marginBottom: 10,
  },
  eventIconContainer: {
    marginRight: 10,
  },
  eventIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  eventIconText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
})

export default FeedScreen
