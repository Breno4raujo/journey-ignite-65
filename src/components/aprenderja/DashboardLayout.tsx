import { GraduationCap, Sparkles, LogOut } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  userName: string;
  children: ReactNode;
}

export function DashboardLayout({ userName, children }: Props) {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/70 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-soft">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-semibold tracking-tight">AprenderJá</p>
              <p className="text-xs text-muted-foreground">Sua nova carreira, no seu ritmo</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-muted-foreground hidden sm:inline">Olá,</span>
            <span className="font-medium">{userName}</span>
            <button
              onClick={handleLogout}
              className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">{children}</main>
      <footer className="mx-auto max-w-5xl px-4 sm:px-6 py-10 text-center text-xs text-muted-foreground">
        Feito com cuidado para quem está recomeçando. Você não está sozinho(a).
      </footer>
    </div>
  );
}