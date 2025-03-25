/**
 * Utilitário para padronizar os logs da aplicação
 */

// Cores para o console
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    crimson: "\x1b[38m",
  },

  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
    crimson: "\x1b[48m",
  },
};

// Função para sanitizar objetos antes de logar (remover senhas, etc)
const sanitizeData = (data: any): any => {
  if (!data) return data;

  if (typeof data !== "object") return data;

  // Se for um array, sanitizar cada item
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  // Criar uma cópia para não modificar o original
  const sanitized = { ...data };

  // Remover campos sensíveis
  if ("password" in sanitized) sanitized.password = "********";
  if ("senha" in sanitized) sanitized.senha = "********";
  if ("token" in sanitized) sanitized.token = "********";
  if ("authorization" in sanitized) sanitized.authorization = "********";

  // Sanitizar objetos aninhados
  Object.keys(sanitized).forEach((key) => {
    if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });

  return sanitized;
};

// Função para formatar a data/hora
const getTimestamp = (): string => {
  return new Date().toISOString();
};

// Tipos de log
type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

// Cores para cada tipo de log
const logColors: Record<LogLevel, string> = {
  INFO: colors.fg.green,
  WARN: colors.fg.yellow,
  ERROR: colors.fg.red,
  DEBUG: colors.fg.cyan,
};

// Função principal de log
export const log = (
  level: LogLevel,
  message: string,
  data?: any,
  userId?: string
): void => {
  const timestamp = getTimestamp();
  const color = logColors[level];
  const userInfo = userId ? `[Usuário: ${userId}]` : "";

  console.log(
    `${color}[${timestamp}] [${level}]${colors.reset} ${userInfo} ${message}`
  );

  if (data) {
    const sanitizedData = sanitizeData(data);
    console.log(
      `${colors.dim}Dados:${colors.reset}`,
      JSON.stringify(sanitizedData, null, 2)
    );
  }
};

// Funções específicas para cada nível de log
export const logInfo = (message: string, data?: any, userId?: string): void => {
  log("INFO", message, data, userId);
};

export const logWarn = (message: string, data?: any, userId?: string): void => {
  log("WARN", message, data, userId);
};

export const logError = (
  message: string,
  error?: any,
  userId?: string
): void => {
  log("ERROR", message, error, userId);
};

export const logDebug = (
  message: string,
  data?: any,
  userId?: string
): void => {
  if (process.env.NODE_ENV !== "production") {
    log("DEBUG", message, data, userId);
  }
};

// Função para medir o tempo de execução
export const logExecutionTime = (
  startTime: [number, number],
  operation: string,
  userId?: string
): void => {
  const endTime = process.hrtime(startTime);
  const executionTime = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
  logInfo(`${operation} concluído em ${executionTime}ms`, null, userId);
};
