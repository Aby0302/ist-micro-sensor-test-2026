# n8n Workflow Kurulum Kılavuzu

## Genel Bakış

3 adet workflow, müşteri e-posta kampanyasını uçtan uca yönetir:

```
📧 email_campaign.json    → E-posta gönderme (manuel/tetiklemeli)
👁️ tracking_webhook.json  → E-posta açılma/tıklama takibi
🔄 followup_pipeline.json  → Otomatik takip & sipariş süreci
```

## Aşama Akışı

```
yeni → email_gonderildi → email_acildi → ilgilendi → teklif_gonderildi → siparis_asamasi
```

## Kurulum Adımları

### 1. n8n'e Import Et

1. n8n → **Workflows** → **Add Workflow** → **Import from File**
2. Sırasıyla import et:
   - `workflows/email_campaign.json`
   - `workflows/tracking_webhook.json`
   - `workflows/followup_pipeline.json`

### 2. SMTP Kimlik Bilgisi Ekle

n8n → **Credentials** → **New** → **SMTP**

| Alan | Değer |
|------|-------|
| SMTP Host | *(kendi SMTP sunucunuz)* |
| SMTP Port | 587 |
| User | *(e-posta adresiniz)* |
| Password | *(şifreniz)* |

Workflow'lardaki SMTP node'larında bu credential'ı seçin.

### 3. Webhook'u Aktifleştir

- `tracking_webhook.json` workflow'unu aç
- **Webhook** node'unu seç
- **Listen on Test** ve **Listen on Production** butonlarına bas
- Webhook URL'ini not al: `https://n8n.retailerway.com/webhook/email-takip`

### 4. E-posta Şablonlarını Yükle

`email_templates/` klasöründeki HTML dosyalarını n8n'deki **Code** node'larına kopyalayın
veya doğrudan SMTP node'unun **Message** alanına yapıştırın.

### 5. Zamanlayıcıyı Ayarla

`followup_pipeline.json` workflow'unda Schedule Trigger varsayılan olarak
hafta içi her gün 09:00'da çalışır. İhtiyaca göre değiştirin.

## Müşteri Aşama Takibi

```bash
# Pipeline durumunu görüntüle
python3 workflows/customer_pipeline.py rapor

# JSON formatında istatistik
python3 workflows/customer_pipeline.py stats

# Müşteri aşamasını ilerlet
python3 workflows/customer_pipeline.py ilerlet "Firma Adı" teklif_gonderildi

# E-posta gönderimini kaydet
python3 workflows/customer_pipeline.py email_kaydet "Firma Adı"
```

## Sipariş Süreci

Müşteri `siparis_asamasi` aşamasına geldiğinde:

1. n8n Code node'u bildirim gönderir
2. `customer_pipeline.py` sipariş adaylarını listeler
3. Manuel olarak teklif/sipariş süreci başlatılır

## Notlar

- Tracking pixel için webhook'un **HTTPS** üzerinden erişilebilir olduğundan emin olun
- CSV verisi güncellendikçe e-posta kampanyasını yeniden çalıştırabilirsiniz
- Günlük gönderim limitlerini aşmamak için SMTP sağlayıcınızın kısıtlamalarını kontrol edin
