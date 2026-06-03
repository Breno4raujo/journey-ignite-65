import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const course = {
  title: "Fundamentos de Análise de Dados",
  description:
    "Uma jornada prática para você dominar planilhas, SQL e visualização — no seu ritmo.",
  totalModules: 6,
  modules: [
    { order: 1, title: "Boas-vindas e Mentalidade Digital", totalLessons: 6 },
    { order: 2, title: "Planilhas do Zero ao Avançado", totalLessons: 10 },
    { order: 3, title: "Pensamento Analítico na Prática", totalLessons: 8 },
    { order: 4, title: "SQL para Quem Nunca Programou", totalLessons: 12 },
    { order: 5, title: "Visualização e Storytelling com Dados", totalLessons: 9 },
    { order: 6, title: "Projeto Final e Portfólio", totalLessons: 5 },
  ],
};

async function main() {
  const existing = await prisma.course.findFirst({
    where: { title: course.title },
  });

  if (existing) {
    console.log("Seed já aplicado — curso existente:", existing.title);
    return;
  }

  await prisma.course.create({
    data: {
      title: course.title,
      description: course.description,
      totalModules: course.totalModules,
      modules: {
        create: course.modules,
      },
    },
  });

  console.log("Seed concluído: curso inicial criado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
