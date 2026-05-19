import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import axios from 'axios'
import { prisma } from '../lib/prisma'
import { hashPassword, comparePassword, generateTokens } from '../lib/auth'
import { StoreStatus } from '@prisma/client'
// Nota: proteção de rate limit fornecida globalmente pelo plugin registrado em server.ts

const loginSchema = z.object({
  cnpj: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(1),
})

const registerSchema = z.object({
  cnpj: z.string().length(14),
  razaoSocial: z.string().min(2),
  nomeFantasia: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.object({
    street: z.string(),
    number: z.string(),
    complement: z.string().optional(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string().length(2),
    zipCode: z.string(),
  }),
  password: z.string().min(8),
})

export async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          body.email ? { email: body.email } : {},
          body.cnpj ? { store: { cnpj: body.cnpj } } : {},
        ],
      },
      include: { store: true, representative: true },
    })

    if (!user || !user.active) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Credenciais inválidas',
        statusCode: 401,
      })
    }

    const valid = await comparePassword(body.password, user.password)
    if (!valid) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Credenciais inválidas',
        statusCode: 401,
      })
    }

    if (user.store?.status === StoreStatus.PENDING) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Conta aguardando aprovação. Você receberá um e-mail em breve.',
        statusCode: 403,
      })
    }

    if (user.store?.status === StoreStatus.BLOCKED) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Conta bloqueada. Entre em contato com o suporte.',
        statusCode: 403,
      })
    }

    const tokens = generateTokens(fastify, user.id, user.role)

    // Salva refresh token
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    await prisma.refreshToken.create({
      data: { token: tokens.refreshToken, userId: user.id, expiresAt },
    })

    return reply.send({
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          role: user.role,
          storeId: user.store?.id,
          representativeId: user.representative?.id,
        },
      },
    })
  })

  // Refresh token
  fastify.post('/refresh', async (request, reply) => {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(request.body)

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!stored || stored.expiresAt < new Date()) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Refresh token inválido ou expirado',
        statusCode: 401,
      })
    }

    const tokens = generateTokens(fastify, stored.user.id, stored.user.role)

    // Rotaciona o refresh token
    await prisma.refreshToken.delete({ where: { id: stored.id } })
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    await prisma.refreshToken.create({
      data: { token: tokens.refreshToken, userId: stored.user.id, expiresAt },
    })

    return reply.send({ data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken } })
  })

  // Cadastro
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)

    const existingCNPJ = await prisma.store.findUnique({ where: { cnpj: body.cnpj } })
    if (existingCNPJ) {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'CNPJ já cadastrado',
        statusCode: 409,
      })
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: body.email } })
    if (existingEmail) {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'E-mail já cadastrado',
        statusCode: 409,
      })
    }

    // Tabela de preços padrão
    const defaultPriceTable = await prisma.priceTable.findFirst({ where: { active: true } })
    if (!defaultPriceTable) {
      return reply.status(500).send({
        error: 'Internal',
        message: 'Nenhuma tabela de preços ativa encontrada',
        statusCode: 500,
      })
    }

    const hashedPassword = await hashPassword(body.password)

    await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        role: 'lojista',
        store: {
          create: {
            cnpj: body.cnpj,
            razaoSocial: body.razaoSocial,
            nomeFantasia: body.nomeFantasia,
            email: body.email,
            phone: body.phone,
            address: body.address,
            priceTableId: defaultPriceTable.id,
            status: StoreStatus.PENDING,
          },
        },
      },
    })

    return reply.status(201).send({
      data: { message: 'Cadastro realizado com sucesso. Aguardando aprovação.' },
    })
  })

  // Esqueceu a senha — gera token temporário (simplificado sem e-mail real por ora)
  fastify.post('/forgot-password', async (request, reply) => {
    const { email } = z.object({ email: z.string().email() }).parse(request.body)

    const user = await prisma.user.findUnique({ where: { email } })
    // Responde sempre com sucesso para não revelar se o e-mail existe
    return reply.send({
      data: { message: 'Se o e-mail existir, você receberá as instruções em breve.' },
    })
  })

  // Busca dados do CNPJ via ReceitaWS
  fastify.get('/cnpj/:cnpj', async (request, reply) => {
    const { cnpj } = z.object({ cnpj: z.string().length(14) }).parse(request.params)

    try {
      const { data } = await axios.get(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`)
      if (data.status === 'ERROR') {
        return reply.status(404).send({ error: 'NotFound', message: 'CNPJ não encontrado', statusCode: 404 })
      }
      return reply.send({ data })
    } catch {
      return reply.status(404).send({ error: 'NotFound', message: 'CNPJ não encontrado', statusCode: 404 })
    }
  })
}
