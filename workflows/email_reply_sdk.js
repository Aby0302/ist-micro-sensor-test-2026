import { workflow, node, trigger, ifElse, switchCase, expr, merge } from '@n8n/workflow-sdk';

const imapTrigger = trigger({
  type: 'n8n-nodes-base.emailReadImap',
  version: 2.1,
  config: {
    name: 'Gelen Kutusu',
    parameters: {
      mailbox: 'INBOX',
      postProcessAction: 'read',
      format: 'simple',
      downloadAttachments: false,
      options: {
        customEmailConfig: '["UNSEEN"]',
        forceReconnect: 60,
        trackLastMessageId: true
      }
    },
    credentials: {
      imap: { id: null, name: 'IST Micro IMAP' }
    },
    position: [240, 300]
  },
  output: [{}]
});

const bilgiBaziniOku = node({
  type: 'n8n-nodes-base.readBinaryFiles',
  version: 1,
  config: {
    name: 'Bilgi Bazını Oku',
    parameters: { filePath: '/mnt/downloads/sensors+test-2026/workflows/ist_micro_bilgi_baz.json' },
    position: [480, 180]
  },
  output: [{ binary: { data: {} } }]
});

const musteriVeYanit = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Müşteri Bul ve Yanıt Eşle',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      code: `const items = $input.all();
const fs = require('fs');
const csv = require('csv-parse/sync');

// Bilgi bazını oku
const kb = JSON.parse(fs.readFileSync('/mnt/downloads/sensors+test-2026/workflows/ist_micro_bilgi_baz.json', 'utf-8'));

// Müşteri listesini oku
const content = fs.readFileSync('/mnt/downloads/sensors+test-2026/workflows/musteri_listesi_email.csv', 'utf-8');
const musteriler = csv.parse(content, { delimiter: ';', columns: true, skip_empty_lines: true, bom: true });

// Pipeline durumunu oku
let pipeline = { musteriler: [] };
try {
  pipeline = JSON.parse(fs.readFileSync('/mnt/downloads/sensors+test-2026/workflows/musteri_pipeline.json', 'utf-8'));
} catch(e) {}

const result = [];
for (const item of items) {
  const fromEmail = (item.json.fromEmail || item.json.from || '').toLowerCase().trim();
  const subject = item.json.subject || '';
  const textBody = (item.json.text || item.json.html || item.json.body || '').toLowerCase();
  const fullText = (subject + ' ' + textBody).toLowerCase();
  
  // Müşteriyi e-posta adresine göre eşleştir
  let eslesen = null;
  for (const m of musteriler) {
    const eposta = (m['E-posta'] || '').toLowerCase().trim();
    if (eposta && fromEmail.includes(eposta)) {
      eslesen = m;
      break;
    }
  }
  
  // E-posta adresinden [IST-XXXXX] kodunu çıkar
  const istKod = (subject.match(/\[IST-([a-f0-9]+)\]/i) || [])[1] || '';
  
  // Pipeline'da müşteri durumunu bul
  let asama = 'yeni';
  for (const p of pipeline.musteriler || []) {
    if ((p.firma === (eslesen ? eslesen.Firma : '') && p.email === (eslesen ? eslesen['E-posta'] : '')) || (istKod && p.customer_id === istKod)) {
      asama = p.asama || 'yeni';
      break;
    }
  }
  
  // --- BİLGİ BAZINDAN YANIT EŞLE ---
  // Sadece tanıdık müşterilere yanıt ver
  let yanit = '';
  let eslenenSoru = '';
  
  if (eslesen) {
    // SSS'de ara
    for (const sss of kb.sss) {
      for (const anahtar of sss.soru_anahtarlari) {
        if (fullText.includes(anahtar.toLowerCase())) {
          yanit = sss.cevap;
          eslenenSoru = anahtar;
          break;
        }
      }
      if (yanit) break;
    }
    
    // Ürün kategorilerinde ara
    if (!yanit) {
      for (const kat of kb.urun_kategorileri) {
        for (const anahtar of kat.anahtar_kelimeler) {
          if (fullText.includes(anahtar.toLowerCase())) {
            yanit = kat.aciklama + ' Detayl\u0131 bilgi ve teklif i\u00e7in istmicro@istmicro.com.tr adresine e-posta g\u00f6nderebilirsiniz.';
            eslenenSoru = anahtar;
            break;
          }
        }
        if (yanit) break;
      }
    }
    
    // Hala yanıt yoksa güvenli düşüş mesajını kullan
    if (!yanit) {
      yanit = kb.cevaplanamaz_mesaj;
    }
  }
  
  // Yanıt e-postası oluştur
  const yanitHtml = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">'
    + '<table width="600" style="background:#fff;border-radius:8px;margin:0 auto;padding:0">'
    + '<tr><td style="background:#1a3a5c;padding:24px;text-align:center;color:#fff;font-size:20px;font-weight:bold">IST Micro Teknoloji</td></tr>'
    + '<tr><td style="padding:32px">'
    + '<p style="font-size:16px;color:#333">Say\u0131n <strong>' + ((eslesen && eslesen.Ki\u015fi) || 'De\u011ferli Müşterimiz') + '</strong>,</p>'
    + '<p style="font-size:14px;color:#555;line-height:1.6">Sensor+Test 2026 fuar\u0131nda tan\u0131\u015ft\u0131ktan sonra g\u00f6r\u00fc\u015fmemizle ilgili mesaj\u0131n\u0131z\u0131 ald\u0131k.</p>'
    + '<div style="background:#f9f9f9;border-left:4px solid #1a3a5c;padding:16px;margin:16px 0;font-size:14px;color:#555">'
    + (yanit.startsWith('Sorunuzu') ? '' : '<p><strong>Yan\u0131t\u0131m\u0131z:</strong></p>')
    + '<p>' + yanit + '</p>'
    + '</div>'
    + '<p style="font-size:13px;color:#888;line-height:1.5">Sorular\u0131n\u0131z i\u00e7in her zaman istmicro@istmicro.com.tr adresinden bize ula\u015fabilirsiniz.</p>'
    + '</td></tr>'
    + '<tr><td style="background:#f8f8f8;padding:16px;text-align:center;font-size:11px;color:#999">IST Micro Teknoloji \u2014 \u0130stanbul, T\u00fcrkiye \u2014 www.istmicro.com.tr</td></tr>'
    + '</table></body></html>';
  
  result.push({
    json: {
      musteri_bulundu: !!eslesen,
      firma: eslesen ? eslesen.Firma : '',
      kisi: eslesen ? (eslesen.Ki\u015fi || '') : '',
      email: eslesen ? (eslesen['E-posta'] || '') : fromEmail,
      talep: eslesen ? (eslesen['Ne istiyor'] || '') : '',
      mevcut_asama: asama,
      yeni_asama: 'ilgilendi',
      konu: subject,
      yanit_ozeti: yanit.slice(0, 200),
      eslenen_anahtar: eslenenSoru,
      tam_yanit: yanit,
      yanit_html: yanitHtml,
      guvenli_yanit: !eslenenSoru && !!eslesen
    }
  });
}
return result;`
    },
    position: [720, 300]
  },
  output: [{ json: { musteri_bulundu: false, firma: '', email: '', tam_yanit: '', yanit_html: '' } }]
});

const taninanMusteriler = ifElse({
  version: 2.2,
  config: {
    name: 'Tanınan Müşteri?',
    parameters: {
      conditions: {
        combinator: 'and',
        conditions: [
          {
            id: 'musteri-kontrol',
            leftValue: expr('$json.musteri_bulundu'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'equal' }
          }
        ],
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }
      }
    },
    position: [960, 300]
  }
});

const yanitGonder = node({
  type: 'n8n-nodes-base.emailSend',
  version: 2.1,
  config: {
    name: 'Yanıt E-postası Gönder',
    parameters: {
      operation: 'send',
      fromEmail: 'istmicro@istmicro.com.tr',
      fromName: 'IST Micro Teknoloji',
      toEmail: expr('$json.email'),
      subject: 'RE: ' + expr('$json.konu'),
      emailFormat: 'html',
      html: expr('$json.yanit_html'),
      options: {}
    },
    credentials: {
      smtp: { id: null, name: 'SMTP account' }
    },
    position: [1200, 100]
  },
  output: [{}]
});

const asamaGuncelle = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Aşama Güncelle',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      code: `const items = $input.all();
const fs = require('fs');
const pipelinePath = '/mnt/downloads/sensors+test-2026/workflows/musteri_pipeline.json';

let pipeline = { musteriler: [] };
try {
  pipeline = JSON.parse(fs.readFileSync(pipelinePath, 'utf-8'));
} catch(e) {}

for (const item of items) {
  const { firma, email, yeni_asama } = item.json;
  if (!firma || !email) continue;
  
  let guncellendi = false;
  for (const m of pipeline.musteriler || []) {
    if (m.firma === firma && m.email === email) {
      if (yeni_asama) m.asama = yeni_asama;
      m.son_etkilesim = new Date().toISOString();
      guncellendi = true;
      break;
    }
  }
  
  if (guncellendi) {
    pipeline.son_guncelleme = new Date().toISOString();
    fs.writeFileSync(pipelinePath, JSON.stringify(pipeline, null, 2));
  }
}
return items;`
    },
    position: [1200, 300]
  },
  output: [{ json: { firma: '', email: '' } }]
});

const taninmayan = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Tanınmayan Gönderici', position: [1200, 500] },
  output: [{}]
});

export default workflow('email-reply-monitor', '📥 E-posta Yanıtları (Bilgi Bazlı)')
  .add(imapTrigger)
  .to(bilgiBaziniOku)
  .to(musteriVeYanit)
  .to(taninanMusteriler
    .onTrue(yanitGonder.to(asamaGuncelle))
    .onFalse(taninmayan)
  );
