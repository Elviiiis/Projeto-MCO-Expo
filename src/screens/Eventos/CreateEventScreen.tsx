"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { db, auth } from "../../../config/firebaseconfig" // ajuste o caminho
import { collection, addDoc } from "firebase/firestore"
import { addMemberToEvent } from "../../utils/AddMemberToEvent" // ajuste o caminho correto


const CreateEventScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [maxMembers, setMaxMembers] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState("#007AFF")
  const [loading, setLoading] = useState(false)

  const categories = ["Música", "Arte", "Esporte", "Teatro", "Dança", "Outro"]
  const colors = ["#007AFF", "#FF3B30", "#34C759", "#FF9500", "#AF52DE", "#FF2D92"]

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    })

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri)
    }
  }

  const handleCreateEvent = async () => {
    if (!name || !category || !maxMembers) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios")
      return
    }

    if (Number.parseInt(maxMembers) < 1) {
      Alert.alert("Erro", "O número máximo de membros deve ser maior que 0")
      return
    }

    setLoading(true)

    try {
      const user = auth.currentUser
      if (!user) throw new Error("Usuário não autenticado")

      const newEvent = {
        name,
        category,
        maxMembers: Number.parseInt(maxMembers),
        image: selectedImage,
        color: selectedImage ? undefined : selectedColor,
        memberCount: 1, // O criador já é membro
        createdBy: user.uid,
        createdAt: new Date(),
      }

      const docRef = await addDoc(collection(db, "events"), newEvent)

      // Adiciona o usuário autenticado como membro "gestor"
      await addMemberToEvent(
        {
          id: user.uid,
          name: user.displayName || "Usuário sem nome",
          email: user.email || "",
          cpf: "", // ajustar se tiver essa info
          profileImage: user.photoURL || null,
        },
        docRef.id,
        "gestor" // papel do criador
      )

      Alert.alert("Sucesso", "Evento criado com sucesso!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (error) {
      console.error(error)
      Alert.alert("Erro", "Erro ao criar evento. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Nome do Evento *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Digite o nome do evento"
        />

        <Text style={styles.label}>Categoria *</Text>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryButton, category === cat && styles.categoryButtonSelected]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[styles.categoryButtonText, category === cat && styles.categoryButtonTextSelected]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Máximo de Membros *</Text>
        <TextInput
          style={styles.input}
          value={maxMembers}
          onChangeText={setMaxMembers}
          placeholder="Ex: 30"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Imagem do Evento</Text>
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={40} color="#666" />
              <Text style={styles.imagePlaceholderText}>Adicionar Imagem</Text>
            </View>
          )}
        </TouchableOpacity>

        {!selectedImage && (
          <>
            <Text style={styles.label}>Ou escolha uma cor</Text>
            <View style={styles.colorContainer}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorButtonSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateEvent}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>{loading ? "Criando..." : "Criar Evento"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: "white",
    marginBottom: 20,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 10,
    marginBottom: 10,
  },
  categoryButtonSelected: {
    backgroundColor: "#007AFF",
  },
  categoryButtonText: {
    color: "#666",
    fontSize: 14,
  },
  categoryButtonTextSelected: {
    color: "white",
    fontWeight: "bold",
  },
  imageButton: {
    marginBottom: 20,
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  colorContainer: {
    flexDirection: "row",
    marginBottom: 30,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorButtonSelected: {
    borderColor: "#333",
  },
  createButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#ccc",
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default CreateEventScreen
