export type UserRole = "gestor" | "coordenador" | "aluno"

export interface RolePermissions {
  canCreatePosts: boolean
  canManageMembers: boolean
  canMarkAttendance: boolean
  canPromoteMembers: boolean
  canRemoveMembers: boolean
  canAccessFiles: boolean
}

export const getRolePermissions = (role: UserRole): RolePermissions => {
  switch (role) {
    case "gestor":
      return {
        canCreatePosts: true,
        canManageMembers: true,
        canMarkAttendance: true,
        canPromoteMembers: true,
        canRemoveMembers: true,
        canAccessFiles: true,
      }

    case "coordenador":
      return {
        canCreatePosts: true,
        canManageMembers: false,
        canMarkAttendance: true,
        canPromoteMembers: false,
        canRemoveMembers: false,
        canAccessFiles: true,
      }

    case "aluno":
    default:
      return {
        canCreatePosts: false,
        canManageMembers: false,
        canMarkAttendance: false,
        canPromoteMembers: false,
        canRemoveMembers: false,
        canAccessFiles: true,
      }
  }
}

export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case "gestor":
      return "Gestor"
    case "coordenador":
      return "Coordenador"
    case "aluno":
      return "Aluno"
    default:
      return "Usuário"
  }
}

export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case "gestor":
      return "#FF9500"
    case "coordenador":
      return "#007AFF"
    case "aluno":
      return "#666"
    default:
      return "#999"
  }
}
