"use client"

import type React from "react"
import { createStackNavigator } from "@react-navigation/stack"
import { useUser } from "../contexts/UserContext"
import AuthStack from "./AuthStack"
import MainTabs from "./MainTabs"

const Stack = createStackNavigator()

const MainNavigator: React.FC = () => {
  const { isAuthenticated } = useUser()

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  )
}

export default MainNavigator
