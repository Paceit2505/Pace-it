import 'dotenv/config'
import { PrismaClient, StoreStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Tabela de preços padrão
  const defaultTable = await prisma.priceTable.upsert({
    where: { id: 'default-table' },
    update: {},
    create: {
      id: 'default-table',
      name: 'Tabela Padrão',
      discount: 0,
    },
  })

  const goldTable = await prisma.priceTable.upsert({
    where: { id: 'gold-table' },
    update: {},
    create: {
      id: 'gold-table',
      name: 'Gold',
      discount: 10,
    },
  })

  console.log('✅ Tabelas de preços criadas')

  // Admin user
  const adminHash = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@paceit.com.br' },
    update: {},
    create: {
      email: 'admin@paceit.com.br',
      password: adminHash,
      role: 'admin',
    },
  })

  // Loja de teste
  const storeHash = await bcrypt.hash('loja123', 12)
  await prisma.user.upsert({
    where: { email: 'loja@teste.com.br' },
    update: {},
    create: {
      email: 'loja@teste.com.br',
      password: storeHash,
      role: 'lojista',
      store: {
        create: {
          cnpj: '12345678000195',
          razaoSocial: 'Loja Teste Ltda',
          nomeFantasia: 'Loja Teste',
          email: 'loja@teste.com.br',
          phone: '11999999999',
          address: {
            street: 'Rua dos Testes',
            number: '100',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01310-100',
          },
          priceTableId: defaultTable.id,
          status: StoreStatus.ACTIVE,
        },
      },
    },
  })

  console.log('✅ Usuários criados (admin: admin@paceit.com.br / admin123 | loja: loja@teste.com.br / loja123)')

  // Produtos de teste
  const productData = [
    {
      sku: 'HG-001',
      name: 'Hidrogelé Pace It Neutro 40g',
      category: 'Hidrogéis',
      unit: 'sachê',
      unitQty: 30,
      minOrder: 6,
      weight: 0.04,
      prices: { default: 8.9, gold: 7.9 },
      stock: 120,
    },
    {
      sku: 'HG-002',
      name: 'Hidrogelé Pace It Laranja 40g',
      category: 'Hidrogéis',
      unit: 'sachê',
      unitQty: 30,
      minOrder: 6,
      weight: 0.04,
      prices: { default: 8.9, gold: 7.9 },
      stock: 85,
    },
    {
      sku: 'EL-001',
      name: 'Eletrólito Pace It Limão 10g',
      category: 'Eletrólitos',
      unit: 'sachê',
      unitQty: 30,
      minOrder: 12,
      weight: 0.01,
      prices: { default: 4.5, gold: 3.9 },
      stock: 200,
    },
    {
      sku: 'EL-002',
      name: 'Eletrólito Pace It Tropical 10g',
      category: 'Eletrólitos',
      unit: 'sachê',
      unitQty: 30,
      minOrder: 12,
      weight: 0.01,
      prices: { default: 4.5, gold: 3.9 },
      stock: 8,
    },
    {
      sku: 'PT-001',
      name: 'Proteína Whey Pace It Chocolate 2kg',
      category: 'Proteínas',
      unit: 'caixa',
      unitQty: 6,
      minOrder: 1,
      weight: 2.0,
      prices: { default: 189.9, gold: 169.9 },
      stock: 45,
    },
    {
      sku: 'AC-001',
      name: 'Cinto de Hidratação Pace It',
      category: 'Acessórios',
      unit: 'unidade',
      unitQty: 1,
      minOrder: 2,
      weight: 0.3,
      prices: { default: 89.9, gold: 79.9 },
      stock: 0,
    },
    {
      sku: 'MR-001',
      name: 'Camiseta Pace It Run Tech P',
      category: 'Merch',
      unit: 'unidade',
      unitQty: 1,
      minOrder: 5,
      weight: 0.2,
      prices: { default: 129.9, gold: 115.9 },
      stock: 30,
    },
  ]

  for (const p of productData) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        category: p.category,
        unit: p.unit,
        unitQty: p.unitQty,
        minOrder: p.minOrder,
        weight: p.weight,
        images: [],
      },
    })

    await prisma.productPrice.upsert({
      where: { productId_priceTableId: { productId: product.id, priceTableId: defaultTable.id } },
      update: { price: p.prices.default },
      create: { productId: product.id, priceTableId: defaultTable.id, price: p.prices.default },
    })

    await prisma.productPrice.upsert({
      where: { productId_priceTableId: { productId: product.id, priceTableId: goldTable.id } },
      update: { price: p.prices.gold },
      create: { productId: product.id, priceTableId: goldTable.id, price: p.prices.gold },
    })

    await prisma.stock.upsert({
      where: { productId: product.id },
      update: { qty: p.stock },
      create: { productId: product.id, qty: p.stock },
    })
  }

  console.log('✅ Produtos e estoque criados')
  console.log('🎉 Seed concluído!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
