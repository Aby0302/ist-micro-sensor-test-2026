#!/usr/bin/env python3
"""
Müşteri Aşama Yönetim Sistemi
n8n workflow'u ile birlikte kullanılır.
Aşamalar: yeni -> email_gonderildi -> email_acildi -> ilgilendi -> teklif_gonderildi -> siparis_asamasi
"""

import csv
import json
import os
import sys
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(BASE_DIR, "workflows", "musteri_listesi_email.csv")
PIPELINE_FILE = os.path.join(BASE_DIR, "workflows", "musteri_pipeline.json")

STAGES = [
    "yeni",
    "email_gonderildi",
    "email_acildi",
    "ilgilendi",
    "teklif_gonderildi",
    "siparis_asamasi",
]


def load_customers():
    customers = []
    with open(DATA_FILE, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            row["asama"] = row.get("asama", "yeni")
            row["email_sayisi"] = int(row.get("email_sayisi", 0))
            row["son_etkilesim"] = row.get("son_etkilesim", "")
            customers.append(row)
    return customers


def save_pipeline(customers):
    with open(PIPELINE_FILE, "w", encoding="utf-8") as f:
        json.dump(
            {
                "son_guncelleme": datetime.now().isoformat(),
                "musteri_sayisi": len(customers),
                "asama_dagilimi": {
                    s: sum(1 for c in customers if c["asama"] == s) for s in STAGES
                },
                "musteriler": [
                    {
                        "firma": c["Firma"],
                        "kisi": c.get("Kişi", ""),
                        "email": c.get("E-posta", ""),
                        "talep": c.get("Ne istiyor", ""),
                        "asama": c["asama"],
                        "email_sayisi": c["email_sayisi"],
                        "son_etkilesim": c["son_etkilesim"],
                    }
                    for c in customers
                ],
            },
            f,
            ensure_ascii=False,
            indent=2,
        )


def stage_index(asama):
    return STAGES.index(asama) if asama in STAGES else -1


def ilerlet(firma_kisi, yeni_asama):
    customers = load_customers()
    for c in customers:
        if c["Firma"] == firma_kisi[0] and c.get("Kişi", "") == firma_kisi[1]:
            mevcut = stage_index(c["asama"])
            hedef = stage_index(yeni_asama)
            if hedef > mevcut:
                c["asama"] = yeni_asama
                c["son_etkilesim"] = datetime.now().isoformat()
                save_pipeline(customers)
                return True
    return False


def email_kaydet(firma_kisi):
    customers = load_customers()
    for c in customers:
        if c["Firma"] == firma_kisi[0] and c.get("Kişi", "") == firma_kisi[1]:
            c["email_sayisi"] += 1
            if c["asama"] == "yeni":
                c["asama"] = "email_gonderildi"
            c["son_etkilesim"] = datetime.now().isoformat()
            save_pipeline(customers)
            return True
    return False


def rapor():
    customers = load_customers()
    print(f"Toplam müşteri: {len(customers)}")
    print(f"\nAşama Dağılımı:")
    for s in STAGES:
        sayi = sum(1 for c in customers if c["asama"] == s)
        print(f"  {s}: {sayi}")
    print(f"\nEmail gönderilebilecek (e-posta adresi olan): {sum(1 for c in customers if c.get('E-posta', '').strip())}")
    print(f"Sipariş aşamasına yakın (ilgilendi+): {sum(1 for c in customers if stage_index(c['asama']) >= stage_index('ilgilendi'))}")
    return customers


def stats_to_json():
    customers = load_customers()
    stats = {
        "toplam": len(customers),
        "email_var": sum(1 for c in customers if c.get("E-posta", "").strip()),
        "email_yok": sum(1 for c in customers if not c.get("E-posta", "").strip()),
        "asama_dagilimi": {},
        "siparis_asamasi": 0,
    }
    for s in STAGES:
        sayi = sum(1 for c in customers if c["asama"] == s)
        stats["asama_dagilimi"][s] = sayi
        if stage_index(s) >= stage_index("ilgilendi"):
            stats["siparis_asamasi"] += sayi
    return stats


if __name__ == "__main__":
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "rapor":
            rapor()
        elif cmd == "stats":
            print(json.dumps(stats_to_json(), ensure_ascii=False, indent=2))
        elif cmd == "ilerlet" and len(sys.argv) >= 4:
            firma = sys.argv[2]
            asama = sys.argv[3]
            ilerlet((firma, ""), asama)
            print(f"{firma} -> {asama}")
        elif cmd == "email_kaydet" and len(sys.argv) >= 3:
            firma = sys.argv[2]
            email_kaydet((firma, ""))
            print(f"{firma}: email kaydedildi")
        else:
            print("Kullanım:")
            print("  python customer_pipeline.py rapor")
            print("  python customer_pipeline.py stats")
            print('  python customer_pipeline.py ilerlet "Firma Adı" teklif_gonderildi')
            print('  python customer_pipeline.py email_kaydet "Firma Adı"')
    else:
        save_pipeline(load_customers())
        rapor()
