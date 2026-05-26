import {
  BUDGET_ACCOUNT_TYPES,
  BUDGET_BUCKET_TYPES,
  BUDGET_LEDGER_TYPES,
  DEFAULT_BONUS_ALLOCATION_RULES,
  DEFAULT_BUDGET_ACCOUNTS,
  DEFAULT_BUDGET_BUCKETS,
  DEFAULT_BUDGET_LEDGERS,
  DEFAULT_BUDGET_PROFILE,
  DEFAULT_BUDGET_TRANSACTIONS,
} from "../constants/budgetConstants.js";

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const cleanString = (value, fallback = "") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

export function budgetUid(prefix = "budget") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeBudgetProfile(profile = DEFAULT_BUDGET_PROFILE) {
  const source = profile && typeof profile === "object" ? profile : DEFAULT_BUDGET_PROFILE;
  return {
    ...DEFAULT_BUDGET_PROFILE,
    ...source,
    currency: cleanString(source.currency, DEFAULT_BUDGET_PROFILE.currency).toUpperCase(),
    monthlyIncome: toNumber(source.monthlyIncome, DEFAULT_BUDGET_PROFILE.monthlyIncome),
    resetDay: Math.min(31, Math.max(1, Math.round(toNumber(source.resetDay, 1)))),
  };
}

export function normalizeBudgetAccount(account = {}) {
  const type = BUDGET_ACCOUNT_TYPES.includes(account.type) ? account.type : "debit";
  return {
    id: cleanString(account.id, budgetUid("account")),
    name: cleanString(account.name, "Untitled account"),
    type,
    currency: cleanString(account.currency, "SGD").toUpperCase(),
    balance: toNumber(account.balance, 0),
    institution: cleanString(account.institution, "Editable"),
    includeInNetWorth: account.includeInNetWorth !== false,
    includeInAustraliaReady: Boolean(account.includeInAustraliaReady),
    ledgerId: cleanString(account.ledgerId, "personal-ledger"),
    updatedAt: account.updatedAt || null,
  };
}

export function normalizeBudgetAccounts(accounts = DEFAULT_BUDGET_ACCOUNTS) {
  const list = Array.isArray(accounts) && accounts.length ? accounts : DEFAULT_BUDGET_ACCOUNTS;
  return list.map(normalizeBudgetAccount);
}

export function normalizeBudgetLedger(ledger = {}) {
  const type = BUDGET_LEDGER_TYPES.includes(ledger.type) ? ledger.type : "personal";
  return {
    id: cleanString(ledger.id, budgetUid("ledger")),
    name: cleanString(ledger.name, "Untitled ledger"),
    type,
    accountIds: Array.isArray(ledger.accountIds) ? ledger.accountIds.filter(Boolean) : [],
    description: cleanString(ledger.description, ""),
    updatedAt: ledger.updatedAt || null,
  };
}

export function normalizeBudgetLedgers(ledgers = DEFAULT_BUDGET_LEDGERS) {
  const list = Array.isArray(ledgers) && ledgers.length ? ledgers : DEFAULT_BUDGET_LEDGERS;
  return list.map(normalizeBudgetLedger);
}

export function normalizeBudgetBucket(bucket = {}) {
  const type = BUDGET_BUCKET_TYPES.includes(bucket.type) ? bucket.type : "flexible_spending";
  return {
    id: cleanString(bucket.id, budgetUid("bucket")),
    name: cleanString(bucket.name, "Untitled bucket"),
    monthlyAmount: toNumber(bucket.monthlyAmount, 0),
    type,
    group: cleanString(bucket.group, "Flexible spending"),
    accountId: cleanString(bucket.accountId, "main-bank"),
    ledgerId: cleanString(bucket.ledgerId, "personal-ledger"),
    isProtected: Boolean(bucket.isProtected),
    rolloverEnabled: Boolean(bucket.rolloverEnabled),
    damageControlPriority: bucket.damageControlPriority === null || bucket.damageControlPriority === undefined ? null : toNumber(bucket.damageControlPriority, null),
    notes: cleanString(bucket.notes, ""),
    updatedAt: bucket.updatedAt || null,
  };
}

export function normalizeBudgetBuckets(buckets = DEFAULT_BUDGET_BUCKETS) {
  const list = Array.isArray(buckets) && buckets.length ? buckets : DEFAULT_BUDGET_BUCKETS;
  return list.map(normalizeBudgetBucket);
}

export function normalizeBudgetTransaction(transaction = {}) {
  return {
    id: cleanString(transaction.id, budgetUid("txn")),
    date: cleanString(transaction.date, new Date().toISOString().slice(0, 10)),
    description: cleanString(transaction.description, ""),
    amount: toNumber(transaction.amount, 0),
    direction: transaction.direction === "income" ? "income" : "expense",
    accountId: cleanString(transaction.accountId, "main-bank"),
    ledgerId: cleanString(transaction.ledgerId, "personal-ledger"),
    bucketId: cleanString(transaction.bucketId, ""),
    notes: cleanString(transaction.notes, ""),
    createdAt: transaction.createdAt || null,
    updatedAt: transaction.updatedAt || null,
  };
}

export function normalizeBudgetTransactions(transactions = DEFAULT_BUDGET_TRANSACTIONS) {
  return Array.isArray(transactions) ? transactions.map(normalizeBudgetTransaction) : [];
}

export function normalizeBonusAllocationRules(rules = DEFAULT_BONUS_ALLOCATION_RULES) {
  const list = Array.isArray(rules) && rules.length ? rules : DEFAULT_BONUS_ALLOCATION_RULES;
  return list.map(rule => ({
    bucketId: cleanString(rule.bucketId, ""),
    label: cleanString(rule.label, rule.bucketId || "Bonus bucket"),
    percentage: toNumber(rule.percentage, 0),
  }));
}

export function calculateBudgetSummary({ profile, accounts = [], ledgers = [], buckets = [], transactions = [] } = {}) {
  const safeProfile = normalizeBudgetProfile(profile);
  const safeAccounts = normalizeBudgetAccounts(accounts);
  const safeBuckets = normalizeBudgetBuckets(buckets);
  const safeTransactions = normalizeBudgetTransactions(transactions);
  const monthlyIncome = toNumber(safeProfile.monthlyIncome, 0);
  const allocated = safeBuckets.reduce((sum, bucket) => sum + toNumber(bucket.monthlyAmount, 0), 0);
  const protectedMonthly = safeBuckets.filter(bucket => bucket.isProtected).reduce((sum, bucket) => sum + toNumber(bucket.monthlyAmount, 0), 0);
  const sinkingFundsMonthly = safeBuckets.filter(bucket => bucket.type === "sinking_fund").reduce((sum, bucket) => sum + toNumber(bucket.monthlyAmount, 0), 0);
  const netWorth = safeAccounts.filter(account => account.includeInNetWorth).reduce((sum, account) => sum + toNumber(account.balance, 0), 0);
  const australiaReadyFunds = safeAccounts.filter(account => account.includeInAustraliaReady).reduce((sum, account) => sum + toNumber(account.balance, 0), 0);
  const monthSpend = safeTransactions.filter(t => t.direction === "expense").reduce((sum, t) => sum + Math.abs(toNumber(t.amount, 0)), 0);
  return {
    monthlyIncome,
    allocated,
    remaining: monthlyIncome - allocated,
    protectedMonthly,
    sinkingFundsMonthly,
    flexibleMonthly: safeBuckets.filter(bucket => bucket.type === "flexible_spending").reduce((sum, bucket) => sum + toNumber(bucket.monthlyAmount, 0), 0),
    accountCount: safeAccounts.length,
    ledgerCount: normalizeBudgetLedgers(ledgers).length,
    bucketCount: safeBuckets.length,
    transactionCount: safeTransactions.length,
    monthSpend,
    netWorth,
    australiaReadyFunds,
  };
}

export function formatBudgetMoney(value, currency = "SGD") {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: currency || "SGD",
    maximumFractionDigits: Number(value) % 1 === 0 ? 0 : 2,
  }).format(toNumber(value, 0));
}

export function patchBudgetItem(list, id, patch) {
  const timestamp = new Date().toISOString();
  return (Array.isArray(list) ? list : []).map(item => item.id === id ? { ...item, ...patch, updatedAt: timestamp } : item);
}
