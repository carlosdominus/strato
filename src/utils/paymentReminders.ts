import { CreditCardSheet, Subscription, SubscriptionMonthPayment } from '../types';
import { getCardInvoicePaymentKey, getSubscriptionPaymentKey } from './subscriptions';

export interface PaymentReminder {
  id: string;
  name: string;
  kind: 'Conta recorrente' | 'Fatura de cartão';
  amount: number;
  dueDate: string;
  daysUntilDue: number;
}

function dueDateForDay(today: Date, day: number): Date {
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(Math.max(Math.floor(day), 1), lastDayOfMonth));
}

export function buildPaymentReminders(
  today: Date,
  currentMonth: string,
  subscriptions: Subscription[],
  subscriptionPayments: Record<string, SubscriptionMonthPayment>,
  cards: CreditCardSheet[],
  paidCardInvoices: Record<string, boolean>
): PaymentReminder[] {
  const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const reminders: PaymentReminder[] = [];

  subscriptions.forEach((subscription) => {
    const isActive = subscription.status === 'ativa' || subscription.active;
    const paymentKey = getSubscriptionPaymentKey(subscription.serviceName, currentMonth);
    if (!isActive || subscription.monthlyPrice <= 0 || subscriptionPayments[paymentKey]?.paidDate) return;

    const dueDate = dueDateForDay(today, subscription.renewalDay);
    reminders.push({
      id: `subscription:${paymentKey}`,
      name: subscription.serviceName,
      kind: 'Conta recorrente',
      amount: subscription.personalMonthlyPrice ?? subscription.monthlyPrice,
      dueDate: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`,
      daysUntilDue: Math.round((dueDate.getTime() - todayAtMidnight.getTime()) / 86400000),
    });
  });

  cards.forEach((card) => {
    const paymentKey = getCardInvoicePaymentKey(card.name, currentMonth);
    if (card.currentInvoice <= 0 || paidCardInvoices[paymentKey]) return;

    const dueDate = dueDateForDay(today, card.dueDay);
    reminders.push({
      id: `card:${paymentKey}`,
      name: card.name,
      kind: 'Fatura de cartão',
      amount: card.currentInvoice,
      dueDate: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`,
      daysUntilDue: Math.round((dueDate.getTime() - todayAtMidnight.getTime()) / 86400000),
    });
  });

  return reminders.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
