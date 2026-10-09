import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "vernal-maker-gf6jr",
  appId: "1:213662711994:web:2732176cbad2b592898283",
  apiKey: "AIzaSyD7vghtL2cYX2VU60eJzAcJZIJSpxw5WX4",
  authDomain: "vernal-maker-gf6jr.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-bet88gamingplatf-6ccaee40-01d9-4e38-9efd-7ae0204beb2b",
};

function getDb() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  return getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { amount, phone, description } = req.body || {};
  const numAmount = parseFloat(amount);
  if (!numAmount || numAmount < 50) {
    return res.status(400).json({ success: false, message: 'Minimum deposit is ₱50.' });
  }

  const cleanPhone = phone || '09060489645';
  const refNo = `PM-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const txId = `tx_pm_${Date.now()}`;

  // 1. Check environment variable first
  let liveSecretKey = process.env.PAYMONGO_SECRET_KEY || '';

  // 2. Check /tmp filesystem cache
  if (!liveSecretKey) {
    try {
      const fs = await import('fs');
      if (fs.existsSync('/tmp/paymongo_config.json')) {
        const parsed = JSON.parse(fs.readFileSync('/tmp/paymongo_config.json', 'utf-8'));
        if (parsed?.secretKey) {
          liveSecretKey = parsed.secretKey;
        }
      }
    } catch {}
  }

  // 3. Check Firestore cloud settings (reliably connected on Vercel)
  if (!liveSecretKey) {
    try {
      const db = getDb();
      const snap = await getDoc(doc(db, 'settings', 'paymongo_config'));
      if (snap.exists()) {
        const data: any = snap.data();
        if (data?.secretKey) {
          liveSecretKey = data.secretKey;
        }
      }
    } catch (e: any) {
      console.warn('Firestore read error in Vercel function:', e.message);
    }
  }

  if (!liveSecretKey) {
    return res.status(400).json({
      success: false,
      message: 'Walang naka-set na PayMongo Secret Key sa backend. Mangyaring ilagay ang inyong Secret Key (sk_live_...) sa Admin Settings (PayMongo Gateway) o sa Vercel Environment Variables.'
    });
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(liveSecretKey + ':').toString('base64');
    const amountInCentavos = Math.round(numAmount * 100);

    const pmRes = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: false,
            show_description: true,
            show_line_items: true,
            payment_method_types: ['gcash', 'paymaya', 'card', 'qrph', 'grab_pay', 'dob', 'billease'],
            line_items: [
              {
                currency: 'PHP',
                amount: amountInCentavos,
                description: description || 'Bet88 Casino Wallet Deposit',
                name: 'Bet88 Credits',
                quantity: 1,
              },
            ],
            description: `Bet88 Wallet Credit for ${cleanPhone} (Ref: ${refNo})`,
            reference_number: refNo,
          },
        },
      }),
    });

    const pmData: any = await pmRes.json().catch(() => ({}));
    if (pmRes.ok && pmData.data?.attributes?.checkout_url) {
      return res.json({
        success: true,
        checkoutUrl: pmData.data.attributes.checkout_url,
        referenceNo: refNo,
        transactionId: txId,
      });
    }

    const detail = pmData.errors?.[0]?.detail || pmData.message || (pmRes.status === 401 ? 'Maling Secret Key sa PayMongo' : `Error code HTTP ${pmRes.status}`);
    return res.status(400).json({
      success: false,
      message: `PayMongo API Error: ${detail}`
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Hindi makakonekta sa PayMongo: ${err.message}`
    });
  }
}
