import { defineStore } from 'pinia'
import { request } from '@/api/request'

const SELECTION_KEY = 'sioges.tables.selected'
export const SIN_ZONA_ID = 'SIN_ZONA'
export const SIN_PUESTO_ID = 'SIN_PUESTO'

function savedSelection() {
  try {
    const value = uni.getStorageSync(SELECTION_KEY)
    return value && typeof value === 'object' ? value as { zoneId?: string; tableId?: string } : {}
  } catch {
    return {}
  }
}

const initialSelection = savedSelection()

export interface DiningTable {
  zoneId: string
  id: string
  name: string
  type: string
  occupied: boolean
  total: number | null
  openedAt: string | null
}

export interface DiningZone {
  id: string
  name: string
  tables: DiningTable[]
}

interface TablesResponse { zones: DiningZone[]; tables: DiningTable[] }

export const useTablesStore = defineStore('tables', {
  state: () => ({
    zones: [] as DiningZone[],
    loading: false,
    error: '',
    selectedZoneId: initialSelection.zoneId === '' && initialSelection.tableId
      ? SIN_ZONA_ID
      : initialSelection.zoneId ?? '',
    selectedTableId: initialSelection.tableId ?? '',
  }),
  actions: {
    selectTable(zoneId: string, tableId: string) {
      this.selectedZoneId = zoneId
      this.selectedTableId = tableId
      uni.setStorageSync(SELECTION_KEY, { zoneId, tableId })
    },
    clearSelection() {
      this.selectedZoneId = ''
      this.selectedTableId = ''
      uni.removeStorageSync(SELECTION_KEY)
    },
    async refresh() {
      this.loading = true
      this.error = ''
      try {
        const response = await request<TablesResponse>('/api/v1/tables')
        const apiZones = (response.zones ?? []).map((zone) => ({ ...zone, tables: [...(zone.tables ?? [])] }))
        const apiTables = response.tables ?? apiZones.flatMap((zone) => zone.tables)
        const regularZones = apiZones
          .filter((zone) => zone.id && zone.id !== SIN_ZONA_ID)
          .map((zone) => ({
            ...zone,
            tables: apiTables.filter((table) => table.zoneId === zone.id && table.id !== SIN_PUESTO_ID),
          }))
        this.zones = regularZones
        if (this.selectedZoneId && this.selectedTableId && !this.zones.some((zone) =>
          zone.id === this.selectedZoneId && zone.tables.some((table) => table.id === this.selectedTableId))) {
          this.clearSelection()
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
      } finally {
        this.loading = false
      }
    },
  },
})
