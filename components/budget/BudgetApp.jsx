import {
  BUDGET_ACCOUNT_TYPES,
  BUDGET_BUCKET_TYPES,
  BUDGET_LEDGER_TYPES,
} from "../../constants/budgetConstants";
import {
  budgetUid,
  calculateBudgetSummary,
  formatBudgetMoney,
  normalizeBudgetAccount,
  normalizeBudgetBucket,
  normalizeBudgetLedger,
  patchBudgetItem,
} from "../../utils/budgetPlanUtils";

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

function AccountsPanel({ accounts, ledgers, currency, onChange }) {
  const patchAccount = (id, patch) => onChange(patchBudgetItem(accounts, id, patch).map(normalizeBudgetAccount));
  const addAccount = () => onChange([
    ...accounts,
    normalizeBudgetAccount({
      id: budgetUid("account"),
      name: "New account",
      type: "debit",
      currency,
      balance: 0,
      ledgerId: ledgers[0]?.id || "personal-ledger",
      includeInNetWorth: true,
    }),
  ]);
  const removeAccount = id => {
    if (accounts.length <= 1) return;
    onChange(accounts.filter(account => account.id !== id));
  };

  return (
    <section className="budget-card">
      <div className="budget-card-head">
        <div>
          <p className="budget-kicker">Accounts</p>
          <h2>Bank accounts & balances</h2>
        </div>
        <button className="tf-save" type="button" onClick={addAccount}>＋ Account</button>
      </div>
      <div className="budget-account-list">
        {accounts.map(account => (
          <div className="budget-account-row" key={account.id}>
            <input className="budget-input" value={account.name} onChange={event => patchAccount(account.id, { name: event.target.value })} aria-label={`${account.name} name`} />
            <SelectInput value={account.type} options={BUDGET_ACCOUNT_TYPES} onChange={type => patchAccount(account.id, { type })} ariaLabel={`${account.name} type`} />
            <MoneyInput value={account.balance} onChange={balance => patchAccount(account.id, { balance })} ariaLabel={`${account.name} balance`} />
            <select className="budget-input" value={account.ledgerId} onChange={event => patchAccount(account.id, { ledgerId: event.target.value })} aria-label={`${account.name} ledger`}>
              {ledgers.map(ledger => <option key={ledger.id} value={ledger.id}>{ledger.name}</option>)}
            </select>
            <label className="budget-check"><input type="checkbox" checked={Boolean(account.includeInNetWorth)} onChange={event => patchAccount(account.id, { includeInNetWorth: event.target.checked })} /> Net worth</label>
            <label className="budget-check"><input type="checkbox" checked={Boolean(account.includeInAustraliaReady)} onChange={event => patchAccount(account.id, { includeInAustraliaReady: event.target.checked })} /> Australia-ready</label>
            <button className="tf-cancel" type="button" onClick={() => removeAccount(account.id)} disabled={accounts.length <= 1}>Remove</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function LedgersPanel({ ledgers, accounts, onChange }) {
  const patchLedger = (id, patch) => onChange(patchBudgetItem(ledgers, id, patch).map(normalizeBudgetLedger));
  const addLedger = () => onChange([...ledgers, normalizeBudgetLedger({ id: budgetUid("ledger"), name: "New ledger", type: "personal", accountIds: [] })]);
  const removeLedger = id => {
    if (ledgers.length <= 1) return;
    onChange(ledgers.filter(ledger => ledger.id !== id));
  };

  return (
    <section className="budget-card">
      <div className="budget-card-head">
        <div>
          <p className="budget-kicker">Ledgers</p>
          <h2>Separate money stories</h2>
        </div>
        <button className="tf-save" type="button" onClick={addLedger}>＋ Ledger</button>
      </div>
      <div className="budget-ledger-grid">
        {ledgers.map(ledger => {
          const linkedAccounts = accounts.filter(account => account.ledgerId === ledger.id || ledger.accountIds?.includes(account.id));
          return (
            <div className="budget-ledger-card" key={ledger.id}>
              <input className="budget-input" value={ledger.name} onChange={event => patchLedger(ledger.id, { name: event.target.value })} aria-label={`${ledger.name} name`} />
              <SelectInput value={ledger.type} options={BUDGET_LEDGER_TYPES} onChange={type => patchLedger(ledger.id, { type })} ariaLabel={`${ledger.name} type`} />
              <textarea className="budget-input" value={ledger.description || ""} onChange={event => patchLedger(ledger.id, { description: event.target.value })} aria-label={`${ledger.name} description`} />
              <small>{linkedAccounts.length} linked account{linkedAccounts.length === 1 ? "" : "s"}</small>
              <button className="tf-cancel" type="button" onClick={() => removeLedger(ledger.id)} disabled={ledgers.length <= 1}>Remove</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BucketsPanel({ buckets, accounts, ledgers, currency, onChange }) {
  const patchBucket = (id, patch) => onChange(patchBudgetItem(buckets, id, patch).map(normalizeBudgetBucket));
  const addBucket = () => onChange([
    ...buckets,
    normalizeBudgetBucket({
      id: budgetUid("bucket"),
      name: "New bucket",
      monthlyAmount: 0,
      type: "flexible_spending",
      group: "Flexible spending",
      accountId: accounts[0]?.id || "main-bank",
      ledgerId: ledgers[0]?.id || "personal-ledger",
      isProtected: false,
      rolloverEnabled: false,
    }),
  ]);
  const removeBucket = id => {
    if (buckets.length <= 1) return;
    onChange(buckets.filter(bucket => bucket.id !== id));
  };

  return (
    <section className="budget-card">
      <div className="budget-card-head">
        <div>
          <p className="budget-kicker">Buckets</p>
          <h2>Editable monthly budget buckets</h2>
        </div>
        <button className="tf-save" type="button" onClick={addBucket}>＋ Bucket</button>
      </div>
      <div className="budget-bucket-list">
        {buckets.map(bucket => (
          <div className={`budget-bucket-row ${bucket.isProtected ? "protected" : ""}`} key={bucket.id}>
            <input className="budget-input bucket-name" value={bucket.name} onChange={event => patchBucket(bucket.id, { name: event.target.value })} aria-label={`${bucket.name} name`} />
            <MoneyInput value={bucket.monthlyAmount} onChange={monthlyAmount => patchBucket(bucket.id, { monthlyAmount })} ariaLabel={`${bucket.name} monthly amount`} />
            <SelectInput value={bucket.type} options={BUDGET_BUCKET_TYPES} onChange={type => patchBucket(bucket.id, { type })} ariaLabel={`${bucket.name} type`} />
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
            <textarea className="budget-input bucket-notes" value={bucket.notes || ""} onChange={event => patchBucket(bucket.id, { notes: event.target.value })} aria-label={`${bucket.name} notes`} />
          </div>
        ))}
      </div>
      <p className="budget-helper-copy">Protected buckets stay editable, but later damage-control flows will warn before reducing them.</p>
    </section>
  );
}

function BudgetRoadmapCard() {
  const nextItems = [
    "Phase 143: transactions, categories, and ledger entries",
    "Phase 144: spending pace tracker and budget calendar",
    "Phase 145: protected-fund warnings and damage-control repair plans",
    "Phase 146: bonus rules and yearly auto-increases",
  ];
  return (
    <section className="budget-card budget-roadmap-card">
      <p className="budget-kicker">Foundation now, intelligence later</p>
      <h2>How Budget connects to Schedule</h2>
      <p>Budget data stays separate from schedule data for privacy and clarity. Overall mode will later compare spending with tasks, events, habits, and journal signals to find lifestyle patterns.</p>
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
    transactions: ["Transactions", "The ledger-entry skeleton is ready for Phase 143 transaction entry."],
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

function BudgetHomePage({ summary, currency, buckets, accounts }) {
  const expenseBuckets = buckets.filter(bucket => bucket.type !== "protected_goal" && bucket.type !== "investment");
  const protectedBuckets = buckets.filter(bucket => bucket.isProtected);
  return (
    <>
      <BudgetMetrics summary={summary} currency={currency} />
      <section className="budget-card budget-networth-card">
        <div className="budget-networth-inner">
          <p className="budget-kicker">Net worth skeleton</p>
          <strong>{formatBudgetMoney(summary.netWorth, currency)}</strong>
          <span>Assets across {accounts.length} editable account{accounts.length === 1 ? "" : "s"}</span>
        </div>
        <div className="budget-networth-wave" aria-hidden="true" />
      </section>
      <section className="budget-card">
        <div className="budget-card-head">
          <div>
            <p className="budget-kicker">Monthly spending buckets</p>
            <h2>Home cards</h2>
          </div>
        </div>
        <div className="budget-home-tile-grid">
          {expenseBuckets.map(bucket => (
            <div className="budget-home-tile" key={bucket.id}>
              <span className="budget-home-tile-icon">{bucket.type === "sinking_fund" ? "✈️" : bucket.type === "fixed_commitment" ? "🤝" : bucket.type === "business" ? "🧰" : "🛍️"}</span>
              <strong>{bucket.name}</strong>
              <small>{formatBudgetMoney(bucket.monthlyAmount, currency)} / month</small>
            </div>
          ))}
        </div>
      </section>
      <section className="budget-card">
        <div className="budget-card-head">
          <div>
            <p className="budget-kicker">Protected funds</p>
            <h2>Goals to protect first</h2>
          </div>
        </div>
        <div className="budget-home-tile-grid compact">
          {protectedBuckets.map(bucket => (
            <div className="budget-home-tile protected" key={bucket.id}>
              <span className="budget-home-tile-icon">🛡️</span>
              <strong>{bucket.name}</strong>
              <small>{formatBudgetMoney(bucket.monthlyAmount, currency)} / month</small>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function BudgetTransactionsPage({ transactions, currency }) {
  return (
    <>
      <section className="budget-card budget-calendar-card">
        <div className="budget-card-head">
          <div>
            <p className="budget-kicker">Transaction calendar</p>
            <h2>This Month</h2>
          </div>
          <span className="budget-editable-pill">Phase 143</span>
        </div>
        <div className="budget-calendar-placeholder">
          {Array.from({ length: 35 }, (_, index) => <span key={index} className={index === 26 ? "active" : ""}>{index % 7 === 0 ? "" : index + 1}</span>)}
        </div>
      </section>
      <section className="budget-card">
        <div className="budget-card-head">
          <div>
            <p className="budget-kicker">Ledger entries</p>
            <h2>Transactions</h2>
          </div>
        </div>
        {transactions.length ? (
          <div className="budget-transaction-list">
            {transactions.map(transaction => (
              <div className="budget-transaction-row" key={transaction.id}>
                <span>{transaction.description || "Untitled transaction"}</span>
                <strong>{formatBudgetMoney(transaction.amount, currency)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="budget-helper-copy">Transaction entry starts in Phase 143. This page is intentionally a skeleton so the Budget footer already matches the target app structure.</p>
        )}
      </section>
    </>
  );
}

function BudgetSettingsPage({ profile, accounts, ledgers, buckets }) {
  const settingsRows = [
    ["🎟️", "Ledger Manager", `${ledgers.length} ledgers`],
    ["💳", "Account Manager", `${accounts.length} accounts`],
    ["🧩", "Category Manager", `${buckets.length} budget buckets`],
    ["💰", "Budget", profile.name || "Budget V1"],
    ["🏦", "Saving", "Australia-ready funds later"],
    ["💱", "Base Currency", profile.currency || "SGD"],
    ["🔁", "Recurring", "Phase 143+"],
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
  onLedgersChange,
  onBucketsChange,
}) {
  const safePage = ["home", "account", "transactions", "budget", "settings"].includes(activePage) ? activePage : "home";
  const summary = calculateBudgetSummary({ profile, accounts, ledgers, buckets, transactions });
  const currency = profile.currency || "SGD";

  return (
    <main className={`budget-page budget-page-${safePage} phase-page`}>
      <BudgetHero activePage={safePage} />

      {safePage === "home" && <BudgetHomePage summary={summary} currency={currency} buckets={buckets} accounts={accounts} />}
      {safePage === "account" && (
        <>
          <BudgetMetrics summary={summary} currency={currency} />
          <AccountsPanel accounts={accounts} ledgers={ledgers} currency={currency} onChange={onAccountsChange} />
          <LedgersPanel ledgers={ledgers} accounts={accounts} onChange={onLedgersChange} />
        </>
      )}
      {safePage === "transactions" && <BudgetTransactionsPage transactions={transactions} currency={currency} />}
      {safePage === "budget" && (
        <>
          <BudgetMetrics summary={summary} currency={currency} />
          <div className="budget-layout-grid">
            <EditableProfileCard profile={profile} onChange={onProfileChange} />
            <BudgetRoadmapCard />
          </div>
          <BucketsPanel buckets={buckets} accounts={accounts} ledgers={ledgers} currency={currency} onChange={onBucketsChange} />
        </>
      )}
      {safePage === "settings" && <BudgetSettingsPage profile={profile} accounts={accounts} ledgers={ledgers} buckets={buckets} />}
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
        <BudgetMetric label="Habit rhythm" value={`${rhythmSummary?.habitRate7 ?? 0}%`} detail="From Schedule data" />
        <BudgetMetric label="Australia-ready" value={formatBudgetMoney(budgetSummary.australiaReadyFunds, "SGD")} detail="Budget data only for now" />
      </section>
      <section className="budget-card">
        <p className="budget-kicker">Coming after Budget core</p>
        <h2>Pattern comparison</h2>
        <p>Later, Overall will compare spending data with your events, tasks, habits, check-ins, and journal entries to surface practical rhythm advice, not generic finance judgement.</p>
      </section>
    </main>
  );
}
