import { workflow, node, trigger, ifElse, switchCase, expr, merge } from '@n8n/workflow-sdk';

const zamanlayici = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Zamanlayıcı',
    parameters: {
      rule: {
        interval: [
          { field: 'cronExpression', expression: '0 9 * * 1-5' }
        ]
      }
    },
    position: [240, 300]
  },
  output: [{}]
});

const pipelineOku = node({
  type: 'n8n-nodes-base.readBinaryFiles',
  version: 1,
  config: {
    name: 'Pipeline JSON Oku',
    parameters: { filePath: '/mnt/downloads/sensors+test-2026/workflows/musteri_pipeline.json' },
    position: [480, 300]
  },
  output: [{ binary: { data: {} } }]
});

const jsonParseEt = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'JSON Parse Et',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      code: `const items = $input.all();
const fs = require('fs');
const pipeline = JSON.parse(fs.readFileSync('/mnt/downloads/sensors+test-2026/workflows/musteri_pipeline.json', 'utf-8'));
const musteriler = pipeline.musteriler || [];
return musteriler.filter(m => m.email).map(m => ({ json: m }));`
    },
    position: [720, 300]
  },
  output: [{ json: { firma: '', kisi: '', email: '', asama: '', talep: '' } }]
});

const asamaAyir = switchCase({
  version: 3.2,
  config: {
    name: 'Aşamaya Göre Ayır',
    parameters: {
      dataType: 'string',
      value1: expr('$json.asama'),
      rules: {
        values: [
          { value: 'email_gonderildi', outputKey: 'email_gonderildi' },
          { value: 'email_acildi', outputKey: 'email_acildi' },
          { value: 'ilgilendi', outputKey: 'ilgilendi' },
          { value: 'teklif_gonderildi', outputKey: 'teklif_gonderildi' }
        ]
      }
    },
    position: [960, 300]
  }
});

// Branch 1: email_gonderildi -> check if 3 days passed
const emailGonderildiHatirlat = node({
  type: 'n8n-nodes-base.emailSend',
  version: 2.1,
  config: {
    name: 'Hatırlatma Gönder',
    parameters: {
      operation: 'send',
      fromEmail: 'noreply@istmicro.com.tr',
      toEmail: expr('$json.email'),
      subject: 'Hatırlatma: ' + expr('$json.firma') + ' görüşmemiz',
      emailFormat: 'html',
      html: '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:20px">'
        + '<h2 style="color:#2d5a27">Hatırlatma</h2>'
        + '<p>Say\u0131n <strong>' + expr('$json.kisi') + '</strong>,</p>'
        + '<p>Ge\u00e7ti\u011fimiz g\u00fcnlerde Sensor+Test 2026 fuar\u0131nda <strong>' + expr('$json.firma') + '</strong> ile g\u00f6r\u00fc\u015fmeniz hakk\u0131nda e-posta g\u00f6ndermi\u015ftik.</p>'
        + '<p>Hen\u00fcz size ula\u015famad\u0131ysak da, talebinizle ilgili g\u00fcncel bilgileri payla\u015fmak isteriz.</p>'
        + '<p style="text-align:center;margin:24px 0">'
        + '<a href="https://n8n.retailerway.com/webhook/email-takip?cid=' + expr('$json.customer_id') + '&event=click&action=followup_click" style="background:#2d5a27;color:#fff;padding:12px 28px;text-decoration:none;border-radius:4px">Bilgi Dok\u00fcman\u0131n\u0131 \u0130ncele</a></p>'
        + '<img src="https://n8n.retailerway.com/webhook/email-takip?cid=' + expr('$json.customer_id') + '&event=open" width="1" height="1" style="display:none"/>'
        + '</body></html>'
    },
    position: [1200, 100]
  },
  output: [{}]
});

// Branch 2: email_acildi -> interested (auto-promote)
const ilgilendiyeAl = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'İlgilendi Olarak İşaretle', position: [1200, 300] },
  output: [{}]
});

// Branch 3: ilgilendi -> send offer
const teklifGonder = node({
  type: 'n8n-nodes-base.emailSend',
  version: 2.1,
  config: {
    name: 'Teklif Gönder',
    parameters: {
      operation: 'send',
      fromEmail: 'noreply@istmicro.com.tr',
      toEmail: expr('$json.email'),
      subject: 'Teklif: ' + expr('$json.firma') + ' / ' + expr('$json.talep'),
      emailFormat: 'html',
      html: '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:20px">'
        + '<h2 style="color:#b35c00">Teklif</h2>'
        + '<p>Say\u0131n <strong>' + expr('$json.kisi') + '</strong>,</p>'
        + '<p><strong>' + expr('$json.firma') + '</strong> i\u00e7in talebinizle ilgili teklifimizi haz\u0131rlad\u0131k.</p>'
        + '<table style="width:100%;background:#f9f9f9;border-radius:6px;padding:16px;margin:16px 0">'
        + '<tr><td><strong>\u00dcr\u00fcn/\u00c7\u00f6z\u00fcm:</strong> ' + expr('$json.talep') + '</td></tr>'
        + '<tr><td><strong>Miktar:</strong> ' + expr('$json.miktar') + '</td></tr>'
        + '</table>'
        + '<p style="text-align:center;margin:24px 0">'
        + '<a href="https://n8n.retailerway.com/webhook/email-takip?cid=' + expr('$json.customer_id') + '&event=click&action=offer_view" style="background:#b35c00;color:#fff;padding:12px 28px;text-decoration:none;border-radius:4px">Teklifi G\u00f6r\u00fcnt\u00fcle</a></p>'
        + '<img src="https://n8n.retailerway.com/webhook/email-takip?cid=' + expr('$json.customer_id') + '&event=open" width="1" height="1" style="display:none"/>'
        + '</body></html>'
    },
    position: [1200, 500]
  },
  output: [{}]
});

// Branch 4: teklif_gonderildi -> order pipeline
const siparisBildir = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Sipariş Bildir',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      code: `const item = $input.first().json;
console.log('S\u0130PAR\u0130\u015e ADAYI:', item.firma, '-', item.kisi, '-', item.email);
return [{ json: { ...item, mesaj: 'Sipari\u015f a\u015famas\u0131na yakla\u015ft\u0131', asama: 'siparis_asamasi' } }];`
    },
    position: [1200, 700]
  },
  output: [{ json: { firma: '', kisi: '', email: '', asama: '' } }]
});

// Fallback
const diger = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Diğer (yeni/siparis)', position: [1200, 900] },
  output: [{}]
});

export default workflow('followup-pipeline', '🔄 Takip & Sipariş Süreci')
  .add(zamanlayici)
  .to(pipelineOku)
  .to(jsonParseEt)
  .to(asamaAyir
    .onCase(0, emailGonderildiHatirlat)
    .onCase(1, ilgilendiyeAl)
    .onCase(2, teklifGonder)
    .onCase(3, siparisBildir)
    .onCase(4, diger)
    
  );
