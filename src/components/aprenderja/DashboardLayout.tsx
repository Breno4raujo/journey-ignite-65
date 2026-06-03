import { GraduationCap, LogOut, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/frontend/context/AuthContext";

interface Props {
  userName: string;
  children: ReactNode;
  loading?: boolean;
}

export function DashboardLayout({ userName, children, loading }: Props) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/70 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-primary grid place-items-center shadow-soft">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-base font-semibold tracking-tight truncate">AprenderJá</p>
              <p className="text-xs text-muted-foreground hidden xs:block truncate">
                Sua nova carreira, no seu ritmo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-sm shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="h-4 w-4 text-accent hidden sm:block" />
              <span className="text-muted-foreground hidden md:inline">Olá,</span>
              <span className="font-medium truncate max-w-[120px] sm:max-w-none">{userName}</span>
            </div>
            {!loading && (
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  window.location.href = "/login";
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                aria-label="Sair da conta"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">{children}</main>
      <footer className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10 text-center text-xs text-muted-foreground">
        Feito com cuidado para quem está recomeçando. Você não está sozinho(a).
      </footer>
    </div>
  );
}
