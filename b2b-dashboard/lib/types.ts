export interface ItemPedido {
  codigo: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface PedidoProcessado {
  cliente: string;
  cnpj: string;
  cidade: string;
  uf: string;
  vendedor: string;
  dataPedido: string; // ISO date string YYYY-MM-DD
  valor: number;
  frete: number;
  desconto: number;
  outrasDespesas: number;
  totalVenda: number;
  situacao: string;
  tipo: "Nova loja" | "Recompra";
  itens: ItemPedido[];
}

export interface KPIs {
  totalFaturamento: number;
  totalPedidos: number;
  ticketMedio: number;
  qtdRecompras: number;
  qtdNovasLojas: number;
  faturamentoRecompras: number;
  faturamentoNovasLojas: number;
  topVendedor: string;
  topLojista: string;
}

export interface DashboardData {
  pedidos: PedidoProcessado[];
  kpis: KPIs;
  vendedores: string[];
  tokenRenovado: boolean;
}

// Raw Bling API shapes
export interface BlingContato {
  id: number;
  nome: string;
  cpfCnpj: string;
  endereco?: {
    municipio?: string;
    uf?: string;
  };
}

export interface BlingItem {
  quantidade: number;
  valor: number;
  produto: {
    codigo: string;
    descricao: string;
  };
}

export interface BlingPedido {
  id: number;
  numero: string;
  data: string;
  contato: { id: number; nome: string };
  vendedor?: { nome: string };
  totalProdutos: number;
  frete: number;
  desconto: number;
  outrasDespesas: number;
  totalVenda: number;
  situacao: { nome: string };
  itens: BlingItem[];
}
