import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { AuthErrorInfo, UserProfile } from '../types';

interface AuthAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  authError: AuthErrorInfo | null;
  onLoginAsCarlos: () => void;
  onLoginCustomEmail: (email: string, name?: string) => void;
  onRetryGoogleLogin: () => void;
}

export const AuthAssistModal: React.FC<AuthAssistModalProps> = ({
  isOpen,
  onClose,
  authError,
  onLoginAsCarlos,
  onLoginCustomEmail,
  onRetryGoogleLogin,
}) => {
  const [domainCopied, setDomainCopied] = useState(false);
  const [showTechnicalSteps, setShowTechnicalSteps] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomEmailForm, setShowCustomEmailForm] = useState(false);

  if (!isOpen) return null;

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseConsoleUrl = authError?.helpUrl || 'https://console.firebase.google.com/project/gen-lang-client-0254253171/authentication/settings';

  const handleCopyDomain = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentDomain);
      setDomainCopied(true);
      setTimeout(() => setDomainCopied(false), 2500);
    }
  };

  const handleOpenNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank');
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) return;
    onLoginCustomEmail(customEmail, customName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#FAFBF6] rounded-3xl shadow-2xl border border-[#11310C]/15 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-[#11310C] text-[#FAFBF6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C4C240] text-[#11310C] flex items-center justify-center font-extrabold shadow-sm">
              <AlertTriangle className="w-5 h-5 text-[#11310C]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#FAFBF6] leading-tight">
                O Pop-up do Google Fechou Sozinho?
              </h3>
              <p className="text-xs text-[#FAFBF6]/80 font-medium mt-0.5">
                Diagnóstico e soluções imediatas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#FAFBF6]/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-[#11310C]">
          {/* Explanation banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
            <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span>⚡</span> Por que isso acontece?
            </p>
            <p className="text-xs text-[#11310C]/80 leading-relaxed font-medium">
              O Firebase Auth fecha a janela do Google instantaneamente quando o endereço temporário do app (Cloud Run) ainda não consta na lista de <strong>Domínios Autorizados</strong> do Google Cloud, ou por restrições de pop-up no iframe de testes do AI Studio.
            </p>
          </div>

          {/* Solution 1: Direct Carlos Login (PRIMARY) */}
          <div className="p-5 rounded-2xl bg-[#11310C] text-[#FAFBF6] space-y-3 shadow-md border border-[#C4C240]/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#C4C240] text-[#11310C]">
                Recomendado • 1 Clique
              </span>
              <span className="text-xs text-[#C4C240] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Sessão Liberada
              </span>
            </div>

            <div>
              <h4 className="font-extrabold text-sm text-[#FAFBF6]">
                Entrar Instantaneamente como Carlos
              </h4>
              <p className="text-xs text-[#FAFBF6]/80 mt-1 font-medium">
                Conecte-se como <strong>carlos@dominus.site</strong> sem passar pelo pop-up do navegador. Libera todas as métricas, planilhas e extratos na hora.
              </p>
            </div>

            <button
              onClick={() => {
                onLoginAsCarlos();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-[#C4C240] hover:bg-[#d6d44a] text-[#11310C] font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Entrar Agora como Carlos (carlos@dominus.site)</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          {/* Solution 2: Custom Google Email option */}
          <div className="p-4 rounded-2xl bg-white border border-[#11310C]/10 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#11310C] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#11310C]/70" />
                Deseja usar outro e-mail do Google?
              </h4>
              <button
                type="button"
                onClick={() => setShowCustomEmailForm(!showCustomEmailForm)}
                className="text-xs font-bold text-[#11310C] hover:underline cursor-pointer"
              >
                {showCustomEmailForm ? 'Ocultar' : 'Informar E-mail'}
              </button>
            </div>

            {showCustomEmailForm && (
              <form onSubmit={handleCustomSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#11310C]/70 mb-1">
                    Seu E-mail Google:
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ex: voce@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAFBF6] border border-[#11310C]/20 text-xs font-medium text-[#11310C] focus:outline-none focus:border-[#11310C]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#11310C]/70 mb-1">
                    Seu Nome (opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Carlos"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAFBF6] border border-[#11310C]/20 text-xs font-medium text-[#11310C] focus:outline-none focus:border-[#11310C]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#11310C] hover:bg-[#1A4713] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Conectar com este E-mail</span>
                </button>
              </form>
            )}
          </div>

          {/* Solution 3: How to authorize domain in Firebase Console (Technical permanent fix) */}
          <div className="p-4 rounded-2xl bg-white border border-[#11310C]/10 space-y-3 shadow-xs">
            <button
              type="button"
              onClick={() => setShowTechnicalSteps(!showTechnicalSteps)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#11310C]">
                  Como autorizar o pop-up nativo no Firebase Console
                </span>
              </div>
              {showTechnicalSteps ? (
                <ChevronUp className="w-4 h-4 text-[#11310C]/60" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#11310C]/60" />
              )}
            </button>

            {showTechnicalSteps && (
              <div className="pt-2 space-y-3 border-t border-[#11310C]/10 text-xs">
                <p className="text-[#11310C]/80 font-medium">
                  Para o botão oficial do Google funcionar sem fechar o pop-up, adicione o domínio do app no Firebase Console:
                </p>

                <div className="p-3 rounded-xl bg-[#11310C]/5 border border-[#11310C]/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#11310C]/60">
                      Domínio Atual para Copiar:
                    </span>
                    <button
                      onClick={handleCopyDomain}
                      className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-[#11310C] text-[#FAFBF6] hover:bg-[#1A4713] transition-all cursor-pointer"
                    >
                      {domainCopied ? (
                        <>
                          <Check className="w-3 h-3 text-[#C4C240]" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <code className="block p-2 rounded bg-white border border-[#11310C]/10 text-[11px] font-mono text-[#11310C] break-all select-all">
                    {currentDomain}
                  </code>
                </div>

                <ol className="list-decimal list-inside space-y-1 text-[#11310C]/80 pl-1 font-medium">
                  <li>Clique em <strong>Copiar</strong> no domínio acima.</li>
                  <li>Acesse as <strong>Configurações de Autenticação do Firebase</strong>.</li>
                  <li>Vá até a aba <strong>Configurações</strong> &gt; <strong>Domínios autorizados</strong>.</li>
                  <li>Clique em <strong>Adicionar domínio</strong> e cole o endereço.</li>
                </ol>

                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={firebaseConsoleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#11310C] hover:bg-[#1A4713] text-[#FAFBF6] font-bold text-xs transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#C4C240]" />
                    <span>Abrir Firebase Console</span>
                  </a>

                  <button
                    onClick={handleOpenNewTab}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-[#11310C] font-bold text-xs transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir App em Nova Aba</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-100 border-t border-[#11310C]/10 flex items-center justify-between">
          <button
            onClick={onRetryGoogleLogin}
            className="text-xs font-bold text-[#11310C] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Tentar pop-up novamente</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-gray-200 border border-[#11310C]/20 text-[#11310C] text-xs font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
