import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import argon2 from "argon2";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://beautyflow:beautyflow@localhost:5432/beautyflow?schema=public";
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.env.SEED_USER_EMAIL ?? "owner@example.com").trim().toLowerCase();
  const password = process.env.SEED_USER_PASSWORD ?? "beautyflow-local-password";
  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: "Profissional BeautyFlow", passwordHash, emailVerifiedAt: new Date() },
    create: {
      name: "Profissional BeautyFlow",
      email,
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: "beautyflow-demo" },
    update: { name: "BeautyFlow Demo", archivedAt: null },
    create: {
      name: "BeautyFlow Demo",
      slug: "beautyflow-demo",
      currencyCode: "BRL",
      timezone: "America/Sao_Paulo",
    },
  });

  const member = await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
    update: { active: true, role: "OWNER" },
    create: { organizationId: organization.id, userId: user.id, role: "OWNER" },
  });

  const service = await prisma.service.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      organizationId: organization.id,
      name: "Maquiagem social",
      description: "Produção completa para eventos e ocasiões especiais.",
      durationMinutes: 90,
      priceCents: 18000,
    },
  });

  const client = await prisma.client.upsert({
    where: { id: "00000000-0000-4000-8000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000002",
      organizationId: organization.id,
      name: "Ana Souza",
      phone: "(11) 99999-0000",
      email: "ana@example.com",
    },
  });

  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 1);
  startsAt.setHours(10, 0, 0, 0);
  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);

  const appointment = await prisma.appointment.upsert({
    where: { id: "00000000-0000-4000-8000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000003",
      organizationId: organization.id,
      memberId: member.id,
      clientId: client.id,
      serviceId: service.id,
      startsAt,
      endsAt,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      status: "CONFIRMED",
    },
  });

  await prisma.payment.upsert({
    where: { id: "00000000-0000-4000-8000-000000000004" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000004",
      organizationId: organization.id,
      appointmentId: appointment.id,
      type: "DEPOSIT",
      amountCents: 5000,
      method: "PIX",
      receivedAt: new Date(),
    },
  });

  await prisma.expense.upsert({
    where: { id: "00000000-0000-4000-8000-000000000005" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000005",
      organizationId: organization.id,
      description: "Reposição de pincéis",
      category: "Materiais",
      amountCents: 8500,
      expenseDate: new Date(),
      status: "PAID",
      paidAt: new Date(),
      method: "CARD",
    },
  });

  console.log(`Seed concluído para ${email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
