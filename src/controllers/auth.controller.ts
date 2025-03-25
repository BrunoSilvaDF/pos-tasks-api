import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { logDebug, logError, logExecutionTime, logInfo } from "../utils/logger";

const prisma = new PrismaClient();

// Schema de validação para registro
const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

// Schema de validação para login
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Função para gerar token JWT
const generateToken = (userId: string) => {
  const secret = process.env.JWT_SECRET || "default_secret";
  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
};

// Controlador para registro de usuários
export const register = async (req: Request, res: Response): Promise<void> => {
  const startTime = process.hrtime();
  logInfo("Iniciando registro de usuário", { body: req.body });

  try {
    // Validar dados de entrada
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      logDebug("Dados de registro inválidos", {
        errors: result.error.format(),
      });
      res.status(400).json({
        error: "Dados inválidos",
        details: result.error.format(),
      });
      return;
    }

    const { name, email, password } = result.data;

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logDebug("Tentativa de registro com email já existente", { email });
      res.status(409).json({ error: "Usuário com este email já existe" });
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Gerar token JWT
    const token = generateToken(user.id);

    logInfo("Usuário registrado com sucesso", {
      userId: user.id,
      email: user.email,
    });
    logExecutionTime(startTime, "Registro de usuário", user.id);

    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    logError("Erro ao registrar usuário", error);
    res.status(500).json({ error: "Erro ao processar a solicitação" });
  }
};

// Controlador para login
export const login = async (req: Request, res: Response): Promise<void> => {
  const startTime = process.hrtime();
  logInfo("Tentativa de login", { email: req.body.email });

  try {
    // Validar dados de entrada
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      logDebug("Dados de login inválidos", { errors: result.error.format() });
      res.status(400).json({
        error: "Dados inválidos",
        details: result.error.format(),
      });
      return;
    }

    const { email, password } = result.data;

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      logDebug("Tentativa de login com credenciais inválidas", { email });
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      logDebug("Tentativa de login com senha incorreta", { email });
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }

    // Gerar token JWT
    const token = generateToken(user.id);

    logInfo("Login realizado com sucesso", {
      userId: user.id,
      email: user.email,
    });
    logExecutionTime(startTime, "Login de usuário", user.id);

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    logError("Erro ao fazer login", error);
    res.status(500).json({ error: "Erro ao processar a solicitação" });
  }
};
