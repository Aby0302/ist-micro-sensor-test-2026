#!/usr/bin/env python3
"""
IST Micro - Yeni Müşteri Adayı Import Scripti
Sektör rehberlerinden toplanan CSV/Excel dosyalarını Customers API'sine import eder.
Segmentasyon otomatik yapılır.

Kullanım:
  python3 prospect_import.py --file yeni_adaylar.csv
  python3 prospect_import.py --file yeni_adaylar.xlsx

CSV Beklenen Sütunlar: firma, kisi, email, telefon, ulke, sehir, web, notlar
Excel Beklenen Sütunlar: aynı isimlerde başlıklar
"""

import json
import csv
import sys
import argparse
from pathlib import Path

URUN_ANAHTARLARI = {
    "pt100": "Pt100",
    "pt500": "Pt500",
    "pt200": "Pt200",
    "pt1000": "Pt1000",
    "rtd": "Pt Sicaklik Sensorleri",
    "platin": "Pt Sicaklik Sensorleri",
    "sicaklik": "Pt Sicaklik Sensorleri",
    "temperature": "Pt Sicaklik Sensorleri",
    "termokupl": "Termokupl",
    "thermocouple": "Termokupl",
    "thermowell": "Termokupl",
    "ntc": "Termistorler",
    "ptc": "Termistorler",
    "termistor": "Termistorler",
    "basinc": "Basinc Sensorleri",
    "pressure": "Basinc Sensorleri",
    "gaz": "Gaz Akis Sensorleri",
    "akis": "Gaz Akis Sensorleri",
    "flow": "Gaz Akis Sensorleri",
    "mikro isitici": "Mikro Isiticilar",
    "micro heater": "Mikro Isiticilar",
    "heater": "Mikro Isiticilar",
    "sensor": "Genel",
    "sensör": "Genel",
}


def segment_et(notlar: str) -> list:
    text = notlar.lower()
    eslesen = set()
    for anahtar, urun_adi in URUN_ANAHTARLARI.items():
        if anahtar in text:
            if urun_adi != "Genel":
                eslesen.add(urun_adi)
    if not eslesen:
        eslesen.add("Genel")
    return sorted(eslesen)


def import_csv(path: Path) -> list:
    contacts = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter=None)
        sniffer = csv.Sniffer()
        f.seek(0)
        dialect = sniffer.sniff(f.read(4096))
        f.seek(0)
        reader = csv.DictReader(f, dialect=dialect)
        for row in reader:
            firma = (row.get("firma") or row.get("company") or row.get("sirket") or "").strip()
            kisi = (row.get("kisi") or row.get("contact_person") or row.get("ad") or "").strip()
            email = (row.get("email") or row.get("e-posta") or "").strip()
            telefon = (row.get("telefon") or row.get("phone") or "").strip()
            ulke = (row.get("ulke") or row.get("country") or "").strip()
            sehir = (row.get("sehir") or row.get("city") or "").strip()
            web = (row.get("web") or row.get("website") or "").strip()
            notlar = (row.get("notlar") or row.get("notes") or "").strip()
            notlar_full = f"{firma} {kisi} {notlar}"
            segments = segment_et(notlar_full)
            contacts.append({
                "company": firma,
                "contactPerson": kisi,
                "email": email,
                "phone": telefon,
                "country": ulke,
                "city": sehir,
                "website": web,
                "notes": notlar,
                "tags": ",".join(segments),
                "source": "Sektor Rehberi",
            })
    return contacts


def main():
    parser = argparse.ArgumentParser(description="Yeni müşteri adaylarını import et")
    parser.add_argument("--file", required=True, help="CSV veya Excel dosya yolu")
    args = parser.parse_args()

    path = Path(args.file)
    if not path.exists():
        print(f"Hata: Dosya bulunamadı: {path}")
        sys.exit(1)

    if path.suffix.lower() == ".csv":
        contacts = import_csv(path)
    else:
        print("Desteklenen format: CSV")
        sys.exit(1)

    out_path = Path(__file__).parent / "prospect_api_import.json"
    out_path.write_text(json.dumps(contacts, ensure_ascii=False, indent=2), encoding="utf-8")

    segment_counts = {}
    for c in contacts:
        for s in c["tags"].split(","):
            segment_counts[s] = segment_counts.get(s, 0) + 1

    print(f"✔ {len(contacts)} aday import edildi -> {out_path}")
    print(f"  Segmentler: {json.dumps(segment_counts, ensure_ascii=False)}")
    print(f"\nAPI'ye yüklemek için:")
    print(f"  curl -X POST https://istmicro.com/api/v1/customers \\")
    print(f"    -H 'X-API-Key: API_ANAHTARINIZ' \\")
    print(f"    -H 'Content-Type: application/json' \\")
    print(f"    -d @{out_path}")


if __name__ == "__main__":
    main()
