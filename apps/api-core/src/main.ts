import fastify from "fastify";
import staticPlugin from "@fastify/static";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import path from "path";
import crypto from "crypto";
import { renderHTML } from "./render";
import { chargeUsage } from "./usage";

const prisma = new PrismaClient({
  log: ["query", "info", "warn"],
});

const app = fastify();

app.register(cors, {
  origin: "*",
});

app.register(staticPlugin, {
  root: path.join(__dirname, "..", "storage"),
  prefix: "/renders/",
});

app.get("/user/:id", async (request, reply) => {
  const result = await prisma.user.findUnique({
    where: {
      id: Number(request.params.id),
    },
    include: {
      projects: {
        include: {
          templates: true,
          secrets: true,
        },
      },
      usage: true,
    },
  });
  if (!result)
    return reply.status(404).send({
      message: "User not found",
    });
  delete result?.password;
  reply.send(result);
});

app.post("/user", async (request, reply) => {
  type Body = {
    email: string;
    password: string;
    name: string;
  };
  const { email, password, name } = request.body as Body;
  const user = await prisma.user.create({
    data: {
      email,
      password,
      name,
    },
  });

  const usage = await prisma.usage.create({
    data: {
      userId: user.id,
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "Default project",
      description: "Default project",
      ownerId: user.id,
      usageId: usage.id,
    },
  });

  await prisma.secret.create({
    data: {
      userId: user.id,
      projectId: project.id,
      value: crypto
        .randomBytes(160 / 8)
        .toString("base64")
        .replace(/=/g, ""),
      name: "Project API secret",
    },
  });

  await chargeUsage(user.id, {
    project: 1,
  });
  // @ts-expect-error
  delete user?.password;
  reply.send(user);
});

app.post("/project", async (request, reply) => {
  type Body = {
    userId: number;
    name: string;
    description: string;
  };

  const { name, description, userId } = request.body as Body;

  const usage = await prisma.usage.findFirst({
    where: {
      userId: userId,
    },
  });
  if (!usage) return reply.status(500).send({ message: "internal error!" });

  const project = await prisma.project.create({
    data: {
      name,
      description,
      ownerId: userId,
      usageId: usage.id,
    },
  });

  await prisma.secret.create({
    data: {
      userId: userId,
      projectId: project.id,
      value: crypto
        .randomBytes(160 / 8)
        .toString("base64")
        .replace(/=/g, ""),
      name: "Project API secret",
    },
  });

  await chargeUsage(userId, {
    project: 1,
  });

  reply.send(project);
});

app.get("/template", async (request, reply) => {
  const result = await prisma.template.findMany();
  reply.send(result);
});

app.get("/template/:id", async (request, reply) => {
  const result = await prisma.template.findUnique({
    where: {
      id: Number(request.params.id),
    },
  });
  if (!result)
    return reply.status(404).send({
      message: "Template not found",
    });
  reply.send(result);
});

app.put("/template/:id", async (request, reply) => {
  type Body = {
    name: string;
    description: string;
    content: string;
    fields: string;
  };
  const { name, description, content, fields } = request.body as Body;

  const result = await prisma.template.update({
    where: {
      id: Number(request.params.id),
    },
    data: {
      name,
      description,
      content,
      fields,
    },
  });
  reply.send(result);
});

app.post("/template", async (request, reply) => {
  type Body = {
    name: string;
    description: string;
    content: string;
    fields: string;
    projectId: number;
  };
  const { name, description, content, fields, projectId } =
    request.body as Body;

  const result = await prisma.template.create({
    data: {
      name,
      description,
      content,
      fields,
      projectId,
    },
  });
  await chargeUsage(projectId, { template: 1 });
  reply.send(result);
});

app.post("/render", async (request, reply) => {
  type Body = {
    templateId: number;
    secretId: string;
    secretValue: string;
    fileType: string;
    values: string;
  };
  const { templateId, fileType, secretId, secretValue, values } =
    request.body as Body;

  const secret = await prisma.secret.findFirst({
    where: {
      id: secretId,
      value: secretValue,
    },
  });

  if (!secret) {
    return reply.status(401).send({
      message: "Unauthorized",
    });
  }

  const template = await prisma.template.findFirst({
    where: {
      id: Number(templateId),
      projectId: secret.projectId,
    },
  });

  if (!template)
    return reply.status(404).send({
      message: "Template not found",
    });

  if (fileType === "pdf") {
    const render = await renderHTML(template.content);
    const result = await prisma.render.create({
      data: {
        templateId: template.id,
        projectId: secret.projectId,
        type: fileType,
        values,
        fileName: render.fileName,
      },
    });
    await chargeUsage(secret.userId, { render: 1, storage: render.fileSize });
    return reply.send(result);
  }
});

app
  .listen({
    port: 8000,
  })
  .then(() => {
    console.log("Server started at http://localhost:8000");
  });
