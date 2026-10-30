/** Format euros without depending on Intl, which may be absent in older App runtimes. */
export function formatEuro(value: number): string {
  const amount = Number.isFinite(value) ? value : 0
  const fixed = Math.abs(amount).toFixed(2)
  const [integer, fraction] = fixed.split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const sign = amount < 0 ? '-' : ''
  return `${sign}${grouped},${fraction}\u00a0€`
}
