import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/frontend/context/AuthContext";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — AprenderJá" },
      { name: "description", content: "Acesse sua conta e continue sua jornada de aprendizado." },
    ],
  }),
});

type Tab = "login" | "register";

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, login, register } = useAuth();
  const [tab, setTab] = useState<Tab>("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const err = await login(loginEmail, loginPassword);
      if (err) {
        setLoginError(err);
        return;
      }
      navigate({ to: "/" });
    } catch {
      setLoginError("Erro de conexão. Tente novamente.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegLoading(true);
    try {
      const err = await register(regName, regEmail, regPassword);
      if (err) {
        setRegError(err);
        return;
      }
      navigate({ to: "/" });
    } catch {
      setRegError("Erro de conexão. Tente novamente.");
    } finally {
      setRegLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-11 w-11 rounded-2xl bg-gradient-primary grid place-items-center shadow-soft">
          <GraduationCap className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <p className="text-xl font-semibold tracking-tight text-foreground">AprenderJá</p>
          <p className="text-xs text-muted-foreground">Sua nova carreira, no seu ritmo</p>
        </div>
      </div>

      <div className="w-full max-w-md bg-card rounded-2xl shadow-soft border border-border p-6 sm:p-8">
        <div className="flex rounded-xl bg-muted p-1 mb-6" role="tablist" aria-label="Autenticação">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "login"}
            onClick={() => {
              setTab("login");
              setLoginError(null);
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              tab === "login"
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "register"}
            onClick={() => {
              setTab("register");
              setRegError(null);
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              tab === "register"
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Criar conta
          </button>
        </div>

        {tab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4" aria-label="Formulário de login">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1.5">
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-1.5">
                Senha
              </label>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>

            {loginError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3.5 py-2.5" role="alert">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold shadow-soft hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60 cursor-pointer"
            >
              {loginLoading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        )}

        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-4" aria-label="Formulário de registro">
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-foreground mb-1.5">
                Nome
              </label>
              <input
                id="reg-name"
                type="text"
                required
                autoComplete="name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Seu nome"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-foreground mb-1.5">
                E-mail
              </label>
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-foreground mb-1.5">
                Senha
              </label>
              <input
                id="reg-password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>

            {regError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3.5 py-2.5" role="alert">
                {regError}
              </p>
            )}

            <button
              type="submit"
              disabled={regLoading}
              className="w-full bg-gradient-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold shadow-soft hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60 cursor-pointer"
            >
              {regLoading ? "Criando conta…" : "Criar conta"}
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground text-center max-w-sm">
        Feito com cuidado para quem está recomeçando. Você não está sozinho(a).
      </p>
    </div>
  );
}
