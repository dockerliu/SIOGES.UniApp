import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { request } from '@/api/request'
import { useLocaleStore } from '@/stores/locale'
import { SIN_PUESTO_ID, SIN_ZONA_ID } from '@/stores/tables'

export interface MenuCategory { id: string; name: string; order: number }
export interface MenuModifierValue { id: string; name: string }
export interface MenuModifier { id: string; name: string; values: MenuModifierValue[] }
export interface MenuProduct {
  id: string
  name: string
  categoryId: string
  type: string
  priceMode: string
  order: number
  price: number | null
  taxRate: number
  modifiers: MenuModifier[]
}
export interface CartModifier {
  modifier_id: string
  value_id: string
  modifierName: string
  valueName: string
}
export interface CartLine {
  key: string
  product: MenuProduct
  quantity: number
  modifiers: CartModifier[]
  note: string
}
export interface OrderReceipt {
  duplicate: boolean
  order: { id: string; caja: string; codigo: number; importe: number; clientOrderNo: string }
}

interface MenuResponse {
  language: string
  taxIncluded: boolean
  categories: MenuCategory[]
  products: MenuProduct[]
}

export const useCartStore = defineStore('cart', () => {
  const locale = useLocaleStore()
  const zoneId = ref('')
  const tableId = ref('')
  const categories = ref<MenuCategory[]>([])
  const products = ref<MenuProduct[]>([])
  const taxIncluded = ref(true)
  const selectedCategoryId = ref('')
  const loading = ref(false)
  const loadError = ref('')
  const cart = ref<CartLine[]>([])
  const lastSubmittedLines = ref<CartLine[]>([])
  const covers = ref(1)
  const modalProduct = ref<MenuProduct | null>(null)
  const selectedModifiers = ref<Record<string, string>>({})
  const modalQuantity = ref(1)
  const modalNote = ref('')
  const sending = ref(false)
  const sendError = ref('')
  const receipt = ref<OrderReceipt['order'] | null>(null)
  let clientOrderNo = ''

  const itemCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0))
  const total = computed(() => cart.value.reduce((sum, item) => sum + lineTotal(item.product, item.quantity), 0))
  const hasUnpricedItems = computed(() => cart.value.some((item) => item.product.price === null))

  function roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100
  }

  function lineTotal(product: MenuProduct, quantity: number) {
    const base = roundMoney((product.price ?? 0) * quantity)
    return taxIncluded.value ? base : base + roundMoney(base * product.taxRate / 100)
  }

  function unitPrice(product: MenuProduct) {
    return product.price === null ? null : lineTotal(product, 1)
  }

  function setTable(zone: string, table: string) {
    if (zoneId.value !== zone || tableId.value !== table) {
      cart.value = []
      lastSubmittedLines.value = []
      receipt.value = null
      clientOrderNo = ''
    }
    zoneId.value = zone
    tableId.value = table
    loadError.value = ''
    sendError.value = ''
  }

  async function loadMenu() {
    if (!zoneId.value || zoneId.value === SIN_ZONA_ID || !tableId.value || tableId.value === SIN_PUESTO_ID) {
      loadError.value = '请先从桌态页面选择餐桌。'
      return
    }
    loading.value = true
    loadError.value = ''
    try {
      const tableQuery = zoneId.value
        ? `zone_id=${encodeURIComponent(zoneId.value)}&table_id=${encodeURIComponent(tableId.value)}&`
        : ''
      const query = `${tableQuery}lang=${locale.language}`
      const menu = await request<MenuResponse>(`/api/v1/menu?${query}`)
      categories.value = menu.categories ?? []
      products.value = menu.products ?? []
      taxIncluded.value = menu.taxIncluded
      if (!categories.value.some((category) => category.id === selectedCategoryId.value))
        selectedCategoryId.value = categories.value[0]?.id ?? ''
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : String(error)
    } finally {
      loading.value = false
    }
  }

  function selectedCount(productId: string) {
    return cart.value.filter((line) => line.product.id === productId).reduce((sum, line) => sum + line.quantity, 0)
  }

  function addLine(product: MenuProduct, quantity: number, modifiers: CartModifier[] = [], note = '') {
    if (product.price === null) return
    receipt.value = null
    const cleanNote = note.trim().slice(0, 40)
    const modifierKey = modifiers.map((modifier) => `${modifier.modifier_id}:${modifier.value_id}`).sort().join('|')
    const key = `${product.id}::${modifierKey}::${cleanNote}`
    const existing = cart.value.find((line) => line.key === key)
    if (existing) existing.quantity = Math.min(999, existing.quantity + quantity)
    else cart.value.push({ key, product, quantity, modifiers, note: cleanNote })
    sendError.value = ''
  }

  function addWithoutOptions(product: MenuProduct) {
    addLine(product, 1)
  }

  function openProduct(product: MenuProduct) {
    modalProduct.value = product
    selectedModifiers.value = {}
    modalQuantity.value = 1
    modalNote.value = ''
  }

  function addModalProduct() {
    const product = modalProduct.value
    if (!product) return
    const modifiers = product.modifiers.flatMap((modifier) => {
      const valueId = selectedModifiers.value[modifier.id]
      const value = modifier.values.find((item) => item.id === valueId)
      return value ? [{ modifier_id: modifier.id, value_id: value.id, modifierName: modifier.name, valueName: value.name }] : []
    })
    addLine(product, modalQuantity.value, modifiers, modalNote.value)
    modalProduct.value = null
  }

  function adjustLine(key: string, amount: number) {
    const line = cart.value.find((item) => item.key === key)
    if (!line) return
    if (line.quantity + amount <= 0) cart.value = cart.value.filter((item) => item.key !== key)
    else line.quantity = Math.min(999, line.quantity + amount)
  }

  function adjustProduct(productId: string, amount: number) {
    if (amount > 0) {
      const product = products.value.find((item) => item.id === productId)
      if (product) addWithoutOptions(product)
      return
    }
    const line = [...cart.value].reverse().find((item) => item.product.id === productId)
    if (line) adjustLine(line.key, -1)
  }

  async function submitOrder() {
    if (sending.value || !cart.value.length || hasUnpricedItems.value || receipt.value) return null
    if (!zoneId.value || zoneId.value === SIN_ZONA_ID || !tableId.value || tableId.value === SIN_PUESTO_ID) {
      sendError.value = '请先从桌态页面选择餐桌。'
      return null
    }
    sending.value = true
    sendError.value = ''
    if (!clientOrderNo) clientOrderNo = `uni-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    try {
      const result = await request<OrderReceipt>('/api/v1/orders', 'POST', {
        client_order_no: clientOrderNo,
        zone_id: zoneId.value,
        table_id: tableId.value,
        comensales: covers.value,
        items: cart.value.map((line) => ({
          article_id: line.product.id,
          quantity: line.quantity,
          note: line.note,
          modifiers: line.modifiers.map(({ modifier_id, value_id }) => ({ modifier_id, value_id })),
        })),
      })
      receipt.value = result.order
      lastSubmittedLines.value = cart.value.map((line) => ({ ...line, modifiers: [...line.modifiers] }))
      clientOrderNo = ''
      cart.value = []
      return result.order
    } catch (error) {
      // Keep the same idempotency key if the response was lost after the server committed.
      sendError.value = error instanceof Error ? error.message : String(error)
      return null
    } finally {
      sending.value = false
    }
  }

  function clearReceipt() {
    receipt.value = null
  }

  return {
    zoneId, tableId, categories, products, taxIncluded, selectedCategoryId, loading, loadError,
    cart, lastSubmittedLines, covers, modalProduct, selectedModifiers, modalQuantity, modalNote, sending, sendError,
    receipt, itemCount, total, hasUnpricedItems, lineTotal, unitPrice, setTable, loadMenu,
    selectedCount, addWithoutOptions, openProduct, addModalProduct, adjustLine, adjustProduct, submitOrder, clearReceipt,
  }
})
