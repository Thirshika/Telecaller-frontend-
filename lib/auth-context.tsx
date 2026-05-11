"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { type User, type UserRole, mockUsers } from "./mock-data"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<User | null>
  register: (name: string, email: string, password: string, role: string, mobile: string) => Promise<User | null>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize session from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("cems_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem("cems_user")
      }
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.status === "success") {
        setUser(data.user)
        localStorage.setItem("cems_user", JSON.stringify(data.user))
        setIsLoading(false)
        return data.user
      } else {
        setError(data.message || "Invalid email or password")
        setIsLoading(false)
        return null
      }
    } catch (err) {
      setError("Failed to connect to the server. Is the backend running?")
      setIsLoading(false)
      return null
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string, role: string, mobile: string): Promise<User | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role, mobile }),
      })

      const data = await response.json()

      if (response.ok && data.status === "success") {
        setUser(data.user)
        localStorage.setItem("cems_user", JSON.stringify(data.user))
        setIsLoading(false)
        return data.user
      } else {
        setError(data.message || "Registration failed")
        setIsLoading(false)
        return null
      }
    } catch (err) {
      setError("Failed to connect to the server.")
      setIsLoading(false)
      return null
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setError(null)
    localStorage.removeItem("cems_user")
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function getRoleRedirectPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard"
    case "telecaller":
      return "/telecaller/dashboard"
    case "spoc":
    case "spoc" as any:
    case "spoke" as any: // Handle legacy role name
      return "/spoc/dashboard"
    default:
      return "/login"
  }
}
