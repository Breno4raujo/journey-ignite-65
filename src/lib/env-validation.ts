/**
 * Validação amigável de variáveis de ambiente.
 *
 * Adicione aqui as variáveis obrigatórias do servidor. Ao iniciar, se alguma
 * estiver faltando, o processo aborta com uma mensagem clara em vez de quebrar
 * em runtime com erros confusos.
 *
 * Exemplo:
 *   { name: "DATABASE_URL", description: "URL de conexão do PostgreSQL",
 *     example: "postgresql://user:pass@localhost:5432/aprenderja" }
 */
export type RequiredEnv = {
  name: string;
  description: string;
  example?: string;
};

export const REQUIRED_ENVS: RequiredEnv[] = [
  // Nenhuma variável obrigatória no momento (app roda com dados mockados).
  // Quando reintroduzir backend, adicione entradas aqui.
];

export function validateEnv(required: RequiredEnv[] = REQUIRED_ENVS): void {
  const missing = required.filter((e) => {
    const v = process.env[e.name];
    return v == null || v.trim() === "";
  });

  if (missing.length === 0) return;

  const lines: string[] = [];
  lines.push("");
  lines.push("==============================================================");
  lines.push("  ❌ Configuração incompleta — variáveis de ambiente faltando");
  lines.push("==============================================================");
  lines.push("");
  lines.push(`Faltam ${missing.length} variável(is) obrigatória(s):`);
  lines.push("");
  for (const e of missing) {
    lines.push(`  • ${e.name}`);
    lines.push(`      ${e.description}`);
    if (e.example) lines.push(`      exemplo: ${e.example}`);
    lines.push("");
  }
  lines.push("Como resolver:");
  lines.push("  1. Copie .env.example para .env (na raiz do projeto)");
  lines.push("  2. Preencha cada variável listada acima");
  lines.push("  3. Reinicie o servidor");
  lines.push("==============================================================");
  lines.push("");

  const message = lines.join("\n");
  // Imprime formatado e lança erro com resumo (para stack traces curtas).
  console.error(message);
  const summary = missing.map((e) => e.name).join(", ");
  throw new Error(`Variáveis de ambiente ausentes: ${summary}`);
}