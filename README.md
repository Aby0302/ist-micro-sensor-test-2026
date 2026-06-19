# IST Micro — Sensor+Test 2026 Fuar & E-posta Otomasyon Sistemi

**Tarih:** 9-11 Haziran 2026, Nürnberg, Almanya  
**Şirket:** IST Micro Sensör Teknolojileri AŞ  
**Web:** [istmicro.com](https://istmicro.com) | **E-posta:** info@istmicro.com

---

## Genel Bakış

Bu repo, Sensor+Test 2026 fuarında toplanan kontak verilerini ve bu veriler üzerinde çalışan **n8n e-posta otomasyon sistemini** içerir. Amaç: fuardan toplanan müşteri adaylarını e-posta kampanyaları ile beslemek, ilgilerini takip etmek ve sipariş aşamasına kadar yönlendirmek.

---

## İçindekiler

| Dosya/Klasör | Açıklama |
|---|---|
| `ist_micro_contacts_firma_talep.xlsx` | Ana Excel (4 sayfa: Talep Listesi, Tüm Kişiler, Email Listesi, İstatistikler) |
| `workflows/` | n8n workflow dosyaları (SDK), bilgi bazı, REST API spec, pipeline yöneticisi |
| `workflows/musteri_listesi_email.csv` | 31 müşteri adayı e-posta listesi (zenginleştirilmiş) |
| `workflows/ist_micro_bilgi_baz.json` | Şirket bilgi bazı (ürünler, SSS, pazarlama kuralları) |
| `workflows/istmicro_rest_api_spec.md` | Önerilen ASP.NET REST API spesifikasyonu (70 endpoint) |
| `workflows/customer_pipeline.py` | Müşteri aşama yönetim scripti |
| `workflows/exchange_reply_sdk.js` | Exchange/Outlook API ile e-posta yanıtlama workflow kodu |
| `workflows/email_campaign_sdk.js` | E-posta kampanyası workflow kodu |
| `workflows/followup_pipeline_sdk.js` | Takip & sipariş pipeline workflow kodu |
| `email_templates/` | HTML e-posta şablonları (welcome, followup, offer) |
| `extracted/` | Kamera ve WhatsApp kaynak görselleri |
| `extracted/pdfs/` | PDF kartvizit kaynakları |
| `kartvizitler/` | Firma bazlı kartvizit PDF/TIFF kaynakları |

---

## n8n Workflow'ları

5 workflow **n8n üzerinde aktiftir** (n8n MCP ile oluşturuldu):

| Workflow | ID | Açıklama |
|---|---|---|
| 📧 **Müşteri E-posta Kampanyası** | `Fqz1UAeqWhc7NVyT` | CSV'den okur, filtreler, kişiselleştirir, SMTP ile gönderir |
| 👁️ **E-posta Takip Webhook** | `T15vpmIPc7XIKcfd` | Açılma/tıklanma takibi (aktif, test edildi ✅) |
| 🔄 **Takip & Sipariş Süreci** | `TaWQQh2nVi3PJMzM` | Haftaiçi 09:00'da çalışır, pipeline aşamalarını yönetir |
| 📥 **Exchange E-posta Yanıtları** | `2jYlcTyw208PbGJb` | Exchange/Outlook API ile gelen yanıtları okur ve bilgi bazına göre yanıtlar |
| 🌐 **Web Sitesi Senkronizasyonu** | `xmVwMmuTavITjCUr` | istmicro.com'u haftada bir tarar, meta verileri çıkarır, bilgi bazını günceller |

**Tracking Webhook URL:** `https://n8n.retailerway.com/webhook/email-takip`

---

## Pipeline (Müşteri Aşamaları)

```
yeni → email_gonderildi → email_acildi → ilgilendi → teklif_gonderildi → siparis_asamasi
```

- `customer_pipeline.py` ile CLI üzerinden yönetilir
- `musteri_pipeline.json` ve `yanitlanan_mesajlar.json` otomatik oluşturulur
- Exchange/Outlook API ile gelen yanıtlar otomatik olarak pipeline'ı günceller

---

## E-posta Sistemi

| Özellik | Detay |
|---|---|
| **Gönderim (SMTP)** | `noreply@istmicro.com.tr` — kampanya e-postaları |
| **Yanıt Okuma (Exchange API)** | `istmicro@istmicro.com.tr` — gelen kutusu |
| **Yanıtlama** | Yalnızca bilgi bazı eşleşmesi, **AI yok**, keyword matching |
| **Takip Kodu** | `[IST-XXXXX]` formatı, Reply-To başlığı |
| **Tracking** | 1x1 GIF pixel + link yeniden yönlendirme |
| **Şablonlar** | `email_templates/` — welcome, followup, offer |

---

## Bilgi Bazı (Knowledge Base)

`workflows/ist_micro_bilgi_baz.json` — aşağıdaki alanları kapsar:

- **Şirket bilgisi** — ad, iletişim, sektör
- **9 ürün kategorisi** — Platin RTD, NTC, Thermowell, Basınç, Akış, Gaz, Mikro Isıtıcı, MEMS, Özel Çözümler
- **15 SSS** — fiyat, teslimat, numune, distribütör, kalite, fuar vs.
- **5 pazarlama kısıtlaması** — fiyat/stok/rakip bilgisi verilmez
- **Güvenli düşüş mesajı** — eşleşmeyen sorular için

Bilgi bazı manuel olarak veya **Web Sitesi Senkronizasyonu** workflow'u ile otomatik güncellenir.

---

## REST API Spec

`workflows/istmicro_rest_api_spec.md` — ASP.NET Core Web API için 70 endpoint'lik tam spec:

- Authentication (JWT)
- Ürün/Kategori/Distribütör CRUD
- Müşteri yönetimi + pipeline
- E-posta kampanyaları, şablonlar, loglar
- Dosya yönetimi (DataSheet PDF)
- Analytics dashboard
- Export/Import (CSV, XLSX, PDF)
- Swagger/OpenAPI

---

## Kurulum

### n8n Workflow'ları
1. n8n'de "SMTP account" credential'ı oluşturun
2. "Microsoft Outlook OAuth2" credential'ı oluşturun
3. 📥 Exchange E-posta Yanıtları workflow'unu etkinleştirin
4. Tracking webhook'unun aktif olduğunu doğrulayın
5. Kampanya ve pipeline workflow'larını başlatın

### REST API (ASP.NET)
Geliştiriciye `workflows/istmicro_rest_api_spec.md` verilir. Önerilen komut:
```
dotnet new webapi -n IstMicro.Api
```

---

## Renk Kodları (Excel Talep Listesi)

| Firma Tipi | Öncelik | Durum |
|---|---|---|
| 🟦 Üretici | 🔴 Yüksek | 🟢 Net talep |
| 🟪 Distribütör | 🟠 Orta | 🟡 Belirsiz |
| 🟣 Savunma/Havacılık | 🟡 Düşük | 🟣 Tedarikçi |
| 🟨 Ar-Ge/Eğitim | 🟢 Bilgi | |
