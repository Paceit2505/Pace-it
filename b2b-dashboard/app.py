import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

import datetime
import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px

from api.bling import BlingAPI
from data.processor import processar_pedidos, calcular_kpis, processar_itens

# ── Paleta ────────────────────────────────────────────────────────────────────
AZUL_ESCURO = "#1E3A5F"
AZUL_MEDIO = "#2E5FA3"
VERDE = "#2ECC71"
VERMELHO = "#E74C3C"
CINZA = "#F5F7FA"

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    layout="wide",
    page_title="Dashboard B2B",
    page_icon="📦",
)

# ── CSS global ────────────────────────────────────────────────────────────────
st.markdown(
    """
    <style>
    .kpi-card {
        background: #ffffff;
        border-radius: 10px;
        padding: 18px 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        border-left: 5px solid #2E5FA3;
        margin-bottom: 10px;
    }
    .kpi-card.green  { border-left-color: #2ECC71; }
    .kpi-card.dark   { border-left-color: #1E3A5F; }
    .kpi-card.red    { border-left-color: #E74C3C; }
    .kpi-title  { font-size: 0.82rem; color: #6b7280; margin-bottom: 4px; font-weight: 500; }
    .kpi-value  { font-size: 1.55rem; font-weight: 700; color: #111827; }
    .kpi-sub    { font-size: 0.78rem; color: #9ca3af; margin-top: 4px; }
    .highlight-box {
        background: #f0f9ff;
        border-radius: 8px;
        padding: 12px 16px;
        margin-top: 8px;
        border: 1px solid #bae6fd;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# ── Helpers ───────────────────────────────────────────────────────────────────
def fmt_brl(value: float) -> str:
    try:
        return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except Exception:
        return "R$ 0,00"


def kpi_card(title: str, value: str, sub: str = "", color_class: str = "") -> str:
    return (
        f'<div class="kpi-card {color_class}">'
        f'<div class="kpi-title">{title}</div>'
        f'<div class="kpi-value">{value}</div>'
        f'{"<div class=kpi-sub>" + sub + "</div>" if sub else ""}'
        f"</div>"
    )


def segunda_feira_semana_atual() -> datetime.date:
    today = datetime.date.today()
    return today - datetime.timedelta(days=today.weekday())


# ── Carregamento com cache ────────────────────────────────────────────────────
@st.cache_data(ttl=3600, show_spinner=False)
def carregar_dados(data_inicio: str, data_fim: str):
    api = BlingAPI()
    pedidos_raw = api.get_pedidos(data_inicio, data_fim)
    df = processar_pedidos(pedidos_raw, api)
    return df


# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown(f"## 📦 Dashboard B2B")
    st.markdown("---")

    data_inicio = st.date_input(
        "Data início",
        value=segunda_feira_semana_atual(),
        format="DD/MM/YYYY",
    )
    data_fim = st.date_input(
        "Data fim",
        value=datetime.date.today(),
        format="DD/MM/YYYY",
    )

    atualizar = st.button("🔄 Atualizar dados", use_container_width=True)
    if atualizar:
        st.cache_data.clear()

    st.markdown("---")
    if "ultima_atualizacao" in st.session_state:
        st.caption(f"Última atualização: {st.session_state['ultima_atualizacao']}")


# ── Carrega dados ─────────────────────────────────────────────────────────────
data_inicio_str = data_inicio.strftime("%Y-%m-%d")
data_fim_str = data_fim.strftime("%Y-%m-%d")

with st.spinner("Buscando pedidos no Bling..."):
    df_full = carregar_dados(data_inicio_str, data_fim_str)
    st.session_state["ultima_atualizacao"] = datetime.datetime.now().strftime(
        "%d/%m/%Y %H:%M:%S"
    )

if df_full.empty:
    st.warning(
        "Nenhum pedido B2B encontrado para o período selecionado. "
        "Verifique as datas e as credenciais da API."
    )
    st.stop()

# ── Filtro de vendedor (sidebar, após dados carregados) ───────────────────────
with st.sidebar:
    vendedores = ["Todos"] + sorted(df_full["vendedor"].dropna().unique().tolist())
    vendedor_sel = st.selectbox("Vendedor", vendedores)

df = df_full.copy()
if vendedor_sel != "Todos":
    df = df[df["vendedor"] == vendedor_sel]

if df.empty:
    st.warning("Nenhum pedido encontrado para o vendedor selecionado.")
    st.stop()

kpis = calcular_kpis(df)
total = kpis["total_pedidos"]

# ═══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 1 — KPIs
# ═══════════════════════════════════════════════════════════════════════════════
st.markdown("## 📊 Resumo do Período")
c1, c2, c3, c4, c5 = st.columns(5)

pct_recompra = (kpis["qtd_recompras"] / total * 100) if total else 0
pct_nova = (kpis["qtd_novas_lojas"] / total * 100) if total else 0

with c1:
    st.markdown(
        kpi_card("💰 Total Faturado", fmt_brl(kpis["total_faturamento"]), color_class="dark"),
        unsafe_allow_html=True,
    )
with c2:
    st.markdown(
        kpi_card("📦 Total de Pedidos", str(total)),
        unsafe_allow_html=True,
    )
with c3:
    st.markdown(
        kpi_card("🎯 Ticket Médio", fmt_brl(kpis["ticket_medio"])),
        unsafe_allow_html=True,
    )
with c4:
    st.markdown(
        kpi_card(
            "🔄 Recompras",
            str(kpis["qtd_recompras"]),
            f"{pct_recompra:.1f}% dos pedidos · {fmt_brl(kpis['faturamento_recompras'])}",
            color_class="green",
        ),
        unsafe_allow_html=True,
    )
with c5:
    st.markdown(
        kpi_card(
            "🆕 Novas Lojas",
            str(kpis["qtd_novas_lojas"]),
            f"{pct_nova:.1f}% dos pedidos · {fmt_brl(kpis['faturamento_novas_lojas'])}",
            color_class="green",
        ),
        unsafe_allow_html=True,
    )

st.markdown("---")

# ═══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 2 — Ranking de Lojistas
# ═══════════════════════════════════════════════════════════════════════════════
st.markdown("## 🏆 Ranking de Lojistas")

ranking = (
    df.groupby(["cliente", "cnpj", "cidade", "uf", "vendedor", "tipo"])["total_venda"]
    .sum()
    .reset_index()
    .sort_values("total_venda", ascending=False)
    .reset_index(drop=True)
)
ranking.index += 1
ranking.index.name = "#"

ranking_display = ranking.copy()
ranking_display["Cidade/UF"] = ranking_display["cidade"] + "/" + ranking_display["uf"]
ranking_display["Total Venda"] = ranking_display["total_venda"].apply(fmt_brl)
ranking_display = ranking_display.rename(
    columns={"cliente": "Cliente", "cnpj": "CNPJ", "vendedor": "Vendedor", "tipo": "Tipo"}
)[["Cliente", "CNPJ", "Cidade/UF", "Vendedor", "Total Venda", "Tipo"]]

def colorir_tipo(val):
    color = VERDE if val == "Nova loja" else AZUL_MEDIO
    return f"color: {color}; font-weight: 600"

st.dataframe(
    ranking_display.style.applymap(colorir_tipo, subset=["Tipo"]),
    use_container_width=True,
    height=400,
)

col_tv, col_tl = st.columns(2)
with col_tv:
    st.markdown(
        f'<div class="highlight-box">🥇 <b>Top Vendedor:</b> {kpis["top_vendedor"]}</div>',
        unsafe_allow_html=True,
    )
with col_tl:
    st.markdown(
        f'<div class="highlight-box">🏅 <b>Top Lojista:</b> {kpis["top_lojista"]}</div>',
        unsafe_allow_html=True,
    )

st.markdown("---")

# ═══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 3 — Recompras vs Novas Lojas
# ═══════════════════════════════════════════════════════════════════════════════
st.markdown("## 🔄 Recompras vs Novas Lojas")

df["semana"] = df["data_pedido"].dt.to_period("W").apply(lambda r: r.start_time)

semanal = (
    df.groupby(["semana", "tipo"])["total_venda"]
    .sum()
    .reset_index()
)

col_bar, col_donut = st.columns(2)

with col_bar:
    fig_bar = go.Figure()
    for tipo, cor in [("Recompra", AZUL_MEDIO), ("Nova loja", VERDE)]:
        subset = semanal[semanal["tipo"] == tipo]
        fig_bar.add_trace(
            go.Bar(
                x=subset["semana"].dt.strftime("Sem %d/%m"),
                y=subset["total_venda"],
                name=tipo,
                marker_color=cor,
                hovertemplate="%{x}<br>%{y:,.2f}<extra>" + tipo + "</extra>",
            )
        )
    fig_bar.update_layout(
        barmode="stack",
        title="Faturamento semanal por tipo",
        xaxis_title="Semana",
        yaxis_title="Faturamento (R$)",
        legend=dict(orientation="h", y=1.1),
        plot_bgcolor=CINZA,
        paper_bgcolor="white",
        margin=dict(t=60, b=40),
    )
    st.plotly_chart(fig_bar, use_container_width=True)

with col_donut:
    fat_tipo = df.groupby("tipo")["total_venda"].sum().reset_index()
    fig_donut = go.Figure(
        go.Pie(
            labels=fat_tipo["tipo"],
            values=fat_tipo["total_venda"],
            hole=0.5,
            marker_colors=[AZUL_MEDIO, VERDE],
            hovertemplate="%{label}<br>R$ %{value:,.2f}<br>%{percent}<extra></extra>",
        )
    )
    fig_donut.update_layout(
        title="Proporção por valor",
        legend=dict(orientation="h", y=-0.1),
        margin=dict(t=60, b=40),
    )
    st.plotly_chart(fig_donut, use_container_width=True)

st.markdown("---")

# ═══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 4 — Evolução por Período
# ═══════════════════════════════════════════════════════════════════════════════
st.markdown("## 📈 Evolução por Período")

granularidade = st.radio(
    "Agrupamento",
    ["Por dia", "Por semana"],
    horizontal=True,
)

if granularidade == "Por dia":
    df["periodo"] = df["data_pedido"].dt.date
else:
    df["periodo"] = df["semana"].dt.date

evolucao = (
    df.groupby("periodo")
    .agg(faturamento=("total_venda", "sum"), pedidos=("total_venda", "count"))
    .reset_index()
    .sort_values("periodo")
)

media = evolucao["faturamento"].mean()

fig_linha = go.Figure()
fig_linha.add_trace(
    go.Scatter(
        x=evolucao["periodo"],
        y=evolucao["faturamento"],
        mode="lines+markers",
        name="Faturamento",
        line=dict(color=AZUL_ESCURO, width=2.5),
        marker=dict(size=7),
        customdata=evolucao[["pedidos"]],
        hovertemplate=(
            "<b>%{x}</b><br>"
            "Faturamento: R$ %{y:,.2f}<br>"
            "Pedidos: %{customdata[0]}<extra></extra>"
        ),
    )
)
fig_linha.add_trace(
    go.Scatter(
        x=evolucao["periodo"],
        y=[media] * len(evolucao),
        mode="lines",
        name=f"Média ({fmt_brl(media)})",
        line=dict(color=VERMELHO, width=1.5, dash="dash"),
        hoverinfo="skip",
    )
)
fig_linha.update_layout(
    xaxis_title="Período",
    yaxis_title="Faturamento (R$)",
    plot_bgcolor=CINZA,
    paper_bgcolor="white",
    legend=dict(orientation="h", y=1.05),
    margin=dict(t=40, b=40),
)
st.plotly_chart(fig_linha, use_container_width=True)

st.markdown("---")

# ═══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 5 — Mix de Produtos
# ═══════════════════════════════════════════════════════════════════════════════
st.markdown("## 📊 Mix de Produtos")

df_itens = processar_itens(df)

if df_itens.empty:
    st.info("Nenhum item de produto encontrado nos pedidos filtrados.")
else:
    top_valor = (
        df_itens.groupby("descricao_produto")["valor_total_item"]
        .sum()
        .nlargest(10)
        .reset_index()
        .sort_values("valor_total_item")
    )
    top_qtd = (
        df_itens.groupby("descricao_produto")["quantidade"]
        .sum()
        .nlargest(10)
        .reset_index()
        .sort_values("quantidade")
    )

    col_pv, col_pq = st.columns(2)

    with col_pv:
        fig_valor = go.Figure(
            go.Bar(
                x=top_valor["valor_total_item"],
                y=top_valor["descricao_produto"],
                orientation="h",
                marker_color=AZUL_ESCURO,
                hovertemplate="%{y}<br>R$ %{x:,.2f}<extra></extra>",
            )
        )
        fig_valor.update_layout(
            title="Top 10 por Valor (R$)",
            xaxis_title="Valor total (R$)",
            plot_bgcolor=CINZA,
            paper_bgcolor="white",
            margin=dict(t=50, b=40, l=180),
        )
        st.plotly_chart(fig_valor, use_container_width=True)

    with col_pq:
        fig_qtd = go.Figure(
            go.Bar(
                x=top_qtd["quantidade"],
                y=top_qtd["descricao_produto"],
                orientation="h",
                marker_color=AZUL_MEDIO,
                hovertemplate="%{y}<br>Qtd: %{x:,.0f}<extra></extra>",
            )
        )
        fig_qtd.update_layout(
            title="Top 10 por Quantidade",
            xaxis_title="Quantidade vendida",
            plot_bgcolor=CINZA,
            paper_bgcolor="white",
            margin=dict(t=50, b=40, l=180),
        )
        st.plotly_chart(fig_qtd, use_container_width=True)

st.markdown("---")

# ═══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 6 — Géis
# ═══════════════════════════════════════════════════════════════════════════════
st.markdown("## 🧴 Géis: Saída Diária + Resultado Semanal")

if df_itens.empty:
    st.info("Nenhum item disponível para filtrar géis.")
else:
    df_gel = df_itens[
        df_itens["descricao_produto"].str.contains("gel", case=False, na=False)
    ].copy()

    if df_gel.empty:
        st.info("Nenhum produto de gel encontrado no período selecionado.")
    else:
        df_gel["data"] = pd.to_datetime(df_gel["data_pedido"]).dt.date

        # Tabela pivot diária
        pivot = (
            df_gel.groupby(["data", "descricao_produto"])["quantidade"]
            .sum()
            .unstack(fill_value=0)
            .reset_index()
        )
        pivot.columns.name = None
        pivot = pivot.rename(columns={"data": "Data"})

        st.markdown("### Quantidade vendida por dia")
        st.dataframe(pivot, use_container_width=True)

        # Cards de resumo semanal
        total_unidades_gel = df_gel["quantidade"].sum()
        total_fat_gel = df_gel["valor_total_item"].sum()

        mais_vendido_qtd = (
            df_gel.groupby("descricao_produto")["quantidade"].sum().idxmax()
        )
        mais_fat_gel = (
            df_gel.groupby("descricao_produto")["valor_total_item"].sum().idxmax()
        )

        cg1, cg2, cg3, cg4 = st.columns(4)
        with cg1:
            st.markdown(
                kpi_card("📦 Total unidades", f"{total_unidades_gel:,.0f}", color_class="dark"),
                unsafe_allow_html=True,
            )
        with cg2:
            st.markdown(
                kpi_card("💰 Total faturado (géis)", fmt_brl(total_fat_gel)),
                unsafe_allow_html=True,
            )
        with cg3:
            st.markdown(
                kpi_card("🏆 Mais vendido (un.)", mais_vendido_qtd, color_class="green"),
                unsafe_allow_html=True,
            )
        with cg4:
            st.markdown(
                kpi_card("💎 Mais faturado (R$)", mais_fat_gel, color_class="green"),
                unsafe_allow_html=True,
            )

        # Gráfico de barras géis
        gel_total = (
            df_gel.groupby("descricao_produto")["quantidade"]
            .sum()
            .reset_index()
            .sort_values("quantidade", ascending=False)
        )
        fig_gel = go.Figure(
            go.Bar(
                x=gel_total["descricao_produto"],
                y=gel_total["quantidade"],
                marker_color=VERDE,
                hovertemplate="%{x}<br>Qtd: %{y:,.0f}<extra></extra>",
            )
        )
        fig_gel.update_layout(
            title="Quantidade total por produto gel",
            xaxis_title="Produto",
            yaxis_title="Quantidade",
            plot_bgcolor=CINZA,
            paper_bgcolor="white",
            margin=dict(t=50, b=120),
            xaxis=dict(tickangle=-30),
        )
        st.plotly_chart(fig_gel, use_container_width=True)
