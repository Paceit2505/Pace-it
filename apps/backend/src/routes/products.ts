import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export async function productRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (fastify as any).authenticate)

  // Categorias ativas — deve vir antes de /:id
  fastify.get('/categories', async (request, reply) => {
    const categories = await prisma.product.findMany({
      where: { active: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })
    return reply.send({ data: categories.map((c) => c.category) })
  })

  // Favoritos — deve vir antes de /:id
  fastify.get('/favorites', async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const store = await prisma.store.findUnique({ where: { userId } })
    if (!store) return reply.status(404).send({ error: 'NotFound', message: 'Loja não encontrada', statusCode: 404 })

    const favorites = await prisma.favorite.findMany({
      where: { storeId: store.id },
      include: {
        product: {
          include: {
            stock: true,
            priceTables: {
              where: { priceTableId: store.priceTableId },
              select: { price: true },
            },
          },
        },
      },
    })

    const result = favorites.map((f) => ({
      ...f.product,
      price: f.product.priceTables[0]?.price ?? null,
      priceTables: undefined,
    }))

    return reply.send({ data: result })
  })

  // Toggle favorito — deve vir antes de /:id
  fastify.post('/favorites/:productId', async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { productId } = z.object({ productId: z.string() }).parse(request.params)

    const store = await prisma.store.findUnique({ where: { userId } })
    if (!store) return reply.status(404).send({ error: 'NotFound', message: 'Loja não encontrada', statusCode: 404 })

    const existing = await prisma.favorite.findUnique({
      where: { storeId_productId: { storeId: store.id, productId } },
    })

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } })
      return reply.send({ data: { favorited: false } })
    }

    await prisma.favorite.create({ data: { storeId: store.id, productId } })
    return reply.send({ data: { favorited: true } })
  })

  // Listagem de produtos com preços da tabela do lojista
  fastify.get('/', async (request, reply) => {
    const { id: userId } = request.user as { id: string }

    const query = z.object({
      search: z.string().optional(),
      category: z.string().optional(),
      inStock: z.enum(['true', 'false']).optional(),
      sortBy: z.enum(['name', 'price', 'stock']).optional().default('name'),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(20),
    }).parse(request.query)

    const store = await prisma.store.findUnique({ where: { userId } })
    if (!store) return reply.status(404).send({ error: 'NotFound', message: 'Loja não encontrada', statusCode: 404 })

    const where: any = {
      active: true,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.inStock === 'true' ? { stock: { qty: { gt: 0 } } } : {}),
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          stock: true,
          priceTables: {
            where: { priceTableId: store.priceTableId },
            select: { price: true },
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: query.sortBy === 'name' ? { name: 'asc' } : undefined,
      }),
    ])

    let result = products.map((p) => ({
      ...p,
      price: p.priceTables[0]?.price ?? null,
      priceTables: undefined,
    }))

    // Ordenação por preço ou estoque após busca (Prisma não suporta sort por relação diretamente)
    if (query.sortBy === 'price') {
      result = result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    } else if (query.sortBy === 'stock') {
      result = result.sort((a, b) => (b.stock?.qty ?? 0) - (a.stock?.qty ?? 0))
    }

    return reply.send({
      data: result,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  })

  // Detalhe de produto
  fastify.get('/:id', async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { id } = z.object({ id: z.string() }).parse(request.params)

    const store = await prisma.store.findUnique({ where: { userId } })
    if (!store) return reply.status(404).send({ error: 'NotFound', message: 'Loja não encontrada', statusCode: 404 })

    const [product, isFavorited] = await Promise.all([
      prisma.product.findUnique({
        where: { id },
        include: {
          stock: true,
          priceTables: {
            where: { priceTableId: store.priceTableId },
            select: { price: true },
          },
        },
      }),
      prisma.favorite.findUnique({
        where: { storeId_productId: { storeId: store.id, productId: id } },
      }),
    ])

    if (!product) return reply.status(404).send({ error: 'NotFound', message: 'Produto não encontrado', statusCode: 404 })

    return reply.send({
      data: {
        ...product,
        price: product.priceTables[0]?.price ?? null,
        priceTables: undefined,
        isFavorited: !!isFavorited,
      },
    })
  })
}
