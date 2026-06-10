import { useState } from "react";
import { CheckCircle2, Circle, PlayCircle, Award, Pencil, Trash2 } from "lucide-react";
import type { Module, ModuleProgressView } from "@/lib/aprenderja/types";

interface Props {
  modules: ModuleProgressView[];
  onAdvance: (moduleId: string) => void;
  onEdit: (
    moduleId: string,
    patch: { title: string; totalLessons: number; lessons: string[] },
  ) => void;
  onDelete: (moduleId: string) => void;
}

interface EditingModule {
  id: string;
  title: string;
  totalLessons: number;
  lessonsText: string;
}

function toEditingModule(module: Module): EditingModule {
  return {
    id: module.id,
    title: module.title,
    totalLessons: module.totalLessons,
    lessonsText: (module.lessons ?? []).join("\n"),
  };
}

export function ModuleList({ modules, onAdvance, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState<EditingModule | null>(null);

  function handleSaveEdit() {
    if (!editing) return;
    onEdit(editing.id, {
      title: editing.title,
      totalLessons: editing.totalLessons,
      lessons: editing.lessonsText
        .split("\n")
        .map((lesson) => lesson.trim())
        .filter(Boolean),
    });
    setEditing(null);
  }

  function handleDelete(module: Module) {
    const confirmed = window.confirm(`Excluir o módulo "${module.title}"?`);
    if (confirmed) onDelete(module.id);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-lg font-semibold tracking-tight">Seus módulos</h2>
        <p className="text-xs text-muted-foreground">
          {modules.filter((m) => m.isCompleted).length} de {modules.length} concluídos
        </p>
      </div>

      <ul className="space-y-3">
        {modules.map((m) => {
          const isEditing = editing?.id === m.module.id;
          return (
            <li
              key={m.module.id}
              className={`rounded-2xl border bg-card p-4 sm:p-5 shadow-soft transition-all duration-300 ${
                m.isCompleted
                  ? "border-accent/40 bg-accent-soft/40"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                <div
                  className={`h-10 w-10 shrink-0 rounded-xl grid place-items-center transition-colors ${
                    m.isCompleted
                      ? "bg-accent text-accent-foreground"
                      : m.completedLessons > 0
                        ? "bg-primary-soft text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {m.isCompleted ? (
                    <Award className="h-5 w-5" />
                  ) : m.completedLessons > 0 ? (
                    <PlayCircle className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">
                      <span className="text-muted-foreground mr-2">
                        {String(m.module.order).padStart(2, "0")}
                      </span>
                      {m.module.title}
                    </p>
                    {m.isCompleted && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                        <CheckCircle2 className="h-3 w-3" /> Conquistado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.completedLessons} de {m.module.totalLessons} lições · {m.percent}%
                  </p>
                </div>
                {!m.isCompleted && (
                  <button
                    onClick={() => onAdvance(m.module.id)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition shrink-0"
                  >
                    {m.completedLessons === 0 ? "Começar" : "Avançar"}
                  </button>
                )}
                <div className="flex items-center gap-1 shrink-0 sm:ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditing(isEditing ? null : toEditingModule(m.module))}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition inline-flex items-center gap-1"
                  >
                    <Pencil className="h-3 w-3" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.module)}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-full border border-border text-muted-foreground hover:text-destructive hover:bg-muted transition inline-flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> Excluir
                  </button>
                </div>
              </div>

              <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                    m.isCompleted ? "bg-accent" : "bg-gradient-primary"
                  }`}
                  style={{ width: `${m.percent}%` }}
                />
              </div>

              {isEditing && editing && (
                <div className="mt-4 rounded-xl border border-dashed border-border bg-background/60 p-4 space-y-3">
                  <div className="grid sm:grid-cols-[1fr,120px] gap-3">
                    <label className="block">
                      <span className="text-xs font-medium text-muted-foreground">
                        Nome do módulo
                      </span>
                      <input
                        type="text"
                        value={editing.title}
                        onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                        className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-muted-foreground">Itens</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={editing.totalLessons}
                        onChange={(event) =>
                          setEditing({ ...editing, totalLessons: Number(event.target.value) })
                        }
                        className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">
                      Conteúdos do checklist
                    </span>
                    <textarea
                      value={editing.lessonsText}
                      onChange={(event) =>
                        setEditing({ ...editing, lessonsText: event.target.value })
                      }
                      rows={4}
                      className="mt-1 w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </label>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="text-xs px-3 py-2 rounded-lg border border-border hover:bg-background"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="text-xs font-medium px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
                    >
                      Salvar módulo
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
