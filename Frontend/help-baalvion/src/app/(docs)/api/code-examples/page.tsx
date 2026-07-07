import type { Metadata } from 'next';
import { DocPage } from '@/components/docs/doc-page';
import { CodeBlock } from '@/components/ui/code-block';

const PATH = '/api/code-examples';

export const metadata: Metadata = {
  title: 'Code Examples',
  description: 'JavaScript, Python, and cURL examples for the Baalvion API.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Code Examples"
      description="Common API calls in JavaScript, Python, and cURL to get you started quickly."
      toc={[
        { id: 'list-orders', text: 'List Orders' },
        { id: 'create-an-order', text: 'Create an Order' },
        { id: 'handle-a-webhook', text: 'Handle a Webhook' },
      ]}
    >
      <h2 id="list-orders">List Orders</h2>
      <CodeBlock
        language="bash"
        filename="cURL"
        code={`curl "https://api.baalvion.com/v1/orders?status=pending" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
      />
      <CodeBlock
        language="javascript"
        filename="JavaScript (fetch)"
        code={`const response = await fetch('https://api.baalvion.com/v1/orders?status=pending', {
  headers: { Authorization: \`Bearer \${process.env.BAALVION_API_KEY}\` },
});

const { data } = await response.json();
console.log(data);`}
      />
      <CodeBlock
        language="python"
        filename="Python (requests)"
        code={`import os
import requests

response = requests.get(
    "https://api.baalvion.com/v1/orders",
    params={"status": "pending"},
    headers={"Authorization": f"Bearer {os.environ['BAALVION_API_KEY']}"},
)

data = response.json()["data"]
print(data)`}
      />

      <h2 id="create-an-order">Create an Order</h2>
      <CodeBlock
        language="bash"
        filename="cURL"
        code={`curl -X POST https://api.baalvion.com/v1/orders \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "listingId": "lst_1a4f22", "quantity": 500 }'`}
      />
      <CodeBlock
        language="javascript"
        filename="JavaScript (fetch)"
        code={`const response = await fetch('https://api.baalvion.com/v1/orders', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.BAALVION_API_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ listingId: 'lst_1a4f22', quantity: 500 }),
});

const { data } = await response.json();
console.log(data);`}
      />
      <CodeBlock
        language="python"
        filename="Python (requests)"
        code={`import os
import requests

response = requests.post(
    "https://api.baalvion.com/v1/orders",
    json={"listingId": "lst_1a4f22", "quantity": 500},
    headers={"Authorization": f"Bearer {os.environ['BAALVION_API_KEY']}"},
)

order = response.json()["data"]
print(order)`}
      />

      <h2 id="handle-a-webhook">Handle a Webhook</h2>
      <CodeBlock
        language="javascript"
        filename="Node.js (Express)"
        code={`const crypto = require('crypto');

app.post('/webhooks/baalvion', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.header('Baalvion-Signature');
  const expected = crypto
    .createHmac('sha256', process.env.BAALVION_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (signature !== expected) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body);
  // handle event.type, e.g. 'order.status_changed'
  res.sendStatus(200);
});`}
      />
      <CodeBlock
        language="python"
        filename="Python (Flask)"
        code={`import hashlib
import hmac
import os

from flask import Flask, request

app = Flask(__name__)

@app.post("/webhooks/baalvion")
def handle_webhook():
    signature = request.headers.get("Baalvion-Signature", "")
    secret = os.environ["BAALVION_WEBHOOK_SECRET"].encode()
    expected = hmac.new(secret, request.data, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(signature, expected):
        return "Invalid signature", 401

    event = request.get_json()
    # handle event["type"], e.g. "order.status_changed"
    return "", 200`}
      />
    </DocPage>
  );
}
