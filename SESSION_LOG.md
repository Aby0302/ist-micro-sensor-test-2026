# Sohbet Kaydı — IST Micro / Sensor+Test 2026

**Tarih:** 16 Haziran 2026
**Platform:** opencode CLI

---

## 1. Başlangıç — Kartvizitlerden Kişi Listesi

**Talep:** WhatsApp'tan gelen 12 kartvizit görselindeki kişileri oku, Excel'e işle.

**Yapılanlar:**
- 12 WhatsApp JPEG görseli Tesseract OCR ile okundu
- 20 adet kamera HEIC fotoğrafı (fuar rozetleri) da işlendi
- Toplam ~81 benzersiz kişi tespit edildi
- İlk Excel: `Fuar_Kartvizitler.xlsx` → `Fuar_Kartvizitler_v2.xlsx`

## 2. Web Araştırması — Eksik İletişim Bilgileri

**Talep:** E-posta adresi olmayan kişilerin bilgilerini web'den bul.

**Yapılanlar:**
- 30+ kişi/firma için web araması yapıldı
- E-posta kapsama oranı: 48/81 → **76/81** (5 kişi bulunamadı)
- Bulunamayanlar: Fethi Hakbilen (ROKETSAN), Vishnuprasad (Schaeffler), Aleksandr Skripkin (TU Saratow), Corinna Kaulen (OTH Regensburg), Thiruvarul Durai (AMT GmbH)

## 3. Talep Sütunları Ekleme

**Talep:** "Ne istiyor / Ne kadar istiyor" sütunlarını ekle.

**Yapılanlar:**
- Firma Talep Özeti sayfasından veriler eşleştirildi
- 13 kişiye talep bilgisi girildi (kartvizitlerdeki el yazılarından)

## 4. Excel Tasarımı — Sıfırdan Yeniden Düzenleme

**Talep:** Tablo karışık, yeniden tasarla.

**Yapılanlar:**
- Tek sayfa → **4 sayfa** olarak yeniden düzenlendi:
  1. **Talep Listesi** — Öncelik renk kodlu (Kırmızı→Yeşil), 11 firma
  2. **Tüm Kişiler** — 78 kişi
  3. **Email Listesi** — 73 e-posta
  4. **İstatistikler** — KPI kartları + kategori dağılımı

## 5. Firma Tipi Sınıflandırması

**Talep:** Hangi firma distribütör vs. olduğunu ekle.

**Yapılanlar:**
- Tüm firmalar sınıflandırıldı:
  - 🟦 **Üretici** (53 kişi)
  - 🟪 **Distribütör** (11 kişi) — Trem Trading (IST distribütörü), Turkuaz, TELTEC, GS Electronic, Sourcewell, Tempcontrol, MESUREX, NOVA Elektrik, HROC, VIP PULSE
  - 🟣 **Savunma/Havacılık** (8 kişi) — ROKETSAN, Turkish Aerospace, Pavelsis, OHB, İlter Savunma, TUALCOM
  - 🟨 **Ar-Ge/Eğitim** (5 kişi) — Fraunhofer, DLR, OTH Regensburg, TU Saratow, Research Centre Řež
  - 🟩 **Medya/Organizasyon** (1 kişi) — SENSOR CHINA
- Tüm sayfalara "Firma Tipi" sütunu eklendi

## 6. GitHub Repo

**Talep:** Repo oluştur, push et.

**Yapılanlar:**
- Repo: https://github.com/Aby0302/ist-micro-sensor-test-2026
- İçerik: `ist_micro_contacts_firma_talep.xlsx`, `README.md`, `.gitignore`, `SESSION_LOG.md`

---

## Dosya Yapısı

```
/mnt/downloads/sensors+test-2026/
├── ist_micro_contacts_firma_talep.xlsx   # Ana Excel (4 sayfa)
├── README.md                              # Repo açıklaması
├── SESSION_LOG.md                         # Bu dosya (sohbet kaydı)
├── .gitignore
├── opencode.json                          # n8n MCP yapılandırması (git'te yok)
├── create_excel.py / create_excel_v2.py   # Python scriptleri (git'te yok)
├── Fu ar_Kartvizitler.xlsx / _v2.xlsx      # Önceki versiyonlar (git'te yok)
├── whatsapp_images/                        # 12 JPEG kaynak görsel (git'te yok)
├── camera_images/                          # 20 HEIC fuar fotoğrafı (git'te yok)
└── *.zip                                   # Sıkıştırılmış kaynaklar (git'te yok)
```

## Excel Sayfaları

### Talep Listesi (11 satır)
| Sütun | İçerik |
|---|---|
| Öncelik | Yüksek (🟥) → Orta-Yüksek (🟧) → Orta (🟨) → Düşük (🟩) |
| Durum | Net talep (🟩) / Belirsiz (🟨) / Tedarikçi (🟪) |
| Firma Tipi | 🟦🟪🟣🟨🟩 |
| Şirket, Kişi, E-posta | İletişim bilgileri |
| Ne İstiyor? / Ne Kadar? | Talep detayı ve adet |
| Teknik Detay | Spesifikasyonlar |
| Aksiyon | Yapılacak işlem |

### Tüm Kişiler (78 kişi)
Ad Soyad, Şirket, Firma Tipi, E-posta, Telefon, Ülke, Talep, Not

### Email Listesi (73 e-posta)
No, Firma Tipi, Şirket, Kişi, E-posta, Talep, Öncelik

### İstatistikler
KPI kartları + kategori dağılımı

## Kritik Bilgiler

- **5 kişinin e-postası bulunamadı:** Fethi Hakbilen (ROKETSAN), Vishnuprasad Revikumar Nair (Schaeffler), Aleksandr Skripkin (TU Saratow), Corinna Kaulen (OTH Regensburg), Thiruvarul Durai (AMT GmbH)
- **n8n MCP endpoint:** `https://n8n.retailerway.com/mcp-server/http` (bearer token opencode.json'da)
- **Adet belirtilen talepler:** hotset (50k PT100), Sensography (100k+), Sensor Tech (milyonlarca), Analysis Sensors (1k/yıl)

## Sonraki Adımlar (Planning)

1. Talep verilerinin doğruluğunu kontrol et
2. n8n üzerinden e-posta gönderim workflow'u kur
3. Varsa yeni kartvizit eklemeleri
