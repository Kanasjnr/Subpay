import { useState, useEffect } from 'react'

export function usePushNotifications() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setSubscription(subscription)
    } catch (err) {
      setError('Failed to check push notification subscription')
      console.error('Error checking subscription:', err)
    }
  }

  const subscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })
      setSubscription(subscription)
      return subscription
    } catch (err) {
      setError('Failed to subscribe to push notifications')
      console.error('Error subscribing:', err)
      throw err
    }
  }

  const unsubscribe = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe()
        setSubscription(null)
      }
    } catch (err) {
      setError('Failed to unsubscribe from push notifications')
      console.error('Error unsubscribing:', err)
      throw err
    }
  }

  return {
    subscription,
    error,
    subscribe,
    unsubscribe,
  }
} 