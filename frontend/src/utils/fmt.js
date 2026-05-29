const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

// ₹1,24,500
export function fmtINR(n) {
  return INR.format(n)
}

// ₹1.2L  ₹45K  ₹900
export function fmtINRCompact(n) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`
  return `₹${Math.round(n)}`
}

// 23.4%
export function fmtPct(n) {
  return `${n.toFixed(1)}%`
}

// "12 May 2024"
export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
