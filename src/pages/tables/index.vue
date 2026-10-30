<script setup lang="ts">
import { computed, ref } from 'vue'
import { onHide, onShow, onUnload } from '@dcloudio/uni-app'
import { useTablesStore, type DiningTable } from '@/stores/tables'
import { useCartStore } from '@/stores/cart'
import { formatEuro } from '@/utils/format'

const store = useTablesStore()
const cart = useCartStore()
const selectedZoneId = ref('')
let refreshTimer: ReturnType<typeof setInterval> | undefined
const selectedZone = computed(() => store.zones.find((zone) => zone.id === selectedZoneId.value) ?? store.zones[0])

onShow(() => {
  void loadTables()
  if (!refreshTimer) refreshTimer = setInterval(() => void store.refresh(), 15000)
})

function stopRefresh() {
  if (refreshTimer) clearInterval(refreshTimer)
  refreshTimer = undefined
}

onHide(stopRefresh)
onUnload(stopRefresh)

async function loadTables() {
  await store.refresh()
  if (!store.zones.some((zone) => zone.id === selectedZoneId.value)) {
    selectedZoneId.value = store.zones[0]?.id ?? ''
  }
}

function selectTable(table: DiningTable) {
  store.selectTable(table.zoneId, table.id)
  cart.setTable(table.zoneId, table.id)
  uni.switchTab({ url: '/pages/menu/index' })
}

function openSettings() {
  uni.navigateTo({ url: '/pages/settings/index' })
}

function formatMoney(value: number | null) {
  return formatEuro(value ?? 0)
}

function formatOpenedAt(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <view class="dashboard">
    <view class="topbar">
      <view>
        <text class="heading">厅房与餐桌</text>
        <text class="subheading">桌态每 15 秒自动刷新</text>
      </view>
      <view class="actions">
        <button class="small-button" :disabled="store.loading" @click="loadTables">刷新</button>
        <button class="small-button settings-button" @click="openSettings">连接设置</button>
      </view>
    </view>

    <view v-if="store.zones.length" class="zone-tabs">
      <button
        v-for="zone in store.zones"
        :key="zone.id"
        class="zone-tab"
        :class="{ active: selectedZoneId === zone.id }"
        @click="selectedZoneId = zone.id"
      >{{ zone.name }}</button>
    </view>

    <view v-if="store.error" class="state error-state">
      <text>无法读取桌态：{{ store.error }}</text>
      <button class="small-button" @click="loadTables">重试</button>
    </view>
    <view v-else-if="store.loading && !store.zones.length" class="state">正在加载餐桌…</view>
    <view v-else-if="selectedZone" class="table-grid">
      <button
        v-for="table in selectedZone.tables"
        :key="`${table.zoneId}-${table.id}`"
        class="table-card"
        :class="table.occupied ? 'occupied' : 'free'"
        @click="selectTable(table)"
      >
        <text class="table-name">{{ table.name }}</text>
        <text class="table-status">{{ table.occupied ? '占用' : '空闲' }}</text>
        <template v-if="table.occupied">
          <text class="table-total">{{ formatMoney(table.total) }}</text>
          <text v-if="table.openedAt" class="table-time">开台 {{ formatOpenedAt(table.openedAt) }}</text>
        </template>
        <text v-else class="table-type">{{ table.type }}</text>
      </button>
    </view>
    <view v-else class="state">没有可显示的餐桌。</view>

    <view class="legend">
      <text><text class="dot free-dot" />空闲</text>
      <text><text class="dot occupied-dot" />占用</text>
    </view>
  </view>
</template>

<style scoped>
.dashboard { min-height: 100vh; box-sizing: border-box; padding: 24px clamp(16px, 4vw, 48px) 34px; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 0 auto 22px; max-width: 1280px; }
.heading { display: block; font-size: 26px; font-weight: 750; }
.subheading { display: block; margin-top: 5px; color: #66717d; font-size: 13px; }
.actions { display: flex; gap: 8px; }
.small-button { padding: 0 14px; background: #fff; border: 1px solid #d6dce2; border-radius: 8px; color: #26323d; font-size: 14px; line-height: 38px; }
.settings-button { background: #203d53; color: white; border-color: #203d53; }
.zone-tabs { display: flex; gap: 8px; max-width: 1280px; margin: 0 auto 18px; overflow-x: auto; }
.zone-tab { flex: 0 0 auto; padding: 0 18px; border: 1px solid #d6dce2; border-radius: 999px; background: white; color: #34424e; font-size: 14px; line-height: 38px; }
.zone-tab.active { background: #203d53; border-color: #203d53; color: white; }
.table-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(145px, 1fr)); gap: 14px; max-width: 1280px; margin: 0 auto; }
.table-card { display: flex; min-height: 130px; flex-direction: column; align-items: flex-start; justify-content: center; gap: 7px; padding: 16px; border: 0; border-radius: 13px; text-align: left; color: #173329; box-shadow: 0 4px 14px #1a2b3610; }
.table-card.free { background: #d8f3df; }
.table-card.occupied { background: #f8dddd; color: #5b2121; }
.table-name { font-size: 18px; font-weight: 700; }
.table-status { font-size: 13px; opacity: .78; }
.table-total { font-size: 17px; font-weight: 700; }
.table-time, .table-type { font-size: 12px; opacity: .75; }
.state { display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 180px; color: #687581; }
.error-state { flex-direction: column; color: #b42318; }
.legend { display: flex; justify-content: center; gap: 20px; margin-top: 24px; color: #5f6973; font-size: 13px; }
.dot { display: inline-block; width: 10px; height: 10px; margin-right: 7px; border-radius: 50%; }
.free-dot { background: #57b673; }
.occupied-dot { background: #d86464; }
@media (max-width: 480px) { .heading { font-size: 22px; } .table-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } .table-card { min-height: 118px; padding: 13px; } .settings-button { padding: 0 10px; } }
</style>
