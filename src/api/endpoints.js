import api from './axios'

// ── Auth ──────────────────────────────────────────────────────────────────────

export const getGoogleLoginUrl = () =>
    `${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/google/login`

// Protected endpoint — must go through the authenticated axios instance
// (Authorization header), not a plain <a href> or window.location, since
// the backend ignores query params for auth. Returns the actual Google
// consent URL; only that second step should be a real browser navigation.
export const connectGmail = () =>
    api.get('/auth/google/gmail/connect').then((r) => r.data)

export const disconnectGmail = () =>
    api.post('/auth/google/gmail/disconnect').then((r) => r.data)

// ── User ──────────────────────────────────────────────────────────────────────

export const getUserStatus = () =>
    api.get('/users/status').then((r) => r.data)

export const setBank = (code) =>
    api.patch(`/users/bank?code=${code}`).then((r) => r.data)

export const getBanks = () =>
    api.get('/banks').then((r) => r.data)

// ── Telegram ──────────────────────────────────────────────────────────────────

export const getTelegramLinkToken = () =>
    api.post('/telegram/link-token').then((r) => r.data)

export const unlinkTelegram = () =>
    api.post('/telegram/unlink').then((r) => r.data)

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

// ── Transaction edit (merchant / mode / category) ───────────────────────────────

export const updateTransaction = (transactionId, { counterparty, paymentMode, category }) =>
    api.patch(`/transactions/${transactionId}`, { counterparty, paymentMode, category }).then((r) => r.data)

// ── Transaction delete ───────────────────────────────────────────────────────

export const deleteTransaction = (transactionId) =>
    api.delete(`/transactions/${transactionId}`).then((r) => r.data)