import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Budget Home and Transactions use popup transaction recorder', () => {
  const budgetApp = readFileSync(new URL('../components/budget/BudgetApp.jsx', import.meta.url), 'utf8');
  assert.match(budgetApp, /function BudgetTransactionPopup/);
  assert.match(budgetApp, /budget-transaction-popup-overlay/);
  assert.match(budgetApp, /BudgetAmountKeypad/);
  assert.match(budgetApp, /openHomeTransaction\("expense", expenseBuckets\[0\]\?\.id\)/);
  assert.match(budgetApp, /onClick=\{\(\) => openTransaction\("income"\)\}/);
  assert.doesNotMatch(budgetApp, /<BudgetTransactionForm form=\{form\} setForm=\{setForm\} accounts=\{accounts\} ledgers=\{ledgers\} buckets=\{buckets\} currency=\{currency\} onSave=\{saveTransaction\}/);
});

test('Budget popup recorder styles exist', () => {
  const styles = readFileSync(new URL('../styles/tempoStyles.js', import.meta.url), 'utf8');
  assert.match(styles, /budget-transaction-popup-sheet/);
  assert.match(styles, /budget-popup-keypad/);
  assert.match(styles, /budget-popup-progress/);
});
