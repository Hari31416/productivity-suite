import { useState, useEffect, useCallback } from 'react'

const USER_NAME_KEY = 'productivity_user_name'
const ONBOARDING_COMPLETED_KEY = 'productivity_onboarding_completed'

export interface UserProfile {
  userName: string
  hasCompletedOnboarding: boolean
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (typeof window === 'undefined') {
      return { userName: '', hasCompletedOnboarding: true }
    }
    const savedName = localStorage.getItem(USER_NAME_KEY) || ''
    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true'
    return {
      userName: savedName,
      hasCompletedOnboarding: completed
    }
  })

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_NAME_KEY || e.key === ONBOARDING_COMPLETED_KEY) {
        const savedName = localStorage.getItem(USER_NAME_KEY) || ''
        const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true'
        setProfile({
          userName: savedName,
          hasCompletedOnboarding: completed
        })
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const completeOnboarding = useCallback((name: string) => {
    const trimmed = name.trim()
    if (trimmed) {
      localStorage.setItem(USER_NAME_KEY, trimmed)
    }
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
    setProfile({
      userName: trimmed,
      hasCompletedOnboarding: true
    })
    window.dispatchEvent(new Event('user-profile-updated'))
  }, [])

  const setUserName = useCallback((name: string) => {
    const trimmed = name.trim()
    localStorage.setItem(USER_NAME_KEY, trimmed)
    setProfile((prev) => ({
      ...prev,
      userName: trimmed
    }))
    window.dispatchEvent(new Event('user-profile-updated'))
  }, [])

  return {
    userName: profile.userName,
    hasCompletedOnboarding: profile.hasCompletedOnboarding,
    completeOnboarding,
    setUserName
  }
}
