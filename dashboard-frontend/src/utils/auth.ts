import { jwtDecode } from 'jwt-decode'
import axios from 'axios'

interface JwtPayload {
  userId: number
  username: string
  role: 'admin' | 'editor' | 'viewer'
  exp: number
}

export const getUserData = (): JwtPayload | null => {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    return jwtDecode<JwtPayload>(token)
  } catch (error) {
    return null
  }
}

export const isAuthenticated = async (): Promise<boolean> => {
  const user = getUserData()
  if (!user) return false
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('http://localhost:5000/dashboard-data', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return Date.now() < user.exp * 1000 && response.status === 200
  } catch (err) {
    return false
  }
}

export const hasRole = (role: string): boolean => {
  const user = getUserData()
  return user?.role === role
}
