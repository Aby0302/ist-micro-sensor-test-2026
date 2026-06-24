#!/usr/bin/env python3
"""
IST Micro - E-posta Şablonlarını API'ye Yükleme Scripti
Kullanım:
  python3 sablon_import.py --api-key API_ANAHTARINIZ
"""

import json
import sys
import argparse
import urllib.request
import urllib.error
from pathlib import Path

SABLON_PATH = Path(__file__).parent / "email_sablonlari.json"
API_BASE = "https://istmicro.com/api/v1/templates"


def main():
    parser = argparse.ArgumentParser(description="E-posta sablonlarini API'ye yukle")
    parser.add_argument("--api-key", required=True, help="API anahtari")
    parser.add_argument("--api-base", default=API_BASE, help="API base URL")
    args = parser.parse_args()

    sablonlar = json.loads(SABLON_PATH.read_text(encoding="utf-8"))

    headers = {
        "X-API-Key": args.api_key,
        "Content-Type": "application/json",
    }

    for sablon in sablonlar:
        # Convert camelCase to snake_case for ASP.NET API
        snake = {}
        for k, v in sablon.items():
            snake_key = ''.join(['_' + c.lower() if c.isupper() else c for c in k]).lstrip('_')
            snake[snake_key] = v
        if "campaigns" not in snake:
            snake["campaigns"] = []
        data = json.dumps(snake, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(
            args.api_base,
            data=data,
            headers=headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(req) as resp:
                result = json.loads(resp.read())
                print(f"✔ {sablon['name']} -> ID: {result.get('id', '?')}")
        except urllib.error.HTTPError as e:
            print(f"✘ {sablon['name']} -> HTTP {e.code}: {e.read().decode()}")

    print("\nTamam. Sablonlar yuklendi.")


if __name__ == "__main__":
    main()
