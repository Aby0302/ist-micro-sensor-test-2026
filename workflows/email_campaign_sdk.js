import { workflow, node, trigger, ifElse, expr } from '@n8n/workflow-sdk';

const kampanyaBaslat = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Kampanyayı Başlat', position: [240, 300] },
  output: [{}]
});

const csvOku = node({
  type: 'n8n-nodes-base.readBinaryFiles',
  version: 1,
  config: {
    name: 'CSV Oku',
    parameters: { filePath: '/mnt/downloads/sensors+test-2026/workflows/musteri_listesi_email.csv' },
    position: [480, 300]
  },
  output: [{ binary: { data: {} } }]
});

const csvParseEt = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'CSV Parse Et',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      code: `const csv = require('csv-parse/sync');
const fs = require('fs');
const content = fs.readFileSync('/mnt/downloads/sensors+test-2026/workflows/musteri_listesi_email.csv', 'utf-8');
const records = csv.parse(content, { delimiter: ';', columns: true, skip_empty_lines: true, bom: true });
return records.map(row => ({
  json: {
    firma: (row.Firma || '').trim(),
    kisi: (row.Ki\u015fi || '').trim(),
    email: (row['E-posta'] || '').trim(),
    talep: (row['Ne istiyor'] || '').trim(),
    miktar: (row['Miktar/Tutar'] || '').trim(),
    kategori: (row.Kategori || '').trim(),
    asama: 'yeni'
  }
}));`
    },
    position: [720, 300]
  },
  output: [{ json: { firma: '', kisi: '', email: '', talep: '' } }]
});

const emailVarMi = ifElse({
  version: 2.2,
  config: {
    name: 'E-posta Var Mı?',
    parameters: {
      conditions: {
        combinator: 'and',
        conditions: [
          {
            id: 'email-check',
            leftValue: expr('$json.email'),
            rightValue: '',
            operator: {
              type: 'string',
              operation: 'isNotEmpty'
            }
          }
        ],
        options: { caseSensitive: true }
      }
    },
    position: [960, 300]
  }
});

const kisilestir = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Kişiselleştir',
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      code: `const crypto = require('crypto');
const item = $input.first().json;
const customerId = crypto.createHash('md5').update(item.firma + '-' + item.email).digest('hex').slice(0, 12);
const trackingBase = 'https://n8n.retailerway.com/webhook/email-takip';
item.customer_id = customerId;
item.tracking_pixel = trackingBase + '?cid=' + customerId + '&event=open';
item.tracking_url = trackingBase + '?cid=' + customerId + '&event=click';
const talep = item.talep || '';
if (talep && talep !== 'Belirtilmemi\u015f') {
  item.konu = 'Sensor+Test 2026 \u2013 ' + item.firma + ' / ' + talep.slice(0, 60);
} else {
  item.konu = 'Sensor+Test 2026 \u2013 ' + item.firma + ' g\u00f6r\u00fc\u015fmemiz hakk\u0131nda';
}
return { json: item };`
    },
    position: [1200, 200]
  },
  output: [{ json: { firma: '', kisi: '', email: '', konu: '', tracking_pixel: '', tracking_url: '', customer_id: '' } }]
});

const emailGonder = node({
  type: 'n8n-nodes-base.emailSend',
  version: 2.1,
  config: {
    name: 'E-posta Gönder',
    parameters: {
      operation: 'send',
      fromEmail: 'noreply@istmicro.com.tr',
      toEmail: expr('$json.email'),
      subject: expr('$json.konu'),
      emailFormat: 'html',
      options: { replyTo: '"istmicro@istmicro.com.tr" <istmicro@istmicro.com.tr>' },
      html: '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">'
        + '<table width="600" style="background:#fff;border-radius:8px;margin:0 auto;padding:0">'
        + '<tr><td style="background:#1a3a5c;padding:24px;text-align:center;color:#fff;font-size:22px;font-weight:bold">IST Micro Teknoloji</td></tr>'
        + '<tr><td style="padding:32px">'
        + '<p style="font-size:16px;color:#333">Say\u0131n <strong>' + expr('$json.kisi') + '</strong>,</p>'
        + '<p style="font-size:14px;color:#555;line-height:1.6">Sensor+Test 2026 fuar\u0131nda <strong>' + expr('$json.firma') + '</strong> stand\u0131nda tan\u0131\u015fm\u0131\u015ft\u0131k.</p>'
        + '<p style="font-size:14px;color:#555;line-height:1.6">G\u00f6r\u00fc\u015fmemizde belirtti\u011finiz talep ile ilgili olarak sizinle ileti\u015fime ge\u00e7mek istiyoruz.</p>'
        + '<p style="text-align:center;margin:24px 0">'
        + '<a href="' + expr('$json.tracking_url') + '&action=interested" style="background:#1a3a5c;color:#fff;padding:12px 28px;text-decoration:none;border-radius:4px;font-size:15px;display:inline-block">Benimle \u0130leti\u015fime Ge\u00e7in</a></p>'
        + '</td></tr>'
        + '<tr><td style="background:#f8f8f8;padding:16px;text-align:center;font-size:11px;color:#999">IST Micro Teknoloji \u2014 \u0130stanbul, T\u00fcrkiye</td></tr>'
        + '</table>'
        + '<img src="' + expr('$json.tracking_pixel') + '" width="1" height="1" style="display:none" alt=""/>'
        + '</body></html>'
    },
    credentials: {
      smtp: { id: null, name: 'IST Micro SMTP' }
    },
    position: [1440, 200]
  },
  output: [{}]
});

const emailYok = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'E-posta Yok', position: [1200, 500] },
  output: [{}]
});

export default workflow('email-campaign-workflow', '📧 Müşteri E-posta Kampanyası')
  .add(kampanyaBaslat)
  .to(csvOku)
  .to(csvParseEt)
  .to(emailVarMi
    .onTrue(kisilestir.to(emailGonder))
    .onFalse(emailYok)
  );
