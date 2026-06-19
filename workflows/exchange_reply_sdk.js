import { workflow, node, trigger, ifElse, expr } from '@n8n/workflow-sdk';

const zamanlayici = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Her 10 Dakikada Bir',
    parameters: {
      rule: {
        interval: [
          { field: 'cronExpression', expression: '*/10 * * * *' }
        ]
      }
    },
    position: [240, 300]
  },
  output: [{}]
});

const gelenKutusu = node({
  type: 'n8n-nodes-base.microsoftOutlook',
  version: 2,
  config: {
    name: 'Gelen Kutusu',
    parameters: {
      resource: 'folderMessage',
      operation: 'getAll',
      folderId: { mode: 'list', value: 'inbox' },
      returnAll: false,
      limit: 50,
      filtersUI: {
        values: {
          filterBy: 'filters',
          filters: {
            values: {
              readStatus: 'unreadOnly',
              emailType: 'any'
            }
          }
        }
      },
      output: 'fields',
      fields: ['from', 'subject', 'bodyPreview', 'body', 'receivedDateTime', 'conversationId', 'internetMessageId']
    },
    credentials: {
      microsoftOutlookOAuth2Api: { id: null, name: 'Microsoft Outlook' }
    },
    position: [480, 300]
  },
  output: [{ json: { id: '', from: { emailAddress: { address: '' } }, subject: '', bodyPreview: '', body: { content: '' } } }]
});

const musteriVeYanitBul = node({
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

// Daha önce yanıtlanan mesajları takip et (conversationId bazlı)
let yanitlanan = new Set();
try {
  const log = JSON.parse(fs.readFileSync('/mnt/downloads/sensors+test-2026/workflows/yanitlanan_mesajlar.json', 'utf-8') || '[]');
  yanitlanan = new Set(log);
} catch(e) {}

const result = [];
for (const item of items) {
  const msgId = item.json.id || '';
  const fromEmail = ((item.json.from || {}).emailAddress || {}).address || '';
  const subject = item.json.subject || '';
  const conversationId = item.json.conversationId || '';
  const bodyText = (item.json.bodyPreview || item.json.body?.content || '').toLowerCase();
  const fullText = (subject + ' ' + bodyText).toLowerCase();
  
  // Kendi gönderdiklerimizi atla (fromEmail bizim adresimizse)
  if (fromEmail.includes('istmicro.com.tr')) continue;
  
  // Daha önce yanıtlanmış mı?
  if (yanitlanan.has(conversationId) || yanitlanan.has(msgId)) continue;
  
  // Müşteriyi e-posta adresine göre eşleştir
  let eslesen = null;
  for (const m of musteriler) {
    const eposta = (m['E-posta'] || '').toLowerCase().trim();
    if (eposta && fromEmail.toLowerCase().includes(eposta)) {
      eslesen = m;
      break;
    }
  }
  
  // Sadece tanıdık müşterilere yanıt ver
  let yanit = '';
  let eslenenAnahtar = '';
  
  if (eslesen) {
    // SSS'de anahtar kelime ara
    for (const sss of kb.sss) {
      for (const anahtar of sss.soru_anahtarlari) {
        if (fullText.includes(anahtar.toLowerCase())) {
          yanit = sss.cevap;
          eslenenAnahtar = anahtar;
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
            yanit = kat.aciklama + '<br><br>Detayl\u0131 bilgi ve teklif i\u00e7in istmicro@istmicro.com.tr adresine e-posta g\u00f6nderebilirsiniz.';
            eslenenAnahtar = anahtar;
            break;
          }
        }
        if (yanit) break;
      }
    }
    
    // Hala yanıt yoksa güvenli düşüş
    if (!yanit) {
      yanit = kb.cevaplanamaz_mesaj;
    }
  }
  
  const kisiAdi = eslesen ? (eslesen.Ki\u015fi || fromEmail.split('@')[0]) : fromEmail.split('@')[0];
  
  const htmlYanit = '<div style="font-family:Arial,sans-serif;max-width:600px">'
    + '<div style="background:#1a3a5c;padding:16px 24px;color:#fff;font-size:18px;font-weight:bold">IST Micro Teknoloji</div>'
    + '<div style="padding:24px;background:#fff">'
    + '<p style="font-size:15px;color:#333">Say\u0131n <strong>' + kisiAdi + '</strong>,</p>'
    + '<p style="font-size:14px;color:#555">Mesaj\u0131n\u0131z\u0131 ald\u0131k, te\u015fekk\u00fcr ederiz.</p>'
    + '<div style="background:#f9f9f9;border-left:3px solid #1a3a5c;padding:12px 16px;margin:12px 0">'
    + '<p style="font-size:14px;color:#555;margin:0">' + yanit + '</p></div>'
    + '<p style="font-size:13px;color:#888">Sorular\u0131n\u0131z i\u00e7in: istmicro@istmicro.com.tr</p>'
    + '</div>'
    + '<div style="background:#f8f8f8;padding:12px;text-align:center;font-size:11px;color:#999">'
    + 'IST Micro Teknoloji \u2014 \u0130stanbul, T\u00fcrkiye \u2014 www.istmicro.com.tr</div></div>';
  
  result.push({
    json: {
      message_id: msgId,
      conversation_id: conversationId,
      musteri_bulundu: !!eslesen,
      firma: eslesen ? eslesen.Firma : '',
      kisi: kisiAdi,
      email: fromEmail,
      subject: subject,
      yanit: yanit,
      yanit_html: htmlYanit,
      eslenen_anahtar: eslenenAnahtar
    }
  });
}

// Yanıtlanan mesajları kaydet (10MB sınırı var, en son 1000 mesajı tut)
const logDosyasi = '/mnt/downloads/sensors+test-2026/workflows/yanitlanan_mesajlar.json';
let log = [];
try { log = JSON.parse(fs.readFileSync(logDosyasi, 'utf-8') || '[]'); } catch(e) {}
for (const r of result) {
  if (r.json.musteri_bulundu && r.json.conversation_id) {
    if (!log.includes(r.json.conversation_id)) log.push(r.json.conversation_id);
  }
}
if (log.length > 1000) log = log.slice(-1000);
fs.writeFileSync(logDosyasi, JSON.stringify(log));

return result;`
    },
    position: [720, 300]
  },
  output: [{ json: { message_id: '', musteri_bulundu: false, firma: '', email: '', yanit: '', yanit_html: '' } }]
});

const taninanMusteri = ifElse({
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

const yanitla = node({
  type: 'n8n-nodes-base.microsoftOutlook',
  version: 2,
  config: {
    name: 'Yanıtla',
    parameters: {
      resource: 'message',
      operation: 'reply',
      messageId: { mode: 'id', value: expr('$json.message_id') },
      replyToSenderOnly: true,
      message: expr('$json.yanit_html')
    },
    credentials: {
      microsoftOutlookOAuth2Api: { id: null, name: 'Microsoft Outlook' }
    },
    position: [1200, 200]
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
  const { firma, email } = item.json;
  if (!firma || !email) continue;
  
  for (const m of pipeline.musteriler || []) {
    if (m.firma === firma && m.email === email) {
      m.asama = 'ilgilendi';
      m.son_etkilesim = new Date().toISOString();
      break;
    }
  }
}

pipeline.son_guncelleme = new Date().toISOString();
fs.writeFileSync(pipelinePath, JSON.stringify(pipeline, null, 2));
return items;`
    },
    position: [1440, 200]
  },
  output: [{ json: { firma: '', email: '' } }]
});

const taninmayan = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Tanınmayan - Atlanır', position: [1200, 500] },
  output: [{}]
});

export default workflow('exchange-email-reply', '📥 Exchange E-posta Yanıtları')
  .add(zamanlayici)
  .to(gelenKutusu)
  .to(musteriVeYanitBul)
  .to(taninanMusteri
    .onTrue(yanitla.to(asamaGuncelle))
    .onFalse(taninmayan)
  );
