const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}
