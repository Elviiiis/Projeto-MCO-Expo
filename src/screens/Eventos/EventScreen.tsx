"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import EventCard from "../../components/EventCard"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../../../config/firebaseconfig" // ajuste o caminho

export interface Event {
  id: string
  name: string
  category: string
  image?: string
  color?: string
  memberCount: number
  maxMembers: number
  createdBy: string
}

const EventScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [searchText, setSearchText] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")

  const categories = ["Todos", "Música", "Arte", "Esporte", "Teatro", "Dança"]

  useEffect(() => {
    // Escuta em tempo real na coleção "events"
    const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
      const eventsData: Event[] = []

      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        eventsData.push({
          id: doc.id,
          name: data.name,
          category: data.category,
          color: data.color ?? "#007AFF",
          image: data.image ?? null,
          memberCount: data.memberCount ?? 0,
          maxMembers: data.maxMembers ?? 30,
          createdBy: data.createdBy,
        })
      })

      setEvents(eventsData)
    }, (error) => {
      console.error("Erro ao buscar eventos:", error)
    })

    return () => unsubscribe() // cleanup no unmount
  }, [])

  useEffect(() => {
    filterEvents()
  }, [searchText, selectedCategory, events])

  const filterEvents = () => {
    let filtered = [...events]

    if (selectedCategory !== "Todos") {
      filtered = filtered.filter((event) => event.category === selectedCategory)
    }

    if (searchText) {
      filtered = filtered.filter((event) =>
        event.name.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    // Ordenar por popularidade (mais membros primeiro)
    filtered.sort((a, b) => b.memberCount - a.memberCount)

    setFilteredEvents(filtered)
  }

  const handleEventPress = (event: Event) => {
    navigation.navigate("EventDetail", { event })
  }

  const renderCategoryFilter = () => (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryButton, selectedCategory === item && styles.categoryButtonActive]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )

  const renderEvent = ({ item }: { item: Event }) => (
    <EventCard event={item} onPress={() => handleEventPress(item)} />
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar eventos..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate("CreateEvent")}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {renderCategoryFilter()}

      <FlatList
        data={filteredEvents}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
    padding: 15,
    backgroundColor: "white",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: "#007AFF",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    backgroundColor: "white",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  categoryButtonActive: {
    backgroundColor: "#007AFF",
  },
  categoryText: {
    fontSize: 14,
    color: "#666",
  },
  categoryTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  listContainer: {
    padding: 15,
  },
})

export default EventScreen
