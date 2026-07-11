import {
  UtensilsCrossed, Plane, ShoppingBag, Receipt, Clapperboard,
  HeartPulse, TrendingUp, Wallet, ArrowLeftRight, CircleDashed,
} from 'lucide-react'

export const CATEGORIES = [
  'FOOD', 'TRAVEL', 'SHOPPING', 'BILLS', 'ENTERTAINMENT',
  'HEALTH', 'INVESTMENT', 'SALARY', 'TRANSFER', 'OTHER',
]

export const TYPES = ['DEBIT', 'CREDIT']

export const PAYMENT_MODES = ['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'CHEQUE', 'NEFT', 'IMPS', 'RTGS']

export const CATEGORY_META = {
  FOOD: { label: 'Food', color: '#F59E0B', icon: UtensilsCrossed },
  TRAVEL: { label: 'Travel', color: '#3B82F6', icon: Plane },
  SHOPPING: { label: 'Shopping', color: '#8B5CF6', icon: ShoppingBag },
  BILLS: { label: 'Bills', color: '#6B7280', icon: Receipt },
  ENTERTAINMENT: { label: 'Entertainment', color: '#EC4899', icon: Clapperboard },
  HEALTH: { label: 'Health', color: '#10B981', icon: HeartPulse },
  INVESTMENT: { label: 'Investment', color: '#14B8A6', icon: TrendingUp },
  SALARY: { label: 'Salary', color: '#22C55E', icon: Wallet },
  TRANSFER: { label: 'Transfer', color: '#64748B', icon: ArrowLeftRight },
  OTHER: { label: 'Other', color: '#94A3B8', icon: CircleDashed },
}

export const categoryColor = (category) => CATEGORY_META[category]?.color ?? '#94A3B8'
export const categoryLabel = (category) => CATEGORY_META[category]?.label ?? category ?? 'Other'
export const CategoryIcon = ({ category, size = 15, ...props }) => {
  const Icon = CATEGORY_META[category]?.icon ?? CircleDashed
  return <Icon size={size} {...props} />
}

const MODE_ACRONYMS = new Set(['UPI', 'NEFT', 'IMPS', 'RTGS'])

export const formatMode = (mode) =>
  mode
    ? mode
        .split('_')
        .map((w) => (MODE_ACRONYMS.has(w) ? w : w[0] + w.slice(1).toLowerCase()))
        .join(' ')
    : ''
