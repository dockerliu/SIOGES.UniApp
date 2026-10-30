import { defineStore } from 'pinia'

const STORAGE_KEY = 'sioges.auth.settings'
const DEFAULT_BASE_URL = 'http://192.168.1.181:5000'

interface SavedAuthSettings {
  baseUrl?: string
  staffId?: string
  staffName?: string
  token?: string
}

function loadSavedSettings(): SavedAuthSettings {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY)
    return saved && typeof saved === 'object' ? saved as SavedAuthSettings : {}
  } catch {
    return {}
  }
}

const saved = loadSavedSettings()

export const useAuthStore = defineStore('auth', {
  state: () => ({
    baseUrl: saved.baseUrl?.trim().replace(/\/$/, '') || DEFAULT_BASE_URL,
    staffId: saved.staffId || '',
    staffName: saved.staffName || '',
    token: saved.token || '',
  }),
  actions: {
    setBaseUrl(value: string) {
      const normalized = value.trim().replace(/\/$/, '')
      if (!/^https?:\/\//i.test(normalized)) throw new Error('地址必须以 http:// 或 https:// 开头')
      this.baseUrl = normalized
      this.persist()
    },
    setStaff(identity: { id: string; name: string; token?: string }) {
      this.staffId = identity.id.trim()
      this.staffName = identity.name.trim()
      this.token = identity.token ?? ''
      this.persist()
    },
    clearStaff() {
      this.staffId = ''
      this.staffName = ''
      this.token = ''
      this.persist()
    },
    persist() {
      uni.setStorageSync(STORAGE_KEY, {
        baseUrl: this.baseUrl,
        staffId: this.staffId,
        staffName: this.staffName,
        token: this.token,
      })
    },
  },
})

// Compatibility alias for the existing connection settings page.
export const useConnectionStore = useAuthStore
