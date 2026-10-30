<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow, onHide, onUnload } from '@dcloudio/uni-app'
import { request } from '@/api/request'
import { useAuthStore } from '@/stores/auth'
import { useTablesStore } from '@/stores/tables'
import { useLocaleStore } from '@/stores/locale'
import { formatEuro } from '@/utils/format'

interface OrderLine {
  linea: string
  articulo: string
  nombre: string
  unidades: number
  importeUnitario: number
  importeTotal: number
  textoCocina: string
  estado: string
}
interface OpenOrder {
  caja: string
  id: string
  fechaCreacion: string | null
  zona: string
  zonaNombre: string
  puesto: string
  puestoNombre: string
  importe: number
  comensales: number
  lines: OrderLine[]
}
interface OrdersResponse { orders: OpenOrder[] }

const tables = useTablesStore()
const auth = useAuthStore()
const locale = useLocaleStore()
const orders = ref<OpenOrder[]>([])
const selectedOrders = computed(() => {
  if (!tables.selectedZoneId || !tables.selectedTableId) return []
  return orders.value.filter((order) =>
    order.zona === tables.selectedZoneId && order.puesto === tables.selectedTableId)
})
const selectedTableName = computed(() => {
  const zone = tables.zones.find((item) => item.id === tables.selectedZoneId)
  const table = zone?.tables.find((item) => item.id === tables.selectedTableId)
  return table ? `${zone?.name ?? tables.selectedZoneId} · ${table.name}` : ''
})
const loading = ref(false)
const busyKey = ref('')
const error = ref('')
const message = ref('')
let refreshTimer: ReturnType<typeof setInterval> | undefined

onShow(() => {
  locale.applyTabBarLabels()
  uni.setNavigationBarTitle({ title: locale.t('tab.pickup') })
  void refreshOrders()
  if (!refreshTimer) refreshTimer = setInterval(() => void refreshOrders(), 20000)
})
onHide(stopRefresh)
onUnload(stopRefresh)

function stopRefresh() {
  if (refreshTimer) clearInterval(refreshTimer)
  refreshTimer = undefined
}

function goToTables() {
  uni.switchTab({ url: '/pages/index/index' })
}

function goToLogin() {
  uni.switchTab({ url: '/pages/user/index' })
}

async function refreshOrders() {
  if (!auth.token) {
    orders.value = []
    error.value = ''
    return
  }
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const [result] = await Promise.all([
      request<OrdersResponse>('/api/v1/orders'),
      tables.refresh(),
    ])
    orders.value = result.orders ?? []
  } catch (cause) {
    if (String(cause).includes('401')) auth.clearStaff()
    error.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    loading.value = false
  }
}

function money(value: number) {
  return formatEuro(value)
}

function time(value: string | null) {
  if (!value) return locale.t('order.timeUnknown')
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { hour: '2-digit', minute: '2-digit' })
}

async function markUrgent(order: OpenOrder) {
  const key = `urgent:${order.caja}:${order.id}`
  if (busyKey.value) return
  busyKey.value = key
  message.value = ''
  try {
    await request(`/api/v1/orders/${encodeURIComponent(order.id)}/urgente?caja=${encodeURIComponent(order.caja)}`, 'POST')
    message.value = locale.t('order.urgentDone', { table: order.puestoNombre || order.puesto, id: order.id })
    await refreshOrders()
  } catch (cause) {
    if (String(cause).includes('401')) auth.clearStaff()
    message.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    busyKey.value = ''
  }
}

function transferTable(order: OpenOrder) {
  if (busyKey.value) return
  const targets = tables.zones.flatMap((zone) => zone.tables
    .filter((item) => item.type === 'PTO' && !item.occupied && !(item.zoneId === order.zona && item.id === order.puesto))
    .map((item) => ({ ...item, zoneName: zone.name })))
  if (!targets.length) {
    message.value = locale.t('order.noTarget')
    return
  }
  uni.showActionSheet({
    itemList: targets.map((item) => `${item.zoneName} · ${item.name}`),
    success: async ({ tapIndex }) => {
      const target = targets[tapIndex]
      if (!target) return
      const key = `transfer:${order.caja}:${order.id}`
      busyKey.value = key
      message.value = ''
      try {
        await request('/api/v1/tables/transfer', 'POST', {
          source_zone: order.zona,
          source_table: order.puesto,
          target_zone: target.zoneId,
          target_table: target.id,
        })
        message.value = locale.t('order.transferDone', { source: order.puestoNombre || order.puesto, target: `${target.zoneName} · ${target.name}` })
        await refreshOrders()
      } catch (cause) {
        if (String(cause).includes('401')) auth.clearStaff()
        message.value = cause instanceof Error ? cause.message : String(cause)
      } finally {
        busyKey.value = ''
      }
    },
  })
}
</script>

<template>
  <view class="orders-page">
    <view class="page-header">
      <view>
      <text class="page-title">{{ locale.t('order.title') }}</text>
      <text class="page-subtitle">{{ selectedTableName || locale.t('order.noTable') }} · {{ locale.t('order.interval') }}</text>
      </view>
      <button class="refresh-button" :disabled="loading" @click="refreshOrders">{{ locale.t('common.refresh') }}</button>
    </view>
    <view v-if="!auth.token" class="state-card login-required">
      <text class="login-icon">♙</text><text class="login-title">{{ locale.t('order.loginRequired') }}</text><text class="login-hint">{{ locale.t('order.loginHint') }}</text>
      <button class="login-button" @click="goToLogin">{{ locale.t('menu.goLogin') }}</button>
    </view>
    <template v-else>
    <text v-if="message" class="message">{{ message }}</text>
    <view v-if="error" class="state-card error-card"><text>{{ locale.t('order.readFailed') }}{{ error }}</text><button class="retry-button" @click="refreshOrders">{{ locale.t('common.retry') }}</button></view>
    <view v-else-if="loading && !orders.length" class="state-card">{{ locale.t('order.loading') }}</view>
    <view v-else-if="!tables.selectedZoneId || !tables.selectedTableId" class="state-card empty-card">
      <text>{{ locale.t('order.selectTableHint') }}</text>
      <button class="choose-table-button" @click="goToTables">{{ locale.t('order.selectTable') }}</button>
    </view>
    <view v-else-if="!selectedOrders.length" class="state-card empty-card">{{ selectedTableName }} {{ locale.t('order.noOpen') }}</view>
    <scroll-view v-else class="order-list" scroll-y>
      <view v-for="order in selectedOrders" :key="`${order.caja}:${order.id}`" class="order-card">
        <view class="order-heading">
          <view class="order-place"><text class="table-name">{{ order.puestoNombre || locale.t('order.tableFallback', { id: order.puesto }) }}</text><text class="zone-name">{{ order.zonaNombre || order.zona }}</text></view>
          <view class="order-total"><text class="amount">{{ money(order.importe) }}</text><text class="ticket-number">{{ locale.t('order.ticket') }} {{ order.id }} · {{ order.caja }}</text></view>
        </view>
        <view class="order-meta"><text>{{ time(order.fechaCreacion) }}</text><text>{{ order.comensales }} {{ locale.t('order.people') }}</text><text>{{ order.lines.length }} {{ locale.t('order.items') }}</text></view>
        <view class="lines">
          <view v-for="line in order.lines" :key="line.linea" class="order-line">
            <view class="line-description"><text class="line-name">{{ line.nombre || locale.t('order.itemFallback', { id: line.articulo }) }} × {{ line.unidades }}</text><text v-if="line.textoCocina" class="line-note">{{ line.textoCocina }}</text></view>
            <text class="line-price">{{ money(line.importeTotal) }}</text>
          </view>
        </view>
        <view class="order-actions">
          <button class="urgent-button" :disabled="!!busyKey" @click="markUrgent(order)">{{ locale.t('order.urgent') }}</button>
          <button class="transfer-button" :disabled="!!busyKey" @click="transferTable(order)">{{ locale.t('order.transfer') }}</button>
        </view>
      </view>
    </scroll-view>
    </template>
  </view>
</template>

<style scoped>
.orders-page { display: flex; min-height: 100vh; height: 100dvh; flex-direction: column; box-sizing: border-box; padding: 16px 14px calc(72px + env(safe-area-inset-bottom)); background: #f5f6f7; }
.page-header { display: flex; flex: none; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.page-title { display: block; font-size: clamp(21px, 6vw, 25px); font-weight: 750; }
.page-subtitle { display: block; margin-top: 4px; color: #777e83; font-size: 13px; }
.refresh-button, .retry-button { min-width: 58px; padding: 0 12px; border: 1px solid #e3e4e5; border-radius: 18px; background: #fff; color: #444; font-size: 14px; line-height: 36px; white-space: nowrap; }
.order-list { flex: 1; min-height: 0; }
.order-card, .state-card { margin-bottom: 12px; padding: 15px; border: 1px solid #eceeef; border-radius: 13px; background: #fff; box-shadow: 0 3px 12px #151b2208; }
.order-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.table-name { display: block; font-size: 17px; font-weight: 700; }
.zone-name, .ticket-number { display: block; margin-top: 4px; color: #81868a; font-size: 12px; }
.order-total { flex: none; text-align: right; }.amount { color: #ce3635; font-size: 17px; font-weight: 750; }
.order-meta { display: flex; flex-wrap: wrap; gap: 12px; margin: 12px 0 4px; color: #81868a; font-size: 12px; }
.order-line { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding: 10px 0; border-top: 1px solid #f0f1f2; }
.line-description { min-width: 0; }.line-name { font-size: 14px; line-height: 1.4; }.line-note { display: block; margin-top: 3px; color: #a05b29; font-size: 12px; line-height: 1.35; }
.line-price { flex: none; color: #555; font-size: 13px; }.order-actions { display: flex; gap: 9px; margin-top: 7px; }
.order-actions button { flex: 1; border-radius: 8px; color: white; font-size: 14px; line-height: 39px; }
.urgent-button { background: #d93035; }.transfer-button { background: #46515a; }.order-actions button:disabled { opacity: .45; }
.state-card { display: flex; min-height: 125px; align-items: center; justify-content: center; gap: 12px; color: #737b81; font-size: 14px; text-align: center; }
.empty-card { line-height: 1.6; }.error-card { flex-direction: column; color: #ae2828; }.message { flex: none; margin: 0 0 9px; color: #267b4d; font-size: 13px; }
.choose-table-button { min-width: 130px; padding: 0 16px; border-radius: 8px; background: #d93035; color: #fff; font-size: 14px; line-height: 38px; }
.login-required { flex-direction: column; min-height: 240px; padding: 24px; }.login-icon { color: #d93035; font-size: 30px; }.login-title { color: #293139; font-size: 17px; font-weight: 700; }.login-hint { max-width: 300px; color: #798188; line-height: 1.55; }.login-button { min-width: 145px; padding: 0 18px; border-radius: 9px; background: #d93035; color: white; font-size: 14px; line-height: 41px; }
</style>
