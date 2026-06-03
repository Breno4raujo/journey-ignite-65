import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USERS_KEY = "aprenderja:users";
const SESSION_KEY = "aprenderja:session";

type StoredUser = AuthUser & { password: string };

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null");
  } catch {
    return null;
  }
}

function writeSession(user: AuthUser | null) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const me = readSession();
    setUser(me);
    return !!me;
  }, []);

  useEffect(() => {
    setUser(readSession());
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    const users = readUsers();
    const found = users.find((u) => u.email.toLowerCase() === normalized);
    if (!found) return "E-mail não cadastrado.";
    if (found.password !== password) return "Senha incorreta.";
    const session: AuthUser = {
      id: found.id,
      name: found.name,
      email: found.email,
      createdAt: found.createdAt,
    };
    writeSession(session);
    setUser(session);
    return null;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    if (!name.trim()) return "Informe seu nome.";
    if (!normalized) return "Informe um e-mail válido.";
    if (password.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
    const users = readUsers();
    if (users.some((u) => u.email.toLowerCase() === normalized)) {
      return "Já existe uma conta com este e-mail.";
    }
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalized,
      createdAt: new Date().toISOString(),
      password,
    };
    writeUsers([...users, newUser]);
    const session: AuthUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };
    writeSession(session);
    setUser(session);
    return null;
  }, []);

  const logout = useCallback(async () => {
    writeSession(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshSession }),
    [user, loading, login, register, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
