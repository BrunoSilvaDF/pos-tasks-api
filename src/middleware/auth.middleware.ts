import { PrismaClient } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { logDebug, logError, logInfo } from "../utils/logger";

const prisma = new PrismaClient();

// Estender a interface Request para incluir o usuário autenticado
export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

// Middleware de autenticação
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = process.hrtime();
  logDebug("Verificando autenticação", {
    path: req.path,
    method: req.method,
  });

  try {
    // Obter o token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logDebug("Token de autenticação não fornecido", {
        path: req.path,
        method: req.method,
      });
      res.status(401).json({ error: "Token de autenticação não fornecido" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "default_secret";

    // Verificar e decodificar o token
    jwt.verify(token, secret, async (err, decoded) => {
      if (err) {
        logDebug("Token inválido ou expirado", {
          path: req.path,
          method: req.method,
          error: err.message,
        });
        res.status(401).json({ error: "Token inválido ou expirado" });
        return;
      }

      try {
        // Verificar se o usuário existe
        const userId = (decoded as { userId: string }).userId;
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          logDebug("Usuário não encontrado na autenticação", { userId });
          res.status(401).json({ error: "Usuário não encontrado" });
          return;
        }
        // Adicionar o usuário à requisição
        (req as AuthRequest).user = { id: user.id };

        const endTime = process.hrtime(startTime);
        const executionTime = (
          endTime[0] * 1000 +
          endTime[1] / 1000000
        ).toFixed(2);

        logInfo(
          "Usuário autenticado com sucesso",
          {
            userId: user.id,
            path: req.path,
            method: req.method,
            executionTime: `${executionTime}ms`,
          },
          user.id
        );

        next();
      } catch (error) {
        logError("Erro ao verificar usuário na autenticação", error);
        res.status(500).json({ error: "Erro ao processar a autenticação" });
      }
    });
  } catch (error) {
    logError("Erro de autenticação", error);
    res.status(500).json({ error: "Erro ao processar a solicitação" });
  }
};
