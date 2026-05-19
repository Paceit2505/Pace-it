import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export async function productRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (fastify as any).authenticate)

  // Listagem de produtos com preços da tabela do lojista
  fastify.get('/', async (request, reply) => {
    const { id } = request.user as { id: string }
    const { search, category, page = '1', limit = '20' } = z.object({
      search: z.string().optional(),
      category: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }).parse(request.query)

    const store = await prisma.store.findUnique({ where: { userId: id } })
    if (!store) return reply.status(404).send({ error: 'NotFound', message: 'Loja não encontrada', statusCode: 404 })

    const products = await prisma.product.findMany({
      where: {
        active: true,
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
        ...(category ? { category } : {}),
      },
      include: {
        stock: true,
        priceTables: {
          where: { priceTableId: store.priceTableId },
          select: { price: true },
        },
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    })

    // Mapeia preço da tabela do lojista
    const result = products.map((p) => ({
      ...p,
      price: p.priceTables[0]?.price ?? null,
      priceTables: undefined,
    }))

    return reply.send({ data: result })
  })

  // Categorias ativas — deve vir ANTES de /:id para evitar conflito de rota dinâmica
  fastify.get('/categories', async (request, reply) => {
    const categories = await prisma.product.findMany({
      where: { active: true },
      select: { category: true },
      distinct: ['category'],
    })
    return reply.send({ data: categories.map((c) => c.category) })
  })

  // Detalhe de produto
  fastify.get('/:id', async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { id } = z.object({ id: z.string() }).parse(request.params)

    const store = await prisma.store.findUnique({ where: { userId } })
    if (!store) return reply.status(404).send({ error: 'NotFound', message: 'Loja não encontrada', statusCode: 404 })

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stock: true,
        priceTables: {
          where: { priceTableId: store.priceTableId },
          select: { price: true },
        },
      },
    })

    if (!product) return reply.status(404).send({ error: 'NotFound', message: 'Produto não encontrado', statusCode: 404 })

    return reply.send({
      data: { ...product, price: product.priceTables[0]?.price ?? null, priceTables: undefined },
    })
  })
}
