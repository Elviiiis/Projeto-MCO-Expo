import type React from "react"
import { createStackNavigator } from "@react-navigation/stack"
import EventScreen from "../screens/Eventos/EventScreen"
import CreateEventScreen from "../screens/Eventos/CreateEventScreen"
import EventDetailScreen from "../screens/Eventos/EventDetailScreen"

const Stack = createStackNavigator()

const EventStack: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="EventList" component={EventScreen} options={{ title: "Eventos" }} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: "Criar Evento" }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: "Detalhes do Evento" }} />
    </Stack.Navigator>
  )
}

export default EventStack
