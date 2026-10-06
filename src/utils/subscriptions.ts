export function getSubscriptionPaymentKey(serviceName: string, month: string): string {
  const normalizedName = (serviceName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  return `${normalizedName}::${month.toLowerCase().trim()}`;
}
