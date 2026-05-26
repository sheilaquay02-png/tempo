export function calculateProgress(done, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round(done / total * 100)));
}

export function pct(done, total) {
  return calculateProgress(done, total);
}

export function calculateBudgetTotal(items = []) {
  return (Array.isArray(items) ? items : []).reduce((sum, item) => sum + Number(item?.amount || item?.value || 0), 0);
}

export function calculateCategorySpent(transactions = [], categoryName = "") {
  return (Array.isArray(transactions) ? transactions : [])
    .filter(item => String(item?.category || item?.categoryName || "") === String(categoryName))
    .reduce((sum, item) => sum + Number(item?.amount || item?.value || 0), 0);
}
