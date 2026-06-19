# IST Micro - Sensor+Test 2026 Fuarı Kontak ve Talep Listesi

**Tarih:** 9-11 Haziran 2026, Nürnberg, Almanya

Bu repo, Sensor+Test 2026 fuarında toplanan kartvizit ve rozetlerden oluşturulmuş kontak ve talep listesini içerir.

## İçerik

- `ist_micro_contacts_firma_talep.xlsx` — Ana Excel dosyası (5.4 MB, 4 sayfa)
  - **Talep Listesi** — Öncelik sıralı, renk kodlu talep tablosu (~75 firma talebi)
  - **Tüm Kişiler** — 162+ kişi, her birine gömülü kartvizit görseli
  - **Email Listesi** — E-posta adresleri, talep olanlar vurgulu
  - **İstatistikler** — KPI kartları ve kategori dağılımı
- `firma_talepleri.csv` — Talep listesi dışa aktarım (75 satır)
- `firma_kartvizitleri_tum_liste.csv` — Tüm kişi/kartvizit listesi (84 satır)
- `firma_talepleri.xlsx` — Talep listesi yedek Excel
- `extracted/` — Kamera ve WhatsApp kaynak görselleri
- `kartvizitler/` — Firma bazlı kartvizit PDF/TIFF kaynakları
- `create_excel.py`, `create_excel_v2.py` — Excel oluşturma betikleri
- `use_opencode_auto.sh` — Otomatik iş akışı betiği

## Kolon Açıklamaları

- **Firma Tipi:** 🟦 Üretici / 🟪 Distribütör / 🟣 Savunma-Havacılık / 🟨 Ar-Ge-Eğitim
- **Öncelik:** Kırmızı (Yüksek) → Turuncu → Sarı → Yeşil (Düşük)
- **Durum:** Yeşil (Net talep) / Sarı (Belirsiz) / Mor (Tedarikçi)
- **Kartvizit:** Her kişi satırında gömülü kartvizit görseli (L sütunu)

## Kartvizit Görselleri

Ana Excel'deki **Tüm Kişiler** sayfasında 162 kişinin her biri için doğrudan gömülü kartvizit görseli bulunur.
Kaynak dosyalardaki tüm kartvizitler taranmış, kırpılmış ve Excel'e eklenmiştir.
