import type React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import FeedScreen from "../screens/Feed/FeedScreen"
import EventStack from "./EventStack"
import PerfilScreen from "../screens/Perfil/PerfilScreen"

const Tab = createBottomTabNavigator()

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === "Início") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Eventos") {
            iconName = focused ? "calendar" : "calendar-outline"
          } else if (route.name === "Perfil") {
            iconName = focused ? "person" : "person-outline"
          } else {
            iconName = "help-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Início" component={FeedScreen} />
      <Tab.Screen name="Eventos" component={EventStack} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  )
}

export default MainTabs
