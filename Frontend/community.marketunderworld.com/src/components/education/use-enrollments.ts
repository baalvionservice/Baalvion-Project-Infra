"use client"

import { useAuth } from "@/context/auth-context"
import { useCallback, useEffect, useState } from "react"
import { edu, isUnauthorized, type Enrollment } from "@/lib/api/education"

export function useMyEnrollments() {
  const [items, setItems] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      setError("")
      setItems(await edu.myEnrollments())
    } catch (err) {
      if (isUnauthorized(err)) setNeedsLogin(true)
      else setError(err instanceof Error ? err.message : "Could not load your sessions")
    } finally {
      setLoading(false)
    }
  }, [])

  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Ask the API only once we know someone is signed in; a signed-out visitor just gets the sign-in prompt.
  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      setNeedsLogin(true)
      setLoading(false)
      return
    }
    load()
  }, [authLoading, isAuthenticated, load])

  const cancel = async (id: string) => {
    try {
      await edu.cancel(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel")
    }
  }

  return { items, loading, needsLogin, error, cancel }
}
