import { PrismaClient } from "@prisma/client";
import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.middleware";
import { logDebug, logError, logExecutionTime, logInfo } from "../utils/logger";

const prisma = new PrismaClient();

// Schema de validação para criação de tarefas
const createTaskSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA"]),
  status: z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDO"]),
});

// Schema de validação para atualização de tarefas
const updateTaskSchema = z.object({
  title: z
    .string()
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .optional(),
  description: z.string().optional(),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA"]).optional(),
  status: z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDO"]).optional(),
});

// Obter todas as tarefas do usuário
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  const startTime = process.hrtime();
  const userId = (req as AuthRequest).user?.id;

  logInfo(
    "Buscando tarefas do usuário",
    {
      query: req.query,
      userId,
    },
    userId
  );

  try {
    // Parâmetros de filtro
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;

    // Construir filtro
    const filter: any = {
      userId,
    };

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    const tasks = await prisma.task.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
    });

    logInfo(
      `Encontradas ${tasks.length} tarefas`,
      {
        filters: { status, priority },
      },
      userId
    );
    logExecutionTime(startTime, "Busca de tarefas", userId);

    res.status(200).json(tasks);
  } catch (error) {
    logError("Erro ao buscar tarefas", error, userId);
    res.status(500).json({ error: "Erro ao processar a solicitação" });
  }
};

// Obter uma tarefa específica
export const getTaskById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const startTime = process.hrtime();
  const { id } = req.params;
  const userId = (req as AuthRequest).user?.id;

  logInfo("Buscando tarefa por ID", { taskId: id }, userId);

  try {
    const task = await prisma.task.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!task) {
      logDebug("Tarefa não encontrada", { taskId: id }, userId);
      res.status(404).json({ error: "Tarefa não encontrada" });
      return;
    }

    logInfo("Tarefa encontrada", { taskId: id }, userId);
    logExecutionTime(startTime, "Busca de tarefa por ID", userId);

    res.status(200).json(task);
  } catch (error) {
    logError("Erro ao buscar tarefa", { error, taskId: id }, userId);
    res.status(500).json({ error: "Erro ao processar a solicitação" });
  }
};

// Criar uma nova tarefa
export const createTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  const startTime = process.hrtime();
  const userId = (req as AuthRequest).user?.id;

  logInfo("Criando nova tarefa", { body: req.body }, userId);

  try {
    // Validar dados de entrada
    const result = createTaskSchema.safeParse(req.body);
    if (!result.success) {
      logDebug(
        "Dados de tarefa inválidos",
        { errors: result.error.format() },
        userId
      );
      res.status(400).json({
        error: "Dados inválidos",
        details: result.error.format(),
      });
      return;
    }

    const { title, description, priority, status } = result.data;

    const task = await prisma.task.create({
      data: {
        title,
        description: description || "",
        priority,
        status,
        userId,
      },
    });

    logInfo(
      "Tarefa criada com sucesso",
      {
        taskId: task.id,
        title: task.title,
        priority: task.priority,
        status: task.status,
      },
      userId
    );
    logExecutionTime(startTime, "Criação de tarefa", userId);

    res.status(201).json(task);
  } catch (error) {
    logError("Erro ao criar tarefa", error, userId);
    res.status(500).json({ error: "Erro ao processar a solicitação" });
  }
};

// Atualizar uma tarefa existente
export const updateTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  const startTime = process.hrtime();
  const { id } = req.params;
  const userId = (req as AuthRequest).user?.id;

  logInfo("Atualizando tarefa", { taskId: id, body: req.body }, userId);

  try {
    // Verificar se a tarefa existe e pertence ao usuário
    const existingTask = await prisma.task.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!existingTask) {
      logDebug(
        "Tentativa de atualizar tarefa inexistente",
        { taskId: id },
        userId
      );
      res.status(404).json({ error: "Tarefa não encontrada" });
      return;
    }

    // Validar dados de entrada
    const result = updateTaskSchema.safeParse(req.body);
    if (!result.success) {
      logDebug(
        "Dados de atualização inválidos",
        { errors: result.error.format() },
        userId
      );
      res.status(400).json({
        error: "Dados inválidos",
        details: result.error.format(),
      });
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: result.data,
    });

    logInfo(
      "Tarefa atualizada com sucesso",
      {
        taskId: updatedTask.id,
        changes: result.data,
      },
      userId
    );
    logExecutionTime(startTime, "Atualização de tarefa", userId);

    res.status(200).json(updatedTask);
  } catch (error) {
    logError("Erro ao atualizar tarefa", { error, taskId: id }, userId);
    res.status(500).json({ error: "Erro ao processar a solicitação" });
  }
};

// Excluir uma tarefa
export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  const startTime = process.hrtime();
  const { id } = req.params;
  const userId = (req as AuthRequest).user?.id;

  logInfo("Excluindo tarefa", { taskId: id }, userId);

  try {
    // Verificar se a tarefa existe e pertence ao usuário
    const existingTask = await prisma.task.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!existingTask) {
      logDebug(
        "Tentativa de excluir tarefa inexistente",
        { taskId: id },
        userId
      );
      res.status(404).json({ error: "Tarefa não encontrada" });
      return;
    }

    await prisma.task.delete({
      where: { id },
    });

    logInfo(
      "Tarefa excluída com sucesso",
      {
        taskId: id,
        taskTitle: existingTask.title,
      },
      userId
    );
    logExecutionTime(startTime, "Exclusão de tarefa", userId);

    res.status(200).json({ message: "Tarefa excluída com sucesso" });
  } catch (error) {
    logError("Erro ao excluir tarefa", { error, taskId: id }, userId);
    res.status(500).json({ error: "Erro ao processar a solicitação" });
  }
};
