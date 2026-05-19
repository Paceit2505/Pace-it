import bcrypt from 'bcryptjs'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Verifica se o usuário tem o role necessário
export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: any) => {
    const payload = request.user as { id: string; role: UserRole }
    if (!roles.includes(payload.role)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Acesso negado para este recurso',
        statusCode: 403,
      })
    }
  }
}

export function generateTokens(fastify: FastifyInstance, userId: string, role: UserRole) {
  const accessToken = fastify.jwt.sign(
    { id: userId, role },
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' }
  )
  const refreshToken = fastify.jwt.sign(
    { id: userId, role, type: 'refresh' },
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d' }
  )
  return { accessToken, refreshToken }
}
