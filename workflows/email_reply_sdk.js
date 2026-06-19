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

const musteriBul = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Müşteri Bul',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      code: `const items = $input.all();
const fs = require('fs');
const csv = require('csv-parse/sync');

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
  const textBody = item.json.text || item.json.html || '';
  
  // Müşteriyi e-posta adresine göre eşleştir
  let eslesen = null;
  for (const m of musteriler) {
    const eposta = (m['E-posta'] || '').toLowerCase().trim();
    if (eposta && fromEmail.includes(eposta)) {
      eslesen = m;
      break;
    }
  }
  
  if (eslesen) {
    // Pipeline'da müşteri durumunu bul
    let asama = 'yeni';
    for (const p of pipeline.musteriler || []) {
      if (p.firma === eslesen.Firma && p.email === eslesen['E-posta']) {
        asama = p.asama || 'yeni';
        break;
      }
    }
    
    result.push({
      json: {
        musteri_bulundu: true,
        firma: eslesen.Firma,
        kisi: eslesen.Ki\u015fi || '',
        email: eslesen['E-posta'] || '',
        talep: eslesen['Ne istiyor'] || '',
        mevcut_asama: asama,
        yeni_asama: 'ilgilendi',
        konu: subject,
        yanit_ozeti: (textBody || '').slice(0, 500),
        mesaj: 'M\u00fc\u015fteri e-postay\u0131 yan\u0131tlad\u0131'
      }
    });
  } else {
    result.push({
      json: {
        musteri_bulundu: false,
        email: fromEmail,
        konu: subject,
        mesaj: 'Tan\u0131nmad\u0131'
      }
    });
  }
}
return result;`
    },
    position: [480, 300]
  },
  output: [{ json: { musteri_bulundu: false, firma: '', email: '' } }]
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
        ]
      },
      options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }
    },
    position: [720, 300]
  }
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
      m.asama = yeni_asama;
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
    position: [960, 200]
  },
  output: [{ json: { firma: '', email: '', mesaj: '' } }]
});

const taninmayan = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Tanınmayan Gönderici', position: [960, 500] },
  output: [{}]
});

export default workflow('email-reply-monitor', '📥 E-posta Yanıtları')
  .add(imapTrigger)
  .to(musteriBul)
  .to(taninanMusteriler
    .onTrue(asamaGuncelle)
    .onFalse(taninmayan)
  );
