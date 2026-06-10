import type { Course, Module, User, UserProgress } from "./types";

export const mockUser: User = {
  id: "u1",
  name: "Breno",
  email: "breno@example.com",
  createdAt: new Date("2025-03-01"),
};

export const mockCourse: Course = {
  id: "c1",
  title: "Fundamentos de Análise de Dados",
  description:
    "Uma jornada prática para você dominar planilhas, SQL e visualização — no seu ritmo.",
  totalModules: 6,
};

export const mockModules: Module[] = [
  {
    id: "m1",
    courseId: "c1",
    order: 1,
    title: "Boas-vindas e Mentalidade Digital",
    totalLessons: 6,
    lessons: [
      "Conhecer a jornada de análise de dados",
      "Mapear objetivos profissionais",
      "Organizar rotina de estudos",
      "Entender ferramentas digitais essenciais",
      "Criar ambiente de prática",
      "Definir primeiro compromisso semanal",
    ],
  },
  {
    id: "m2",
    courseId: "c1",
    order: 2,
    title: "Planilhas do Zero ao Avançado",
    totalLessons: 10,
    lessons: [
      "Criar e formatar planilhas",
      "Organizar tabelas de dados",
      "Usar fórmulas básicas",
      "Aplicar funções condicionais",
      "Trabalhar com filtros e ordenação",
      "Construir tabelas dinâmicas",
      "Validar entradas de dados",
      "Criar gráficos simples",
      "Automatizar conferências básicas",
      "Preparar uma planilha de análise",
    ],
  },
  {
    id: "m3",
    courseId: "c1",
    order: 3,
    title: "Pensamento Analítico na Prática",
    totalLessons: 8,
    lessons: [
      "Transformar perguntas em hipóteses",
      "Identificar métricas importantes",
      "Separar dados úteis de ruído",
      "Comparar períodos e categorias",
      "Encontrar padrões e exceções",
      "Interpretar causas possíveis",
      "Comunicar descobertas com clareza",
      "Montar uma análise guiada",
    ],
  },
  {
    id: "m4",
    courseId: "c1",
    order: 4,
    title: "SQL para Quem Nunca Programou",
    totalLessons: 12,
    lessons: [
      "Entender tabelas e bancos de dados",
      "Consultar dados com SELECT",
      "Filtrar resultados com WHERE",
      "Ordenar dados com ORDER BY",
      "Agrupar informações com GROUP BY",
      "Calcular métricas com funções agregadas",
      "Relacionar tabelas com JOIN",
      "Usar aliases para clareza",
      "Combinar filtros e agrupamentos",
      "Ler erros comuns de consulta",
      "Criar consultas para perguntas reais",
      "Revisar boas práticas de SQL",
    ],
  },
  {
    id: "m5",
    courseId: "c1",
    order: 5,
    title: "Visualização e Storytelling com Dados",
    totalLessons: 9,
    lessons: [
      "Escolher o gráfico certo",
      "Evitar distorções visuais",
      "Destacar informação principal",
      "Criar comparações legíveis",
      "Montar painéis simples",
      "Usar cores com propósito",
      "Construir narrativa com dados",
      "Apresentar insights para decisão",
      "Revisar uma visualização final",
    ],
  },
  {
    id: "m6",
    courseId: "c1",
    order: 6,
    title: "Projeto Final e Portfólio",
    totalLessons: 5,
    lessons: [
      "Escolher problema de negócio",
      "Preparar base de dados",
      "Analisar e documentar descobertas",
      "Criar apresentação final",
      "Publicar projeto no portfólio",
    ],
  },
];

const day = (d: number) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date;
};

export const initialProgress: UserProgress[] = [
  {
    id: "p1",
    userId: "u1",
    moduleId: "m1",
    completedLessons: 6,
    lastAccessedAt: day(28),
    completedAt: day(21),
  },
  {
    id: "p2",
    userId: "u1",
    moduleId: "m2",
    completedLessons: 10,
    lastAccessedAt: day(20),
    completedAt: day(10),
  },
  {
    id: "p3",
    userId: "u1",
    moduleId: "m3",
    completedLessons: 5,
    lastAccessedAt: day(3),
    completedAt: null,
  },
  {
    id: "p4",
    userId: "u1",
    moduleId: "m4",
    completedLessons: 0,
    lastAccessedAt: null,
    completedAt: null,
  },
  {
    id: "p5",
    userId: "u1",
    moduleId: "m5",
    completedLessons: 0,
    lastAccessedAt: null,
    completedAt: null,
  },
  {
    id: "p6",
    userId: "u1",
    moduleId: "m6",
    completedLessons: 0,
    lastAccessedAt: null,
    completedAt: null,
  },
];
