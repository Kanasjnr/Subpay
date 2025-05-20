// App-wide constants
export const APP_CONFIG = {
  name: 'SubPay',
  description: 'A DeFi-based subscription payment platform on Celo',
  version: '1.0.0',
  author: 'kanas',
  github: 'https://github.com/kanas/subpay',
} as const

// Feature flags
export const FEATURES = {
  ENABLE_AI_RISK_ASSESSMENT: true,
  ENABLE_DISPUTE_RESOLUTION: true,
  ENABLE_MULTI_CURRENCY: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
} as const

// UI Constants
export const UI = {
  MAX_SUBSCRIPTIONS_PER_PAGE: 10,
  MAX_PLANS_PER_PAGE: 10,
  MAX_DISPUTES_PER_PAGE: 5,
  DEFAULT_PAGINATION_SIZE: 10,
  TOAST_DURATION: 5000,
  ANIMATION_DURATION: 300,
} as const

// Blockchain Constants
export const BLOCKCHAIN = {
  DEFAULT_GAS_LIMIT: 500000n,
  DEFAULT_GAS_PRICE: 5n, // in gwei
  CONFIRMATION_BLOCKS: 1,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // in milliseconds
} as const

// Risk Assessment Constants
export const RISK = {
  MIN_CREDIT_SCORE: 0,
  MAX_CREDIT_SCORE: 1000,
  BASE_CREDIT_SCORE: 500,
  SUCCESS_BONUS: 5,
  FAILURE_PENALTY: 10,
  HIGH_RISK_THRESHOLD: 300,
  MEDIUM_RISK_THRESHOLD: 600,
} as const

// Subscription Constants
export const SUBSCRIPTION = {
  MIN_FREQUENCY: 86400, // 1 day in seconds
  MAX_FREQUENCY: 31536000, // 1 year in seconds
  MAX_TRIAL_PERIOD: 2592000, // 30 days in seconds
  DEFAULT_GRACE_PERIOD: 86400, // 1 day in seconds
  MAX_ACTIVE_SUBSCRIPTIONS: 100,
} as const

// API Constants
export const API = {
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
} as const

// Export all constants
export const CONSTANTS = {
  APP: APP_CONFIG,
  FEATURES,
  UI,
  BLOCKCHAIN,
  RISK,
  SUBSCRIPTION,
  API,
} as const

// Type for all constants
export type Constants = typeof CONSTANTS 