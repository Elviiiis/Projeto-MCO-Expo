"use client"

import type React from "react"
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../config/firebaseconfig';
import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { useUser } from "../../contexts/UserContext"
import type { StackNavigationProp } from '@react-navigation/stack';


type AuthStackParamList = {
  Login: undefined;
  Cadastro: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};
const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useUser()

const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Erro", "Por favor, preencha todos os campos");
    return;
  }

  setLoading(true);
  try {
    const success = await login(email.trim(), password);
    if (success) {
      Alert.alert("Sucesso", `Bem-vindo(a)!`);
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } else {
      Alert.alert("Erro", "E-mail ou senha inválidos.");
    }
  } catch (error: any) {
    console.error("Erro no login:", error);
    Alert.alert("Erro", error.message || "Falha no login.");
  } finally {
    setLoading(false);
  }
};


  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>MCO</Text>
          <Text style={styles.subtitle}>Movimento Cultura Oeste</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate("Cadastro")}>
            <Text style={styles.linkText}>Não tem conta? Cadastre-se</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Use: admin@mco.com / 123456 para testar</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  form: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkButton: {
    alignItems: "center",
  },
  linkText: {
    color: "#007AFF",
    fontSize: 14,
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
})

export default LoginScreen
