import { BlingContato, BlingPedido } from "./types";

const BASE_URL = "https://www.bling.com.br/Api/v3";

// Module-level token cache (lives for the duration of a serverless instance)
let cachedAccessToken = "";
let cachedRefreshToken = "";
let tokenRenovado = false;

// Per-request contact cache
const contatoCache = new Map<number, BlingContato>();

function getTokens() {
  return {
    accessToken: cachedAccessToken || process.env.BLING_ACCESS_TOKEN || "",
    refreshToken: cachedRefreshToken || process.env.BLING_REFRESH_TOKEN || "",
  };
}

export function wasTokenRenovado() {
  return tokenRenovado;
}

export function getNewTokens() {
  return {
    accessToken: cachedAccessToken,
    refreshToken: cachedRefreshToken,
  };
}

export function resetRequestState() {
  contatoCache.clear();
  tokenRenovado = false;
}

async function refreshToken(): Promise<void> {
  const { refreshToken: rt } = getTokens();
  const clientId = process.env.BLING_CLIENT_ID || "";
  const clientSecret = process.env.BLING_CLIENT_SECRET || "";

  const res = await fetch(`${BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: rt,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    throw new Error(`Falha ao renovar token Bling: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedAccessToken = data.access_token;
  cachedRefreshToken = data.refresh_token;
  tokenRenovado = true;
}

async function blingGet(endpoint: string, params: Record<string, string> = {}): Promise<unknown> {
  await new Promise((r) => setTimeout(r, 300)); // rate limit

  const { accessToken } = getTokens();
  const url = new URL(`${BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const doFetch = (token: string) =>
    fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

  let res = await doFetch(accessToken);

  if (res.status === 401) {
    await refreshToken();
    const { accessToken: newToken } = getTokens();
    res = await doFetch(newToken);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bling API [${res.status}] ${endpoint}: ${body.slice(0, 300)}`);
  }

  return res.json();
}

export async function getPedidos(dataInicio: string, dataFim: string): Promise<BlingPedido[]> {
  const pedidos: BlingPedido[] = [];
  let pagina = 1;

  while (true) {
    const result = (await blingGet("pedidos/vendas", {
      dataInicial: dataInicio,
      dataFinal: dataFim,
      pagina: String(pagina),
    })) as { data?: BlingPedido[] };

    const data = result?.data ?? [];
    if (data.length === 0) break;
    pedidos.push(...data);
    pagina++;
  }

  return pedidos;
}

export async function getContato(idContato: number): Promise<BlingContato> {
  if (contatoCache.has(idContato)) {
    return contatoCache.get(idContato)!;
  }

  const result = (await blingGet(`contatos/${idContato}`)) as { data?: BlingContato };
  const contato = result?.data ?? ({ id: idContato, nome: "", cpfCnpj: "" } as BlingContato);
  contatoCache.set(idContato, contato);
  return contato;
}
