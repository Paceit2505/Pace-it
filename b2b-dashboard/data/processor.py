import re
import pandas as pd


def _extrair_cnpj(cpf_cnpj: str) -> str | None:
    digits = re.sub(r"\D", "", str(cpf_cnpj or ""))
    if len(digits) == 14:
        return digits
    return None


def processar_pedidos(pedidos_raw: list, bling_api) -> pd.DataFrame:
    registros = []

    for pedido in pedidos_raw:
        contato_ref = pedido.get("contato", {})
        id_contato = contato_ref.get("id")

        if not id_contato:
            continue

        try:
            contato = bling_api.get_contato(int(id_contato))
        except Exception:
            continue

        cpf_cnpj = contato.get("cpfCnpj", "")
        cnpj = _extrair_cnpj(cpf_cnpj)
        if cnpj is None:
            continue

        endereco = contato.get("endereco", {})
        cidade = endereco.get("municipio", "")
        uf = endereco.get("uf", "")

        vendedor_info = pedido.get("vendedor", {}) or {}
        vendedor = vendedor_info.get("nome", "Sem vendedor")

        data_str = pedido.get("data", "")
        try:
            data_pedido = pd.to_datetime(data_str)
        except Exception:
            data_pedido = pd.NaT

        valor = float(pedido.get("totalProdutos", 0) or 0)
        frete = float(pedido.get("frete", 0) or 0)
        desconto = float(pedido.get("desconto", 0) or 0)
        outras_despesas = float(pedido.get("outrasDespesas", 0) or 0)
        total_venda = float(pedido.get("totalVenda", 0) or 0)

        situacao_info = pedido.get("situacao", {}) or {}
        situacao = situacao_info.get("nome", "")

        itens = bling_api.get_produtos_pedido(pedido)

        registros.append(
            {
                "cliente": contato.get("nome", ""),
                "cnpj": cnpj,
                "cidade": cidade,
                "uf": uf,
                "vendedor": vendedor,
                "data_pedido": data_pedido,
                "valor": valor,
                "frete": frete,
                "desconto": desconto,
                "outras_despesas": outras_despesas,
                "total_venda": total_venda,
                "situacao": situacao,
                "itens": itens,
            }
        )

    if not registros:
        return pd.DataFrame(
            columns=[
                "cliente", "cnpj", "cidade", "uf", "vendedor", "data_pedido",
                "valor", "frete", "desconto", "outras_despesas", "total_venda",
                "situacao", "itens", "tipo",
            ]
        )

    df = pd.DataFrame(registros)

    df = df[df["total_venda"] != df["frete"]].copy()

    df = df.sort_values("data_pedido", ascending=True).reset_index(drop=True)

    vistos = set()
    tipos = []
    for cnpj in df["cnpj"]:
        if cnpj not in vistos:
            tipos.append("Nova loja")
            vistos.add(cnpj)
        else:
            tipos.append("Recompra")
    df["tipo"] = tipos

    return df


def calcular_kpis(df: pd.DataFrame) -> dict:
    if df.empty:
        return {
            "total_faturamento": 0,
            "total_pedidos": 0,
            "ticket_medio": 0,
            "qtd_recompras": 0,
            "qtd_novas_lojas": 0,
            "faturamento_recompras": 0,
            "faturamento_novas_lojas": 0,
            "top_vendedor": "-",
            "top_lojista": "-",
        }

    total_faturamento = df["total_venda"].sum()
    total_pedidos = len(df)
    ticket_medio = df["total_venda"].mean()

    recompras = df[df["tipo"] == "Recompra"]
    novas_lojas = df[df["tipo"] == "Nova loja"]

    vendedor_fat = df.groupby("vendedor")["total_venda"].sum()
    top_vendedor = vendedor_fat.idxmax() if not vendedor_fat.empty else "-"

    lojista_fat = df.groupby("cliente")["total_venda"].sum()
    top_lojista = lojista_fat.idxmax() if not lojista_fat.empty else "-"

    return {
        "total_faturamento": total_faturamento,
        "total_pedidos": total_pedidos,
        "ticket_medio": ticket_medio,
        "qtd_recompras": len(recompras),
        "qtd_novas_lojas": len(novas_lojas),
        "faturamento_recompras": recompras["total_venda"].sum(),
        "faturamento_novas_lojas": novas_lojas["total_venda"].sum(),
        "top_vendedor": top_vendedor,
        "top_lojista": top_lojista,
    }


def processar_itens(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty or "itens" not in df.columns:
        return pd.DataFrame(
            columns=[
                "data_pedido", "cliente", "cnpj", "codigo_produto",
                "descricao_produto", "quantidade", "valor_unitario", "valor_total_item",
            ]
        )

    explodido = df.explode("itens").copy()
    explodido = explodido[explodido["itens"].notna()]
    explodido = explodido[explodido["itens"].apply(lambda x: isinstance(x, dict))]

    if explodido.empty:
        return pd.DataFrame(
            columns=[
                "data_pedido", "cliente", "cnpj", "codigo_produto",
                "descricao_produto", "quantidade", "valor_unitario", "valor_total_item",
            ]
        )

    explodido["codigo_produto"] = explodido["itens"].apply(lambda x: x.get("codigo", ""))
    explodido["descricao_produto"] = explodido["itens"].apply(lambda x: x.get("descricao", ""))
    explodido["quantidade"] = explodido["itens"].apply(lambda x: float(x.get("quantidade", 0)))
    explodido["valor_unitario"] = explodido["itens"].apply(lambda x: float(x.get("valorUnitario", 0)))
    explodido["valor_total_item"] = explodido["itens"].apply(lambda x: float(x.get("valorTotal", 0)))

    return explodido[
        ["data_pedido", "cliente", "cnpj", "codigo_produto",
         "descricao_produto", "quantidade", "valor_unitario", "valor_total_item"]
    ].reset_index(drop=True)
