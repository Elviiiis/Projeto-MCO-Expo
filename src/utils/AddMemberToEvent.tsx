import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../config/firebaseconfig"

export async function addMemberToEvent(user: {
  id: string
  name: string
  email: string
  cpf: string
  profileImage?: string | null
}, eventId: string) {
  if (!user) {
    console.warn("Usuário não autenticado")
    return
  }

  const memberRef = doc(db, "events", eventId, "members", user.id)

  await setDoc(memberRef, {
    name: user.name,
    role: "gestor", // função padrão
    profileImage: user.profileImage ?? null,
    joinedAt: serverTimestamp(),
    email: user.email,
    cpf: user.cpf,
  })

  console.log(`Usuário ${user.name} adicionado como membro do evento ${eventId}`)
}
