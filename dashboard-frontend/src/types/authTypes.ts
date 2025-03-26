export interface JwtPayload {
    userId: number
    username: string
    roleId: number
    exp: number
}
  
export interface Role {
    id: number
    name: string
    description: string
    permissions: number[]
}
  
export interface Permission {
    id: number
    name: string
    description: string
}
  
export interface AuthState {
    token: string | null
    user: JwtPayload | null
    isAuthenticated: boolean
    roles: Role[]
    permissions: Permission[]
}
  