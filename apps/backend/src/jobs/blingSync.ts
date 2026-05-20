import cron from 'node-cron'
import { syncBlingProducts, syncBlingStock } from '../lib/bling'

// Executa sync a cada 15 minutos
export function startBlingSyncJob() {
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Bling Cron] Iniciando sync de estoque...')
    try {
      await syncBlingStock()
    } catch (err) {
      console.error('[Bling Cron] Erro no sync de estoque:', err)
    }
  })

  // Sync completo de produtos 1x por hora (minuto 0 de cada hora)
  cron.schedule('0 * * * *', async () => {
    console.log('[Bling Cron] Iniciando sync de produtos...')
    try {
      await syncBlingProducts()
    } catch (err) {
      console.error('[Bling Cron] Erro no sync de produtos:', err)
    }
  })

  console.log('[Bling Cron] Jobs agendados: estoque (15min), produtos (1h)')
}
