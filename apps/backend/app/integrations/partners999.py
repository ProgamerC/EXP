import base64
import os
from typing import Dict, Any, Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

API_BASE = "https://partners-api.999.md"

# Настройки ретраев/бэк-оффа из .env
RETRY_TOTAL = int(os.getenv("N999_RETRY_TOTAL", "5"))
RETRY_BACKOFF = float(os.getenv("N999_RETRY_BACKOFF", "0.6"))  # секунды; backoff_factor
RETRY_STATUSES = (429, 502, 503, 504)


def _session() -> requests.Session:
    """Session с ретраями на 429/5xx и экспоненциальным бэк-оффом."""
    s = requests.Session()
    retry = Retry(
        total=RETRY_TOTAL,
        backoff_factor=RETRY_BACKOFF,
        status_forcelist=RETRY_STATUSES,
        allowed_methods=frozenset(["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"]),
        raise_on_status=False,
        respect_retry_after_header=True,
    )
    adapter = HTTPAdapter(max_retries=retry)
    s.mount("https://", adapter)
    s.mount("http://", adapter)
    return s


def _auth_header() -> Dict[str, str]:
    api_key = os.getenv("N999_API_KEY", "")
    if not api_key:
        raise RuntimeError("N999_API_KEY is not set")
    # Basic <base64(api_key:)>
    token = base64.b64encode(f"{api_key}:".encode()).decode()
    return {"Authorization": f"Basic {token}"}


def get_adverts(page: int = 1, page_size: int = 50, states: Optional[str] = None, lang: Optional[str] = None) -> Dict[str, Any]:
    params = {"page": page, "page_size": page_size}
    if states:
        params["states"] = states  # e.g. 'public,hidden'
    if lang:
        params["lang"] = lang
    resp = _session().get(f"{API_BASE}/adverts", headers=_auth_header(), params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def get_advert(advert_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
    params = {}
    if lang:
        params["lang"] = lang
    resp = _session().get(f"{API_BASE}/adverts/{advert_id}", headers=_auth_header(), params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def get_advert_features(advert_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
    params = {}
    if lang:
        params["lang"] = lang
    resp = _session().get(f"{API_BASE}/adverts/{advert_id}/features", headers=_auth_header(), params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()

import requests

def get_public_ad_html(advert_id: str, lang: str = "ro") -> str:
    """
    Получает HTML публичной страницы объявления (fallback, если API не дал images).
    Пример URL: https://999.md/ro/88470725
    """
    lang = (lang or "ro").lower()
    # id может открываться и по /ro/{id} и по /ro/view/{id}; упрощённый вариант:
    url = f"https://999.md/{lang}/{advert_id}"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return resp.text

