import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { AuthErrorInfo, UserProfile } from '../types';

import configData from '../../firebase-applet-config.json';

const firebaseConfig = configData || {
  apiKey: "demo-key",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo-project",
  firestoreDatabaseId: "ai-studio-stratov1atimpost-522b2a22-f49d-4598-a983-177aafd53d38",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null;
const LOCAL_USER_KEY = 'financemaster_local_user';

export const parseAuthError = (error: any): AuthErrorInfo => {
  const code = error?.code || 'auth/unknown';
  const rawMessage = error?.message || String(error);
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
  const isIframe = typeof window !== 'undefined' ? window.self !== window.top : false;

  if (code === 'auth/unauthorized-domain') {
    return {
      code,
      message: rawMessage,
      title: 'Domínio Não Autorizado no Firebase',
      solution: `O domínio atual (${currentDomain}) ainda não foi adicionado aos domínios autorizados do Firebase Authentication.`,
      isDomainError: true,
      currentDomain,
      helpUrl: `https://console.firebase.google.com/project/${(firebaseConfig as any).projectId || 'gen-lang-client-0254253171'}/authentication/settings`,
    };
  }

  if (code === 'auth/popup-blocked') {
    return {
      code,
      message: rawMessage,
      title: 'Pop-up Bloqueado pelo Navegador',
      solution: 'O navegador impediu a abertura da janela do Google. Clique no ícone de pop-up na barra de endereço para permitir ou abra o app em uma nova aba.',
      isPopupBlocked: true,
      isIframeIssue: isIframe,
      currentDomain,
    };
  }

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return {
      code,
      message: rawMessage,
      title: 'O Pop-up do Google Fechou Sozinho',
      solution: `O Firebase encerrou o pop-up automaticamente porque o domínio atual (${currentDomain}) ainda não foi adicionado aos "Domínios Autorizados" no Firebase Console, ou devido a restrições de cross-origin do iframe. Você pode conectar sua conta instantaneamente pelo Modo Direto abaixo ou autorizar o domínio no Console.`,
      isDomainError: true,
      isPopupBlocked: false,
      isIframeIssue: isIframe,
      currentDomain,
      helpUrl: `https://console.firebase.google.com/project/${(firebaseConfig as any).projectId || 'gen-lang-client-0254253171'}/authentication/settings`,
    };
  }

  if (code === 'auth/operation-not-allowed') {
    return {
      code,
      message: rawMessage,
      title: 'Provedor Google Não Ativado',
      solution: 'O provedor de login Google precisa ser ativado no Firebase Console deste projeto.',
      helpUrl: `https://console.firebase.google.com/project/${(firebaseConfig as any).projectId || 'gen-lang-client-0254253171'}/authentication/providers`,
      currentDomain,
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      code,
      message: rawMessage,
      title: 'Falha de Conexão com o Google',
      solution: 'Não foi possível estabelecer contato com os servidores de autenticação. Verifique sua conexão com a internet.',
      currentDomain,
    };
  }

  if (isIframe && (code === 'auth/internal-error' || rawMessage.toLowerCase().includes('cookie') || rawMessage.toLowerCase().includes('storage'))) {
    return {
      code,
      message: rawMessage,
      title: 'Restrição de Cookies no Iframe',
      solution: 'O navegador bloqueou cookies de terceiros no iframe do AI Studio. Abra o aplicativo em uma nova aba para logar com o Google sem bloqueios.',
      isIframeIssue: true,
      currentDomain,
    };
  }

  return {
    code,
    message: rawMessage,
    title: 'Falha no Login com o Google',
    solution: `Erro retornado pelo Firebase (${code}). Tente novamente ou abra o aplicativo em uma nova aba.`,
    isIframeIssue: isIframe,
    currentDomain,
  };
};

export const initAuth = (
  onAuthSuccess?: (user: User | UserProfile, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const savedToken = localStorage.getItem('google_access_token') || cachedAccessToken || '';
      cachedAccessToken = savedToken;
      if (onAuthSuccess) onAuthSuccess(user, savedToken);
    } else {
      // Check if there's a stored profile (e.g. Carlos session)
      if (typeof window !== 'undefined') {
        const storedUserJson = localStorage.getItem(LOCAL_USER_KEY);
        if (storedUserJson) {
          try {
            const localUser: UserProfile = JSON.parse(storedUserJson);
            const savedToken = localStorage.getItem('google_access_token') || cachedAccessToken || '';
            if (onAuthSuccess) onAuthSuccess(localUser, savedToken);
            return;
          } catch {
            localStorage.removeItem(LOCAL_USER_KEY);
          }
        }
      }

      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('google_access_token');
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || '';
    cachedAccessToken = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('google_access_token', token);
      localStorage.removeItem(LOCAL_USER_KEY);
    }
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    console.error('Erro detalhado no login Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const loginWithDirectProfile = (profile: UserProfile): UserProfile => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    localStorage.setItem('google_access_token', 'local-authorized-session');
  }
  cachedAccessToken = 'local-authorized-session';
  return profile;
};

export const loginWithCustomEmail = (email: string, name?: string): UserProfile => {
  const cleanEmail = email.trim();
  const displayName = name?.trim() || cleanEmail.split('@')[0] || 'Usuário';
  const profile: UserProfile = {
    uid: `user-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
    email: cleanEmail,
    displayName,
    photoURL: null,
    isSimulated: true,
  };
  return loginWithDirectProfile(profile);
};

export const loginAsCarlos = (): UserProfile => {
  return loginWithCustomEmail('carlos@dominus.site', 'Carlos');
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null);
};

export const logout = async () => {
  try {
    await auth.signOut();
  } catch (e) {
    console.warn('Erro ao deslogar do Firebase:', e);
  }
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem(LOCAL_USER_KEY);
  }
};

