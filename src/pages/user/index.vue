<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { request } from '@/api/request'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'

interface LoginResponse {
  token: string
  expiresAt: string
  user: { id: string; name: string }
}
interface SessionResponse { user: { id: string; name: string }; expiresAt: string }

const auth = useAuthStore()
const locale = useLocaleStore()
const staffCode = ref(auth.staffId)
const password = ref('')
const pending = ref(false)
const status = ref('')
const loggedIn = computed(() => Boolean(auth.token && auth.staffId))

onShow(() => {
  locale.applyTabBarLabels()
  uni.setNavigationBarTitle({ title: locale.t('user.title') })
  void verifySession()
})

async function verifySession() {
  if (!auth.token) return
  try {
    const session = await request<SessionResponse>('/api/v1/auth/me')
    auth.setStaff({ id: session.user.id, name: session.user.name, token: auth.token })
    staffCode.value = session.user.id
  } catch {
    auth.clearStaff()
    staffCode.value = ''
    status.value = locale.t('user.loginExpired')
  }
}

async function login() {
  if (pending.value) return
  pending.value = true
  status.value = ''
  try {
    const result = await request<LoginResponse>('/api/v1/auth/login', 'POST', {
      codigo: staffCode.value.trim(),
      password: password.value,
    })
    auth.setStaff({ id: result.user.id, name: result.user.name, token: result.token })
    staffCode.value = result.user.id
    password.value = ''
    status.value = locale.t('user.loginSuccess')
  } catch (error) {
    status.value = error instanceof Error ? error.message : String(error)
  } finally {
    pending.value = false
  }
}

async function logout() {
  if (pending.value) return
  pending.value = true
  try {
    await request('/api/v1/auth/logout', 'POST')
  } catch {
    // Clear this device's session even if the network is unavailable.
  } finally {
    auth.clearStaff()
    password.value = ''
    status.value = locale.t('user.logoutDone')
    pending.value = false
  }
}

function openSettings() { uni.navigateTo({ url: '/pages/settings/index' }) }

const avatarText = computed(() => auth.staffName?.trim().slice(0, 1) || locale.t('user.avatarFallback'))
</script>

<template>
  <view class="user-page">
    <view class="page-heading"><text class="eyebrow">SIOGES TPV</text><text class="page-title">{{ locale.t('user.title') }}</text><text class="page-caption">{{ locale.t('user.caption') }}</text></view>

    <view class="profile-card">
      <view class="profile-top">
        <view class="avatar">{{ avatarText }}</view>
        <view class="profile-copy"><text class="profile-name">{{ auth.staffName || locale.t('user.staffAccount') }}</text><text class="profile-id">{{ loggedIn ? `${locale.t('user.staffId')} ${auth.staffId}` : locale.t('user.loginForOrders') }}</text></view>
        <text class="session-pill" :class="{ online: loggedIn }">{{ loggedIn ? locale.t('user.loggedIn') : locale.t('user.notLoggedIn') }}</text>
      </view>
      <view class="profile-divider" />
      <text class="profile-hint">{{ loggedIn ? locale.t('user.savedSession') : locale.t('user.loginHint') }}</text>
    </view>

    <view v-if="!loggedIn" class="section-card login-card">
      <view class="section-heading"><view class="section-icon login-icon">↗</view><view><text class="section-title">{{ locale.t('user.login') }}</text><text class="section-subtitle">{{ locale.t('user.verify') }}</text></view></view>
      <label class="field-label">{{ locale.t('user.staffCode') }}</label>
      <input v-model="staffCode" class="field" :placeholder="locale.t('user.staffCodePlaceholder')" autocomplete="username" />
      <label class="field-label">{{ locale.t('user.password') }}</label>
      <input v-model="password" class="field" password :placeholder="locale.t('user.passwordPlaceholder')" autocomplete="current-password" @confirm="login" />
      <button class="primary-button" :disabled="pending || !staffCode" @click="login">{{ pending ? locale.t('user.verifying') : locale.t('user.loginButton') }}</button>
    </view>
    <view v-else class="section-card account-card">
      <view class="section-heading"><view class="section-icon account-icon">✓</view><view><text class="section-title">{{ locale.t('user.currentAccount') }}</text><text class="section-subtitle">{{ locale.t('user.orderAudit') }}</text></view></view>
      <view class="account-row"><text>{{ locale.t('user.staffName') }}</text><text>{{ auth.staffName || locale.t('user.unknown') }}</text></view>
      <view class="account-row"><text>{{ locale.t('user.staffId') }}</text><text>{{ auth.staffId }}</text></view>
      <button class="logout-button" :disabled="pending" @click="logout">{{ pending ? locale.t('user.processing') : locale.t('user.logout') }}</button>
    </view>
    <text v-if="status" class="account-status">{{ status }}</text>

    <view class="section-card settings-entry" @click="openSettings">
      <view class="section-heading"><view class="section-icon network-icon">⚙</view><view><text class="section-title">{{ locale.t('user.settings') }}</text><text class="section-subtitle">{{ locale.t('user.settingsHint') }}</text></view></view>
      <text class="entry-arrow">›</text>
    </view>
    <text class="version-label">SIOGES UniApp · H5</text>
  </view>
</template>

<style scoped>
.user-page { min-height: 100vh; min-height: 100dvh; box-sizing: border-box; padding: 19px 15px calc(70px + env(safe-area-inset-bottom)); background: #f4f6f8; color: #20252b; }
.page-heading { display: flex !important; flex-direction: column !important; align-items: flex-start; margin: 0 2px 16px; }.page-heading > .eyebrow, .page-heading > .page-title, .page-heading > .page-caption { display: block; width: 100%; }.eyebrow { color: #c34843; font-size: 11px; font-weight: 700; letter-spacing: 1.7px; }.page-title { margin-top: 3px; font-size: 25px; font-weight: 750; }.page-caption { margin-top: 3px; color: #7a8289; font-size: 14px; }
.profile-card { margin-bottom: 13px; padding: 17px; border-radius: 16px; background: linear-gradient(125deg, #fff, #fff6f3); box-shadow: 0 5px 18px #252e380a; }
.profile-top { display: flex !important; flex-direction: row !important; align-items: center; gap: 12px; }.avatar { display: grid; width: 52px; height: 52px; flex: none; place-items: center; border: 3px solid #fff; border-radius: 17px; background: linear-gradient(145deg, #e84a47, #bd252e); box-shadow: 0 4px 10px #d930352c; color: #fff; font-size: 22px; font-weight: 700; }
.profile-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 4px; }.profile-name { overflow: hidden; font-size: 17px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }.profile-id { color: #778087; font-size: 13px; }
.session-pill { padding: 5px 9px; border-radius: 99px; background: #eceff1; color: #777f85; font-size: 12px; white-space: nowrap; }.session-pill.online { background: #e5f5e9; color: #27804b; }.profile-divider { height: 1px; margin: 13px 0 10px; background: #eee9e6; }.profile-hint { color: #798188; font-size: 13px; line-height: 1.5; }
.section-card { margin-bottom: 12px; padding: 16px; border: 1px solid #edf0f2; border-radius: 15px; background: #fff; box-shadow: 0 4px 16px #252e3808; }
.settings-entry { display: flex; align-items: center; justify-content: space-between; cursor: pointer; }.settings-entry .section-heading { margin: 0; }.entry-arrow { color: #9aa1a6; font-size: 27px; line-height: 1; }
.account-status { display: block; margin: -3px 4px 12px; color: #68727a; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
.language-card .section-heading { margin-bottom: 12px; }.language-icon { background: #fff5df; color: #aa7423; }
.language-options { display: flex; gap: 9px; }.language-option { flex: 1; border: 1px solid #e3e7ea; border-radius: 9px; background: #fafbfc; color: #59636a; font-size: 14px; line-height: 40px; }
.language-option.active { border-color: #d93035; background: #fff3f2; color: #c52d32; font-weight: 700; }
.section-heading { display: flex !important; flex-direction: row !important; align-items: center; gap: 10px; margin-bottom: 16px; }.section-icon { display: grid; width: 36px; height: 36px; flex: none; place-items: center; border-radius: 11px; font-size: 19px; font-weight: 700; }.login-icon { background: #fff0ee; color: #d63a37; }.account-icon { background: #eaf7ed; color: #27804b; }.network-icon { background: #eaf2fb; color: #386eaa; }.sync-icon { background: #f2edff; color: #7054b0; }
.section-title, .section-subtitle { display: block; }.section-title { font-size: 15px; font-weight: 700; }.section-subtitle { margin-top: 3px; color: #899198; font-size: 12px; }.field-label { display: block; margin: 12px 0 6px; color: #515b62; font-size: 13px; font-weight: 600; }
.field { display: block; box-sizing: border-box; width: 100%; height: 45px; padding: 0 12px; border: 1px solid #e2e6e9; border-radius: 9px; background: #fafbfc; color: #272d32; font-size: 15px; }.field:focus { border-color: #d64a45; background: #fff; }
.primary-button, .secondary-button, .logout-button, .sync-button { border-radius: 9px; font-size: 15px; line-height: 44px; }.primary-button { width: 100%; margin-top: 16px; background: #d93035; color: #fff; font-weight: 650; }.primary-button:disabled { opacity: .48; }.secondary-button { width: 100%; margin-top: 12px; background: #344650; color: #fff; }.logout-button { width: 100%; margin-top: 14px; border: 1px solid #f0d8d7; background: #fff8f7; color: #bd3431; }
.account-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 0; border-bottom: 1px solid #f0f1f2; color: #778087; font-size: 14px; }.account-row text:last-child { color: #273038; font-weight: 600; }
.sync-card { display: flex; align-items: center; justify-content: space-between; gap: 10px; }.sync-card .section-heading { margin-bottom: 0; }.sync-button { min-width: 72px; padding: 0 15px; background: #f2edff; color: #7054b0; }.status { display: block; margin-top: 9px; color: #6f7880; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }.status.good { color: #247848; }.status.bad { color: #b42318; }.version-label { display: block; padding: 5px 0 10px; color: #a0a6aa; font-size: 12px; text-align: center; }
@media (min-width: 600px) { .user-page { max-width: 620px; margin: 0 auto; padding-right: 22px; padding-left: 22px; } }
</style>
