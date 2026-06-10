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

// Chaves do localStorage
const TOKEN_KEY = "token";
const SESSION_KEY = "aprenderja:session";
const USERS_KEY = "aprenderja:users";

type StoredUser = AuthUser & { password: string };

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const token = getToken();

    // Tenta via API
    if (token) {
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          writeSession(data.user);
          return true;
        }
      } catch {
        // API indisponível — tenta sessão local
      }
    }

    // Fallback: sessão salva no localStorage
    const session = readSession();
    if (session) {
      setUser(session);
      return true;
    }

    setUser(null);
    setToken(null);
    return false;
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setLoading(false));
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    // Tenta via API
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        writeSession(data.user);
        return null;
      }
    } catch {
      // API indisponível — usa fallback local
    }

    // Fallback local
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
    // Tenta via API
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        writeSession(data.user);
        return null;
      }
      const data = await res.json();
      return data.error ?? "Erro ao criar conta.";
    } catch {
      // API indisponível — usa fallback local
    }

    // Fallback local
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
    setToken(null);
    writeSession(null);
    setUser(null);
    window.location.href = "/login";
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