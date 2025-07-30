import type React from "react"
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { Event } from "../screens/Eventos/EventScreen"

interface EventCardProps {
  event: Event
  onPress: () => void
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const isFull = event.memberCount >= event.maxMembers
  const isPopular = event.memberCount > 20

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        {event.image ? (
          <Image source={{ uri: event.image }} style={styles.eventImage} />
        ) : (
          <View style={[styles.eventImagePlaceholder, { backgroundColor: event.color }]} />
        )}

        {isPopular && (
          <View style={styles.popularBadge}>
            <Ionicons name="flame" size={12} color="white" />
            <Text style={styles.popularText}>Popular</Text>
          </View>
        )}

        {isFull && (
          <View style={styles.fullBadge}>
            <Text style={styles.fullText}>Lotado</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.eventName} numberOfLines={2}>
          {event.name}
        </Text>

        <View style={styles.categoryContainer}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
        </View>

        <View style={styles.memberInfo}>
          <Ionicons name="people" size={16} color="#666" />
          <Text style={styles.memberCount}>
            {event.memberCount}/{event.maxMembers} membros
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(event.memberCount / event.maxMembers) * 100}%`,
                  backgroundColor: isFull ? "#FF3B30" : "#34C759",
                },
              ]}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    height: 120,
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  eventImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  popularBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#FF9500",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
  },
  fullBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fullText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  content: {
    padding: 15,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  categoryContainer: {
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  memberCount: {
    marginLeft: 6,
    fontSize: 14,
    color: "#666",
  },
  progressContainer: {
    marginTop: 5,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
})

export default EventCard
