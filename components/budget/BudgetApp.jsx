import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BUDGET_ACCOUNT_TYPES,
  BUDGET_BUCKET_TYPES,
  BUDGET_CARD_FLOW_TYPES,
  BUDGET_TRANSACTION_TYPES,
} from "../../constants/budgetConstants";
import {
  budgetUid,
  calculateBudgetAccountBalances,
  calculateBudgetDailyTotals,
  calculateBudgetSummary,
  formatBudgetMoney,
  groupBudgetTransactionsByDate,
  normalizeBudgetAccount,
  normalizeBudgetBucket,
  normalizeBudgetTransaction,
  normalizeBudgetTransactions,
  patchBudgetItem,
  todayBudgetDateKey,
} from "../../utils/budgetPlanUtils";

const transactionTypeCopy = {
  expense: { label: "Expense", icon: "−", tone: "danger" },
  income: { label: "Income", icon: "+", tone: "good" },
  transfer: { label: "Transfer", icon: "⇄", tone: "neutral" },
};

function FieldLabel({ children }) {
  return <span className="budget-field-label">{children}</span>;
}

function MoneyInput({ value, onChange, ariaLabel }) {
  return (
    <input
      className="budget-input money"
      type="number"
      step="0.01"
      value={Number.isFinite(Number(value)) ? value : 0}
      aria-label={ariaLabel}
      onChange={event => onChange(Number(event.target.value || 0))}
    />
  );
}

function SelectInput({ value, options, onChange, ariaLabel }) {
  return (
    <select className="budget-input" value={value} aria-label={ariaLabel} onChange={event => onChange(event.target.value)}>
      {options.map(option => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
    </select>
  );
}

function BudgetMetric({ label, value, detail, tone = "neutral" }) {
  return (
    <div className={`budget-metric budget-metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

function formatShortDate(dateKey) {
  const [, month, day] = String(dateKey || "").split("-");
  return month && day ? `${Number(day)}/${Number(month)}` : dateKey;
}

function transactionTone(transaction) {
  if (transaction.type === "income") return "good";
  if (transaction.type === "expense") return "danger";
  return "neutral";
}

function transactionDisplayAmount(transaction, currency) {
  const amount = Math.abs(Number(transaction.amount || 0));
  const prefix = transaction.type === "income" ? "+" : transaction.type === "expense" ? "−" : "⇄ ";
  return `${prefix}${formatBudgetMoney(amount, currency)}`;
}

function buildBudgetCalendarDays(monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() + index - mondayOffset);
    return {
      key: todayBudgetDateKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}

function monthTitle(date) {
  return new Intl.DateTimeFormat("en-SG", { month: "long", year: "numeric" }).format(date);
}

function createEmptyTransactionForm({ accounts, ledgers, buckets, type = "expense" }) {
  const firstAccount = accounts[0]?.id || "main-bank";
  const secondAccount = accounts.find(account => account.id !== firstAccount)?.id || firstAccount;
  const firstLedger = ledgers[0]?.id || "daily-ledger";
  const firstExpenseBucket = buckets.find(bucket => bucket.cashFlowType !== "income" && bucket.ledgerId === "daily-ledger") || buckets.find(bucket => bucket.cashFlowType !== "income") || buckets[0] || null;
  const firstIncomeBucket = buckets.find(bucket => bucket.cashFlowType === "income" && bucket.ledgerId === "daily-ledger") || buckets.find(bucket => bucket.cashFlowType === "income") || buckets[0] || null;
  const selectedBucket = type === "income" ? firstIncomeBucket : type === "expense" ? firstExpenseBucket : null;
  return {
    id: null,
    type,
    amount: "",
    date: todayBudgetDateKey(),
    description: "",
    accountId: selectedBucket?.accountId || firstAccount,
    toAccountId: secondAccount,
    ledgerId: selectedBucket?.ledgerId || firstLedger,
    bucketId: type === "transfer" ? "" : selectedBucket?.id || "",
    notes: "",
    tags: "",
  };
}

function formFromTransaction(transaction, fallback) {
  const safe = normalizeBudgetTransaction(transaction);
  return {
    id: safe.id,
    type: safe.type,
    amount: String(safe.amount || ""),
    date: safe.date,
    description: safe.description,
    accountId: safe.accountId,
    toAccountId: safe.toAccountId || fallback.toAccountId,
    ledgerId: safe.ledgerId,
    bucketId: safe.bucketId,
    notes: safe.notes,
    tags: safe.tags.join(", "),
  };
}

function selectedBudgetBucket(form, buckets) {
  if (!form || form.type === "transfer") return null;
  return buckets.find(bucket => bucket.id === form.bucketId) || null;
}

function quickTransactionChips(bucket, type) {
  if (type === "income") return ["Salary", "Side income", "Returned money", "Interest"];
  if (!bucket) return ["Lunch", "Grab", "Shopping", "Activity"];
  const name = String(bucket.name || "").toLowerCase();
  if (name.includes("food")) return ["Lunch", "Dinner", "Groceries", "Coffee"];
  if (name.includes("transport")) return ["Grab", "Taxi", "Parking", "Public Trans"];
  if (name.includes("travel") || name.includes("photo")) return ["Flight", "Trip", "Lens", "Hotel"];
  if (name.includes("business")) return ["Ads", "Tools", "Stock", "Software"];
  if (name.includes("mother")) return ["Mother", "Family", "Transfer", "Gift"];
  if (name.includes("australia")) return ["Australia Fund", "Move fund", "Deposit", "Buffer"];
  if (name.includes("investment")) return ["Investment", "ETF", "Top up", "Dividend"];
  return ["Shopping", "Activity", "Planned", "Misc"];
}

function updateKeypadAmount(value, key) {
  const current = String(value || "");
  if (key === "backspace") return current.slice(0, -1);
  if (key === "clear") return "";
  if (key === ".") return current.includes(".") ? current : `${current || "0"}.`;
  const next = `${current}${key}`.replace(/^0+(?=\d)/, "");
  const [, cents = ""] = next.split(".");
  return cents.length > 2 ? current : next;
}

function moveBudgetItem(items, itemId, direction, predicate = () => true) {
  const eligibleItems = items.filter(predicate);
  const eligibleIndex = eligibleItems.findIndex(item => item.id === itemId);
  const swapItem = eligibleItems[eligibleIndex + direction];
  if (eligibleIndex < 0 || !swapItem) return items;
  const nextItems = [...items];
  const sourceIndex = nextItems.findIndex(item => item.id === itemId);
  const targetIndex = nextItems.findIndex(item => item.id === swapItem.id);
  if (sourceIndex < 0 || targetIndex < 0) return items;
  [nextItems[sourceIndex], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[sourceIndex]];
  return nextItems;
}

function canMoveBudgetItem(items, itemId, direction, predicate = () => true) {
  const eligibleItems = items.filter(predicate);
  const eligibleIndex = eligibleItems.findIndex(item => item.id === itemId);
  return eligibleIndex >= 0 && Boolean(eligibleItems[eligibleIndex + direction]);
}

function useBudgetLongPress(onLongPress, disabled = false, delay = 3000) {
  const timerRef = useRef(null);
  const longPressedRef = useRef(false);
  const clearTimer = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };
  const start = () => {
    if (disabled) return;
    longPressedRef.current = false;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      longPressedRef.current = true;
      onLongPress?.();
    }, delay);
  };
  const end = () => clearTimer();
  const consumeLongPress = () => {
    const wasLongPressed = longPressedRef.current;
    longPressedRef.current = false;
    return wasLongPressed;
  };
  useEffect(() => () => clearTimer(), []);
  return {
    longPressHandlers: {
      onPointerDown: start,
      onPointerUp: end,
      onPointerLeave: end,
      onPointerCancel: end,
    },
    consumeLongPress,
  };
}

function BudgetAmountKeypad({ value, onChange, onSave, currency }) {
  const keys = ["7", "8", "9", "backspace", "4", "5", "6", "clear", "1", "2", "3", ".", currency, "0", "00", "save"];
  const handleKey = key => {
    if (key === currency) return;
    if (key === "save") return onSave();
    if (key === "00") return onChange(updateKeypadAmount(updateKeypadAmount(value, "0"), "0"));
    return onChange(updateKeypadAmount(value, key));
  };
  return (
    <div className="budget-popup-keypad" aria-label="Transaction amount keypad">
      {keys.map(key => (
        <button
          key={key}
          className={key === "save" ? "confirm" : key === currency ? "currency" : ""}
          type="button"
          onClick={() => handleKey(key)}
          disabled={key === currency}
          aria-label={key === "backspace" ? "Delete digit" : key === "clear" ? "Clear amount" : key === "save" ? "Record transaction" : key}
        >
          {key === "backspace" ? "⌫" : key === "clear" ? "C" : key === "save" ? "✓" : key}
        </button>
      ))}
    </div>
  );
}

function BudgetTransactionPopup({ form, setForm, accounts, ledgers, buckets, currency, summary, onSave, onClose }) {
  if (!form) return null;
  const contextBucket = selectedBudgetBucket(form, buckets);
  const title = contextBucket?.name || form.description || transactionTypeCopy[form.type]?.label || "Transaction";
  const popup = (
    <div className="budget-transaction-popup-overlay" role="dialog" aria-modal="true" aria-label={`Record ${title}`}>
      <button className="budget-transaction-popup-backdrop" type="button" onClick={onClose} aria-label="Close transaction recorder" />
      <div className="budget-transaction-popup-sheet">
        <div className="budget-popup-header">
          <button type="button" onClick={onClose} aria-label="Close transaction recorder">×</button>
          <strong>{title}</strong>
          <span aria-hidden="true">☷</span>
        </div>
        <BudgetTransactionForm
          form={form}
          setForm={setForm}
          accounts={accounts}
          ledgers={ledgers}
          buckets={buckets}
          currency={currency}
          onSave={onSave}
          onCancelEdit={onClose}
          popup
          contextBucket={contextBucket}
          summary={summary}
        />
      </div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(popup, document.body) : popup;
}

function EditableProfileCard({ profile, onChange }) {
  return (
    <section className="budget-card budget-profile-card">
      <div className="budget-card-head">
        <div>
          <p className="budget-kicker">Budget V1 defaults</p>
          <h2>Monthly allocation plan</h2>
        </div>
        <span className="budget-editable-pill">Editable</span>
      </div>
      <div className="budget-form-grid">
        <label>
          <FieldLabel>Plan name</FieldLabel>
          <input className="budget-input" value={profile.name || ""} onChange={event => onChange({ ...profile, name: event.target.value })} />
        </label>
        <label>
          <FieldLabel>Monthly income</FieldLabel>
          <MoneyInput value={profile.monthlyIncome} onChange={monthlyIncome => onChange({ ...profile, monthlyIncome })} ariaLabel="Monthly income" />
        </label>
        <label>
          <FieldLabel>Currency</FieldLabel>
          <input className="budget-input" value={profile.currency || "SGD"} onChange={event => onChange({ ...profile, currency: event.target.value.toUpperCase() })} />
        </label>
        <label>
          <FieldLabel>Monthly reset day</FieldLabel>
          <input className="budget-input" type="number" min="1" max="31" value={profile.resetDay || 1} onChange={event => onChange({ ...profile, resetDay: Number(event.target.value || 1) })} />
        </label>
      </div>
      <textarea className="budget-input budget-notes" value={profile.notes || ""} onChange={event => onChange({ ...profile, notes: event.target.value })} aria-label="Budget notes" />
    </section>
  );
}

const accountGroupMeta = {
  debit: { label: "Debit", icon: "💳", tone: "pink" },
  credit: { label: "Credit", icon: "💜", tone: "violet" },
  borrowed: { label: "Borrowed", icon: "🤝", tone: "cream" },
  invest: { label: "Invest", icon: "📈", tone: "mint" },
  other: { label: "Other", icon: "🧾", tone: "soft" },
};

const accountTypeMeta = {
  debit: { label: "Debit card", group: "debit", icon: "💳" },
  savings: { label: "Savings", group: "debit", icon: "🏦" },
  cash: { label: "Cash", group: "debit", icon: "💵" },
  wallet: { label: "Wallet", group: "debit", icon: "👛" },
  business: { label: "Business", group: "debit", icon: "🧰" },
  credit: { label: "Credit card", group: "credit", icon: "💳" },
  other_credit: { label: "Other credit", group: "credit", icon: "💜" },
  borrowed: { label: "Borrowed", group: "borrowed", icon: "🤝" },
  loan: { label: "Loan", group: "borrowed", icon: "📄" },
  investment: { label: "Investment", group: "invest", icon: "📈" },
  stock: { label: "Stock", group: "invest", icon: "📊" },
  fund: { label: "Fund", group: "invest", icon: "📉" },
  crypto: { label: "Crypto", group: "invest", icon: "🪙" },
  real_estate: { label: "Real estate", group: "invest", icon: "🏠" },
  cpf: { label: "CPF", group: "invest", icon: "🧾" },
  other: { label: "Other account", group: "other", icon: "🧾" },
};

const addAccountGroups = [
  { label: "Debit", options: [["debit", "Debit Cards"], ["cash", "Cash"], ["wallet", "Wallet / PayPal"], ["savings", "Other Debit Account"]] },
  { label: "Credit", options: [["credit", "Credit Cards"], ["other_credit", "Other Credit Account"]] },
  { label: "Borrow/Lend", options: [["borrowed", "Borrowed"], ["loan", "Loan"]] },
  { label: "Invest", options: [["stock", "Stock"], ["fund", "Fund"], ["crypto", "Crypto"], ["real_estate", "Real Estate"], ["investment", "Other Investment"]] },
];

function accountMeta(account) {
  return accountTypeMeta[account?.type] || accountTypeMeta.other;
}

function accountGroupKey(account) {
  return accountMeta(account).group || "other";
}

function accountDisplayIcon(account) {
  return account.icon || accountMeta(account).icon || "💳";
}

function accountSignedTransactionAmount(transaction, accountId) {
  const amount = Math.abs(Number(transaction.amount || 0));
  if (transaction.type === "income" && transaction.accountId === accountId) return amount;
  if (transaction.type === "expense" && transaction.accountId === accountId) return -amount;
  if (transaction.type === "transfer") {
    if (transaction.accountId === accountId) return -amount;
    if (transaction.toAccountId === accountId) return amount;
  }
  return 0;
}

function accountTransactionDisplayAmount(transaction, accountId, currency) {
  const amount = accountSignedTransactionAmount(transaction, accountId);
  if (!amount) return `⇄ ${formatBudgetMoney(Math.abs(Number(transaction.amount || 0)), currency)}`;
  return `${amount > 0 ? "+" : "−"}${formatBudgetMoney(Math.abs(amount), currency)}`;
}

function AccountAddSheet({ open, currency, ledgers, onAdd, onClose }) {
  const [query, setQuery] = useState("");
  if (!open) return null;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredGroups = addAccountGroups
    .map(group => ({
      ...group,
      options: group.options.filter(([, label]) => label.toLowerCase().includes(normalizedQuery)),
    }))
    .filter(group => group.options.length);
  const addTypedAccount = (type, label) => {
    const meta = accountTypeMeta[type] || accountTypeMeta.other;
    onAdd(normalizeBudgetAccount({
      id: budgetUid("account"),
      name: label,
      type,
      currency,
      balance: 0,
      institution: meta.label,
      ledgerId: ledgers[0]?.id || "daily-ledger",
      includeInNetWorth: true,
      includeInAustraliaReady: false,
      icon: meta.icon,
    }));
    onClose();
  };
  return (
    <div className="budget-account-sheet-overlay" role="dialog" aria-modal="true" aria-label="Add budget account">
      <button className="budget-transaction-popup-backdrop" type="button" onClick={onClose} aria-label="Close add account" />
      <div className="budget-account-sheet">
        <div className="budget-popup-header">
          <button type="button" onClick={onClose} aria-label="Close add account">×</button>
          <strong>Add Account</strong>
          <span aria-hidden="true">＋</span>
        </div>
        <input className="budget-input budget-account-search" value={query} placeholder="Search account type" onChange={event => setQuery(event.target.value)} aria-label="Search account type" />
        <div className="budget-account-type-list">
          {filteredGroups.map(group => (
            <div className="budget-account-type-group" key={group.label}>
              <p>{group.label}</p>
              {group.options.map(([type, label]) => (
                <button key={type} type="button" onClick={() => addTypedAccount(type, label)}>
                  <span>{accountTypeMeta[type]?.icon || "💳"}</span>
                  <strong>{label}</strong>
                  <em>›</em>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccountEditPopup({ account, ledgers, currency, canDelete, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(() => account ? { ...account } : null);
  useEffect(() => {
    setDraft(account ? { ...account } : null);
  }, [account]);
  if (!account || !draft) return null;
  const update = patch => setDraft(current => ({ ...current, ...patch }));
  const save = () => onSave(normalizeBudgetAccount({ ...draft, updatedAt: new Date().toISOString() }));
  return (
    <div className="budget-account-sheet-overlay" role="dialog" aria-modal="true" aria-label={`Edit ${account.name}`}>
      <button className="budget-transaction-popup-backdrop" type="button" onClick={onClose} aria-label="Close account editor" />
      <div className="budget-account-edit-sheet">
        <div className="budget-popup-header">
          <button type="button" onClick={onClose} aria-label="Close account editor">×</button>
          <strong>Edit Account</strong>
          <span aria-hidden="true">☷</span>
        </div>
        <div className="budget-account-edit-grid">
          <label><FieldLabel>Icon</FieldLabel><input className="budget-input" value={draft.icon || accountDisplayIcon(draft)} onChange={event => update({ icon: event.target.value })} /></label>
          <label><FieldLabel>Name</FieldLabel><input className="budget-input" value={draft.name || ""} onChange={event => update({ name: event.target.value })} /></label>
          <label><FieldLabel>Note / institution</FieldLabel><input className="budget-input" value={draft.institution || ""} onChange={event => update({ institution: event.target.value })} /></label>
          <label><FieldLabel>Currency</FieldLabel><input className="budget-input" value={draft.currency || currency} onChange={event => update({ currency: event.target.value.toUpperCase() })} /></label>
          <label><FieldLabel>Starting balance</FieldLabel><MoneyInput value={draft.balance} onChange={balance => update({ balance })} ariaLabel={`${draft.name} balance`} /></label>
          <label><FieldLabel>Type</FieldLabel><SelectInput value={draft.type} options={BUDGET_ACCOUNT_TYPES} onChange={type => update({ type, icon: draft.icon || accountTypeMeta[type]?.icon })} ariaLabel="Account type" /></label>
          <label><FieldLabel>Ledger</FieldLabel><select className="budget-input" value={draft.ledgerId} onChange={event => update({ ledgerId: event.target.value })}>{ledgers.map(ledger => <option key={ledger.id} value={ledger.id}>{ledger.name}</option>)}</select></label>
        </div>
        <div className="budget-account-toggle-list">
          <label className="budget-switch-row"><span>Count in net worth</span><input type="checkbox" checked={Boolean(draft.includeInNetWorth)} onChange={event => update({ includeInNetWorth: event.target.checked })} /></label>
          <label className="budget-switch-row"><span>Australia-ready funds</span><input type="checkbox" checked={Boolean(draft.includeInAustraliaReady)} onChange={event => update({ includeInAustraliaReady: event.target.checked })} /></label>
          <label className="budget-switch-row"><span>Hide balance on cards</span><input type="checkbox" checked={Boolean(draft.hideBalance)} onChange={event => update({ hideBalance: event.target.checked })} /></label>
        </div>
        <div className="budget-account-edit-actions">
          <button className="tf-save" type="button" onClick={save}>Confirm</button>
          {canDelete && <button className="tf-cancel danger" type="button" onClick={() => onDelete(account.id)}>Delete</button>}
        </div>
      </div>
    </div>
  );
}

function AccountCard({ account, currency, onOpen, editMode = false, onEnterEditMode, onDelete, onMoveLeft, onMoveRight, canMoveLeft = false, canMoveRight = false }) {
  const meta = accountMeta(account);
  const amount = account.hideBalance ? "••••" : formatBudgetMoney(account.currentBalance ?? account.balance, currency);
  const { longPressHandlers, consumeLongPress } = useBudgetLongPress(onEnterEditMode, editMode);
  const openAccount = event => {
    if (editMode || consumeLongPress()) {
      event.preventDefault();
      return;
    }
    onOpen(account.id);
  };
  const stopAction = handler => event => {
    event.preventDefault();
    event.stopPropagation();
    handler?.(account);
  };
  return (
    <div className={`budget-account-card budget-account-card-${meta.group} ${editMode ? "budget-edit-mode-card" : ""}`} {...longPressHandlers} role="group" aria-label={`${account.name} account card`}>
      <button className="budget-account-card-main" type="button" onClick={openAccount} aria-label={`Open ${account.name}`}>
        <span className="budget-account-logo">{accountDisplayIcon(account)}</span>
        <strong>{account.name}</strong>
        <small>{account.institution || meta.label}</small>
        <em>{amount}</em>
      </button>
      {editMode && (
        <div className="budget-card-edit-controls" aria-label={`${account.name} edit controls`}>
          <button type="button" onClick={stopAction(onMoveLeft)} disabled={!canMoveLeft} aria-label={`Move ${account.name} left`}>‹</button>
          <button className="danger" type="button" onClick={stopAction(onDelete)} aria-label={`Delete ${account.name}`}>×</button>
          <button type="button" onClick={stopAction(onMoveRight)} disabled={!canMoveRight} aria-label={`Move ${account.name} right`}>›</button>
        </div>
      )}
    </div>
  );
}

function AccountDetailView({ account, transactions, accounts, ledgers, buckets, currency, onClose, onEdit, onOpenTransfer, onOpenExpense }) {
  const entries = normalizeBudgetTransactions(transactions)
    .filter(transaction => transaction.accountId === account.id || transaction.toAccountId === account.id)
    .sort((a, b) => `${b.date}-${b.createdAt}`.localeCompare(`${a.date}-${a.createdAt}`));
  const bucketById = Object.fromEntries(buckets.map(bucket => [bucket.id, bucket]));
  const accountById = Object.fromEntries(accounts.map(item => [item.id, item]));
  const meta = accountMeta(account);
  return (
    <section className="budget-account-detail-view">
      <div className="budget-account-detail-topbar">
        <button type="button" onClick={onClose} aria-label="Back to accounts">×</button>
        <strong>{account.name}</strong>
        <button type="button" onClick={() => onEdit(account)} aria-label={`Edit ${account.name}`}>Edit</button>
      </div>
      <div className={`budget-account-detail-card budget-account-card-${meta.group}`}>
        <span className="budget-account-logo large">{accountDisplayIcon(account)}</span>
        <div>
          <p>{account.institution || meta.label}</p>
          <h2>{account.hideBalance ? "••••" : formatBudgetMoney(account.currentBalance ?? account.balance, currency)}</h2>
          <small>{account.includeInAustraliaReady ? "Australia-ready" : account.includeInNetWorth ? "Counted in net worth" : "Hidden from net worth"}</small>
        </div>
        <div className="budget-account-detail-actions">
          <button type="button" onClick={() => onOpenExpense(account.id)}>＋</button>
          <button type="button" onClick={() => onOpenTransfer(account.id)}>⇄</button>
        </div>
      </div>
      <div className="budget-account-detail-segment"><button className="active" type="button">Day</button><button type="button">Month</button></div>
      <section className="budget-card budget-account-transactions-card">
        <div className="budget-card-head"><div><p className="budget-kicker">Transactions</p><h2>{entries.length ? `${entries.length} account entries` : "No entries yet"}</h2></div></div>
        {entries.length ? (
          <div className="budget-transaction-list budget-account-entry-list">
            {entries.map(transaction => (
              <div className={`budget-transaction-row ${accountSignedTransactionAmount(transaction, account.id) >= 0 ? "good" : "danger"}`} key={transaction.id}>
                <span className="budget-transaction-icon">{transaction.type === "transfer" ? "⇄" : transaction.type === "income" ? "+" : "−"}</span>
                <div>
                  <strong>{transaction.description || transactionTypeCopy[transaction.type]?.label}</strong>
                  <small>{transaction.type === "transfer" ? `${accountById[transaction.accountId]?.name || "Account"} → ${accountById[transaction.toAccountId]?.name || "Account"}` : bucketById[transaction.bucketId]?.name || "No bucket"}</small>
                </div>
                <strong>{accountTransactionDisplayAmount(transaction, account.id, currency)}</strong>
              </div>
            ))}
          </div>
        ) : <p className="budget-helper-copy">Use the + button to record activity for this account, or ⇄ to move money between accounts.</p>}
      </section>
    </section>
  );
}

function BudgetAccountPage({ accounts, ledgers, buckets, currency, transactions, summary, onAccountsChange, onTransactionsChange }) {
  const adjustedAccounts = calculateBudgetAccountBalances(accounts, transactions);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [addingAccount, setAddingAccount] = useState(false);
  const [transferForm, setTransferForm] = useState(null);
  const [accountCardEditMode, setAccountCardEditMode] = useState(false);
  const selectedAccount = adjustedAccounts.find(account => account.id === selectedAccountId) || null;

  const groupedAccounts = adjustedAccounts.reduce((groups, account) => {
    const key = accountGroupKey(account);
    if (!groups[key]) groups[key] = [];
    groups[key].push(account);
    return groups;
  }, {});

  const addAccount = account => {
    onAccountsChange([...accounts, account].map(normalizeBudgetAccount));
    setAccountCardEditMode(false);
  };
  const saveAccount = account => {
    onAccountsChange(patchBudgetItem(accounts, account.id, account).map(normalizeBudgetAccount));
    setEditingAccount(null);
  };
  const deleteAccount = id => {
    if (accounts.length <= 1) return;
    onAccountsChange(accounts.filter(account => account.id !== id).map(normalizeBudgetAccount));
    if (selectedAccountId === id) setSelectedAccountId(null);
    setEditingAccount(null);
  };
  const quickDeleteAccount = account => {
    if (!account || accounts.length <= 1) return;
    const hasEntries = normalizeBudgetTransactions(transactions).some(transaction => transaction.accountId === account.id || transaction.toAccountId === account.id);
    if (typeof window !== "undefined" && hasEntries && !window.confirm(`Delete ${account.name}? Existing transactions will stay in history but may reference a removed account.`)) return;
    deleteAccount(account.id);
  };
  const moveAccountCard = (account, direction) => {
    if (!account) return;
    const groupKey = accountGroupKey(account);
    onAccountsChange(moveBudgetItem(accounts, account.id, direction, item => accountGroupKey(item) === groupKey).map(normalizeBudgetAccount));
  };
  const openTransfer = (accountId = accounts[0]?.id) => setTransferForm({ ...createEmptyTransactionForm({ accounts, ledgers, buckets, type: "transfer" }), accountId, description: "Transfer" });
  const openAccountExpense = (accountId = accounts[0]?.id) => setTransferForm({ ...createEmptyTransactionForm({ accounts, ledgers, buckets, type: "expense" }), accountId, description: "Expense" });
  const saveTransferTransaction = () => {
    if (!transferForm) return;
    const amount = Math.abs(Number(transferForm.amount || 0));
    if (!amount) return;
    const timestamp = new Date().toISOString();
    const next = normalizeBudgetTransaction({
      ...transferForm,
      amount,
      description: transferForm.description || transactionTypeCopy[transferForm.type]?.label,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    onTransactionsChange([...transactions, next]);
    setTransferForm(null);
  };

  if (selectedAccount) {
    return (
      <>
        <AccountDetailView account={selectedAccount} transactions={transactions} accounts={adjustedAccounts} ledgers={ledgers} buckets={buckets} currency={currency} onClose={() => setSelectedAccountId(null)} onEdit={setEditingAccount} onOpenTransfer={openTransfer} onOpenExpense={openAccountExpense} />
        <AccountEditPopup account={editingAccount} ledgers={ledgers} currency={currency} canDelete={accounts.length > 1} onSave={saveAccount} onDelete={deleteAccount} onClose={() => setEditingAccount(null)} />
        <BudgetTransactionPopup form={transferForm} setForm={setTransferForm} accounts={accounts} ledgers={ledgers} buckets={buckets} currency={currency} summary={summary} onSave={saveTransferTransaction} onClose={() => setTransferForm(null)} />
      </>
    );
  }

  const groupOrder = ["debit", "credit", "borrowed", "invest", "other"];
  return (
    <>
      <section className="budget-account-overview-head">
        <span className="budget-account-filter static">Accounts</span>
        <div className="budget-card-edit-mode-toolbar">
          {accountCardEditMode && <span>Account edit mode</span>}
          {accountCardEditMode && <button className="tf-cancel" type="button" onClick={() => setAccountCardEditMode(false)}>Done</button>}
          <button className="budget-round-icon" type="button" onClick={() => setAddingAccount(true)} aria-label="Add account">＋</button>
        </div>
      </section>
      <section className="budget-card budget-account-networth-card">
        <div className="budget-networth-eye">◉</div>
        <div className="budget-account-chart-icon">⌁</div>
        <p>Net Worth</p>
        <strong>{formatBudgetMoney(summary.netWorth, currency)}</strong>
        <div className="budget-account-networth-split"><span>Assets<br /><b>{formatBudgetMoney(Math.max(summary.netWorth, 0), currency)}</b></span><span>Australia-ready<br /><b>{formatBudgetMoney(summary.australiaReadyFunds, currency)}</b></span></div>
        <div className="budget-networth-wave" aria-hidden="true" />
      </section>
      <div className="budget-account-groups">
        {groupOrder.map(groupKey => {
          const groupAccounts = groupedAccounts[groupKey] || [];
          if (!groupAccounts.length) return null;
          const meta = accountGroupMeta[groupKey] || accountGroupMeta.other;
          const total = groupAccounts.reduce((sum, account) => sum + Number(account.currentBalance || 0), 0);
          return (
            <section className="budget-account-group" key={groupKey}>
              <div className="budget-account-group-head"><h2>{meta.label}</h2><span>{groupKey === "credit" || groupKey === "borrowed" ? "Owed" : "Bal."} {formatBudgetMoney(Math.abs(total), currency)}⌄</span></div>
              <div className={`budget-account-card-grid ${accountCardEditMode ? "budget-card-grid-editing" : ""}`}>
                {groupAccounts.map(account => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    currency={currency}
                    onOpen={setSelectedAccountId}
                    editMode={accountCardEditMode}
                    onEnterEditMode={() => setAccountCardEditMode(true)}
                    onDelete={quickDeleteAccount}
                    onMoveLeft={item => moveAccountCard(item, -1)}
                    onMoveRight={item => moveAccountCard(item, 1)}
                    canMoveLeft={canMoveBudgetItem(accounts, account.id, -1, item => accountGroupKey(item) === groupKey)}
                    canMoveRight={canMoveBudgetItem(accounts, account.id, 1, item => accountGroupKey(item) === groupKey)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <AccountAddSheet open={addingAccount} currency={currency} ledgers={ledgers} onAdd={addAccount} onClose={() => setAddingAccount(false)} />
      <BudgetTransactionPopup form={transferForm} setForm={setTransferForm} accounts={accounts} ledgers={ledgers} buckets={buckets} currency={currency} summary={summary} onSave={saveTransferTransaction} onClose={() => setTransferForm(null)} />
    </>
  );
}

function BucketsPanel({ buckets, accounts, ledgers, currency, transactions, onChange }) {
  const summary = calculateBudgetSummary({ buckets, accounts, ledgers, transactions });
  const patchBucket = (id, patch) => onChange(patchBudgetItem(buckets, id, patch).map(normalizeBudgetBucket));
  const removeBucket = id => {
    if (buckets.length <= 1) return;
    onChange(buckets.filter(bucket => bucket.id !== id).map(normalizeBudgetBucket));
  };
  const addBucket = (ledgerId, cashFlowType) => onChange([
    ...buckets,
    normalizeBudgetBucket({
      id: budgetUid("card"),
      name: cashFlowType === "income" ? "New income card" : "New expense card",
      monthlyAmount: 0,
      type: cashFlowType === "income" ? "income" : "flexible_spending",
      cashFlowType,
      group: cashFlowType === "income" ? "Income" : "Flexible spending",
      accountId: accounts.find(account => account.ledgerId === ledgerId)?.id || accounts[0]?.id || "main-bank",
      ledgerId,
      isProtected: false,
      rolloverEnabled: cashFlowType === "expense",
    }),
  ].map(normalizeBudgetBucket));

  const renderCardEditor = bucket => {
    const recorded = bucket.cashFlowType === "income" ? summary.bucketIncomeById?.[bucket.id] || 0 : summary.bucketSpendById?.[bucket.id] || 0;
    const remaining = Number(bucket.monthlyAmount || 0) - recorded;
    return (
      <div className={`budget-bucket-row ${bucket.isProtected ? "protected" : ""}`} key={bucket.id}>
        <input className="budget-input bucket-name" value={bucket.name} onChange={event => patchBucket(bucket.id, { name: event.target.value })} aria-label={`${bucket.name} name`} />
        <MoneyInput value={bucket.monthlyAmount} onChange={monthlyAmount => patchBucket(bucket.id, { monthlyAmount })} ariaLabel={`${bucket.name} monthly amount`} />
        <SelectInput value={bucket.cashFlowType} options={BUDGET_CARD_FLOW_TYPES} onChange={cashFlowType => patchBucket(bucket.id, { cashFlowType, type: cashFlowType === "income" ? "income" : bucket.type === "income" ? "flexible_spending" : bucket.type })} ariaLabel={`${bucket.name} income or expense card`} />
        <SelectInput value={bucket.type} options={BUDGET_BUCKET_TYPES} onChange={type => patchBucket(bucket.id, { type, cashFlowType: type === "income" ? "income" : bucket.cashFlowType })} ariaLabel={`${bucket.name} type`} />
        <select className="budget-input" value={bucket.accountId} onChange={event => patchBucket(bucket.id, { accountId: event.target.value })} aria-label={`${bucket.name} account`}>
          {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
        </select>
        <select className="budget-input" value={bucket.ledgerId} onChange={event => patchBucket(bucket.id, { ledgerId: event.target.value })} aria-label={`${bucket.name} ledger`}>
          {ledgers.map(ledger => <option key={ledger.id} value={ledger.id}>{ledger.name}</option>)}
        </select>
        <label className="budget-check protected-check"><input type="checkbox" checked={Boolean(bucket.isProtected)} onChange={event => patchBucket(bucket.id, { isProtected: event.target.checked })} /> Protected</label>
        <label className="budget-check"><input type="checkbox" checked={Boolean(bucket.rolloverEnabled)} onChange={event => patchBucket(bucket.id, { rolloverEnabled: event.target.checked })} /> Rollover</label>
        <input className="budget-input damage" type="number" min="1" max="6" value={bucket.damageControlPriority ?? ""} placeholder="Repair #" onChange={event => patchBucket(bucket.id, { damageControlPriority: event.target.value === "" ? null : Number(event.target.value) })} aria-label={`${bucket.name} damage control priority`} />
        <button className="tf-cancel" type="button" onClick={() => removeBucket(bucket.id)} disabled={buckets.length <= 1}>Remove</button>
        <div className="budget-bucket-impact">
          <span>{bucket.cashFlowType === "income" ? "Received" : "Spent"} {formatBudgetMoney(recorded, currency)}</span>
          <strong className={remaining < 0 ? "danger" : "good"}>{bucket.cashFlowType === "income" ? "Planned" : remaining < 0 ? "Exceeded" : "Left"} {formatBudgetMoney(Math.abs(bucket.cashFlowType === "income" ? Number(bucket.monthlyAmount || 0) : remaining), currency)}</strong>
        </div>
        <textarea className="budget-input bucket-notes" value={bucket.notes || ""} onChange={event => patchBucket(bucket.id, { notes: event.target.value })} aria-label={`${bucket.name} notes`} />
      </div>
    );
  };

  return (
    <section className="budget-card budget-ledger-card-manager">
      <div className="budget-card-head">
        <div>
          <p className="budget-kicker">Ledger cards</p>
          <h2>Daily, Travel, and Business cards</h2>
        </div>
      </div>
      <p className="budget-helper-copy">Ledgers are now fixed to Daily, Travel, and Business. Add, edit, or remove the income and expense cards inside each ledger.</p>
      <div className="budget-ledger-card-manager-list">
        {ledgers.map(ledger => {
          const ledgerBuckets = buckets.filter(bucket => bucket.ledgerId === ledger.id);
          const incomeCards = ledgerBuckets.filter(bucket => bucket.cashFlowType === "income");
          const expenseCards = ledgerBuckets.filter(bucket => bucket.cashFlowType !== "income");
          return (
            <section className="budget-ledger-card-section" key={ledger.id}>
              <div className="budget-ledger-card-section-head">
                <div>
                  <p className="budget-kicker">{ledger.type}</p>
                  <h3>{ledger.name}</h3>
                  <small>{ledger.description}</small>
                </div>
              </div>
              <div className="budget-card-flow-head"><span>Income cards</span><button className="tf-save" type="button" onClick={() => addBucket(ledger.id, "income")}>＋ Income card</button></div>
              <div className="budget-bucket-list">{incomeCards.length ? incomeCards.map(renderCardEditor) : <p className="budget-helper-copy">No income cards yet.</p>}</div>
              <div className="budget-card-flow-head"><span>Expense cards</span><button className="tf-save" type="button" onClick={() => addBucket(ledger.id, "expense")}>＋ Expense card</button></div>
              <div className="budget-bucket-list">{expenseCards.length ? expenseCards.map(renderCardEditor) : <p className="budget-helper-copy">No expense cards yet.</p>}</div>
            </section>
          );
        })}
      </div>
      <p className="budget-helper-copy">Protected expense cards stay editable, but later damage-control flows will warn before reducing them.</p>
    </section>
  );
}

function BudgetRoadmapCard() {
  const nextItems = [
    "Phase 144: account page refinement, cards, and ledgers",
    "Phase 145: spending pace tracker and budget repair warnings",
    "Phase 146: Budget Home dashboard and quick actions",
    "Phase 147: mobile calculator keypad for fast entry",
  ];
  return (
    <section className="budget-card budget-roadmap-card">
      <p className="budget-kicker">Foundation now, intelligence later</p>
      <h2>How Budget connects to Schedule</h2>
      <p>Budget data stays separate from schedule data for privacy and clarity. Overall mode may later compare spending with scheduling and task patterns.</p>
      <ul>
        {nextItems.map(item => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

function BudgetHero({ activePage }) {
  const pageCopy = {
    home: ["Budget Home", "A soft overview of cash, goals, and monthly allocation health."],
    account: ["Accounts", "Multiple bank accounts and ledgers stay editable and separate."],
    transactions: ["Transactions", "Record income, expenses, and transfers across accounts and ledgers."],
    budget: ["Budget Plan", "Your pasted Budget V1 defaults stay fully editable."],
    settings: ["Budget Settings", "Budget-specific managers live here, separate from Schedule settings."],
  };
  const [title, body] = pageCopy[activePage] || pageCopy.home;
  return (
    <section className="budget-hero phase-hero">
      <div>
        <div className="phase-kicker">Budget</div>
        <h1>💰 {title}</h1>
        <p>{body}</p>
      </div>
    </section>
  );
}

function BudgetMetrics({ summary, currency }) {
  const balanceTone = summary.remaining < 0 ? "danger" : summary.remaining > 0 ? "good" : "neutral";
  return (
    <section className="budget-metrics-grid">
      <BudgetMetric label="Monthly income" value={formatBudgetMoney(summary.monthlyIncome, currency)} detail="Editable plan income" />
      <BudgetMetric label="Allocated" value={formatBudgetMoney(summary.allocated, currency)} detail={`${summary.bucketCount} buckets`} />
      <BudgetMetric label="Unallocated" value={formatBudgetMoney(summary.remaining, currency)} tone={balanceTone} detail={summary.remaining === 0 ? "Budget balances exactly" : "Adjust buckets anytime"} />
      <BudgetMetric label="Australia-ready" value={formatBudgetMoney(summary.australiaReadyFunds, currency)} detail="Accounts marked migration-ready" />
    </section>
  );
}


function BudgetCardEditorPopup({ draft, setDraft, accounts, ledgers, currency, canDelete, onSave, onDelete, onClose }) {
  if (!draft) return null;
  const update = patch => setDraft(current => ({ ...current, ...patch }));
  const title = draft.id ? `Edit ${draft.name || "card"}` : `Add ${draft.cashFlowType === "income" ? "income" : "expense"} card`;
  const popup = (
    <div className="budget-card-editor-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <button className="budget-transaction-popup-backdrop" type="button" onClick={onClose} aria-label="Close card editor" />
      <div className="budget-card-editor-sheet">
        <div className="budget-popup-header">
          <button type="button" onClick={onClose} aria-label="Close card editor">×</button>
          <strong>{title}</strong>
          <span aria-hidden="true">☷</span>
        </div>
        <div className="budget-card-editor-grid">
          <label>
            <FieldLabel>Card name</FieldLabel>
            <input className="budget-input" value={draft.name || ""} onChange={event => update({ name: event.target.value })} aria-label="Card name" />
          </label>
          <label>
            <FieldLabel>Monthly amount</FieldLabel>
            <MoneyInput value={draft.monthlyAmount} onChange={monthlyAmount => update({ monthlyAmount })} ariaLabel="Card monthly amount" />
          </label>
          <label>
            <FieldLabel>Income / Expense</FieldLabel>
            <SelectInput value={draft.cashFlowType || "expense"} options={BUDGET_CARD_FLOW_TYPES} onChange={cashFlowType => update({ cashFlowType, type: cashFlowType === "income" ? "income" : draft.type === "income" ? "flexible_spending" : draft.type })} ariaLabel="Card flow type" />
          </label>
          <label>
            <FieldLabel>Card type</FieldLabel>
            <SelectInput value={draft.type || "flexible_spending"} options={BUDGET_BUCKET_TYPES} onChange={type => update({ type, cashFlowType: type === "income" ? "income" : draft.cashFlowType === "income" && type !== "income" ? "expense" : draft.cashFlowType })} ariaLabel="Card type" />
          </label>
          <label>
            <FieldLabel>Ledger</FieldLabel>
            <select className="budget-input" value={draft.ledgerId} onChange={event => update({ ledgerId: event.target.value })} aria-label="Card ledger">
              {ledgers.map(ledger => <option key={ledger.id} value={ledger.id}>{ledger.name}</option>)}
            </select>
          </label>
          <label>
            <FieldLabel>Default account</FieldLabel>
            <select className="budget-input" value={draft.accountId} onChange={event => update({ accountId: event.target.value })} aria-label="Card account">
              {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </label>
        </div>
        <div className="budget-account-toggle-list">
          <label className="budget-switch-row"><span>Protected card</span><input type="checkbox" checked={Boolean(draft.isProtected)} onChange={event => update({ isProtected: event.target.checked })} /></label>
          <label className="budget-switch-row"><span>Rollover monthly balance</span><input type="checkbox" checked={Boolean(draft.rolloverEnabled)} onChange={event => update({ rolloverEnabled: event.target.checked })} /></label>
        </div>
        <textarea className="budget-input budget-notes" value={draft.notes || ""} placeholder="Optional note for this card" onChange={event => update({ notes: event.target.value })} aria-label="Card notes" />
        <div className="budget-card-editor-actions">
          <button className="tf-save" type="button" onClick={onSave}>Save card</button>
          {canDelete && <button className="tf-cancel danger" type="button" onClick={onDelete}>Remove card</button>}
        </div>
      </div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(popup, document.body) : popup;
}

function BudgetCardTile({ bucket, amount, currency, icon, onRecord, onEdit, editMode = false, onEnterEditMode, onDelete, onMoveLeft, onMoveRight, canMoveLeft = false, canMoveRight = false, ...ariaProps }) {
  const { longPressHandlers, consumeLongPress } = useBudgetLongPress(onEnterEditMode, editMode);
  const record = event => {
    if (editMode || consumeLongPress()) {
      event.preventDefault();
      return;
    }
    onRecord?.();
  };
  const stopAction = handler => event => {
    event.preventDefault();
    event.stopPropagation();
    handler?.(bucket);
  };
  return (
    <div className={`budget-home-tile budget-home-card-shell ${bucket.isProtected ? "protected" : ""} ${bucket.cashFlowType === "income" ? "income-card" : ""} ${editMode ? "budget-edit-mode-card" : ""}`} {...longPressHandlers}>
      <button className="budget-home-card-record" type="button" onClick={record} aria-label={ariaProps["aria-label"]}>
        <strong>{bucket.name}</strong>
        <span className="budget-home-tile-icon">{icon}</span>
        <small>{formatBudgetMoney(amount, currency)}</small>
      </button>
      {!editMode && <button className="budget-home-card-edit" type="button" onClick={onEdit} aria-label={`Edit ${bucket.name}`}>✎</button>}
      {editMode && (
        <div className="budget-card-edit-controls" aria-label={`${bucket.name} edit controls`}>
          <button type="button" onClick={stopAction(onMoveLeft)} disabled={!canMoveLeft} aria-label={`Move ${bucket.name} left`}>‹</button>
          <button className="danger" type="button" onClick={stopAction(onDelete)} aria-label={`Delete ${bucket.name}`}>×</button>
          <button type="button" onClick={stopAction(onMoveRight)} disabled={!canMoveRight} aria-label={`Move ${bucket.name} right`}>›</button>
        </div>
      )}
    </div>
  );
}


function selectedBudgetMonthKey(monthDate) {
  return `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
}

function filterBudgetTransactionsByMonth(transactions, monthDate) {
  const monthKey = selectedBudgetMonthKey(monthDate);
  return normalizeBudgetTransactions(transactions).filter(transaction => String(transaction.date || "").startsWith(monthKey));
}

function budgetMonthProgress(monthDate) {
  const now = new Date();
  const firstOfTarget = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstOfCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
  if (firstOfTarget < firstOfCurrent) return 100;
  if (firstOfTarget > firstOfCurrent) return 0;
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.min(100, Math.max(1, Math.round((now.getDate() / totalDays) * 100)));
}

function budgetPaceMeta({ bucket, actual, monthProgress }) {
  const planned = Number(bucket.monthlyAmount || 0);
  if (bucket.cashFlowType === "income") {
    if (planned <= 0) return { label: actual > 0 ? "Extra income" : "No plan", tone: actual > 0 ? "good" : "neutral", percent: actual > 0 ? 100 : 0 };
    const percent = Math.round((actual / planned) * 100);
    if (percent >= 100) return { label: "Received", tone: "good", percent: 100 };
    if (monthProgress >= 70 && percent < 50) return { label: "Behind", tone: "warning", percent };
    return { label: "Expected", tone: "neutral", percent };
  }
  if (planned <= 0) return { label: actual > 0 ? "Unplanned spend" : "No monthly plan", tone: actual > 0 ? "warning" : "neutral", percent: actual > 0 ? 100 : 0 };
  const percent = Math.round((actual / planned) * 100);
  if (percent > 100) return { label: "Exceeded", tone: "danger", percent: 100 };
  if (monthProgress > 0 && percent > monthProgress + 15) return { label: "Too fast", tone: "warning", percent };
  if (monthProgress > 0 && monthProgress - percent > 25) return { label: "Under pace", tone: "good", percent };
  return { label: "On track", tone: "neutral", percent };
}

function BudgetPlanBucketCard({ bucket, actual, currency, monthProgress, onEdit }) {
  const planned = Number(bucket.monthlyAmount || 0);
  const isIncome = bucket.cashFlowType === "income";
  const remaining = planned - actual;
  const pace = budgetPaceMeta({ bucket, actual, monthProgress });
  const progressPercent = Math.min(100, Math.max(0, pace.percent || 0));
  const typeCopy = String(bucket.type || "other").replaceAll("_", " ");
  return (
    <article className={`budget-plan-bucket-card budget-plan-bucket-${pace.tone} ${bucket.isProtected ? "protected" : ""}`}>
      <div className="budget-plan-bucket-top">
        <div>
          <p className="budget-kicker">{isIncome ? "Income card" : typeCopy}</p>
          <h3>{bucket.name}</h3>
        </div>
        <button className="budget-home-card-edit" type="button" onClick={onEdit} aria-label={`Edit ${bucket.name}`}>✎</button>
      </div>
      <div className="budget-plan-bucket-money">
        <span>{isIncome ? "Received" : "Spent"}</span>
        <strong>{formatBudgetMoney(actual, currency)}</strong>
      </div>
      <div className="budget-plan-bucket-split">
        <span>Monthly<br /><b>{formatBudgetMoney(planned, currency)}</b></span>
        <span>{isIncome ? "Still expected" : remaining < 0 ? "Exceeded" : "Left"}<br /><b className={remaining < 0 ? "danger" : ""}>{formatBudgetMoney(Math.abs(remaining), currency)}</b></span>
      </div>
      <div className="budget-plan-progress" aria-label={`${bucket.name} progress ${progressPercent}%`}>
        <span style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="budget-plan-bucket-footer">
        <em className={`pace-${pace.tone}`}>{pace.label}</em>
        {bucket.isProtected ? <em className="protected-pill">Protected</em> : null}
        {bucket.damageControlPriority ? <em>Repair #{bucket.damageControlPriority}</em> : null}
      </div>
    </article>
  );
}

function BudgetPlanPage({ profile, accounts, ledgers, buckets, transactions, currency, onProfileChange, onBucketsChange }) {
  const [planMonthDate, setPlanMonthDate] = useState(() => new Date());
  const [selectedLedgerId, setSelectedLedgerId] = useState(() => ledgers[0]?.id || "daily-ledger");
  const [cardDraft, setCardDraft] = useState(null);
  const selectedLedger = ledgers.find(ledger => ledger.id === selectedLedgerId) || ledgers[0] || { id: "daily-ledger", name: "Daily" };
  const monthTransactions = useMemo(
    () => filterBudgetTransactionsByMonth(transactions, planMonthDate),
    [transactions, planMonthDate],
  );
  const planSummary = useMemo(
    () => calculateBudgetSummary({ profile, accounts, ledgers, buckets, transactions: monthTransactions }),
    [profile, accounts, ledgers, buckets, monthTransactions],
  );
  const monthProgress = budgetMonthProgress(planMonthDate);
  const ledgerBuckets = buckets.filter(bucket => bucket.ledgerId === selectedLedger.id);
  const expenseBuckets = ledgerBuckets.filter(bucket => bucket.cashFlowType !== "income");
  const incomeBuckets = ledgerBuckets.filter(bucket => bucket.cashFlowType === "income");
  const ledgerAllocated = expenseBuckets.reduce((sum, bucket) => sum + Number(bucket.monthlyAmount || 0), 0);
  const ledgerPlannedIncome = incomeBuckets.reduce((sum, bucket) => sum + Number(bucket.monthlyAmount || 0), 0);
  const ledgerSpent = expenseBuckets.reduce((sum, bucket) => sum + Number(planSummary.bucketSpendById?.[bucket.id] || 0), 0);
  const ledgerReceived = incomeBuckets.reduce((sum, bucket) => sum + Number(planSummary.bucketIncomeById?.[bucket.id] || 0), 0);
  const unallocatedTone = planSummary.remaining < 0 ? "danger" : planSummary.remaining > 0 ? "good" : "neutral";
  const changePlanMonth = delta => setPlanMonthDate(current => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  const openCardEditor = (cashFlowType, bucket = null) => {
    const defaultAccount = accounts.find(account => account.ledgerId === selectedLedger.id) || accounts[0];
    setCardDraft(bucket ? { ...normalizeBudgetBucket(bucket), isNew: false } : {
      id: "",
      name: cashFlowType === "income" ? "New income card" : "New expense card",
      monthlyAmount: 0,
      type: cashFlowType === "income" ? "income" : "flexible_spending",
      cashFlowType,
      group: cashFlowType === "income" ? "Income" : "Flexible spending",
      accountId: defaultAccount?.id || "main-bank",
      ledgerId: selectedLedger.id,
      isProtected: false,
      rolloverEnabled: cashFlowType === "expense",
      damageControlPriority: null,
      notes: "",
      isNew: true,
    });
  };
  const closeCardEditor = () => setCardDraft(null);
  const saveCardDraft = () => {
    if (!cardDraft) return;
    const timestamp = new Date().toISOString();
    const normalized = normalizeBudgetBucket({
      ...cardDraft,
      id: cardDraft.id || budgetUid("card"),
      updatedAt: timestamp,
    });
    const nextBuckets = cardDraft.isNew
      ? [...buckets, normalized]
      : patchBudgetItem(buckets, normalized.id, normalized).map(normalizeBudgetBucket);
    onBucketsChange(nextBuckets);
    setCardDraft(null);
  };
  const removeCardDraft = () => {
    if (!cardDraft?.id || buckets.length <= 1) return;
    if (cardDraft.isProtected) {
      const confirmed = window.confirm("This is a protected card. Removing it may affect your Australia or investment plan. Continue?");
      if (!confirmed) return;
    }
    onBucketsChange(buckets.filter(bucket => bucket.id !== cardDraft.id).map(normalizeBudgetBucket));
    setCardDraft(null);
  };

  return (
    <>
      <section className="budget-card budget-plan-header-card">
        <div className="budget-plan-toolbar">
          <select className="budget-ledger-home-select" value={selectedLedger.id} onChange={event => setSelectedLedgerId(event.target.value)} aria-label="Choose budget plan ledger">
            {ledgers.map(ledger => <option key={ledger.id} value={ledger.id}>{ledger.name}</option>)}
          </select>
          <div className="budget-home-month-switcher" aria-label="Budget plan month selector">
            <button type="button" onClick={() => changePlanMonth(-1)} aria-label="Previous budget plan month">‹</button>
            <strong>{monthTitle(planMonthDate)}</strong>
            <button type="button" onClick={() => changePlanMonth(1)} aria-label="Next budget plan month">›</button>
          </div>
          <span className="budget-plan-month-progress">{monthProgress}% of month</span>
        </div>
        <div className="budget-plan-summary-grid">
          <BudgetMetric label="Monthly income" value={formatBudgetMoney(planSummary.monthlyIncome, currency)} detail="Editable below" />
          <BudgetMetric label="Allocated" value={formatBudgetMoney(planSummary.allocated, currency)} detail={`${buckets.filter(bucket => bucket.cashFlowType !== "income").length} expense cards`} />
          <BudgetMetric label={planSummary.remaining < 0 ? "Overallocated" : "Unallocated"} value={formatBudgetMoney(Math.abs(planSummary.remaining), currency)} tone={unallocatedTone} detail={planSummary.remaining === 0 ? "Budget balances exactly" : planSummary.remaining < 0 ? "Reduce cards or raise income" : "Available to assign"} />
          <BudgetMetric label="Protected" value={formatBudgetMoney(planSummary.protectedMonthly, currency)} detail="Australia + investments" />
        </div>
        {planSummary.remaining < 0 && <p className="budget-plan-warning">Your plan is overallocated. The safest fix is to reduce flexible cards before protected Australia or investment cards.</p>}
      </section>

      <div className="budget-layout-grid budget-plan-editor-grid">
        <EditableProfileCard profile={profile} onChange={onProfileChange} />
        <section className="budget-card budget-plan-ledger-snapshot">
          <p className="budget-kicker">{selectedLedger.name} ledger</p>
          <h2>{selectedLedger.name} plan</h2>
          <div className="budget-plan-ledger-stats">
            <span>Planned income <b>{formatBudgetMoney(ledgerPlannedIncome, currency)}</b></span>
            <span>Received <b>{formatBudgetMoney(ledgerReceived, currency)}</b></span>
            <span>Allocated spend <b>{formatBudgetMoney(ledgerAllocated, currency)}</b></span>
            <span>Spent <b>{formatBudgetMoney(ledgerSpent, currency)}</b></span>
          </div>
        </section>
      </div>

      <section className="budget-card budget-plan-section-card">
        <div className="budget-card-flow-head">
          <div>
            <p className="budget-kicker">Expense cards</p>
            <h2>{selectedLedger.name} spending pace</h2>
          </div>
          <button className="budget-card-add-button" type="button" onClick={() => openCardEditor("expense")}>＋ Card</button>
        </div>
        <div className="budget-plan-card-grid">
          {expenseBuckets.length ? expenseBuckets.map(bucket => (
            <BudgetPlanBucketCard
              key={bucket.id}
              bucket={bucket}
              actual={planSummary.bucketSpendById?.[bucket.id] || 0}
              currency={currency}
              monthProgress={monthProgress}
              onEdit={() => openCardEditor("expense", bucket)}
            />
          )) : <p className="budget-helper-copy">No expense cards in {selectedLedger.name} yet.</p>}
        </div>
      </section>

      <section className="budget-card budget-plan-section-card">
        <div className="budget-card-flow-head">
          <div>
            <p className="budget-kicker">Income cards</p>
            <h2>{selectedLedger.name} income plan</h2>
          </div>
          <button className="budget-card-add-button" type="button" onClick={() => openCardEditor("income")}>＋ Card</button>
        </div>
        <div className="budget-plan-card-grid income">
          {incomeBuckets.length ? incomeBuckets.map(bucket => (
            <BudgetPlanBucketCard
              key={bucket.id}
              bucket={bucket}
              actual={planSummary.bucketIncomeById?.[bucket.id] || 0}
              currency={currency}
              monthProgress={monthProgress}
              onEdit={() => openCardEditor("income", bucket)}
            />
          )) : <p className="budget-helper-copy">No income cards in {selectedLedger.name} yet.</p>}
        </div>
      </section>

      <BudgetCardEditorPopup
        draft={cardDraft}
        setDraft={setCardDraft}
        accounts={accounts}
        ledgers={ledgers}
        currency={currency}
        canDelete={Boolean(cardDraft?.id && buckets.length > 1)}
        onSave={saveCardDraft}
        onDelete={removeCardDraft}
        onClose={closeCardEditor}
      />
    </>
  );
}

function BudgetHomePage({ currency, buckets, accounts, ledgers, transactions, onBucketsChange, onTransactionsChange }) {
  const [homeForm, setHomeForm] = useState(null);
  const [cardDraft, setCardDraft] = useState(null);
  const [selectedLedgerId, setSelectedLedgerId] = useState(() => ledgers[0]?.id || "daily-ledger");
  const [homeMonthDate, setHomeMonthDate] = useState(() => new Date());
  const [collapsedSections, setCollapsedSections] = useState({ expense: false, income: false });
  const [homeCardEditMode, setHomeCardEditMode] = useState(false);
  const selectedLedger = ledgers.find(ledger => ledger.id === selectedLedgerId) || ledgers[0] || { id: "daily-ledger", name: "Daily" };
  const homeMonthKey = `${homeMonthDate.getFullYear()}-${String(homeMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const monthTransactions = useMemo(
    () => normalizeBudgetTransactions(transactions).filter(transaction => String(transaction.date || "").startsWith(homeMonthKey)),
    [transactions, homeMonthKey],
  );
  const monthSummary = useMemo(
    () => calculateBudgetSummary({ accounts, ledgers, buckets, transactions: monthTransactions }),
    [accounts, ledgers, buckets, monthTransactions],
  );
  const ledgerBuckets = buckets.filter(bucket => bucket.ledgerId === selectedLedger.id);
  const expenseBuckets = ledgerBuckets.filter(bucket => bucket.cashFlowType !== "income");
  const incomeBuckets = ledgerBuckets.filter(bucket => bucket.cashFlowType === "income");
  const expenseRecorded = expenseBuckets.reduce((total, bucket) => total + Number(monthSummary.bucketSpendById?.[bucket.id] || 0), 0);
  const incomeRecorded = incomeBuckets.reduce((total, bucket) => total + Number(monthSummary.bucketIncomeById?.[bucket.id] || 0), 0);
  const changeHomeMonth = delta => setHomeMonthDate(current => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  const openHomeTransaction = (type, bucketId = "") => {
    const bucket = buckets.find(item => item.id === bucketId);
    const next = createEmptyTransactionForm({ accounts, ledgers, buckets, type });
    setHomeForm({
      ...next,
      ledgerId: bucket?.ledgerId || selectedLedger.id || next.ledgerId,
      accountId: bucket?.accountId || next.accountId,
      bucketId: type === "transfer" ? "" : bucketId || next.bucketId,
      description: "",
    });
  };

  const closeHomeTransaction = () => setHomeForm(null);

  const saveHomeTransaction = () => {
    if (!homeForm) return;
    const amount = Math.abs(Number(homeForm.amount || 0));
    if (!amount) return;
    const timestamp = new Date().toISOString();
    const selectedBucket = buckets.find(bucket => bucket.id === homeForm.bucketId);
    const firstTag = String(homeForm.tags || "").split(",").map(tag => tag.trim()).filter(Boolean)[0];
    const next = normalizeBudgetTransaction({
      ...homeForm,
      amount,
      description: homeForm.description || firstTag || selectedBucket?.name || transactionTypeCopy[homeForm.type]?.label,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    onTransactionsChange([...transactions, next]);
    setHomeForm(null);
  };

  const openCardEditor = (cashFlowType, bucket = null) => {
    const defaultAccount = accounts.find(account => account.ledgerId === selectedLedger.id) || accounts[0];
    setCardDraft(bucket ? { ...normalizeBudgetBucket(bucket), isNew: false } : {
      id: "",
      name: cashFlowType === "income" ? "New income card" : "New expense card",
      monthlyAmount: 0,
      type: cashFlowType === "income" ? "income" : "flexible_spending",
      cashFlowType,
      group: cashFlowType === "income" ? "Income" : "Flexible spending",
      accountId: defaultAccount?.id || "main-bank",
      ledgerId: selectedLedger.id,
      isProtected: false,
      rolloverEnabled: cashFlowType === "expense",
      damageControlPriority: null,
      notes: "",
      isNew: true,
    });
  };
  const closeCardEditor = () => setCardDraft(null);
  const saveCardDraft = () => {
    if (!cardDraft) return;
    const timestamp = new Date().toISOString();
    const normalized = normalizeBudgetBucket({
      ...cardDraft,
      id: cardDraft.id || budgetUid("card"),
      updatedAt: timestamp,
    });
    const nextBuckets = cardDraft.isNew
      ? [...buckets, normalized]
      : patchBudgetItem(buckets, normalized.id, normalized).map(normalizeBudgetBucket);
    onBucketsChange(nextBuckets);
    setCardDraft(null);
  };
  const removeCardDraft = () => {
    if (!cardDraft?.id || buckets.length <= 1) return;
    onBucketsChange(buckets.filter(bucket => bucket.id !== cardDraft.id).map(normalizeBudgetBucket));
    setCardDraft(null);
  };

  const quickDeleteCard = bucket => {
    if (!bucket || buckets.length <= 1) return;
    if (bucket.isProtected && typeof window !== "undefined" && !window.confirm(`Delete protected card ${bucket.name}?`)) return;
    onBucketsChange(buckets.filter(item => item.id !== bucket.id).map(normalizeBudgetBucket));
  };
  const moveHomeCard = (bucket, direction) => {
    if (!bucket) return;
    onBucketsChange(moveBudgetItem(buckets, bucket.id, direction, item => item.ledgerId === bucket.ledgerId && item.cashFlowType === bucket.cashFlowType).map(normalizeBudgetBucket));
  };

  const toggleSection = section => setCollapsedSections(current => ({ ...current, [section]: !current[section] }));
  return (
    <>
      <section className="budget-card budget-month-summary-card budget-home-combined-card">
        <div className="budget-month-toolbar budget-home-month-toolbar">
          <select
            className="budget-ledger-home-select"
            value={selectedLedger.id}
            aria-label="Choose budget ledger"
            onChange={event => {
              setSelectedLedgerId(event.target.value);
              setHomeCardEditMode(false);
            }}
          >
            {ledgers.map(ledger => <option key={ledger.id} value={ledger.id}>{ledger.name}</option>)}
          </select>
          <div className="budget-home-month-switcher" aria-label="Budget month selector">
            <button type="button" onClick={() => changeHomeMonth(-1)} aria-label="Previous budget month">‹</button>
            <strong>{monthTitle(homeMonthDate)}</strong>
            <button type="button" onClick={() => changeHomeMonth(1)} aria-label="Next budget month">›</button>
          </div>
          <div className="budget-home-toolbar-spacer budget-card-edit-mode-toolbar">
            {homeCardEditMode && <span>Card edit mode</span>}
            {homeCardEditMode && <button className="tf-cancel" type="button" onClick={() => setHomeCardEditMode(false)}>Done</button>}
          </div>
        </div>

        <div className="budget-month-total-row budget-section-control-row">
          <button
            className="budget-section-collapse-main budget-collapse-toggle"
            type="button"
            onClick={() => toggleSection("expense")}
            aria-expanded={!collapsedSections.expense}
            aria-controls="budget-home-expense-cards"
          >
            <span>Expense</span>
            <strong>{formatBudgetMoney(expenseRecorded, currency)}</strong>
            <em>{collapsedSections.expense ? "⌃" : "⌄"}</em>
          </button>
          <button className="budget-card-add-button" type="button" onClick={() => openCardEditor("expense")} aria-label={`Add expense card to ${selectedLedger.name}`}>＋ Card</button>
        </div>
        {!collapsedSections.expense && (
          <div id="budget-home-expense-cards" className="budget-home-tile-grid budget-home-category-grid">
            {expenseBuckets.map(bucket => {
              const spent = monthSummary.bucketSpendById?.[bucket.id] || 0;
              const icon = bucket.isProtected ? "🛡️" : bucket.type === "sinking_fund" ? "✈️" : bucket.type === "fixed_commitment" ? "🤝" : bucket.type === "business" ? "🧰" : "🛍️";
              return (
                <BudgetCardTile
                  key={bucket.id}
                  bucket={bucket}
                  amount={spent}
                  currency={currency}
                  icon={icon}
                  aria-label={`Record expense for ${bucket.name}`}
                  onRecord={() => openHomeTransaction("expense", bucket.id)}
                  onEdit={() => openCardEditor("expense", bucket)}
                  editMode={homeCardEditMode}
                  onEnterEditMode={() => setHomeCardEditMode(true)}
                  onDelete={quickDeleteCard}
                  onMoveLeft={item => moveHomeCard(item, -1)}
                  onMoveRight={item => moveHomeCard(item, 1)}
                  canMoveLeft={canMoveBudgetItem(buckets, bucket.id, -1, item => item.ledgerId === bucket.ledgerId && item.cashFlowType === bucket.cashFlowType)}
                  canMoveRight={canMoveBudgetItem(buckets, bucket.id, 1, item => item.ledgerId === bucket.ledgerId && item.cashFlowType === bucket.cashFlowType)}
                />
              );
            })}
            {!expenseBuckets.length && <p className="budget-helper-copy">No expense cards in {selectedLedger.name} yet. Add cards from Budget.</p>}
          </div>
        )}

        <div className="budget-month-total-row budget-section-control-row income">
          <button
            className="budget-section-collapse-main budget-collapse-toggle"
            type="button"
            onClick={() => toggleSection("income")}
            aria-expanded={!collapsedSections.income}
            aria-controls="budget-home-income-cards"
          >
            <span>Income</span>
            <strong>{formatBudgetMoney(incomeRecorded, currency)}</strong>
            <em>{collapsedSections.income ? "⌃" : "⌄"}</em>
          </button>
          <button className="budget-card-add-button" type="button" onClick={() => openCardEditor("income")} aria-label={`Add income card to ${selectedLedger.name}`}>＋ Card</button>
        </div>
        {!collapsedSections.income && (
          <div id="budget-home-income-cards" className="budget-home-tile-grid budget-home-category-grid compact">
            {incomeBuckets.map(bucket => (
              <BudgetCardTile
                key={bucket.id}
                bucket={bucket}
                amount={monthSummary.bucketIncomeById?.[bucket.id] || 0}
                currency={currency}
                icon="💵"
                aria-label={`Record income for ${bucket.name}`}
                onRecord={() => openHomeTransaction("income", bucket.id)}
                onEdit={() => openCardEditor("income", bucket)}
                editMode={homeCardEditMode}
                onEnterEditMode={() => setHomeCardEditMode(true)}
                onDelete={quickDeleteCard}
                onMoveLeft={item => moveHomeCard(item, -1)}
                onMoveRight={item => moveHomeCard(item, 1)}
                canMoveLeft={canMoveBudgetItem(buckets, bucket.id, -1, item => item.ledgerId === bucket.ledgerId && item.cashFlowType === bucket.cashFlowType)}
                canMoveRight={canMoveBudgetItem(buckets, bucket.id, 1, item => item.ledgerId === bucket.ledgerId && item.cashFlowType === bucket.cashFlowType)}
              />
            ))}
            {!incomeBuckets.length && <p className="budget-helper-copy">No income cards in {selectedLedger.name} yet. Add cards from Budget.</p>}
          </div>
        )}
      </section>
      <BudgetTransactionPopup
        form={homeForm}
        setForm={setHomeForm}
        accounts={accounts}
        ledgers={ledgers}
        buckets={buckets}
        currency={currency}
        summary={monthSummary}
        onSave={saveHomeTransaction}
        onClose={closeHomeTransaction}
      />
      <BudgetCardEditorPopup
        draft={cardDraft}
        setDraft={setCardDraft}
        accounts={accounts}
        ledgers={ledgers}
        currency={currency}
        canDelete={Boolean(cardDraft?.id && buckets.length > 1)}
        onSave={saveCardDraft}
        onDelete={removeCardDraft}
        onClose={closeCardEditor}
      />
    </>
  );
}

function BudgetTransactionForm({ form, setForm, accounts, ledgers, buckets, currency, onSave, onCancelEdit, showCancel = false, popup = false, contextBucket = null, summary = null }) {
  const [activeTool, setActiveTool] = useState(null);
  const update = patch => setForm(current => ({ ...current, ...patch }));
  const typeMeta = transactionTypeCopy[form.type] || transactionTypeCopy.expense;
  const chips = quickTransactionChips(contextBucket, form.type);
  const recorded = contextBucket ? Number(contextBucket.cashFlowType === "income" ? summary?.bucketIncomeById?.[contextBucket.id] || 0 : summary?.bucketSpendById?.[contextBucket.id] || 0) : 0;
  const budgeted = contextBucket ? Number(contextBucket.monthlyAmount || 0) : 0;
  const remaining = budgeted - recorded;
  const currentTags = String(form.tags || "").split(",").map(tag => tag.trim()).filter(Boolean);
  const hasTag = tag => currentTags.map(item => item.toLowerCase()).includes(String(tag).toLowerCase());
  const toggleTag = tag => {
    const clean = String(tag || "").trim();
    if (!clean) return;
    const nextTags = hasTag(clean) ? currentTags.filter(item => item.toLowerCase() !== clean.toLowerCase()) : [...currentTags, clean];
    update({ tags: nextTags.join(", ") });
    setActiveTool("tag");
  };
  const selectTool = tool => setActiveTool(current => current === tool ? null : tool);
  const visibleBuckets = buckets.filter(bucket => bucket.cashFlowType === form.type && (!form.ledgerId || bucket.ledgerId === form.ledgerId));
  return (
    <section className={`budget-card budget-transaction-entry-card ${popup ? "budget-transaction-popup-card" : ""}`}>
      {!popup && (
        <div className="budget-card-head">
          <div>
            <p className="budget-kicker">Quick record</p>
            <h2>{form.id ? "Edit transaction" : "Add transaction"}</h2>
          </div>
          {form.id ? <button className="tf-cancel" type="button" onClick={onCancelEdit}>Cancel edit</button> : showCancel ? <button className="tf-cancel" type="button" onClick={onCancelEdit}>Close</button> : null}
        </div>
      )}
      <div className="budget-transaction-type-tabs" role="tablist" aria-label="Transaction type">
        {BUDGET_TRANSACTION_TYPES.map(type => (
          <button
            className={form.type === type ? "active" : ""}
            type="button"
            key={type}
            onClick={() => {
              const nextBucket = type === "transfer" ? null : buckets.find(bucket => bucket.cashFlowType === type && bucket.ledgerId === form.ledgerId) || buckets.find(bucket => bucket.cashFlowType === type) || buckets[0];
              update({ type, bucketId: nextBucket?.id || "", ledgerId: nextBucket?.ledgerId || form.ledgerId, accountId: nextBucket?.accountId || form.accountId });
            }}
          >
            <span>{transactionTypeCopy[type]?.icon}</span>{transactionTypeCopy[type]?.label}
          </button>
        ))}
      </div>
      <div className={`budget-amount-stage budget-amount-${typeMeta.tone}`}>
        <span>{typeMeta.label}</span>
        <input
          type="text"
          inputMode="decimal"
          value={form.amount}
          placeholder="0"
          aria-label="Transaction amount"
          onChange={event => update({ amount: event.target.value.replace(/[^0-9.]/g, "") })}
        />
        <small>{currency}</small>
      </div>
      {popup && contextBucket && (
        <div className="budget-popup-progress">
          <div className="spent"><strong>{formatBudgetMoney(recorded, currency)}</strong><span>{budgeted ? `${Math.min(100, Math.round((recorded / budgeted) * 100))}% ${contextBucket.cashFlowType === "income" ? "Received" : "Spent"}` : contextBucket.cashFlowType === "income" ? "Received" : "Spent"}</span></div>
          <div className="left"><strong>{formatBudgetMoney(Math.max(0, remaining), currency)}</strong><span>{remaining < 0 ? "Exceeded" : "Left"}</span></div>
        </div>
      )}
      {popup && chips.length ? (
        <div className="budget-popup-chip-row" aria-label="Quick transaction tags">
          {chips.map(chip => <button className={hasTag(chip) ? "active" : ""} key={chip} type="button" onClick={() => toggleTag(chip)}>#{chip}</button>)}
        </div>
      ) : null}
      {popup && (
        <div className="budget-popup-tool-row" aria-label="Transaction tools">
          <button className={activeTool === "tag" ? "active" : ""} type="button" onClick={() => selectTool("tag")}>🏷️<span>Tag</span></button>
          <button className={activeTool === "note" ? "active" : ""} type="button" onClick={() => selectTool("note")}>📝<span>Note</span></button>
          <button className={activeTool === "date" ? "active" : ""} type="button" onClick={() => selectTool("date")}>📅<span>{form.date === todayBudgetDateKey() ? "Today" : formatShortDate(form.date)}</span></button>
          <button type="button" disabled>🔁<span>Recurring</span></button>
          <button type="button" onClick={() => update({ excludedFromBudget: !form.excludedFromBudget })}>⊘<span>{form.excludedFromBudget ? "Included" : "Exclude"}</span></button>
          <button type="button" onClick={() => selectTool("more")}>⚙️<span>More</span></button>
        </div>
      )}
      {popup && activeTool === "tag" && (
        <div className="budget-popup-editor-panel">
          <FieldLabel>Tags</FieldLabel>
          <input className="budget-input" value={form.tags} placeholder="Grab, lunch, planned" onChange={event => update({ tags: event.target.value })} aria-label="Edit transaction tags" />
          <div className="budget-popup-tag-preview">
            {currentTags.length ? currentTags.map(tag => <button type="button" key={tag} onClick={() => toggleTag(tag)}>#{tag} ×</button>) : <span>No tags yet.</span>}
          </div>
        </div>
      )}
      {popup && activeTool === "note" && (
        <div className="budget-popup-editor-panel">
          <FieldLabel>Note</FieldLabel>
          <textarea className="budget-input budget-notes" value={form.notes} placeholder="Add a note for your reference" onChange={event => update({ notes: event.target.value })} aria-label="Transaction notes" />
        </div>
      )}
      {popup && activeTool === "date" && (
        <div className="budget-popup-editor-panel budget-popup-date-panel">
          <label>
            <FieldLabel>Date</FieldLabel>
            <input className="budget-input" type="date" value={form.date} onChange={event => update({ date: event.target.value })} />
          </label>
          <button className="tf-save" type="button" onClick={() => update({ date: todayBudgetDateKey() })}>Use today</button>
        </div>
      )}
      {popup && activeTool === "more" && (
        <div className="budget-popup-editor-panel">
          <FieldLabel>Description</FieldLabel>
          <input className="budget-input" value={form.description} placeholder={form.type === "expense" ? "Lunch, Grab, groceries..." : form.type === "income" ? "Salary, returned money..." : "Move to savings..."} onChange={event => update({ description: event.target.value })} />
        </div>
      )}
      <div className="budget-form-grid budget-transaction-form-grid">
        {!popup && (
          <label>
            <FieldLabel>Date</FieldLabel>
            <input className="budget-input" type="date" value={form.date} onChange={event => update({ date: event.target.value })} />
          </label>
        )}
        <label>
          <FieldLabel>{form.type === "transfer" ? "From account" : "Account"}</FieldLabel>
          <select className="budget-input" value={form.accountId} onChange={event => update({ accountId: event.target.value })}>
            {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </label>
        {form.type === "transfer" && (
          <label>
            <FieldLabel>To account</FieldLabel>
            <select className="budget-input" value={form.toAccountId} onChange={event => update({ toAccountId: event.target.value })}>
              {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </label>
        )}
        <label>
          <FieldLabel>Ledger</FieldLabel>
          <select className="budget-input" value={form.ledgerId} onChange={event => {
            const nextLedgerId = event.target.value;
            const nextBucket = form.type === "transfer" ? null : buckets.find(bucket => bucket.cashFlowType === form.type && bucket.ledgerId === nextLedgerId);
            update({ ledgerId: nextLedgerId, bucketId: nextBucket?.id || "", accountId: nextBucket?.accountId || form.accountId });
          }}>
            {ledgers.map(ledger => <option key={ledger.id} value={ledger.id}>{ledger.name}</option>)}
          </select>
        </label>
        {form.type !== "transfer" && (
          <label>
            <FieldLabel>Card</FieldLabel>
            <select className="budget-input" value={form.bucketId} onChange={event => { const bucket = buckets.find(item => item.id === event.target.value); update({ bucketId: event.target.value, ledgerId: bucket?.ledgerId || form.ledgerId, accountId: bucket?.accountId || form.accountId }); }}>
              <option value="">No card</option>
              {visibleBuckets.map(bucket => <option key={bucket.id} value={bucket.id}>{bucket.name}</option>)}
            </select>
          </label>
        )}
        {!popup && (
          <>
            <label>
              <FieldLabel>Description</FieldLabel>
              <input className="budget-input" value={form.description} placeholder={form.type === "expense" ? "Lunch, Grab, groceries..." : form.type === "income" ? "Salary, returned money..." : "Move to savings..."} onChange={event => update({ description: event.target.value })} />
            </label>
            <label>
              <FieldLabel>Tags</FieldLabel>
              <input className="budget-input" value={form.tags} placeholder="travel, emotional, planned" onChange={event => update({ tags: event.target.value })} />
            </label>
          </>
        )}
      </div>
      {!popup && <textarea className="budget-input budget-notes" value={form.notes} placeholder="Optional note" onChange={event => update({ notes: event.target.value })} aria-label="Transaction notes" />}
      {popup ? (
        <BudgetAmountKeypad value={form.amount} onChange={amount => update({ amount })} onSave={onSave} currency={currency} />
      ) : (
        <div className="budget-transaction-actions">
          <button className="tf-save" type="button" onClick={onSave}>{form.id ? "Save changes" : "Record transaction"}</button>
          <span>{formatBudgetMoney(Number(form.amount || 0), currency)} ready to record</span>
        </div>
      )}
    </section>
  );
}

function BudgetTransactionsPage({ transactions, accounts, ledgers, buckets, currency, onTransactionsChange }) {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const emptyForm = useMemo(() => createEmptyTransactionForm({ accounts, ledgers, buckets }), [accounts, ledgers, buckets]);
  const [form, setForm] = useState(null);
  const calendarDays = buildBudgetCalendarDays(monthDate);
  const dailyTotals = calculateBudgetDailyTotals(transactions);
  const grouped = groupBudgetTransactionsByDate(transactions);
  const accountById = Object.fromEntries(accounts.map(account => [account.id, account]));
  const ledgerById = Object.fromEntries(ledgers.map(ledger => [ledger.id, ledger]));
  const bucketById = Object.fromEntries(buckets.map(bucket => [bucket.id, bucket]));
  const monthPrefix = todayBudgetDateKey(monthDate).slice(0, 7);
  const monthTransactions = transactions
    .map(normalizeBudgetTransaction)
    .filter(transaction => transaction.date.startsWith(monthPrefix))
    .sort((a, b) => `${b.date}-${b.createdAt}`.localeCompare(`${a.date}-${a.createdAt}`));
  const monthIncome = monthTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const monthExpense = monthTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const openTransaction = (type = "expense") => setForm(createEmptyTransactionForm({ accounts, ledgers, buckets, type }));
  const closeTransaction = () => setForm(null);
  const saveTransaction = () => {
    if (!form) return;
    const amount = Math.abs(Number(form.amount || 0));
    if (!amount) return;
    const timestamp = new Date().toISOString();
    const next = normalizeBudgetTransaction({
      ...form,
      amount,
      description: form.description || transactionTypeCopy[form.type]?.label,
      createdAt: form.id ? transactions.find(transaction => transaction.id === form.id)?.createdAt : timestamp,
      updatedAt: timestamp,
    });
    const others = transactions.filter(transaction => transaction.id !== next.id);
    onTransactionsChange([...others, next]);
    setForm(null);
  };
  const editTransaction = transaction => setForm(formFromTransaction(transaction, emptyForm));
  const deleteTransaction = id => onTransactionsChange(transactions.filter(transaction => transaction.id !== id));
  const moveMonth = offset => setMonthDate(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));

  return (
    <>
      <section className="budget-card budget-transaction-launch-card">
        <div className="budget-card-head">
          <div>
            <p className="budget-kicker">Quick record</p>
            <h2>Add transaction</h2>
          </div>
          <span className="budget-editable-pill">Popup</span>
        </div>
        <div className="budget-launch-actions">
          <button type="button" onClick={() => openTransaction("expense")}>− Expense</button>
          <button type="button" onClick={() => openTransaction("income")}>＋ Income</button>
          <button type="button" onClick={() => openTransaction("transfer")}>⇄ Transfer</button>
        </div>
      </section>
      <BudgetTransactionPopup form={form} setForm={setForm} accounts={accounts} ledgers={ledgers} buckets={buckets} currency={currency} summary={null} onSave={saveTransaction} onClose={closeTransaction} />
      <section className="budget-card budget-calendar-card">
        <div className="budget-card-head budget-month-head">
          <button className="budget-round-icon" type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}>‹</button>
          <div>
            <p className="budget-kicker">Transaction calendar</p>
            <h2>{monthTitle(monthDate)}</h2>
          </div>
          <button className="budget-round-icon" type="button" aria-label="Next month" onClick={() => moveMonth(1)}>›</button>
          <span className="budget-editable-pill">Record</span>
        </div>
        <div className="budget-calendar-weekdays" aria-hidden="true">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}
        </div>
        <div className="budget-calendar-placeholder budget-calendar-real">
          {calendarDays.map(day => {
            const totals = dailyTotals[day.key] || {};
            const active = day.key === todayBudgetDateKey();
            return (
              <span key={day.key} className={`${active ? "active" : ""} ${day.inMonth ? "" : "muted"}`}>
                <b>{day.day}</b>
                <small>{totals.income ? <em className="good">+{formatBudgetMoney(totals.income, currency)}</em> : null}{totals.expense ? <em className="danger">−{formatBudgetMoney(totals.expense, currency)}</em> : null}{!totals.income && !totals.expense ? "—" : null}</small>
              </span>
            );
          })}
        </div>
        <div className="budget-calendar-month-summary">
          <span>Income <strong className="good">{formatBudgetMoney(monthIncome, currency)}</strong></span>
          <span>Expense <strong className="danger">{formatBudgetMoney(monthExpense, currency)}</strong></span>
          <span>Balance <strong>{formatBudgetMoney(monthIncome - monthExpense, currency)}</strong></span>
        </div>
      </section>
      <section className="budget-card">
        <div className="budget-card-head">
          <div>
            <p className="budget-kicker">Ledger entries</p>
            <h2>Transactions</h2>
          </div>
          <span className="budget-editable-pill">{transactions.length} entries</span>
        </div>
        {monthTransactions.length ? (
          <div className="budget-transaction-list budget-transaction-grouped-list">
            {Object.entries(grouped)
              .filter(([date]) => date.startsWith(monthPrefix))
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, entries]) => (
                <div className="budget-date-group" key={date}>
                  <div className="budget-date-group-head"><strong>{formatShortDate(date)}</strong><span>{entries.length} entr{entries.length === 1 ? "y" : "ies"}</span></div>
                  {entries.map(transaction => (
                    <div className={`budget-transaction-row ${transactionTone(transaction)}`} key={transaction.id}>
                      <span className="budget-transaction-icon">{transactionTypeCopy[transaction.type]?.icon}</span>
                      <div>
                        <strong>{transaction.description || "Untitled transaction"}</strong>
                        <small>{bucketById[transaction.bucketId]?.name || ledgerById[transaction.ledgerId]?.name || "No bucket"} · {accountById[transaction.accountId]?.name || "Account"}{transaction.type === "transfer" && transaction.toAccountId ? ` → ${accountById[transaction.toAccountId]?.name || "Account"}` : ""}</small>
                        {transaction.tags?.length ? <small>#{transaction.tags.join(" #")}</small> : null}
                      </div>
                      <strong>{transactionDisplayAmount(transaction, currency)}</strong>
                      <button className="budget-row-link" type="button" onClick={() => editTransaction(transaction)}>Edit</button>
                      <button className="budget-row-link danger" type="button" onClick={() => deleteTransaction(transaction.id)}>Delete</button>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        ) : (
          <p className="budget-helper-copy">No transactions recorded for this month yet. Add an expense, income, or transfer above to start tracking account balances and bucket spending.</p>
        )}
      </section>
    </>
  );
}

function BudgetSettingsPage({ profile, accounts, ledgers, buckets, transactions }) {
  const settingsRows = [
    ["🎟️", "Ledger Manager", `${ledgers.length} ledgers`],
    ["💳", "Account Manager", `${accounts.length} accounts`],
    ["🧩", "Category Manager", `${buckets.length} budget buckets`],
    ["💰", "Budget", profile.name || "Budget V1"],
    ["🏦", "Saving", "Australia-ready funds later"],
    ["💱", "Base Currency", profile.currency || "SGD"],
    ["🔁", "Recurring", "Later"],
    ["🧾", "Transactions", `${transactions.length} saved entries`],
    ["📤", "Export/Import", "Later"],
    ["☁️", "Cloud Sync", "Uses Tempo sync"],
  ];
  return (
    <>
      <section className="budget-card budget-settings-profile-card">
        <p className="budget-kicker">Budget profile</p>
        <h2>{profile.name || "Budget V1"}</h2>
        <p>Budget settings are intentionally separate from Schedule settings. This keeps finance setup focused on accounts, ledgers, buckets, savings, and currency.</p>
      </section>
      <section className="budget-card budget-settings-list" aria-label="Budget settings skeleton">
        {settingsRows.map(([icon, label, detail]) => (
          <div className="budget-settings-row" key={label}>
            <span className="budget-settings-icon">{icon}</span>
            <strong>{label}</strong>
            <small>{detail}</small>
            <span aria-hidden="true">›</span>
          </div>
        ))}
      </section>
      <BudgetRoadmapCard />
    </>
  );
}

export function BudgetApp({
  activePage = "home",
  profile,
  accounts,
  ledgers,
  buckets,
  transactions,
  onProfileChange,
  onAccountsChange,
  onBucketsChange,
  onTransactionsChange,
}) {
  const safePage = ["home", "account", "transactions", "budget", "settings"].includes(activePage) ? activePage : "home";
  const summary = calculateBudgetSummary({ profile, accounts, ledgers, buckets, transactions });
  const currency = profile.currency || "SGD";

  return (
    <main className={`budget-page budget-page-${safePage} phase-page`}>
      {safePage !== "account" && <BudgetHero activePage={safePage} />}

      {safePage === "home" && <BudgetHomePage currency={currency} buckets={buckets} accounts={accounts} ledgers={ledgers} transactions={transactions} onBucketsChange={onBucketsChange} onTransactionsChange={onTransactionsChange} />}
      {safePage === "account" && <BudgetAccountPage accounts={accounts} ledgers={ledgers} buckets={buckets} currency={currency} transactions={transactions} summary={summary} onAccountsChange={onAccountsChange} onTransactionsChange={onTransactionsChange} />}
      {safePage === "transactions" && <BudgetTransactionsPage transactions={transactions} accounts={accounts} ledgers={ledgers} buckets={buckets} currency={currency} onTransactionsChange={onTransactionsChange} />}
      {safePage === "budget" && (
        <BudgetPlanPage
          profile={profile}
          accounts={accounts}
          ledgers={ledgers}
          buckets={buckets}
          transactions={transactions}
          currency={currency}
          onProfileChange={onProfileChange}
          onBucketsChange={onBucketsChange}
        />
      )}
      {safePage === "settings" && <BudgetSettingsPage profile={profile} accounts={accounts} ledgers={ledgers} buckets={buckets} transactions={transactions} />}
    </main>
  );
}

export function OverallPage({ budgetSummary, rhythmSummary }) {
  return (
    <main className="budget-page overall-page phase-page">
      <section className="budget-hero phase-hero">
        <div>
          <div className="phase-kicker">Overall</div>
          <h1>🌿 Overall rhythm + money view</h1>
          <p>This mode will connect Budget and Schedule later. For now it confirms the combined shell is ready.</p>
        </div>
      </section>
      <section className="budget-metrics-grid">
        <BudgetMetric label="Budget buckets" value={budgetSummary.bucketCount} detail="Editable Budget V1 buckets" />
        <BudgetMetric label="Accounts" value={budgetSummary.accountCount} detail="Bank/account skeleton ready" />
        <BudgetMetric label="Task completion" value={`${rhythmSummary?.taskCompletionRate30 ?? 0}%`} detail="Last 30 days" />
        <BudgetMetric label="Australia-ready" value={formatBudgetMoney(budgetSummary.australiaReadyFunds, "SGD")} detail="Budget data only for now" />
      </section>
      <section className="budget-card">
        <p className="budget-kicker">Coming after Budget core</p>
        <h2>Pattern comparison</h2>
        <p>Later, Overall may compare spending with your calendar and tasks to help you plan more clearly.</p>
      </section>
    </main>
  );
}
