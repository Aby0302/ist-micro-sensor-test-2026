# n8n Workflow Kurulum Kılavuzu

## Genel Bakış

3 adet workflow, müşteri e-posta kampanyasını uçtan uca yönetir:

| Workflow | ID | URL |
|----------|----|-----|
| 📧 Müşteri E-posta Kampanyası | `Fqz1UAeqWhc7NVyT` | [Aç](https://n8n.retailerway.com/workflow/Fqz1UAeqWhc7NVyT) |
| 👁️ E-posta Takip Webhook | `T15vpmIPc7XIKcfd` | [Aç](https://n8n.retailerway.com/workflow/T15vpmIPc7XIKcfd) |
| 🔄 Takip & Sipariş Süreci | `TaWQQh2nVi3PJMzM` | [Aç](https://n8n.retailerway.com/workflow/TaWQQh2nVi3PJMzM) |

## Aşama Akışı

```
yeni → email_gonderildi → email_acildi → ilgilendi → teklif_gonderildi → siparis_asamasi
```

## Deploy Edilmiş Durum

Workflow'lar doğrudan n8n MCP API ile oluşturulmuştur. SMTP credential "SMTP account" otomatik atanmıştır.
Tracking webhook aktif ve şu URL'de çalışıyor:

```
https://n8n.retailerway.com/webhook/email-takip
```

## Manuel Import (Alternatif)

1. n8n → **Workflows** → **Add Workflow** → **Import from File**
2. Sırasıyla import et:
   - `workflows/email_campaign.json`
   - `workflows/tracking_webhook.json`
   - `workflows/followup_pipeline.json`

## SMTP Kimlik Bilgisi

Workflow'lardaki SMTP node'ları "SMTP account" credential'ını kullanır.
Gerekirse n8n → **Credentials** → **SMTP** yolundan güncelleyin.

## Zamanlayıcı

Takip workflow'u hafta içi her gün 09:00'da çalışır (cron: `0 9 * * 1-5`).
Schedule Trigger node'undan değiştirebilirsiniz.

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
