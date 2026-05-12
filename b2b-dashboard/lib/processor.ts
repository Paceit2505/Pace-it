import { BlingPedido, ItemPedido, KPIs, PedidoProcessado } from "./types";
import { getContato } from "./bling";

function extrairCnpj(cpfCnpj: string): string | null {
  const digits = cpfCnpj.replace(/\D/g, "");
  return digits.length === 14 ? digits : null;
}

function extrairItens(pedido: BlingPedido): ItemPedido[] {
  return (pedido.itens ?? []).map((item) => ({
    codigo: item.produto?.codigo ?? "",
    descricao: item.produto?.descricao ?? "",
    quantidade: Number(item.quantidade ?? 0),
    valorUnitario: Number(item.valor ?? 0),
    valorTotal: Number(item.valor ?? 0) * Number(item.quantidade ?? 0),
  }));
}

export async function processarPedidos(pedidosRaw: BlingPedido[]): Promise<PedidoProcessado[]> {
  const registros: PedidoProcessado[] = [];

  for (const pedido of pedidosRaw) {
    const idContato = pedido.contato?.id;
    if (!idContato) continue;

    let contato;
    try {
      contato = await getContato(Number(idContato));
    } catch {
      continue;
    }

    const cnpj = extrairCnpj(contato.cpfCnpj ?? "");
    if (!cnpj) continue;

    const frete = Number(pedido.frete ?? 0);
    const totalVenda = Number(pedido.totalVenda ?? 0);

    // Exclude bonificados: totalVenda == frete
    if (totalVenda === frete) continue;

    registros.push({
      cliente: contato.nome ?? "",
      cnpj,
      cidade: contato.endereco?.municipio ?? "",
      uf: contato.endereco?.uf ?? "",
      vendedor: pedido.vendedor?.nome ?? "Sem vendedor",
      dataPedido: pedido.data ?? "",
      valor: Number(pedido.totalProdutos ?? 0),
      frete,
      desconto: Number(pedido.desconto ?? 0),
      outrasDespesas: Number(pedido.outrasDespesas ?? 0),
      totalVenda,
      situacao: pedido.situacao?.nome ?? "",
      tipo: "Nova loja", // will be overwritten below
      itens: extrairItens(pedido),
    });
  }

  // Sort by date ASC then classify Nova loja / Recompra
  registros.sort((a, b) => a.dataPedido.localeCompare(b.dataPedido));

  const vistos = new Set<string>();
  for (const r of registros) {
    r.tipo = vistos.has(r.cnpj) ? "Recompra" : "Nova loja";
    vistos.add(r.cnpj);
  }

  return registros;
}

export function calcularKPIs(pedidos: PedidoProcessado[]): KPIs {
  if (pedidos.length === 0) {
    return {
      totalFaturamento: 0,
      totalPedidos: 0,
      ticketMedio: 0,
      qtdRecompras: 0,
      qtdNovasLojas: 0,
      faturamentoRecompras: 0,
      faturamentoNovasLojas: 0,
      topVendedor: "-",
      topLojista: "-",
    };
  }

  const totalFaturamento = pedidos.reduce((s, p) => s + p.totalVenda, 0);
  const recompras = pedidos.filter((p) => p.tipo === "Recompra");
  const novas = pedidos.filter((p) => p.tipo === "Nova loja");

  const byVendedor = new Map<string, number>();
  const byLojista = new Map<string, number>();
  for (const p of pedidos) {
    byVendedor.set(p.vendedor, (byVendedor.get(p.vendedor) ?? 0) + p.totalVenda);
    byLojista.set(p.cliente, (byLojista.get(p.cliente) ?? 0) + p.totalVenda);
  }

  const topVendedor = [...byVendedor.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  const topLojista = [...byLojista.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  return {
    totalFaturamento,
    totalPedidos: pedidos.length,
    ticketMedio: totalFaturamento / pedidos.length,
    qtdRecompras: recompras.length,
    qtdNovasLojas: novas.length,
    faturamentoRecompras: recompras.reduce((s, p) => s + p.totalVenda, 0),
    faturamentoNovasLojas: novas.reduce((s, p) => s + p.totalVenda, 0),
    topVendedor,
    topLojista,
  };
}
