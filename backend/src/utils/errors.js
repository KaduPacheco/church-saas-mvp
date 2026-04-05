// src/utils/errors.js
// Classes de erro customizadas para a aplicação.
// O errorHandler middleware usa essas classes para formatar respostas.

class AppError extends Error {
  constructor(message, statusCode, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Erros esperados (não são bugs)
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Requisição inválida') {
    super(message, 400, 'BAD_REQUEST');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Não autenticado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Sem permissão para acessar este recurso') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Recurso já existe') {
    super(message, 409, 'CONFLICT');
  }
}

class ValidationError extends AppError {
  constructor(message = 'Dados inválidos', details = []) {
    super(message, 422, 'VALIDATION_ERROR');
    this.details = details;
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
};
