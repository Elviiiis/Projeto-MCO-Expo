import type React from "react"
import { createStackNavigator } from "@react-navigation/stack"
import LoginScreen from "../screens/Auth/LoginScreen"
import CadastroScreen from "../screens/Auth/CadastroScreen"

const Stack = createStackNavigator()

const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Cadastro" component={CadastroScreen} />
    </Stack.Navigator>
  )
}

export default AuthStack
