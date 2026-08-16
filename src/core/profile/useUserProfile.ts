import { useState, useEffect, useCallback } from 'react'

const USER_NAME_KEY = 'productivity_user_name'
const ONBOARDING_COMPLETED_KEY = 'productivity_onboarding_completed'

export interface UserProfile {
  userName: string
  hasCompletedOnboarding: boolean
}

function getStoredProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return { userName: '', hasCompletedOnboarding: true }
  }
  const savedName = localStorage.getItem(USER_NAME_KEY) || ''
  const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true'
  return {
    userName: savedName,
    hasCompletedOnboarding: completed
  }
}

// Active listeners across all hook instances in the application
const listeners = new Set<(profile: UserProfile) => void>()

function notifyListeners(profile: UserProfile) {
  for (const listener of listeners) {
    listener(profile)
  }
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile)

  useEffect(() => {
    const handleUpdate = (updatedProfile: UserProfile) => {
      setProfile(updatedProfile)
    }

    listeners.add(handleUpdate)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_NAME_KEY || e.key === ONBOARDING_COMPLETED_KEY) {
        const next = getStoredProfile()
        setProfile(next)
        notifyListeners(next)
      }
    }

    const handleCustomEvent = () => {
      const next = getStoredProfile()
      setProfile(next)
      notifyListeners(next)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('user-profile-updated', handleCustomEvent)

    return () => {
      listeners.delete(handleUpdate)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('user-profile-updated', handleCustomEvent)
    }
  }, [])

  const completeOnboarding = useCallback((name: string) => {
    const trimmed = name.trim()
    if (trimmed) {
      localStorage.setItem(USER_NAME_KEY, trimmed)
    }
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
    const next: UserProfile = {
      userName: trimmed,
      hasCompletedOnboarding: true
    }
    setProfile(next)
    notifyListeners(next)
    window.dispatchEvent(new Event('user-profile-updated'))
  }, [])

  const setUserName = useCallback((name: string) => {
    const trimmed = name.trim()
    localStorage.setItem(USER_NAME_KEY, trimmed)
    const next: UserProfile = {
      userName: trimmed,
      hasCompletedOnboarding: true
    }
    setProfile(next)
    notifyListeners(next)
    window.dispatchEvent(new Event('user-profile-updated'))
  }, [])

  return {
    userName: profile.userName,
    hasCompletedOnboarding: profile.hasCompletedOnboarding,
    completeOnboarding,
    setUserName
  }
}
