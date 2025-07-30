"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth"
import { auth, db } from "../../config/firebaseconfig"
import { doc, getDoc } from "firebase/firestore"


export interface User {
  id: string
  name: string
  email: string
  cpf: string
  profileImage?: string
  isEmailVerified: boolean
}

export interface UserContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: RegisterData) => Promise<boolean>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<boolean>
}

export interface RegisterData {
  name: string
  email: string
  password: string
  cpf: string
  profileImage?: string
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Função para carregar dados do Firestore com base no FirebaseUser.uid
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User> => {
    const userDocRef = doc(db, "users", firebaseUser.uid)
    const userDocSnap = await getDoc(userDocRef)
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data()
      return {
        id: firebaseUser.uid,
        name: userData.name ?? firebaseUser.displayName ?? "",
        email: userData.email ?? firebaseUser.email ?? "",
        cpf: userData.cpf ?? "",
        profileImage: userData.profileImage ?? firebaseUser.photoURL ?? "",
        isEmailVerified: firebaseUser.emailVerified,
      }
    } else {
      return {
        id: firebaseUser.uid,
        name: firebaseUser.displayName ?? "",
        email: firebaseUser.email ?? "",
        cpf: "",
        profileImage: firebaseUser.photoURL ?? "",
        isEmailVerified: firebaseUser.emailVerified,
      }
    }
  }

  // Efeito para observar mudança de usuário autenticado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const newUser = await fetchUserData(firebaseUser)
        setUser(newUser)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      const newUser = await fetchUserData(firebaseUser)
      setUser(newUser)
      setIsAuthenticated(true)
      return true
    } catch (error) {
      console.error("Erro no login Firebase:", error)
      return false
    }
  }

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      // Aqui você deve ter o registro com Firebase Authentication + Firestore em outro lugar
      // Apenas atualiza o estado local após registro com sucesso
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        cpf: userData.cpf,
        profileImage: userData.profileImage,
        isEmailVerified: false,
      }
      setUser(newUser)
      setIsAuthenticated(true)
      return true
    } catch (error) {
      console.error("Erro no cadastro:", error)
      return false
    }
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (user) {
        const updatedUser = { ...user, ...userData }
        setUser(updatedUser)
        return true
      }
      return false
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      return false
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = (): UserContextType => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
export default UserContext 