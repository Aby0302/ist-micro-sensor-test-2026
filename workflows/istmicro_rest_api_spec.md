# IST Micro REST API Specification (Full)

> **Amaç:** n8n workflow'ları ve yönetim paneli için tam kapsamlı REST API.
> ASP.NET Web API ile implemente edilecek.

---

## 1. Genel Kurallar

| Özellik | Değer |
|---|---|
| Base URL | `https://istmicro.com/api/v1` |
| Format | JSON, UTF-8 |
| Auth | `Authorization: Bearer {token}` (admin işlemleri için) |
| Pagination | `?page=1&limit=50` — header'da `X-Total-Count` |
| Sorting | `?sort=name&order=asc` |
| Filtering | `?field=value` |
| Timestamps | ISO 8601: `2026-06-19T12:00:00+03:00` |
| Hata formatı | `{ "error": true, "message": "...", "code": "PRODUCT_NOT_FOUND" }` |

### Status Code'lar

| Code | Anlamı |
|---|---|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 204 | Silindi (no content) |
| 400 | Geçersiz istek |
| 401 | Yetkisiz (token yok/geçersiz) |
| 403 | Yetki yok |
| 404 | Bulunamadı |
| 409 | Çakışma (unique constraint) |
| 422 | Doğrulama hatası |
| 500 | Sunucu hatası |

---

## 2. Authentication

### 2.1 Giriş

```
POST /auth/login
```

**Request:**
```json
{
  "email": "admin@istmicro.com",
  "password": "********"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_at": "2026-07-19T12:00:00Z",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@istmicro.com",
    "role": "admin"
  }
}
```

### 2.2 Token Yenileme

```
POST /auth/refresh
Header: Authorization: Bearer {token}
```

### 2.3 Kullanıcı Yönetimi

```
GET    /auth/users          → tüm kullanıcılar (admin)
POST   /auth/users          → yeni kullanıcı
PUT    /auth/users/{id}     → kullanıcı güncelle
DELETE /auth/users/{id}     → kullanıcı sil
```

**POST /auth/users:**
```json
{
  "name": "Operator",
  "email": "operator@istmicro.com",
  "password": "********",
  "role": "operator"
}
```

Roller: `admin`, `operator`, `editor`

---

## 3. Şirket Bilgisi (Company)

```
GET    /company                        → public
PUT    /company                        → auth required
```

**GET Response:**
```json
{
  "id": 1,
  "name": "IST Micro Sensör Teknolojileri AŞ",
  "short_name": "IST Micro",
  "domain": "istmicro.com",
  "email": "info@istmicro.com",
  "email_campaign": "noreply@istmicro.com.tr",
  "email_support": "istmicro@istmicro.com.tr",
  "phone": "+90xxxxxxxxx",
  "address": "İstanbul, Türkiye",
  "description": "Pt100, Pt1000...",
  "meta_keywords": "pt100, pt1000, ntc, ...",
  "meta_description": "IST Micro; Pt100, Pt1000...",
  "logo_url": "/uploads/logo.png",
  "updated_at": "2026-06-19T12:00:00+03:00"
}
```

---

## 4. Ürün Kategorileri (Categories)

```
GET    /categories                → public (tümü)
GET    /categories/{slug}         → public (tek)
POST   /categories                → auth (yeni)
PUT    /categories/{id}           → auth (güncelle)
DELETE /categories/{id}           → auth (sil)
```

**POST/PUT Request:**
```json
{
  "name": "Platin RTD Sıcaklık Sensörleri",
  "slug": "platin-rtd",
  "keywords": ["pt100", "pt1000", "rtd", "platin"],
  "description": "...",
  "sort_order": 1,
  "is_active": true
}
```

**GET Response (tek/single):**
```json
{
  "id": 1,
  "name": "Platin RTD Sıcaklık Sensörleri",
  "slug": "platin-rtd",
  "keywords": ["pt100", "pt1000", "rtd", "platin"],
  "description": "...",
  "sort_order": 1,
  "is_active": true,
  "product_count": 12,
  "created_at": "...",
  "updated_at": "..."
}
```

---

## 5. Ürünler (Products)

```
GET    /products                      → public (tümü, filtreleme)
GET    /products/{id}                 → public (tek)
GET    /products/{id}/datasheet       → public (PDF indir)
POST   /products                      → auth (yeni)
PUT    /products/{id}                 → auth (güncelle)
DELETE /products/{id}                 → auth (sil)
```

### Filtreleme Parametreleri

| Parametre | Örnek |
|---|---|
| `category` | `?category=platin-rtd` |
| `search` | `?search=pt100` |
| `is_active` | `?is_active=true` |
| `sort` | `?sort=name&order=asc` |
| `page` | `?page=1&limit=50` |

**GET /products (koleksiyon):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Pt100 RTD Sensor 2x2mm",
      "slug": "pt100-rtd-2x2mm",
      "category": { "id": 1, "name": "Platin RTD", "slug": "platin-rtd" },
      "description": "2x2 mm, 4 telli, Class B RTD sensör",
      "specs": {
        "temperature_range": "-50..+260 °C",
        "tolerance": "Class B",
        "wires": 4,
        "body": "2x2mm"
      },
      "datasheet_url": "/uploads/datasheets/pt100_2x2mm.pdf",
      "image_url": "/uploads/images/pt100_2x2mm.jpg",
      "keywords": ["pt100", "2x2mm", "class b"],
      "is_active": true,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 35,
    "total_pages": 1
  }
}
```

**POST /products:**
```json
{
  "name": "Pt100 RTD Sensor 2x2mm",
  "category_id": 1,
  "description": "...",
  "specs": { "temperature_range": "-50..+260", "tolerance": "Class B" },
  "keywords": ["pt100", "2x2mm"],
  "datasheet": "(multipart/form-data - PDF dosyası)",
  "image": "(multipart/form-data - resim dosyası)",
  "is_active": true
}
```

---

## 6. Dosya Yönetimi (Uploads)

```
POST   /uploads                    → auth (dosya yükle)
GET    /uploads/{filepath}         → public (dosya indir)
DELETE /uploads/{id}               → auth (dosya sil)
GET    /uploads                    → auth (tüm dosyalar)
```

Yüklenebilir tipler: `datasheet`, `image`, `catalog`, `brochure`, `other`

**POST /uploads (multipart/form-data):**
```
file: (binary)
type: "datasheet"
product_id: 1 (optional)
```

**Response:**
```json
{
  "id": 10,
  "filepath": "/uploads/datasheets/pt100_2x2mm.pdf",
  "url": "https://istmicro.com/uploads/datasheets/pt100_2x2mm.pdf",
  "type": "datasheet",
  "mime": "application/pdf",
  "size_bytes": 245760,
  "product_id": 1,
  "created_at": "..."
}
```

---

## 7. Distribütörler (Distributors)

```
GET    /distributors                → public
GET    /distributors/{id}           → public
POST   /distributors                → auth
PUT    /distributors/{id}           → auth
DELETE /distributors/{id}           → auth
```

```json
{
  "id": 1,
  "company": "Sensor Technology Ltda.",
  "country": "Brezilya",
  "website": "www.sensor-technology.com.br",
  "contact_person": "Lucas Pereira",
  "email": "lucas@sensor-technology.com.br",
  "phone": "+55xxxxxxxxx",
  "authority": "Güney Amerika Distribütörü",
  "is_active": true
}
```

---

## 8. Müşteri Yönetimi (Customers)

```
GET    /customers                   → auth
GET    /customers/{id}              → auth
POST   /customers                   → auth
PUT    /customers/{id}              → auth
DELETE /customers/{id}              → auth
GET    /customers/export/csv        → auth (CSV export)
POST   /customers/import/csv        → auth (CSV import)
```

### Filtreleme
| Parametre | Örnek |
|---|---|
| `pipeline_stage` | `?pipeline_stage=email_gonderildi` |
| `country` | `?country=Almanya` |
| `search` | `?search=company+name` |
| `tag` | `?tag=fuvar2026` |

**Response:**
```json
{
  "id": 1,
  "company": "Örnek GmbH",
  "contact_person": "Hans Müller",
  "email": "hans@ornek.de",
  "phone": "+49xxxxxxxxx",
  "country": "Almanya",
  "notes": "Fuardan tanışıldı, Pt100 talebi var",
  "tags": ["fuvar2026", "sicaklik-sensoru"],
  "pipeline_stage": "email_gonderildi",
  "pipeline_history": [
    { "stage": "yeni", "changed_at": "2026-06-09T10:00:00Z", "note": "Fuar kaydı" },
    { "stage": "email_gonderildi", "changed_at": "2026-06-10T09:00:00Z", "note": "Kampanya 1" }
  ],
  "last_email_code": "IST-00001",
  "email_opened": true,
  "email_clicked": false,
  "offer_sent": false,
  "order_stage": false
}
```

**POST /customers:**
```json
{
  "company": "Örnek GmbH",
  "contact_person": "Hans Müller",
  "email": "hans@ornek.de",
  "phone": "+49xxxxxxxxx",
  "country": "Almanya",
  "notes": "...",
  "tags": ["fuvar2026"],
  "pipeline_stage": "yeni"
}
```

---

## 9. Pipeline Yönetimi

```
GET    /pipeline/stages             → auth (tüm aşamalar)
PUT    /customers/{id}/pipeline     → auth (aşama değiştir)
GET    /pipeline/report             → auth (aşama raporu)
```

**PUT /customers/{id}/pipeline:**
```json
{
  "stage": "ilgilendi",
  "note": "Müşteri Pt1000 datasheet istedi"
}
```

**GET /pipeline/stages:**
```json
[
  { "key": "yeni", "name": "Yeni Müşteri", "count": 45, "color": "#gray" },
  { "key": "email_gonderildi", "name": "E-posta Gönderildi", "count": 31, "color": "#blue" },
  { "key": "email_acildi", "name": "E-posta Açıldı", "count": 18, "color": "#cyan" },
  { "key": "ilgilendi", "name": "İlgilendi", "count": 7, "color": "#yellow" },
  { "key": "teklif_gonderildi", "name": "Teklif Gönderildi", "count": 3, "color": "#orange" },
  { "key": "siparis_asamasi", "name": "Sipariş Aşaması", "count": 1, "color": "#green" }
]
```

**GET /pipeline/report:**
```json
{
  "total_customers": 45,
  "stage_breakdown": { "yeni": 45, "email_gonderildi": 31, ... },
  "conversion_rates": {
    "yeni_to_gonderildi": "68.9%",
    "gonderildi_to_acildi": "58.1%",
    "acildi_to_ilgilendi": "38.9%",
    "ilgilendi_to_teklif": "42.9%",
    "teklif_to_siparis": "33.3%"
  },
  "daily_trend": [
    { "date": "2026-06-09", "new": 34, "emails_sent": 0 },
    { "date": "2026-06-10", "new": 0, "emails_sent": 31 }
  ]
}
```

---

## 10. E-posta Kampanyaları (Campaigns)

```
GET    /campaigns                   → auth
POST   /campaigns                   → auth (yeni kampanya)
GET    /campaigns/{id}              → auth
PUT    /campaigns/{id}              → auth
DELETE /campaigns/{id}              → auth
POST   /campaigns/{id}/send         → auth (manuel gönder)
```

**POST /campaigns:**
```json
{
  "name": "Sensor+Test 2026 Takip 1",
  "subject": "IST Micro'dan merhaba - {company}",
  "template_id": 1,
  "target_stages": ["yeni", "email_gonderildi"],
  "target_tags": ["fuvar2026"],
  "scheduled_at": "2026-06-23T09:00:00Z",
  "is_active": true
}
```

---

## 11. E-posta Şablonları (Templates)

```
GET    /templates                   → auth
POST   /templates                   → auth
GET    /templates/{id}              → auth
PUT    /templates/{id}              → auth
DELETE /templates/{id}              → auth
```

**POST /templates:**
```json
{
  "name": "Welcome Email",
  "subject": "IST Micro'dan merhaba - {{company}}",
  "html_body": "<html>...{{company}}...{{contact_person}}...</html>",
  "variables": ["company", "contact_person", "tracking_pixel"],
  "type": "welcome"
}
```

Tipler: `welcome`, `followup`, `offer`, `reminder`

---

## 12. E-posta Gönderim Logları (Email Logs)

```
GET    /email-logs                  → auth (filtreleme ile)
GET    /email-logs/{id}             → auth
```

Filtreler: `?customer_id=1&campaign_id=1&status=sent&from=2026-06-01&to=2026-06-19`

**GET /email-logs:**
```json
{
  "data": [
    {
      "id": 1,
      "customer_id": 1,
      "campaign_id": 1,
      "email_code": "IST-00001",
      "from": "noreply@istmicro.com.tr",
      "to": "hans@ornek.de",
      "subject": "IST Micro'dan merhaba - Örnek GmbH",
      "status": "sent",
      "opened_at": "2026-06-11T14:30:00Z",
      "clicked_at": null,
      "error": null,
      "sent_at": "2026-06-10T09:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 156 }
}
```

---

## 13. İstatistikler ve Dashboard (Analytics)

```
GET    /analytics/dashboard         → auth (özet kartlar)
GET    /analytics/campaign/{id}    → auth (kampanya detay)
GET    /analytics/timeline         → auth (zaman çizelgesi)
GET    /analytics/countries        → auth (ülke bazında)
GET    /analytics/products         → auth (en çok talep edilen)
```

**GET /analytics/dashboard:**
```json
{
  "total_customers": 45,
  "total_emails_sent": 156,
  "open_rate": "42.3%",
  "click_rate": "18.6%",
  "reply_rate": "12.8%",
  "conversion_to_order": "2.2%",
  "customers_today": 0,
  "emails_sent_today": 0,
  "pending_followups": 12
}
```

**GET /analytics/timeline?days=30:**
```json
[
  { "date": "2026-06-09", "customers_added": 34, "emails_sent": 0, "opens": 0, "replies": 0 },
  { "date": "2026-06-10", "customers_added": 0, "emails_sent": 31, "opens": 0, "replies": 0 },
  { "date": "2026-06-11", "customers_added": 0, "emails_sent": 0, "opens": 12, "replies": 3 }
]
```

**GET /analytics/countries:**
```json
[
  { "country": "Almanya", "count": 15, "sent": 15, "opened": 8, "replied": 3 },
  { "country": "Türkiye", "count": 8, "sent": 8, "opened": 5, "replied": 1 }
]
```

---

## 14. SSS Yönetimi (Knowledge Base)

```
GET    /knowledge-base              → public (aktif olanlar)
GET    /knowledge-base/{id}         → public
POST   /knowledge-base              → auth
PUT    /knowledge-base/{id}         → auth
DELETE /knowledge-base/{id}         → auth
```

**POST /knowledge-base:**
```json
{
  "keywords": ["pt100", "pt1000", "rtd"],
  "question": "Pt100/Pt1000 hakkında bilgi",
  "answer": "Pt100/Pt1000 Platin RTD... info@istmicro.com...",
  "category": "product",
  "is_active": true,
  "sort_order": 1
}
```

Kategoriler: `product`, `pricing`, `shipping`, `quality`, `company`, `general`

---

## 15. Notlar ve Etkinlikler (Activity Log)

```
GET    /customers/{id}/activities   → auth (müşteri aktivite geçmişi)
POST   /activities                  → auth (yeni aktivite kaydı)
```

**GET /customers/1/activities:**
```json
[
  { "type": "email_sent", "description": "Kampanya 1 e-postası gönderildi", "created_at": "..." },
  { "type": "email_opened", "description": "E-posta açıldı", "created_at": "..." },
  { "type": "pipeline_change", "description": "Aşama: email_gonderildi → email_acildi", "created_at": "..." },
  { "type": "note_added", "description": "Müşteri Pt100 datasheet istedi", "user": "Admin", "created_at": "..." }
]
```

---

## 16. Email Ayarları (SMTP Settings)

```
GET    /settings/email              → auth
PUT    /settings/email              → auth
POST   /settings/email/test         → auth (test e-postası gönder)
```

**PUT /settings/email:**
```json
{
  "smtp_host": "mail.istmicro.com.tr",
  "smtp_port": 587,
  "smtp_secure": "tls",
  "smtp_user": "noreply@istmicro.com.tr",
  "smtp_pass": "********",
  "from_name": "IST Micro",
  "from_email": "noreply@istmicro.com.tr",
  "reply_to": "istmicro@istmicro.com.tr"
}
```

---

## 17. Exchange/Outlook Ayarları

```
GET    /settings/exchange           → auth
PUT    /settings/exchange           → auth
```

```json
{
  "tenant_id": "...",
  "client_id": "...",
  "client_secret": "********",
  "mailbox": "istmicro@istmicro.com.tr",
  "poll_interval_minutes": 10
}
```

---

## 18. Export / Import

```
GET    /export/customers?format=csv        → auth (CSV export)
GET    /export/customers?format=xlsx       → auth (Excel export)
GET    /export/report?format=pdf           → auth (PDF rapor)
POST   /import/customers                  → auth (CSV/XLSX import)
```

---

## 19. Sağlık Kontrolü (Health)

```
GET    /health                    → public
```

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-06-19T12:00:00Z",
  "uptime_seconds": 3600,
  "database": "connected",
  "storage": "ok (45.2 GB free)"
}
```

---

## 20. OpenAPI / Swagger

- `GET /swagger/v1/swagger.json` → OpenAPI spec
- `GET /swagger` → Swagger UI
- ASP.NET'te `Swashbuckle` paketi ile otomatik oluşur

---

## Özet: Endpoint Listesi

| # | Metot | Endpoint | Auth | Açıklama |
|---|---|---|---|---|
| 1 | POST | `/auth/login` | - | Giriş |
| 2 | POST | `/auth/refresh` | ✓ | Token yenile |
| 3 | GET | `/auth/users` | ✓ | Kullanıcı listesi |
| 4 | POST | `/auth/users` | ✓ | Kullanıcı ekle |
| 5 | PUT | `/auth/users/{id}` | ✓ | Kullanıcı güncelle |
| 6 | DELETE | `/auth/users/{id}` | ✓ | Kullanıcı sil |
| 7 | GET | `/company` | - | Şirket bilgisi |
| 8 | PUT | `/company` | ✓ | Şirket güncelle |
| 9 | GET | `/categories` | - | Kategoriler |
| 10 | GET | `/categories/{slug}` | - | Kategori detay |
| 11 | POST | `/categories` | ✓ | Kategori ekle |
| 12 | PUT | `/categories/{id}` | ✓ | Kategori güncelle |
| 13 | DELETE | `/categories/{id}` | ✓ | Kategori sil |
| 14 | GET | `/products` | - | Ürünler (filtreli) |
| 15 | GET | `/products/{id}` | - | Ürün detay |
| 16 | GET | `/products/{id}/datasheet` | - | PDF indir |
| 17 | POST | `/products` | ✓ | Ürün ekle |
| 18 | PUT | `/products/{id}` | ✓ | Ürün güncelle |
| 19 | DELETE | `/products/{id}` | ✓ | Ürün sil |
| 20 | POST | `/uploads` | ✓ | Dosya yükle |
| 21 | GET | `/uploads/{path}` | - | Dosya indir |
| 22 | DELETE | `/uploads/{id}` | ✓ | Dosya sil |
| 23 | GET | `/uploads` | ✓ | Dosya listesi |
| 24 | GET | `/distributors` | - | Distribütörler |
| 25 | POST | `/distributors` | ✓ | Distribütör ekle |
| 26 | PUT | `/distributors/{id}` | ✓ | Distribütör güncelle |
| 27 | DELETE | `/distributors/{id}` | ✓ | Distribütör sil |
| 28 | GET | `/customers` | ✓ | Müşteriler |
| 29 | GET | `/customers/{id}` | ✓ | Müşteri detay |
| 30 | POST | `/customers` | ✓ | Müşteri ekle |
| 31 | PUT | `/customers/{id}` | ✓ | Müşteri güncelle |
| 32 | DELETE | `/customers/{id}` | ✓ | Müşteri sil |
| 33 | PUT | `/customers/{id}/pipeline` | ✓ | Aşama değiştir |
| 34 | GET | `/customers/export/csv` | ✓ | CSV export |
| 35 | POST | `/customers/import/csv` | ✓ | CSV import |
| 36 | GET | `/pipeline/stages` | ✓ | Aşama tanımları |
| 37 | GET | `/pipeline/report` | ✓ | Pipeline raporu |
| 38 | GET | `/campaigns` | ✓ | Kampanyalar |
| 39 | POST | `/campaigns` | ✓ | Kampanya oluştur |
| 40 | GET | `/campaigns/{id}` | ✓ | Kampanya detay |
| 41 | PUT | `/campaigns/{id}` | ✓ | Kampanya güncelle |
| 42 | DELETE | `/campaigns/{id}` | ✓ | Kampanya sil |
| 43 | POST | `/campaigns/{id}/send` | ✓ | Manuel gönder |
| 44 | GET | `/templates` | ✓ | Şablonlar |
| 45 | POST | `/templates` | ✓ | Şablon ekle |
| 46 | PUT | `/templates/{id}` | ✓ | Şablon güncelle |
| 47 | DELETE | `/templates/{id}` | ✓ | Şablon sil |
| 48 | GET | `/email-logs` | ✓ | E-posta logları |
| 49 | GET | `/email-logs/{id}` | ✓ | Log detay |
| 50 | GET | `/knowledge-base` | - | SSS listesi |
| 51 | POST | `/knowledge-base` | ✓ | SSS ekle |
| 52 | PUT | `/knowledge-base/{id}` | ✓ | SSS güncelle |
| 53 | DELETE | `/knowledge-base/{id}` | ✓ | SSS sil |
| 54 | GET | `/customers/{id}/activities` | ✓ | Müşteri aktiviteleri |
| 55 | POST | `/activities` | ✓ | Aktivite kaydet |
| 56 | GET | `/settings/email` | ✓ | SMTP ayarları |
| 57 | PUT | `/settings/email` | ✓ | SMTP güncelle |
| 58 | POST | `/settings/email/test` | ✓ | Test e-postası |
| 59 | GET | `/settings/exchange` | ✓ | Exchange ayarları |
| 60 | PUT | `/settings/exchange` | ✓ | Exchange güncelle |
| 61 | GET | `/analytics/dashboard` | ✓ | Dashboard özeti |
| 62 | GET | `/analytics/campaign/{id}` | ✓ | Kampanya analizi |
| 63 | GET | `/analytics/timeline` | ✓ | Zaman serisi |
| 64 | GET | `/analytics/countries` | ✓ | Ülke bazında |
| 65 | GET | `/analytics/products` | ✓ | Ürün talepleri |
| 66 | GET | `/export/customers` | ✓ | CSV/XLSX export |
| 67 | GET | `/export/report` | ✓ | PDF rapor |
| 68 | POST | `/import/customers` | ✓ | CSV/XLSX import |
| 69 | GET | `/health` | - | Sağlık kontrolü |
| 70 | GET | `/swagger` | - | Swagger UI |

---

## Teknik Notlar (ASP.NET Geliştiricisi İçin)

### Önerilen Paketler
```xml
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" />
<PackageReference Include="Swashbuckle.AspNetCore" />
<PackageReference Include="System.Text.Json" />
<PackageReference Include="EPPlus" />  <!-- Excel export için -->
```

### Controller İskeleti
```csharp
[ApiController]
[Route("api/v1/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<Product>>> GetAll(
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50)
    {
        // ...
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Product>> GetById(int id) { ... }

    [HttpPost]
    [Authorize(Roles = "admin,editor")]
    public async Task<ActionResult<Product>> Create(ProductCreateRequest request) { ... }
}
```

### Veritabanı Tabloları (Öneri)

```
users
companies
categories
products
uploads
distributors
customers
pipeline_stages
pipeline_history
campaigns
templates
email_logs
email_settings
knowledge_base
activities
```

### n8n Entegrasyon Notları
- Public endpoint'ler: `GET /products`, `GET /categories`, `GET /knowledge-base`, `GET /company`
- Auth gerekenler: n8n HTTP Request node'unda `Authorization: Bearer {token}` header'ı eklenir
- PDF'ler: `GET /products/{id}/datasheet` ve `GET /uploads/{path}` binary response döner
- CSV import: n8n'de önce CSV okunur, sonra `POST /customers/import/csv` veya tek tek `POST /customers`
