const currencyLocales: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
};

export function formatCurrency(amount: number, currency: string) {
  const formatted = new Intl.NumberFormat(currencyLocales[currency] ?? "en", {
    style: "currency",
    currency,
  }).format(amount);

  return `${formatted} (${currency})`;
}
