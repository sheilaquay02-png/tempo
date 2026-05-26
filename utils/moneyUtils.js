export function formatCurrency(amount, currency = "SGD") {
  const value = Number(amount || 0);
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function parseAmount(value) {
  const number = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

export function sumTransactions(transactions = []) {
  return (Array.isArray(transactions) ? transactions : []).reduce((sum, item) => sum + parseAmount(item?.amount ?? item?.value ?? 0), 0);
}

export function calculateRemaining(income = 0, expenses = 0) {
  return parseAmount(income) - parseAmount(expenses);
}
