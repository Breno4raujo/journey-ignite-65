import { prisma } from "@/backend/lib/prisma";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, passwordHash: true, createdAt: true },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, createdAt: true },
    });
  },

  create(data: { name: string; email: string; passwordHash: string }) {
    return prisma.user.create({
      data,
      select: { id: true, name: true, email: true, createdAt: true },
    });
  },
};
