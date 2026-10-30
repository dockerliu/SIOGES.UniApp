<script setup lang="ts">
import { computed, ref } from 'vue'
import { onHide, onShow, onUnload } from '@dcloudio/uni-app'
import { useTablesStore, type DiningTable } from '@/stores/tables'
import { useCartStore } from '@/stores/cart'
import { useLocaleStore } from '@/stores/locale'
import { formatEuro } from '@/utils/format'

const tables = useTablesStore()
const cart = useCartStore()
const locale = useLocaleStore()
const selectedZoneId = ref(tables.selectedTableId ? tables.selectedZoneId : '__first_zone__')
let refreshTimer: ReturnType<typeof setInterval> | undefined
const selectedZone = computed(() => tables.zones.find((zone) => zone.id === selectedZoneId.value) ?? tables.zones[0])
const visibleTables = computed(() => selectedZone.value?.tables.filter((table) => table.type === 'PTO') ?? [])

onShow(() => {
  // Tab bar APIs must run after the H5 tab bar has rendered.
  locale.applyTabBarLabels()
  uni.setNavigationBarTitle({ title: locale.t('tab.home') })
  void refreshTables()
  if (!refreshTimer) refreshTimer = setInterval(() => void tables.refresh(), 15000)
})

function stopRefresh() {
  if (refreshTimer) clearInterval(refreshTimer)
  refreshTimer = undefined
}
onHide(stopRefresh)
onUnload(stopRefresh)

async function refreshTables() {
  await tables.refresh()
  if (!tables.zones.some((zone) => zone.id === selectedZoneId.value)) {
    selectedZoneId.value = tables.zones[0]?.id ?? ''
  }
  tables.selectedZoneId = selectedZoneId.value
}

function setZone(id: string) {
  selectedZoneId.value = id
  tables.selectedZoneId = id
}

function openTable(table: DiningTable) {
  if (table.occupied) {
    uni.showActionSheet({
      itemList: [locale.t('home.continue'), locale.t('home.viewOrder')],
      success: ({ tapIndex }) => {
        tables.selectTable(table.zoneId, table.id)
        cart.setTable(table.zoneId, table.id)
        uni.switchTab({ url: tapIndex === 0 ? '/pages/menu/index' : '/pages/order/index' })
      },
    })
    return
  }
  uni.showModal({
    title: locale.t('home.startOrder'),
    content: locale.t('home.startQuestion', { table: table.name }),
    confirmText: locale.t('home.goOrder'),
    success: ({ confirm }) => {
      if (!confirm) return
      tables.selectTable(table.zoneId, table.id)
      cart.setTable(table.zoneId, table.id)
      uni.switchTab({ url: '/pages/menu/index' })
    },
  })
}

function formatMoney(value: number | null) {
  return formatEuro(value ?? 0)
}
function elapsed(value: string | null) {
  if (!value) return ''
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return ''
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000))
  return `${Math.floor(minutes / 60)}${locale.t('home.elapsedHours')} ${minutes % 60}${locale.t('home.elapsedMinutes')}`
}
</script>

<template>
  <view class="home-page">
    <view class="header">
      <view><text class="eyebrow">{{ locale.t('home.eyebrow') }}</text><text class="title">{{ locale.t('home.title') }}</text></view>
      <button class="refresh" :disabled="tables.loading" @click="refreshTables">{{ locale.t('common.refresh') }}</button>
    </view>
    <scroll-view class="zone-tabs" scroll-x>
      <button v-for="zone in tables.zones" :key="zone.id" class="zone-tab" :class="{ selected: selectedZoneId === zone.id }" @click="setZone(zone.id)">{{ zone.name }}</button>
    </scroll-view>
    <view class="summary"><text>{{ selectedZone?.name ?? locale.t('home.zone') }}</text><text>{{ visibleTables.length }} {{ locale.t('home.tablesCount') }}</text></view>
    <view v-if="tables.error" class="state error">{{ locale.t('home.readError') }}{{ tables.error }}</view>
    <view v-else-if="tables.loading && !tables.zones.length" class="state">{{ locale.t('home.loading') }}</view>
    <scroll-view v-else class="table-scroll" scroll-y>
      <view class="table-grid">
        <button v-for="table in visibleTables" :key="`${table.zoneId}-${table.id}`" class="table-card" :class="table.occupied ? 'occupied' : 'free'" @click="openTable(table)">
          <view class="table-card-top"><text class="table-name">{{ table.name }}</text><text class="status-pill">{{ table.occupied ? locale.t('home.occupied') : locale.t('home.free') }}</text></view>
          <template v-if="table.occupied">
            <text class="amount">{{ formatMoney(table.total) }}</text>
            <text class="time">{{ elapsed(table.openedAt) }}</text>
          </template>
          <template v-else><text class="tap-hint">{{ locale.t('home.startHint') }}</text></template>
        </button>
      </view>
    </scroll-view>
    <view class="legend"><text><i class="green" />{{ locale.t('home.free') }}</text><text><i class="red" />{{ locale.t('home.occupied') }}</text></view>
  </view>
</template>

<style scoped>
.home-page { display: flex; height: 100vh; height: 100dvh; flex-direction: column; padding: 18px 15px calc(76px + env(safe-area-inset-bottom)); box-sizing: border-box; background: #f5f6f7; }
.header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 11px; }
.eyebrow, .title { display: block; }
.eyebrow { color: #9a5550; font-size: 10px; letter-spacing: 1.5px; }
.title { margin-top: 4px; font-size: 25px; font-weight: 750; }
.refresh { min-width: 72px; min-height: 40px; padding: 0 14px; border: 1px solid #e3e3e3; border-radius: 20px; background: white; color: #555; font-size: 14px; line-height: 38px; }
.zone-tabs { flex: none; white-space: nowrap; }
.zone-tab { display: inline-block; min-height: 36px; margin-right: 7px; padding: 0 14px; border-radius: 18px; background: #e9eaec; color: #555; font-size: 13px; line-height: 36px; }
.zone-tab.selected { background: #d93035; color: #fff; }
.summary { display: flex; justify-content: space-between; padding: 11px 2px 8px; color: #656565; font-size: 13px; }
.table-scroll { flex: 1; min-height: 0; }
.table-grid { display: grid; width: 100%; box-sizing: border-box; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; padding: 0 1px 12px; }
.table-card { display: block; width: 100%; min-width: 0; min-height: 104px; box-sizing: border-box; padding: 12px; border: 1px solid transparent; border-radius: 13px; text-align: left; white-space: normal; box-shadow: 0 2px 7px #00000008; }
.table-card.free { border-color: #c8e5d0; background: #f2fbf4; color: #234b30; }
.table-card.occupied { border-color: #f0ceca; background: #fff5f3; color: #632f2c; }
.table-card-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.table-name { font-size: 15px; font-weight: 700; }
.status-pill { flex: none; padding: 4px 8px; border-radius: 11px; background: #def2e2; color: #27834b; font-size: 11px; }
.occupied .status-pill { background: #f8ded9; color: #c34438; }
.amount { display: block; margin-top: 10px; font-size: 19px; font-weight: 750; }
.time, .tap-hint { display: block; margin-top: 7px; color: #777; font-size: 12px; }
.legend { position: fixed; right: 0; bottom: calc(60px + env(safe-area-inset-bottom)); left: 0; display: flex; justify-content: center; gap: 24px; padding: 9px; background: #ffffffeb; color: #666; font-size: 13px; }
.legend i { display: inline-block; width: 10px; height: 10px; margin-right: 6px; border-radius: 50%; }
.green { background: #55ae6b; }.red { background: #d75a52; }
.state { display: grid; flex: 1; place-items: center; color: #777; font-size: 13px; }.state.error { color: #b42318; }
@media (min-width: 680px) { .table-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }.table-card { min-height: 108px; } }
@media (max-width: 360px) { .home-page { padding-right: 11px; padding-left: 11px; }.table-grid { gap: 7px; }.table-card { min-height: 96px; padding: 10px; }.table-name { font-size: 14px; }.status-pill { padding: 4px 6px; font-size: 10px; } }
/* #ifdef APP-PLUS */
.home-page { padding-bottom: 52px; }
.legend { bottom: 0; }
/* #endif */
</style>
