import {
  BUDGET_ACCOUNT_TYPES,
  BUDGET_BUCKET_TYPES,
  BUDGET_CARD_FLOW_TYPES,
  BUDGET_LEDGER_TYPES,
  BUDGET_TRANSACTION_TYPES,
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

const clampMonthDay = value => Math.min(31, Math.max(1, Math.round(toNumber(value, 1))));

export function budgetUid(prefix = "budget") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeBudgetLedgerId(ledgerId = "daily-ledger") {
  const value = cleanString(ledgerId, "daily-ledger");
  if (["personal-ledger", "daily-ledger"].includes(value)) return "daily-ledger";
  if (["australia-ledger", "investment-ledger", "travel-ledger"].includes(value)) return "travel-ledger";
  if (value === "business-ledger") return "business-ledger";
  return value;
}

export function todayBudgetDateKey(date = new Date()) {
  const source = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const y = source.getFullYear();
  const m = String(source.getMonth() + 1).padStart(2, "0");
  const d = String(source.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function budgetMonthKey(dateKey = todayBudgetDateKey()) {
  return String(dateKey || "").slice(0, 7) || todayBudgetDateKey().slice(0, 7);
}

export function normalizeBudgetProfile(profile = DEFAULT_BUDGET_PROFILE) {
  const source = profile && typeof profile === "object" ? profile : DEFAULT_BUDGET_PROFILE;
  return {
    ...DEFAULT_BUDGET_PROFILE,
    ...source,
    currency: cleanString(source.currency, DEFAULT_BUDGET_PROFILE.currency).toUpperCase(),
    monthlyIncome: toNumber(source.monthlyIncome, DEFAULT_BUDGET_PROFILE.monthlyIncome),
    resetDay: clampMonthDay(source.resetDay),
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
    icon: cleanString(account.icon, ""),
    chartColor: cleanString(account.chartColor, ""),
    hideBalance: Boolean(account.hideBalance),
    includeInNetWorth: account.includeInNetWorth !== false,
    includeInAustraliaReady: Boolean(account.includeInAustraliaReady),
    ledgerId: normalizeBudgetLedgerId(account.ledgerId),
    updatedAt: account.updatedAt || null,
  };
}

export function normalizeBudgetAccounts(accounts = DEFAULT_BUDGET_ACCOUNTS) {
  const list = Array.isArray(accounts) && accounts.length ? accounts : DEFAULT_BUDGET_ACCOUNTS;
  return list.map(normalizeBudgetAccount);
}

export function normalizeBudgetLedger(ledger = {}) {
  const id = normalizeBudgetLedgerId(ledger.id);
  const defaultLedger = DEFAULT_BUDGET_LEDGERS.find(item => item.id === id) || DEFAULT_BUDGET_LEDGERS[0];
  const type = BUDGET_LEDGER_TYPES.includes(ledger.type) ? ledger.type : defaultLedger.type;
  return {
    id,
    name: cleanString(ledger.name, defaultLedger.name),
    type,
    accountIds: Array.isArray(ledger.accountIds) ? ledger.accountIds.filter(Boolean) : defaultLedger.accountIds,
    description: cleanString(ledger.description, defaultLedger.description),
    updatedAt: ledger.updatedAt || null,
  };
}

export function normalizeBudgetLedgers(ledgers = DEFAULT_BUDGET_LEDGERS) {
  const incoming = Array.isArray(ledgers) ? ledgers : [];
  const byCanonicalId = new Map();
  incoming.forEach(ledger => {
    const normalized = normalizeBudgetLedger(ledger);
    byCanonicalId.set(normalized.id, {
      ...normalized,
      accountIds: Array.from(new Set([...(byCanonicalId.get(normalized.id)?.accountIds || []), ...normalized.accountIds])),
    });
  });
  return DEFAULT_BUDGET_LEDGERS.map(defaultLedger => byCanonicalId.get(defaultLedger.id) || normalizeBudgetLedger(defaultLedger));
}

export function normalizeBudgetBucket(bucket = {}) {
  const type = BUDGET_BUCKET_TYPES.includes(bucket.type) ? bucket.type : "flexible_spending";
  const cashFlowType = BUDGET_CARD_FLOW_TYPES.includes(bucket.cashFlowType) ? bucket.cashFlowType : type === "income" ? "income" : "expense";
  return {
    id: cleanString(bucket.id, budgetUid("bucket")),
    name: cleanString(bucket.name, "Untitled card"),
    monthlyAmount: toNumber(bucket.monthlyAmount, 0),
    type,
    cashFlowType,
    group: cleanString(bucket.group, cashFlowType === "income" ? "Income" : "Flexible spending"),
    accountId: cleanString(bucket.accountId, "main-bank"),
    ledgerId: normalizeBudgetLedgerId(bucket.ledgerId),
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
  const legacyDirection = transaction.direction === "income" ? "income" : transaction.direction === "transfer" ? "transfer" : "expense";
  const type = BUDGET_TRANSACTION_TYPES.includes(transaction.type) ? transaction.type : legacyDirection;
  const tags = Array.isArray(transaction.tags)
    ? transaction.tags.map(tag => cleanString(tag, "")).filter(Boolean)
    : String(transaction.tags || "").split(",").map(tag => cleanString(tag, "")).filter(Boolean);
  const now = new Date().toISOString();
  return {
    id: cleanString(transaction.id, budgetUid("txn")),
    type,
    direction: type === "income" ? "income" : type === "transfer" ? "transfer" : "expense",
    date: cleanString(transaction.date, todayBudgetDateKey()),
    description: cleanString(transaction.description, type === "transfer" ? "Transfer" : type === "income" ? "Income" : "Expense"),
    amount: Math.abs(toNumber(transaction.amount, 0)),
    accountId: cleanString(transaction.accountId, "main-bank"),
    toAccountId: type === "transfer" ? cleanString(transaction.toAccountId, "") : cleanString(transaction.toAccountId, ""),
    ledgerId: normalizeBudgetLedgerId(transaction.ledgerId),
    bucketId: type === "transfer" ? "" : cleanString(transaction.bucketId, ""),
    notes: cleanString(transaction.notes ?? transaction.note, ""),
    tags,
    excludedFromBudget: Boolean(transaction.excludedFromBudget),
    createdAt: transaction.createdAt || now,
    updatedAt: transaction.updatedAt || now,
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

export function budgetTransactionSignedAmount(transaction = {}) {
  const safe = normalizeBudgetTransaction(transaction);
  if (safe.type === "income") return Math.abs(safe.amount);
  if (safe.type === "expense") return -Math.abs(safe.amount);
  return 0;
}

export function calculateBudgetAccountBalances(accounts = [], transactions = []) {
  const safeAccounts = normalizeBudgetAccounts(accounts);
  const safeTransactions = normalizeBudgetTransactions(transactions);
  const balanceMap = new Map(safeAccounts.map(account => [account.id, {
    ...account,
    startingBalance: toNumber(account.balance, 0),
    transactionDelta: 0,
    currentBalance: toNumber(account.balance, 0),
  }]));

  const applyDelta = (accountId, delta) => {
    if (!accountId || !balanceMap.has(accountId)) return;
    const current = balanceMap.get(accountId);
    const transactionDelta = current.transactionDelta + delta;
    balanceMap.set(accountId, {
      ...current,
      transactionDelta,
      currentBalance: current.startingBalance + transactionDelta,
    });
  };

  safeTransactions.forEach(transaction => {
    const amount = Math.abs(toNumber(transaction.amount, 0));
    if (!amount) return;
    if (transaction.type === "income") applyDelta(transaction.accountId, amount);
    if (transaction.type === "expense") applyDelta(transaction.accountId, -amount);
    if (transaction.type === "transfer") {
      applyDelta(transaction.accountId, -amount);
      applyDelta(transaction.toAccountId, amount);
    }
  });

  return safeAccounts.map(account => balanceMap.get(account.id));
}

export function calculateBudgetBucketSpending(buckets = [], transactions = []) {
  const safeBuckets = normalizeBudgetBuckets(buckets);
  const safeTransactions = normalizeBudgetTransactions(transactions);
  const spending = Object.fromEntries(safeBuckets.map(bucket => [bucket.id, 0]));
  safeTransactions.forEach(transaction => {
    if (transaction.type !== "expense" || transaction.excludedFromBudget || !transaction.bucketId) return;
    spending[transaction.bucketId] = (spending[transaction.bucketId] || 0) + Math.abs(toNumber(transaction.amount, 0));
  });
  return spending;
}

export function calculateBudgetBucketIncome(buckets = [], transactions = []) {
  const safeBuckets = normalizeBudgetBuckets(buckets);
  const safeTransactions = normalizeBudgetTransactions(transactions);
  const income = Object.fromEntries(safeBuckets.map(bucket => [bucket.id, 0]));
  safeTransactions.forEach(transaction => {
    if (transaction.type !== "income" || transaction.excludedFromBudget || !transaction.bucketId) return;
    income[transaction.bucketId] = (income[transaction.bucketId] || 0) + Math.abs(toNumber(transaction.amount, 0));
  });
  return income;
}

export function groupBudgetTransactionsByDate(transactions = []) {
  const safeTransactions = normalizeBudgetTransactions(transactions)
    .sort((a, b) => `${b.date}-${b.createdAt}`.localeCompare(`${a.date}-${a.createdAt}`));
  return safeTransactions.reduce((groups, transaction) => {
    if (!groups[transaction.date]) groups[transaction.date] = [];
    groups[transaction.date].push(transaction);
    return groups;
  }, {});
}

export function calculateBudgetDailyTotals(transactions = []) {
  const totals = {};
  normalizeBudgetTransactions(transactions).forEach(transaction => {
    if (!totals[transaction.date]) totals[transaction.date] = { income: 0, expense: 0, transfer: 0, balance: 0 };
    const amount = Math.abs(toNumber(transaction.amount, 0));
    if (transaction.type === "income") totals[transaction.date].income += amount;
    if (transaction.type === "expense") totals[transaction.date].expense += amount;
    if (transaction.type === "transfer") totals[transaction.date].transfer += amount;
    totals[transaction.date].balance += budgetTransactionSignedAmount(transaction);
  });
  return totals;
}

export function calculateBudgetSummary({ profile, accounts = [], ledgers = [], buckets = [], transactions = [] } = {}) {
  const safeProfile = normalizeBudgetProfile(profile);
  const safeAccounts = normalizeBudgetAccounts(accounts);
  const safeBuckets = normalizeBudgetBuckets(buckets);
  const safeTransactions = normalizeBudgetTransactions(transactions);
  const adjustedAccounts = calculateBudgetAccountBalances(safeAccounts, safeTransactions);
  const monthlyIncome = toNumber(safeProfile.monthlyIncome, 0);
  const expenseBuckets = safeBuckets.filter(bucket => bucket.cashFlowType !== "income");
  const allocated = expenseBuckets.reduce((sum, bucket) => sum + toNumber(bucket.monthlyAmount, 0), 0);
  const protectedMonthly = expenseBuckets.filter(bucket => bucket.isProtected).reduce((sum, bucket) => sum + toNumber(bucket.monthlyAmount, 0), 0);
  const sinkingFundsMonthly = expenseBuckets.filter(bucket => bucket.type === "sinking_fund").reduce((sum, bucket) => sum + toNumber(bucket.monthlyAmount, 0), 0);
  const incomeTotal = safeTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + Math.abs(toNumber(t.amount, 0)), 0);
  const expenseTotal = safeTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Math.abs(toNumber(t.amount, 0)), 0);
  const transferTotal = safeTransactions.filter(t => t.type === "transfer").reduce((sum, t) => sum + Math.abs(toNumber(t.amount, 0)), 0);
  const bucketSpendById = calculateBudgetBucketSpending(safeBuckets, safeTransactions);
  const bucketIncomeById = calculateBudgetBucketIncome(safeBuckets, safeTransactions);
  return {
    monthlyIncome,
    allocated,
    remaining: monthlyIncome - allocated,
    protectedMonthly,
    sinkingFundsMonthly,
    flexibleMonthly: expenseBuckets.filter(bucket => bucket.type === "flexible_spending").reduce((sum, bucket) => sum + toNumber(bucket.monthlyAmount, 0), 0),
    accountCount: safeAccounts.length,
    ledgerCount: normalizeBudgetLedgers(ledgers).length,
    bucketCount: safeBuckets.length,
    transactionCount: safeTransactions.length,
    monthSpend: expenseTotal,
    incomeTotal,
    expenseTotal,
    transferTotal,
    monthlyBalance: incomeTotal - expenseTotal,
    netWorth: adjustedAccounts.filter(account => account.includeInNetWorth).reduce((sum, account) => sum + toNumber(account.currentBalance, 0), 0),
    australiaReadyFunds: adjustedAccounts.filter(account => account.includeInAustraliaReady).reduce((sum, account) => sum + toNumber(account.currentBalance, 0), 0),
    adjustedAccounts,
    bucketSpendById,
    bucketIncomeById,
    dailyTotals: calculateBudgetDailyTotals(safeTransactions),
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
