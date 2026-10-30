<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useCartStore, type MenuProduct } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useTablesStore } from '@/stores/tables'
import { useLocaleStore } from '@/stores/locale'
import { formatEuro } from '@/utils/format'

const cartStore = useCartStore()
const authStore = useAuthStore()
const tablesStore = useTablesStore()
const locale = useLocaleStore()
const keyword = ref('')
const cartOpen = ref(false)
const selectionState = ref<'checking' | 'missing' | 'ready'>('checking')
const tableName = computed(() => {
  const zone = tablesStore.zones.find((item) => item.id === cartStore.zoneId)
  const table = zone?.tables.find((item) => item.id === cartStore.tableId)
  return table ? `${zone?.name ?? cartStore.zoneId} · ${table.name}` : locale.t('menu.noTable')
})
const filteredProducts = computed(() => {
  const selected = cartStore.products.filter((product) => product.categoryId === cartStore.selectedCategoryId)
  const query = normalize(keyword.value)
  if (!query) return selected
  return selected.filter((product) => normalize(`${product.name} ${product.id}`).includes(query))
})

onShow(() => {
  locale.applyTabBarLabels()
  uni.setNavigationBarTitle({ title: locale.t('tab.menu') })
  void prepareMenu()
})

async function prepareMenu() {
  selectionState.value = 'checking'
  await tablesStore.refresh()
  const selected = tablesStore.zones.some((zone) => zone.id === tablesStore.selectedZoneId &&
    zone.tables.some((table) => table.id === tablesStore.selectedTableId))
  if (!selected) {
    tablesStore.clearSelection()
    cartStore.setTable('', '')
    selectionState.value = 'missing'
    return
  }
  cartStore.setTable(tablesStore.selectedZoneId, tablesStore.selectedTableId)
  selectionState.value = 'ready'
  await cartStore.loadMenu()
  if (/table_not_found|zone_and_table_required_together/i.test(cartStore.loadError)) {
    tablesStore.clearSelection()
    cartStore.setTable('', '')
    selectionState.value = 'missing'
  }
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function hasOptions(product: MenuProduct) {
  return product.modifiers.some((modifier) => modifier.values.length > 0)
}

function imageEmoji(product: MenuProduct) {
  const text = product.name.toLowerCase()
  if (/cafe|coffee|咖啡/.test(text)) return '☕'
  if (/cerveza|beer|啤酒/.test(text)) return '🍺'
  if (/vino|wine|葡萄酒/.test(text)) return '🍷'
  if (/sandwich|bocadillo|汉堡|三明治|toast|吐司/.test(text)) return '🥪'
  if (/agua|water|水/.test(text)) return '🥤'
  return '🍽️'
}

function formatMoney(value: number | null) {
  if (value === null) return locale.t('menu.noPrice')
  return formatEuro(value)
}

function adjust(product: MenuProduct, amount: number) {
  if (product.price === null) {
    uni.showToast({ title: locale.t('menu.noPriceForTable'), icon: 'none' })
    return
  }
  if (amount > 0 && hasOptions(product)) cartStore.openProduct(product)
  else cartStore.adjustProduct(product.id, amount)
}

function categoryChanged(id: string) {
  cartStore.selectedCategoryId = id
}

async function sendOrder() {
  if (!authStore.token) {
    uni.showModal({
      title: locale.t('menu.needLogin'),
      content: locale.t('menu.loginBeforeSubmit'),
      confirmText: locale.t('menu.goLogin'),
      success: ({ confirm }) => { if (confirm) uni.switchTab({ url: '/pages/user/index' }) },
    })
    return
  }
  const order = await cartStore.submitOrder()
  if (order) {
    cartOpen.value = true
    void tablesStore.refresh()
  } else if (cartStore.sendError.includes('401')) {
    authStore.clearStaff()
    uni.showModal({
      title: locale.t('menu.loginExpired'),
      content: locale.t('menu.loginAgain'),
      confirmText: locale.t('menu.goLogin'),
      success: ({ confirm }) => { if (confirm) uni.switchTab({ url: '/pages/user/index' }) },
    })
  }
}

function closeCart() {
  cartOpen.value = false
}

function goToTableSelection() {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<template>
  <view class="menu-page">
    <view class="store-header">
      <view class="store-line">
        <view class="table-chip"><text class="table-dot" />{{ tableName }}</view>
        <button class="refresh-menu" :disabled="cartStore.loading || selectionState === 'checking'" @click="prepareMenu">⟳</button>
      </view>
    <view class="search-box">
        <text class="search-icon">⌕</text>
        <input v-model="keyword" confirm-type="search" :placeholder="locale.t('menu.search')" />
        <text v-if="keyword" class="clear-search" @click="keyword = ''">×</text>
      </view>
    </view>

    <view class="notice-bar">
      <text class="notice-icon">◖))</text>
      <text>{{ locale.t('menu.notice') }}</text>
    </view>

    <view v-if="selectionState === 'checking'" class="selection-state">{{ locale.t('menu.checkTable') }}</view>
    <view v-else-if="selectionState === 'missing'" class="selection-state">
      <text class="selection-title">{{ locale.t('menu.missingTable') }}</text>
      <text class="selection-help">{{ locale.t('menu.selectFirst') }}</text>
      <button class="selection-button" @click="goToTableSelection">{{ locale.t('menu.selectTable') }}</button>
    </view>
    <view v-else-if="cartStore.loadError" class="load-error">
      <text>{{ cartStore.loadError }}</text>
      <button @click="cartStore.loadMenu">{{ locale.t('common.retry') }}</button>
    </view>
    <view v-else class="menu-body">
      <scroll-view class="families" scroll-y>
        <button
          v-for="category in cartStore.categories"
          :key="category.id"
          class="family-button"
          :class="{ active: cartStore.selectedCategoryId === category.id }"
          @click="categoryChanged(category.id)"
        >{{ category.name }}</button>
      </scroll-view>

      <scroll-view class="articles" scroll-y>
        <view v-if="cartStore.loading && !cartStore.products.length" class="loading">{{ locale.t('menu.loading') }}</view>
        <view v-else-if="!filteredProducts.length" class="empty">{{ locale.t('menu.noProducts') }}</view>
        <view v-for="product in filteredProducts" :key="product.id" class="article-row">
          <view class="food-image" :class="`food-${product.id.charCodeAt(0) % 5}`">
            <text>{{ imageEmoji(product) }}</text>
          </view>
          <view class="article-info">
            <text class="article-name">{{ product.name }}</text>
            <text class="article-meta">{{ locale.t('menu.number', { id: product.id }) }}</text>
            <view class="article-bottom">
              <text class="price">{{ formatMoney(cartStore.unitPrice(product)) }}</text>
              <view v-if="hasOptions(product)" class="option-control">
                <text v-if="cartStore.selectedCount(product.id)" class="selected-count">{{ cartStore.selectedCount(product.id) }}</text>
                <button class="choose-button" @click="adjust(product, 1)">{{ locale.t('menu.chooseOptions') }}</button>
              </view>
              <view v-else class="quantity-control">
                <button class="quantity-button minus" :disabled="!cartStore.selectedCount(product.id)" @click="adjust(product, -1)">−</button>
                <text class="quantity">{{ cartStore.selectedCount(product.id) }}</text>
                <button class="quantity-button plus" @click="adjust(product, 1)">＋</button>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="selectionState === 'ready'" class="bottom-cart-bar" @click="cartOpen = true">
      <view class="cart-summary">
        <view class="cart-bag"><text>🛒</text><text v-if="cartStore.itemCount" class="cart-badge">{{ cartStore.itemCount }}</text></view>
        <view class="summary-copy">
          <text>{{ locale.t('menu.selected', { count: cartStore.itemCount }) }}</text>
          <text class="summary-total">{{ locale.t('menu.total') }}<b>{{ formatMoney(cartStore.total) }}</b></text>
        </view>
      </view>
      <button class="checkout-button" :disabled="!cartStore.itemCount" @click.stop="cartOpen = true">{{ locale.t('menu.done') }}</button>
    </view>

    <view v-if="cartStore.modalProduct" class="shade" @click.self="cartStore.modalProduct = null">
      <view class="spec-sheet">
        <view class="sheet-heading">
          <view><text class="sheet-product">{{ cartStore.modalProduct.name }}</text><text class="sheet-price">{{ formatMoney(cartStore.unitPrice(cartStore.modalProduct)) }}</text></view>
          <button class="sheet-close" @click="cartStore.modalProduct = null">×</button>
        </view>
        <scroll-view class="sheet-body" scroll-y>
          <view v-for="modifier in cartStore.modalProduct.modifiers" :key="modifier.id" class="spec-group">
            <text class="spec-name">{{ modifier.name }}</text>
            <view class="spec-options">
              <button
                v-for="value in modifier.values"
                :key="value.id"
                class="spec-option"
                :class="{ checked: cartStore.selectedModifiers[modifier.id] === value.id }"
                @click="cartStore.selectedModifiers[modifier.id] = value.id"
              >{{ value.name }}</button>
            </view>
          </view>
          <view class="note-entry"><text>{{ locale.t('menu.note') }}</text><input v-model="cartStore.modalNote" maxlength="40" :placeholder="locale.t('menu.notePlaceholder')" /></view>
        </scroll-view>
        <view class="sheet-footer">
          <view class="quantity-control modal-quantity">
            <button class="quantity-button minus" :disabled="cartStore.modalQuantity <= 1" @click="cartStore.modalQuantity = Math.max(1, cartStore.modalQuantity - 1)">−</button>
            <text class="quantity">{{ cartStore.modalQuantity }}</text>
            <button class="quantity-button plus" @click="cartStore.modalQuantity = Math.min(999, cartStore.modalQuantity + 1)">＋</button>
          </view>
          <button class="sheet-add" @click="cartStore.addModalProduct">{{ locale.t('menu.addCart') }}</button>
        </view>
      </view>
    </view>

    <view v-if="cartOpen" class="shade cart-shade" @click.self="closeCart">
      <view class="cart-sheet">
        <view class="sheet-heading">
        <view><text class="sheet-product">{{ cartStore.receipt ? locale.t('menu.cartSent') : locale.t('menu.cartSelected') }}</text><text class="sheet-price">{{ cartStore.receipt ? `${locale.t('order.ticket')} ${cartStore.receipt.id}` : `${cartStore.itemCount} · ${formatMoney(cartStore.total)}` }}</text></view>
          <button class="sheet-close" @click="closeCart">×</button>
        </view>
        <template v-if="cartStore.receipt">
          <view class="receipt-message">{{ locale.t('menu.receiptSent') }}<br />{{ cartStore.receipt.caja }} · {{ formatMoney(cartStore.receipt.importe) }}</view>
          <button class="sheet-add full-add" @click="closeCart">{{ locale.t('menu.finish') }}</button>
        </template>
        <template v-else>
          <scroll-view class="cart-items" scroll-y>
            <view v-if="!cartStore.cart.length" class="empty">{{ locale.t('menu.cartEmpty') }}</view>
            <view v-for="line in cartStore.cart" :key="line.key" class="cart-item">
              <view class="cart-item-copy">
                <text class="cart-item-name">{{ line.product.name }}</text>
                <text v-if="line.modifiers.length" class="cart-item-detail">{{ line.modifiers.map((item) => item.valueName).join(' / ') }}</text>
                <text v-if="line.note" class="cart-item-detail">{{ locale.t('menu.note') }}：{{ line.note }}</text>
              </view>
              <view class="cart-item-actions">
                <text class="cart-item-total">{{ formatMoney(cartStore.lineTotal(line.product, line.quantity)) }}</text>
                <view class="quantity-control">
                <button class="quantity-button minus" @click="cartStore.adjustLine(line.key, -1)">−</button>
                <text class="quantity">{{ line.quantity }}</text>
                <button class="quantity-button plus" @click="cartStore.adjustLine(line.key, 1)">＋</button>
                </view>
              </view>
            </view>
          </scroll-view>
          <view class="covers-entry"><text>{{ locale.t('menu.covers') }}</text><input v-model.number="cartStore.covers" type="number" min="1" max="999" /></view>
          <text v-if="cartStore.sendError" class="send-error">{{ locale.t('menu.sendFailed') }}{{ cartStore.sendError }}</text>
          <text v-if="cartStore.hasUnpricedItems" class="send-error">{{ locale.t('menu.unpriced') }}</text>
          <button class="sheet-add full-add" :disabled="cartStore.sending || !cartStore.itemCount || cartStore.hasUnpricedItems" @click="sendOrder">
            {{ cartStore.sending ? locale.t('menu.sending') : locale.t('menu.confirmSend', { total: formatMoney(cartStore.total) }) }}
          </button>
        </template>
      </view>
    </view>
  </view>
</template>

<style scoped>
.menu-page { position: relative; display: flex; height: 100vh; height: 100dvh; min-height: 420px; flex-direction: column; overflow: hidden; background: #fff; color: #272727; }
.store-header { flex: none; padding: 8px 14px 10px; background: #fff; }
.store-line { display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px; }
.table-chip { display: flex; align-items: center; gap: 7px; color: #b92226; font-size: 16px; font-weight: 700; }
.table-dot { width: 8px; height: 8px; border-radius: 50%; background: #db3838; }
.refresh-menu { width: 32px; height: 30px; padding: 0; background: transparent; color: #777; font-size: 22px; line-height: 30px; }
.search-box { display: flex; height: 36px; align-items: center; gap: 7px; padding: 0 10px; border-radius: 18px; background: #f3f4f5; color: #8b8e92; }
.search-icon { font-size: 22px; line-height: 1; }
.search-box input { flex: 1; height: 34px; font-size: 13px; }
.clear-search { padding: 4px; font-size: 20px; }
.notice-bar { display: flex; flex: none; height: 32px; align-items: center; gap: 8px; overflow: hidden; padding: 0 10px; background: #fff8df; color: #77715f; white-space: nowrap; font-size: 12px; }
.notice-icon { color: #df654c; font-weight: 700; }
.menu-body { display: flex; flex: 1; min-height: 0; padding-bottom: 58px; }
.families { width: clamp(82px, 25vw, 104px); flex: none; background: #f3f4f5; }
.family-button { position: relative; width: 100%; min-height: 54px; padding: 8px 6px; border-bottom: 1px solid #e4e5e7; border-radius: 0; background: #f3f4f5; color: #343434; font-size: 12px; line-height: 1.3; text-align: center; white-space: normal; }
.family-button.active { background: #fff; color: #d72e31; font-size: 14px; font-weight: 700; }
.family-button.active::before { position: absolute; top: 0; bottom: 0; left: 0; width: 3px; background: #dc3336; content: ''; }
.articles { flex: 1; min-width: 0; background: #fff; }
.article-row { display: flex; min-height: 104px; gap: 10px; padding: 9px 9px; border-bottom: 1px solid #ececec; }
.food-image { display: grid; width: 62px; height: 62px; flex: none; place-items: center; align-self: center; overflow: hidden; border-radius: 9px; background: linear-gradient(145deg, #f4e1d2, #ecd8b9); }
.food-image text { font-size: 31px; filter: drop-shadow(0 2px 3px #0002); }
.food-1 { background: linear-gradient(145deg, #ead8e2, #d5b7a6); }
.food-2 { background: linear-gradient(145deg, #d8e8da, #bec99f); }
.food-3 { background: linear-gradient(145deg, #f2dfbd, #d1b88d); }
.food-4 { background: linear-gradient(145deg, #d9e5ec, #b7c8d4); }
.article-info { display: flex; min-width: 0; flex: 1; flex-direction: column; justify-content: space-between; padding: 2px 0; }
.article-name { display: -webkit-box; overflow: hidden; color: #282828; font-size: 14px; font-weight: 650; line-height: 1.3; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.article-meta { margin-top: 3px; color: #777; font-size: 11px; line-height: 1.2; }
.article-bottom { display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-top: 6px; }
.price { color: #df4b21; font-size: 16px; font-weight: 750; white-space: nowrap; }
.quantity-control { display: flex; align-items: center; gap: 6px; }
.quantity-button { width: 31px; height: 31px; padding: 0; border: 1px solid #e0e0e0; border-radius: 8px; background: white; color: #e25535; font-size: 18px; font-weight: 700; line-height: 29px; }
.quantity-button:disabled { color: #c5c5c5; }
.quantity { min-width: 18px; color: #222; font-size: 14px; text-align: center; }
.option-control { display: flex; align-items: center; gap: 7px; }
.selected-count { color: #555; font-size: 13px; }
.choose-button { padding: 0 9px; border: 1px solid #e4d5d1; border-radius: 8px; background: #fff9f7; color: #d64032; font-size: 12px; line-height: 31px; white-space: nowrap; }
.loading, .empty { padding: 38px 12px; color: #919191; font-size: 13px; text-align: center; }
.load-error { display: flex; flex: 1; align-items: center; justify-content: center; gap: 10px; padding: 20px; color: #b42318; font-size: 14px; }
.load-error button { padding: 7px 12px; border-radius: 7px; background: #d83235; color: white; }
.selection-state { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px; color: #6f7478; text-align: center; }
.selection-title { color: #292d30; font-size: 19px; font-weight: 700; }.selection-help { max-width: 280px; font-size: 14px; line-height: 1.55; }
.selection-button { min-width: 170px; margin-top: 4px; border-radius: 8px; background: #d93035; color: white; font-size: 15px; line-height: 44px; }
.bottom-cart-bar { position: fixed; z-index: 5; right: 0; bottom: calc(60px + env(safe-area-inset-bottom)); left: 0; display: flex; height: 58px; align-items: stretch; justify-content: space-between; border-top: 1px solid #ececec; background: #fff; box-shadow: 0 -2px 10px #0000000a; }
.cart-summary { display: flex; min-width: 0; align-items: center; gap: 9px; padding: 0 12px; }
.cart-bag { position: relative; display: grid; width: 38px; height: 38px; place-items: center; border-radius: 50%; background: #eee; font-size: 20px; }
.cart-badge { position: absolute; top: -5px; right: -5px; min-width: 17px; height: 17px; padding: 0 3px; border-radius: 10px; background: #de3437; color: #fff; font-size: 10px; line-height: 17px; text-align: center; }
.summary-copy { display: flex; min-width: 0; flex-direction: column; gap: 2px; color: #464646; font-size: 13px; white-space: nowrap; }
.summary-total b { color: #e34b22; font-size: 16px; }
.checkout-button { width: 142px; min-height: 58px; flex: none; border-radius: 0; background: #d93035; color: #fff; font-size: 16px; font-weight: 650; line-height: 58px; }
.checkout-button:disabled { background: #c9c9c9; }
.shade { position: fixed; z-index: 1000; inset: 0; display: flex; align-items: flex-end; justify-content: center; background: #1118; }
.spec-sheet, .cart-sheet { width: 100%; max-width: 600px; max-height: min(82vh, 680px); overflow: hidden; border-radius: 16px 16px 0 0; background: #fff; }
.sheet-heading { display: flex; align-items: center; justify-content: space-between; padding: 17px 18px; border-bottom: 1px solid #eee; }
.sheet-product, .sheet-price { display: block; }
.sheet-product { font-size: 17px; font-weight: 700; }
.sheet-price { margin-top: 5px; color: #df4b21; font-size: 13px; }
.sheet-close { width: 30px; height: 30px; padding: 0; border-radius: 50%; background: #f1f1f1; color: #555; font-size: 21px; line-height: 28px; }
.sheet-body { max-height: 50vh; padding: 0 18px; }
.spec-group { padding: 13px 0; border-bottom: 1px solid #f0f0f0; }
.spec-name { display: block; margin-bottom: 9px; font-size: 13px; font-weight: 700; }
.spec-options { display: flex; flex-wrap: wrap; gap: 8px; }
.spec-option { padding: 0 13px; border: 1px solid #e4e4e4; border-radius: 18px; background: #fafafa; color: #555; font-size: 12px; line-height: 32px; }
.spec-option.checked { border-color: #de3936; background: #fff2ef; color: #d83235; }
.note-entry { padding: 14px 0; color: #555; font-size: 12px; }
.note-entry input { height: 37px; margin-top: 7px; padding: 0 10px; border: 1px solid #e4e4e4; border-radius: 7px; font-size: 13px; }
.sheet-footer { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 16px calc(14px + env(safe-area-inset-bottom)); border-top: 1px solid #eee; }
.modal-quantity { gap: 11px; }
.sheet-add { flex: 1; border-radius: 22px; background: #d93035; color: white; font-size: 14px; line-height: 42px; }
.cart-shade { z-index: 1001; bottom: calc(60px + env(safe-area-inset-bottom)); }
.cart-sheet { display: flex; flex-direction: column; min-height: 0; max-height: min(78vh, 620px); }
.cart-sheet > .sheet-heading, .cart-sheet > .covers-entry, .cart-sheet > .send-error, .cart-sheet > .sheet-add, .cart-sheet > .receipt-message { flex: none; }
.cart-items { box-sizing: border-box; flex: 1; min-height: 0; max-height: none; padding: 0 16px; }
.cart-item { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 13px 0; border-bottom: 1px solid #eee; }
.cart-item-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 4px; }
.cart-item-actions { display: flex; flex: none; flex-direction: column; align-items: flex-end; gap: 5px; }
.cart-item-name { overflow: hidden; font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.cart-item-detail { color: #777; font-size: 12px; }
.cart-item-total { color: #d94b29; font-size: 12px; white-space: nowrap; }
.cart-item .quantity-control { flex: none; gap: 4px; }
.cart-item .quantity-button { box-sizing: border-box; width: 29px; height: 30px; margin: 0; line-height: 28px; }
.cart-item .quantity { min-width: 14px; }
.covers-entry { display: flex; align-items: center; justify-content: space-between; padding: 11px 16px; border-top: 1px solid #eee; color: #555; font-size: 13px; }
.covers-entry input { width: 65px; padding: 6px; border: 1px solid #ddd; border-radius: 6px; text-align: center; }
.send-error { display: block; padding: 0 16px 8px; color: #b42318; font-size: 12px; }
.full-add { display: block; width: calc(100% - 32px); margin: 4px 16px 14px; }
.full-add:disabled { opacity: .48; }
.receipt-message { padding: 40px 10px; color: #444; font-size: 16px; line-height: 2; text-align: center; }
@media (max-width: 360px) {
  .store-header { padding-right: 10px; padding-left: 10px; }
  .article-row { min-height: 96px; gap: 7px; padding: 8px 6px; }
  .food-image { width: 55px; height: 55px; }
  .food-image text { font-size: 28px; }
  .article-name { font-size: 13px; }
  .article-meta { font-size: 10px; }
  .article-bottom { flex-wrap: nowrap; }
  .price { font-size: 15px; }
  .quantity-control { gap: 4px; }
  .quantity-button { width: 29px; height: 30px; }
  .cart-summary { gap: 7px; padding: 0 8px; }
  .cart-bag { width: 34px; height: 34px; }
  .summary-copy { font-size: 12px; }
  .summary-total b { font-size: 15px; }
  .checkout-button { width: 112px; font-size: 15px; }
}
/* #ifdef APP-PLUS */
.bottom-cart-bar, .cart-shade { bottom: 0; }
/* #endif */
</style>
