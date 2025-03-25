import { PrismaClient } from "@prisma/client";
import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.middleware";
import { logDebug, logError, logExecutionTime, logInfo } from "../utils/logger";

const prisma = new PrismaClient();

// Schema de validação para atualização de perfil
const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
});

// Obter perfil do usuário
export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const startTime = process.hrtime();
  const userId = (req as AuthRequest).user?.id;

  logInfo("Buscando perfil do usuário", null, userId);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      logDebug("Usuário não encontrado ao buscar perfil", { userId }, userId);
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    logInfo("Perfil do usuário recuperado com sucesso", null, userId);
    logExecutionTime(startTime, "Busca de perfil", userId);

    res.status(200).json(user);
  } catch (error) {
    logError("Erro ao buscar perfil", error, userId);
    res.status(500).json({ error: "Erro ao processar a solicitação" });
  }
};

// Atualizar perfil do usuário
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const startTime = process.hrtime();
  const userId = (req as AuthRequest).user?.id;

  logInfo("Atualizando perfil do usuário", { body: req.body }, userId);

  try {
    // Validar dados de entrada
    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) {
      logDebug(
        "Dados de atualização de perfil inválidos",
        { errors: result.error.format() },
        userId
      );
      res.status(400).json({
        error: "Dados inválidos",
        details: result.error.format(),
      });
      return;
    }

    // Se o email estiver sendo atualizado, verificar se já existe
    if (result.data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: result.data.email,
          id: { not: userId },
        },
      });

      if (existingUser) {
        logDebug(
          "Tentativa de atualizar para email já em uso",
          { email: result.data.email },
          userId
        );
        res.status(409).json({ error: "Email já está em uso" });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: result.data,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    logInfo(
      "Perfil atualizado com sucesso",
      {
        changes: result.data,
      },
      userId
    );
    logExecutionTime(startTime, "Atualização de perfil", userId);

    res.status(200).json(updatedUser);
  } catch (error) {
    logError("Erro ao atualizar perfil", error, userId);
    res.status(500).json({ error: "Erro ao processar a solicitação" });
  }
};
