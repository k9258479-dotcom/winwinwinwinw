import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Fetch config
  if (req.method === 'GET') {
    let configData: any = {
      isEnabled: true,
      publicKey: process.env.PAYMONGO_PUBLIC_KEY || '',
      secretKey: process.env.PAYMONGO_SECRET_KEY || '',
      webhookSecret: process.env.PAYMONGO_WEBHOOK_SECRET || '',
    };

    // 1. Check /tmp filesystem cache
    try {
      const fs = await import('fs');
      if (fs.existsSync('/tmp/paymongo_config.json')) {
        const saved = JSON.parse(fs.readFileSync('/tmp/paymongo_config.json', 'utf-8'));
        if (saved && typeof saved === 'object') {
          configData = { ...configData, ...saved };
        }
      }
    } catch {}

    // 2. Check Firestore
    try {
      const db = getDb();
      const snap = await getDoc(doc(db, 'settings', 'paymongo_config'));
      if (snap.exists()) {
        const remote = snap.data();
        if (remote) {
          configData = { ...configData, ...remote };
        }
      }
    } catch (e: any) {
      console.warn('Config fetch from Firestore error:', e.message);
    }

    return res.json({
      success: true,
      config: {
        isEnabled: configData.isEnabled !== false,
        publicKey: configData.publicKey || '',
        secretKey: configData.secretKey ? `${configData.secretKey.slice(0, 7)}...${configData.secretKey.slice(-4)}` : '',
        rawSecretKey: configData.secretKey || '',
        hasSecretKey: !!configData.secretKey,
        webhookSecret: configData.webhookSecret || '',
      },
    });
  }

  // POST: Save config
  if (req.method === 'POST') {
    const { isEnabled, publicKey, secretKey, webhookSecret } = req.body || {};

    let currentSecretKey = '';
    let currentWebhookSecret = '';

    // Fetch existing to avoid overwrite if masked
    try {
      const db = getDb();
      const snap = await getDoc(doc(db, 'settings', 'paymongo_config'));
      if (snap.exists()) {
        const old = snap.data();
        currentSecretKey = old?.secretKey || '';
        currentWebhookSecret = old?.webhookSecret || '';
      }
    } catch {}

    const effectiveSecretKey = (secretKey && !secretKey.includes('...') && !secretKey.includes('•'))
      ? secretKey.trim()
      : (currentSecretKey || process.env.PAYMONGO_SECRET_KEY || '');

    const effectiveWebhookSecret = (webhookSecret && !webhookSecret.includes('...') && !webhookSecret.includes('•'))
      ? webhookSecret.trim()
      : (currentWebhookSecret || process.env.PAYMONGO_WEBHOOK_SECRET || '');

    const payloadToSave = {
      isEnabled: isEnabled !== undefined ? !!isEnabled : true,
      publicKey: (publicKey || '').trim(),
      secretKey: effectiveSecretKey,
      webhookSecret: effectiveWebhookSecret,
      updatedAt: new Date().toISOString(),
    };

    // Save to /tmp
    try {
      const fs = await import('fs');
      fs.writeFileSync('/tmp/paymongo_config.json', JSON.stringify(payloadToSave, null, 2), 'utf-8');
    } catch {}

    // Save to Firestore (persisted across Vercel and Google Cloud)
    try {
      const db = getDb();
      await setDoc(doc(db, 'settings', 'paymongo_config'), payloadToSave, { merge: true });
    } catch (err: any) {
      console.warn('Failed saving to Firestore in Vercel function:', err.message);
    }

    return res.json({
      success: true,
      message: 'Matagumpay na na-save ang PayMongo gateway settings!',
      config: {
        isEnabled: payloadToSave.isEnabled,
        publicKey: payloadToSave.publicKey,
        hasSecretKey: !!payloadToSave.secretKey,
      },
    });
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
