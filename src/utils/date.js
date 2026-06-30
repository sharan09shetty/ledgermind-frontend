import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'

// Format LocalDateTime for Spring Boot API params
export const toApiDateTime = (date) => format(date, "yyyy-MM-dd'T'HH:mm:ss")

export const monthStart = (date = new Date()) =>
  toApiDateTime(startOfMonth(date))

export const monthEnd = (date = new Date()) =>
  toApiDateTime(endOfMonth(date))

export const formatCurrency = (amount) => {
  if (amount == null) return '₹0'
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return format(parseISO(dateStr), 'd MMM yyyy, h:mm a')
}

export const formatMonth = (date = new Date()) =>
  format(date, 'MMMM yyyy')

export const prevMonth = (date) => {
  const d = new Date(date)
  d.setMonth(d.getMonth() - 1)
  return d
}

export const nextMonth = (date) => {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1)
  return d
}
