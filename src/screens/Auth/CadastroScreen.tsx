"use client"

import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, auth, } from '../../../config/firebaseconfig';
import { doc, setDoc } from 'firebase/firestore';
import type React from "react"
import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView,} from "react-native"
import { useUser } from "../../contexts/UserContext"
import { validateCPF, formatCPF } from "../../utils/validators"

const CadastroScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [cpf, setCpf] = useState("")
  const [loading, setLoading] = useState(false)
  const { register } = useUser()

const handleRegister = async () => {
  if (!name || !email || !password || !confirmPassword || !cpf) {
    Alert.alert("Erro", "Por favor, preencha todos os campos");
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert("Erro", "As senhas não coincidem");
    return;
  }

  if (password.length < 6) {
    Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
    return;
  }

  if (!validateCPF(cpf)) {
    Alert.alert("Erro", "CPF inválido");
    return;
  }

  setLoading(true);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: name });

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name,
      email,
      cpf,
      createdAt: new Date(),
    });

    Alert.alert("Sucesso", "Conta criada com sucesso!");
    navigation.navigate("Login");
  } catch (error: any) {
    console.error("Erro ao criar conta:", error);
    Alert.alert("Erro", error.message || "Não foi possível criar a conta.");
  } finally {
    setLoading(false);
  }
};


  const handleCpfChange = (text: string) => {
    const formatted = formatCPF(text)
    setCpf(formatted)
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Junte-se ao MCO</Text>
        </View>

        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Nome completo" value={name} onChangeText={setName} />

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
            placeholder="CPF"
            value={cpf}
            onChangeText={handleCpfChange}
            keyboardType="numeric"
            maxLength={14}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Criando conta..." : "Criar Conta"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkText}>Já tem conta? Faça login</Text>
          </TouchableOpacity>
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
    fontSize: 28,
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
})

export default CadastroScreen
