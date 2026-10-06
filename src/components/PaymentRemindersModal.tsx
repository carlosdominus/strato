import React from 'react';
import { AlertTriangle, CalendarDays, CreditCard, Wallet, X } from 'lucide-react';
import { PaymentReminder } from '../utils/paymentReminders';
import { formatCurrency } from '../utils/formatters';

interface PaymentRemindersModalProps {
  reminders: PaymentReminder[];
  onClose: () => void;
}

const getDueLabel = (daysUntilDue: number) => {
  if (daysUntilDue < 0) return `Atrasada há ${Math.abs(daysUntilDue)} ${Math.abs(daysUntilDue) === 1 ? 'dia' : 'dias'}`;
  if (daysUntilDue === 0) return 'Vence hoje';
  return `Vence em ${daysUntilDue} ${daysUntilDue === 1 ? 'dia' : 'dias'}`;
};

export const PaymentRemindersModal: React.FC<PaymentRemindersModalProps> = ({ reminders, onClose }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
    <section role="dialog" aria-modal="true" aria-labelledby="payment-reminders-title" className="w-full max-w-xl overflow-hidden rounded-3xl bg-[#FAFBF6] shadow-2xl">
      <header className="flex items-start justify-between gap-4 bg-[#11310C] p-6 text-[#FAFBF6]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#C4C240] text-[#11310C]"><AlertTriangle className="h-5 w-5" /></div>
          <div>
            <h2 id="payment-reminders-title" className="text-lg font-extrabold">Lembretes de pagamento</h2>
            <p className="mt-1 text-xs text-white/75">Contas e faturas pendentes deste mês.</p>
          </div>
        </div>
        <button type="button" aria-label="Fechar lembretes" onClick={onClose} className="rounded-full p-2 text-white/75 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
      </header>

      <div className="max-h-[60vh] space-y-3 overflow-y-auto p-5">
        {reminders.map((reminder) => (
          <article key={reminder.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[#11310C]/10 bg-white p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#11310C]/5 text-[#11310C]">
                {reminder.kind === 'Fatura de cartão' ? <CreditCard className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-extrabold text-[#11310C]">{reminder.name}</h3>
                <p className="text-[10px] font-semibold text-[#11310C]/60">{reminder.kind} · vencimento {reminder.dueDate.split('-').reverse().join('/')}</p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-extrabold text-[#11310C]">{formatCurrency(reminder.amount)}</p>
              <p className={`inline-flex items-center gap-1 text-[10px] font-extrabold ${reminder.daysUntilDue < 0 ? 'text-red-700' : reminder.daysUntilDue === 0 ? 'text-amber-800' : 'text-[#11310C]/60'}`}>
                <CalendarDays className="h-3 w-3" /> {getDueLabel(reminder.daysUntilDue)}
              </p>
            </div>
          </article>
        ))}
      </div>

      <footer className="flex justify-end border-t border-[#11310C]/10 p-5">
        <button type="button" onClick={onClose} className="rounded-xl bg-[#11310C] px-5 py-2.5 text-xs font-extrabold text-[#C4C240]">Entendi</button>
      </footer>
    </section>
  </div>
);
