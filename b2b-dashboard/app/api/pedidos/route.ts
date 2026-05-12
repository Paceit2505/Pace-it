import { NextRequest, NextResponse } from "next/server";
import {
  getPedidos,
  resetRequestState,
  wasTokenRenovado,
  getNewTokens,
} from "@/lib/bling";
import { calcularKPIs, processarPedidos } from "@/lib/processor";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");

  if (!dataInicio || !dataFim) {
    return NextResponse.json({ error: "dataInicio e dataFim são obrigatórios" }, { status: 400 });
  }

  if (!process.env.BLING_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "Credenciais Bling não configuradas. Adicione as variáveis de ambiente no Vercel." },
      { status: 503 }
    );
  }

  resetRequestState();

  try {
    const pedidosRaw = await getPedidos(dataInicio, dataFim);
    const pedidos = await processarPedidos(pedidosRaw);
    const kpis = calcularKPIs(pedidos);

    const vendedores = [...new Set(pedidos.map((p) => p.vendedor))].sort();

    const tokenRenovado = wasTokenRenovado();
    const newTokens = tokenRenovado ? getNewTokens() : undefined;

    return NextResponse.json({
      pedidos,
      kpis,
      vendedores,
      tokenRenovado,
      ...(newTokens && {
        novoAccessToken: newTokens.accessToken,
        novoRefreshToken: newTokens.refreshToken,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[/api/pedidos]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
