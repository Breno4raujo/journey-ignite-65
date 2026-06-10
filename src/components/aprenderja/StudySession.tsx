import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  StickyNote,
  Timer,
} from "lucide-react";
import type {
  Course,
  ModuleProgressView,
  StudySession as StudySessionState,
} from "@/lib/aprenderja/types";

interface Props {
  course: Course;
  moduleView: ModuleProgressView;
  session: StudySessionState;
  onBack: () => void;
  onToggleLesson: (moduleId: string, lessonNumber: number, checked: boolean) => void;
  onUpdateSession: (sessionId: string, patch: Partial<StudySessionState>) => void;
  onRecordStudyTime: (moduleId: string, seconds: number) => void;
}

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function StudySession({
  course,
  moduleView,
  session,
  onBack,
  onToggleLesson,
  onUpdateSession,
  onRecordStudyTime,
}: Props) {
  const [running, setRunning] = useState(false);
  const checklistItems = useMemo(
    () =>
      Array.from({ length: moduleView.module.totalLessons }, (_, i) => ({
        lessonNumber: i + 1,
        title:
          moduleView.module.lessons?.[i]?.trim() || `${moduleView.module.title} - parte ${i + 1}`,
      })),
    [moduleView.module.lessons, moduleView.module.title, moduleView.module.totalLessons],
  );
  const nextLesson = Math.min(moduleView.module.totalLessons, moduleView.completedLessons + 1);

  useEffect(() => {
    if (!running) return;
    if (session.remainingSeconds <= 0) {
      setRunning(false);
      return;
    }

    const timerId = window.setInterval(() => {
      onUpdateSession(session.id, {
        remainingSeconds: Math.max(0, session.remainingSeconds - 1),
      });
      onRecordStudyTime(session.moduleId, 1);
      if (session.remainingSeconds <= 1) setRunning(false);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [
    running,
    session.id,
    session.moduleId,
    session.remainingSeconds,
    onRecordStudyTime,
    onUpdateSession,
  ]);

  function toggleTimer() {
    if (session.remainingSeconds <= 0) {
      onUpdateSession(session.id, { remainingSeconds: session.durationMinutes * 60 });
    }
    setRunning((value) => !value);
  }

  function adjustMinutes(delta: number) {
    const nextDuration = Math.max(1, Math.min(120, session.durationMinutes + delta));
    const deltaSeconds = (nextDuration - session.durationMinutes) * 60;
    onUpdateSession(session.id, {
      durationMinutes: nextDuration,
      remainingSeconds: Math.max(0, session.remainingSeconds + deltaSeconds),
    });
  }

  function resetTimer() {
    setRunning(false);
    onUpdateSession(session.id, { remainingSeconds: session.durationMinutes * 60 });
  }

  function handleBack() {
    setRunning(false);
    onBack();
  }

  return (
    <section className="space-y-5">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar aos meus cursos
      </button>

      <div className="rounded-3xl bg-card border border-border shadow-soft overflow-hidden">
        <div className="bg-gradient-primary px-6 sm:px-8 py-6 text-primary-foreground">
          <p className="text-xs uppercase tracking-wider opacity-80">Sessão de estudos</p>
          <h1 className="text-xl sm:text-2xl font-semibold mt-1">{course.title}</h1>
          <p className="text-sm opacity-90 mt-1 max-w-xl">{moduleView.module.title}</p>
        </div>

        <div className="px-6 sm:px-8 py-6 grid lg:grid-cols-[1.1fr,0.9fr] gap-6">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Checklist do módulo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Próximo ponto salvo:{" "}
                    {moduleView.module.lessons?.[nextLesson - 1] ?? moduleView.module.title}
                  </p>
                </div>
                <span className="text-xs font-medium tabular-nums text-primary">
                  {moduleView.completedLessons}/{moduleView.module.totalLessons}
                </span>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-primary transition-[width] duration-700 ease-out"
                  style={{ width: `${moduleView.percent}%` }}
                />
              </div>
            </div>

            <ul className="space-y-2">
              {checklistItems.map(({ lessonNumber, title }) => {
                const checked = lessonNumber <= moduleView.completedLessons;
                return (
                  <li key={lessonNumber}>
                    <button
                      type="button"
                      onClick={() => onToggleLesson(moduleView.module.id, lessonNumber, !checked)}
                      className={`w-full rounded-xl border p-3 text-left flex items-center gap-3 transition ${
                        checked
                          ? "border-accent/40 bg-accent-soft/50"
                          : "border-border bg-background/60 hover:border-primary/30"
                      }`}
                    >
                      <span
                        className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${
                          checked
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {checked ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{title}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {checked ? "Concluído e salvo" : "Pendente neste módulo"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-background/60 p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary grid place-items-center">
                  <Timer className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Pomodoro</p>
                  <p className="text-xs text-muted-foreground">
                    {session.durationMinutes} min planejados
                  </p>
                </div>
              </div>

              <div className="mt-5 text-center">
                <p className="text-5xl font-bold tabular-nums tracking-tight">
                  {formatTime(session.remainingSeconds)}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustMinutes(-5)}
                    className="h-9 w-9 rounded-full border border-border grid place-items-center hover:bg-muted transition"
                    aria-label="Reduzir tempo"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleTimer}
                    className="h-11 px-4 rounded-full bg-primary text-primary-foreground inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-90 transition"
                  >
                    {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {running ? "Pausar" : "Iniciar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustMinutes(5)}
                    className="h-9 w-9 rounded-full border border-border grid place-items-center hover:bg-muted transition"
                    aria-label="Aumentar tempo"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={resetTimer}
                    className="h-9 w-9 rounded-full border border-border grid place-items-center hover:bg-muted transition"
                    aria-label="Reiniciar pomodoro"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <label className="block rounded-2xl border border-border bg-background/60 p-5">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <StickyNote className="h-4 w-4 text-primary" /> Anotações
              </span>
              <textarea
                value={session.notes}
                onChange={(event) => onUpdateSession(session.id, { notes: event.target.value })}
                rows={8}
                className="mt-3 w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Registre dúvidas, ideias e próximos passos deste módulo."
              />
              <span className="mt-2 block text-[11px] text-muted-foreground">
                Salvo automaticamente nesta sessão.
              </span>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
