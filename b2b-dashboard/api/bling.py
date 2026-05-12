import time
import requests
from pathlib import Path
import config


BASE_URL = "https://www.bling.com.br/Api/v3"
ENV_FILE = Path(__file__).parent.parent / ".env"


class BlingAPI:
    def __init__(self):
        self.access_token = config.BLING_ACCESS_TOKEN
        self.refresh_token_value = config.BLING_REFRESH_TOKEN
        self.client_id = config.BLING_CLIENT_ID
        self.client_secret = config.BLING_CLIENT_SECRET
        self._contato_cache: dict = {}

    def refresh_token(self):
        response = requests.post(
            f"{BASE_URL}/oauth/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": self.refresh_token_value,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
            },
        )
        response.raise_for_status()
        tokens = response.json()
        self.access_token = tokens["access_token"]
        self.refresh_token_value = tokens["refresh_token"]
        self._persist_tokens()

    def _persist_tokens(self):
        if not ENV_FILE.exists():
            return

        lines = ENV_FILE.read_text().splitlines()
        updated = {}
        new_values = {
            "BLING_ACCESS_TOKEN": self.access_token,
            "BLING_REFRESH_TOKEN": self.refresh_token_value,
        }

        result_lines = []
        for line in lines:
            key = line.split("=", 1)[0] if "=" in line else None
            if key in new_values:
                result_lines.append(f"{key}={new_values[key]}")
                updated[key] = True
            else:
                result_lines.append(line)

        for key, value in new_values.items():
            if key not in updated:
                result_lines.append(f"{key}={value}")

        ENV_FILE.write_text("\n".join(result_lines) + "\n")

    def _get(self, endpoint: str, params: dict = None) -> dict:
        if params is None:
            params = {}

        time.sleep(0.3)
        headers = {"Authorization": f"Bearer {self.access_token}"}
        url = f"{BASE_URL}/{endpoint}"

        response = requests.get(url, headers=headers, params=params)

        if response.status_code == 401:
            self.refresh_token()
            headers = {"Authorization": f"Bearer {self.access_token}"}
            time.sleep(0.3)
            response = requests.get(url, headers=headers, params=params)

        if not response.ok:
            raise RuntimeError(
                f"Erro na API Bling [{response.status_code}] "
                f"{endpoint}: {response.text[:300]}"
            )

        return response.json()

    def get_pedidos(self, data_inicio: str, data_fim: str) -> list:
        pedidos = []
        pagina = 1

        while True:
            resultado = self._get(
                "pedidos/vendas",
                params={
                    "dataInicial": data_inicio,
                    "dataFinal": data_fim,
                    "pagina": pagina,
                },
            )
            data = resultado.get("data", [])
            if not data:
                break
            pedidos.extend(data)
            pagina += 1

        return pedidos

    def get_contato(self, id_contato: int) -> dict:
        if id_contato in self._contato_cache:
            return self._contato_cache[id_contato]

        resultado = self._get(f"contatos/{id_contato}")
        contato = resultado.get("data", {})
        self._contato_cache[id_contato] = contato
        return contato

    def get_produtos_pedido(self, pedido: dict) -> list:
        itens = pedido.get("itens", [])
        produtos = []
        for item in itens:
            produto = item.get("produto", {})
            produtos.append(
                {
                    "codigo": produto.get("codigo", ""),
                    "descricao": produto.get("descricao", ""),
                    "quantidade": item.get("quantidade", 0),
                    "valorUnitario": item.get("valor", 0),
                    "valorTotal": item.get("valor", 0) * item.get("quantidade", 0),
                }
            )
        return produtos
