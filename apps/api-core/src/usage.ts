import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type Charge = {
  render?: number;
  template?: number;
  request?: number;
  storage?: number;
  project?: number;
};

export const chargeUsage = async (userId: number, charge: Charge) => {
  const usage = await prisma.usage.findFirst({
    where: {
      id: userId,
    },
  });

  if (!usage) {
    throw new Error("Internal server error");
  }
  const data: Prisma.UsageUpdateInput = {};

  if (charge.render) {
    data.renders = usage.renders + charge.render;
  }
  if (charge.template) {
    data.templates = usage.templates + charge.template;
  }
  if (charge.request) {
    data.requests = usage.requests + charge.request;
  }
  if (charge.storage) {
    data.storage = usage.storage + charge.storage;
  }
  if (charge.project) {
    data.projects = usage.projects + charge.project;
  }

  await prisma.usage.update({
    where: {
      id: userId,
    },
    data,
  });
};
