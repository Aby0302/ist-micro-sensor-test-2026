import { workflow, node, trigger, ifElse, expr, splitInBatches, merge, switchCase } from '@n8n/workflow-sdk';

const webhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook',
    parameters: {
      path: 'email-takip',
      responseMode: 'onReceived',
      responseData: 'lastEntry',
      options: {
        rawBody: true,
        responseHeaders: {
          entries: [
            { name: 'Content-Type', value: 'image/gif' }
          ]
        }
      }
    },
    httpMethod: 'GET',
    position: [240, 300]
  },
  output: [{}]
});

const eventCozumle = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: "Event'i Çözümle",
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      code: `const items = $input.all();
const result = [];
for (const item of items) {
  const query = item.json.query || '';
  const params = new URLSearchParams(query);
  const customerId = params.get('cid');
  const event = params.get('event');
  const action = params.get('action');
  
  let hedefAsama = 'email_acildi';
  if (action === 'interested' || action === 'followup_click') {
    hedefAsama = 'ilgilendi';
  } else if (action === 'offer_view') {
    hedefAsama = 'teklif_gonderildi';
  } else if (event === 'click') {
    hedefAsama = 'ilgilendi';
  } else if (event === 'open') {
    hedefAsama = 'email_acildi';
  }
  
  result.push({
    json: {
      customer_id: customerId,
      event: event,
      action: action,
      hedef_asama: hedefAsama
    }
  });
}
return result;`
    },
    position: [480, 300]
  },
  output: [{ json: { customer_id: '', event: '', hedef_asama: '' } }]
});

const asamaGuncelle = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Aşama Güncelle',
    parameters: {
      method: 'GET',
      url: 'http://localhost:8080/ilerlet/' + expr('$json.customer_id') + '/' + expr('$json.hedef_asama'),
      authentication: 'none',
      options: {}
    },
    position: [720, 300]
  },
  output: [{}]
});

// Return 1x1 transparent GIF pixel
const pixelYanit = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pixel Yanıt',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      code: `const pixelBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const pixelBytes = Buffer.from(pixelBase64, 'base64');

return [{
  json: { status: 'ok', event: $input.first().json.event },
  binary: {
    data: {
      data: pixelBytes.toString('base64'),
      mimeType: 'image/gif',
      fileName: 'pixel.gif'
    }
  }
}];`
    },
    position: [960, 300]
  },
  output: [{ json: {}, binary: {} }]
});

export default workflow('tracking-webhook', '👁️ E-posta Takip Webhook')
  .add(webhook)
  .to(eventCozumle)
  .to(asamaGuncelle)
  .to(pixelYanit);
