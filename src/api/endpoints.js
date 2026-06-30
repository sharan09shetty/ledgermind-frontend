import api from './axios'

// ── Auth ──────────────────────────────────────────────────────────────────────

export const getGoogleLoginUrl = () =>
  `${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/google/login`

// ── User ──────────────────────────────────────────────────────────────────────

export const getUserStatus = () =>
  api.get('/users/status').then((r) => r.data)

export const setBank = (code) =>
  api.patch(`/users/bank?code=${code}`).then((r) => r.data)

export const getBanks = () =>
  api.get('/banks').then((r) => r.data)

// ── Analytics ─────────────────────────────────────────────────────────────────

export const getSummary = (from, to) =>
  api.get('/analytics/summary', { params: { from, to } }).then((r) => r.data)

export const getMonthly = (from, to) =>
  api.get('/analytics/monthly', { params: { from, to } }).then((r) => r.data)

export const getCategories = (from, to) =>
  api.get('/analytics/categories', { params: { from, to } }).then((r) => r.data)

export const getMerchants = (from, to, topN = 10) =>
  api.get('/analytics/merchants', { params: { from, to, topN } }).then((r) => r.data)

export const getTransactions = (params) =>
  api.get('/analytics/transactions', { params }).then((r) => r.data)

// ── Cash log ──────────────────────────────────────────────────────────────────

export const logCashTransaction = (description) =>
  api.post('/transactions/cash', { description }).then((r) => r.data)

// ── Category correction ───────────────────────────────────────────────────────

export const updateCategory = (transactionId, category) =>
  api.patch(`/analytics/transactions/${transactionId}/category`, { category }).then((r) => r.data)
