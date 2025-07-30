"use client"

import { NavigationContainer } from "@react-navigation/native"
import { StatusBar } from "expo-status-bar"
import * as SplashScreen from "expo-splash-screen"
import { useEffect, useState } from "react"
import { UserProvider } from "./src/contexts/UserContext"
import MainNavigator from "./src/navigation/MainNavigator"

// Previne que a splash screen seja escondida automaticamente
SplashScreen.preventAutoHideAsync()

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false)

  useEffect(() => {
    async function prepare() {
      try {
        // Aqui você pode carregar fontes, dados, etc.
        // Simula um carregamento
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (e) {
        console.warn(e)
      } finally {
        setAppIsReady(true)
      }
    }

    prepare()
  }, [])

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync()
    }
  }, [appIsReady])

  if (!appIsReady) {
    return null
  }

  return (
    <UserProvider>
      <NavigationContainer>
        <MainNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </UserProvider>
  )
}
