<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { checkHealth } from '@/api/request'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useLocaleStore } from '@/stores/locale'

const auth = useAuthStore()
const cart = useCartStore()
const locale = useLocaleStore()
const address = ref(auth.baseUrl)
const busy = ref(false)
const result = ref('')
const syncResult = ref('')
const connected = ref<boolean | null>(null)

onShow(() => {
  uni.setNavigationBarTitle({ title: locale.t('settings.title') })
  address.value = auth.baseUrl
  if (!result.value) result.value = locale.t('settings.notTested')
})

async function testConnection() {
  if (busy.value) return
  busy.value = true
  connected.value = null
  result.value = locale.t('settings.connecting')
  try {
    auth.setBaseUrl(address.value)
    address.value = auth.baseUrl
    const health = await checkHealth()
    connected.value = health.connected === true
    result.value = connected.value
      ? `${locale.t('user.connectionOk')} · ${auth.baseUrl}/health`
      : `${locale.t('user.databaseError')}: ${JSON.stringify(health)}`
  } catch (error) {
    connected.value = false
    result.value = error instanceof Error ? error.message : String(error)
  } finally {
    busy.value = false
  }
}

async function refreshMenu() {
  if (cart.loading) return
  if (!cart.zoneId || !cart.tableId) {
    syncResult.value = locale.t('user.chooseTableFirst')
    return
  }
  await cart.loadMenu()
  syncResult.value = cart.loadError || locale.t('user.menuUpdated')
}
</script>

<template>
  <view class="settings-page">
    <view class="page-heading">
      <text class="eyebrow">SIOGES TPV</text>
      <text class="page-title">{{ locale.t('settings.title') }}</text>
      <text class="page-caption">{{ locale.t('settings.subtitle') }}</text>
    </view>

    <view class="section-card">
      <view class="section-heading">
        <view class="section-icon language-icon">文</view>
        <view><text class="section-title">{{ locale.t('language.title') }}</text></view>
      </view>
      <view class="language-options">
        <button class="language-option" :class="{ active: locale.language === 'zh' }" @click="locale.setLanguage('zh')">{{ locale.t('language.chinese') }}</button>
        <button class="language-option" :class="{ active: locale.language === 'es' }" @click="locale.setLanguage('es')">{{ locale.t('language.spanish') }}</button>
      </view>
    </view>

    <view class="section-card">
      <view class="section-heading">
        <view class="section-icon network-icon">⌁</view>
        <view><text class="section-title">{{ locale.t('user.middleware') }}</text><text class="section-subtitle">{{ locale.t('user.middlewareHint') }}</text></view>
      </view>
      <label class="field-label">{{ locale.t('user.apiAddress') }}</label>
      <input v-model="address" class="field" type="text" :placeholder="locale.t('user.apiPlaceholder')" />
      <button class="primary-button" :disabled="busy" @click="testConnection">{{ busy ? locale.t('user.testing') : locale.t('user.saveTest') }}</button>
      <text class="result" :class="{ good: connected === true, bad: connected === false }">{{ result }}</text>
      <text class="connection-note">{{ locale.t('settings.connectionNote') }}</text>
    </view>

    <view class="section-card sync-card">
      <view class="section-heading">
        <view class="section-icon sync-icon">⟳</view>
        <view class="sync-copy"><text class="section-title">{{ locale.t('user.menuData') }}</text><text class="section-subtitle">{{ locale.t('user.menuRefreshHint') }}</text></view>
      </view>
      <button class="sync-button" :disabled="cart.loading" @click="refreshMenu">{{ locale.t('user.sync') }}</button>
    </view>
    <text v-if="syncResult" class="sync-result">{{ syncResult }}</text>
  </view>
</template>

<style scoped>
.settings-page { min-height: 100vh; min-height: 100dvh; box-sizing: border-box; padding: 19px 15px calc(70px + env(safe-area-inset-bottom)); background: #f4f6f8; color: #20252b; }
.page-heading { display: flex; flex-direction: column; align-items: flex-start; margin: 0 2px 16px; }.eyebrow, .page-title, .page-caption { display: block; width: 100%; }.eyebrow { color: #c34843; font-size: 11px; font-weight: 700; letter-spacing: 1.7px; }.page-title { margin-top: 3px; font-size: 25px; font-weight: 750; }.page-caption { margin-top: 3px; color: #7a8289; font-size: 14px; }
.section-card { margin-bottom: 12px; padding: 16px; border: 1px solid #edf0f2; border-radius: 15px; background: #fff; box-shadow: 0 4px 16px #252e3808; }.section-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }.section-icon { display: grid; width: 36px; height: 36px; flex: none; place-items: center; border-radius: 11px; font-size: 19px; font-weight: 700; }.language-icon { background: #fff5df; color: #aa7423; }.network-icon { background: #eaf2fb; color: #386eaa; }.sync-icon { background: #f2edff; color: #7054b0; }.section-title, .section-subtitle { display: block; }.section-title { font-size: 15px; font-weight: 700; }.section-subtitle { margin-top: 3px; color: #899198; font-size: 12px; line-height: 1.4; }
.language-options { display: flex; gap: 9px; }.language-option { flex: 1; border: 1px solid #e3e7ea; border-radius: 9px; background: #fafbfc; color: #59636a; font-size: 14px; line-height: 40px; }.language-option.active { border-color: #d93035; background: #fff3f2; color: #c52d32; font-weight: 700; }
.field-label { display: block; margin: 12px 0 6px; color: #515b62; font-size: 13px; font-weight: 600; }.field { display: block; box-sizing: border-box; width: 100%; height: 45px; padding: 0 12px; border: 1px solid #e2e6e9; border-radius: 9px; background: #fafbfc; color: #272d32; font-size: 15px; }.primary-button { width: 100%; margin-top: 12px; border-radius: 9px; background: #344650; color: #fff; font-size: 15px; line-height: 44px; }.primary-button:disabled, .sync-button:disabled { opacity: .55; }.result, .connection-note, .sync-result { display: block; margin-top: 9px; color: #69737a; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }.connection-note { color: #899198; font-size: 12px; }.good { color: #247848; }.bad { color: #b42318; }
.sync-card { display: flex; align-items: center; justify-content: space-between; gap: 10px; }.sync-card .section-heading { min-width: 0; margin: 0; }.sync-copy { min-width: 0; }.sync-button { flex: none; min-width: 78px; padding: 0 14px; border-radius: 9px; background: #f2edff; color: #7054b0; font-size: 14px; line-height: 40px; }.sync-result { margin: -4px 3px 0; }
@media (min-width: 600px) { .settings-page { max-width: 620px; margin: 0 auto; padding-right: 22px; padding-left: 22px; } }
</style>
