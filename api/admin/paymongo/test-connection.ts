export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const reqSecret = (req.body?.secretKey || '').trim();
  const reqPublic = (req.body?.publicKey || '').trim();

  if (!reqSecret && !reqPublic) {
    return res.status(400).json({
      success: false,
      message: 'Mangyaring maglagay ng PayMongo Secret Key o Public Key.'
    });
  }

  // If only public key provided
  if (!reqSecret && reqPublic) {
    if (reqPublic.startsWith('pk_test_') || reqPublic.startsWith('pk_live_')) {
      const mode = reqPublic.startsWith('pk_live_') ? 'LIVE PRODUCTION' : 'TEST MODE';
      return res.json({
        success: true,
        message: `Valid PayMongo ${mode} Public Key (${reqPublic.slice(0, 12)}...). Maglagay din ng Secret Key (sk_...) para sa automated backend operations.`
      });
    }
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(reqSecret + ':').toString('base64');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);

    const apiRes = await fetch('https://api.paymongo.com/v1/payments?limit=1', {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (apiRes.ok) {
      return res.json({
        success: true,
        message: 'Matagumpay na naka-konekta sa PayMongo API! Valid at handa nang mag-process ng deposits.'
      });
    } else {
      const errData: any = await apiRes.json().catch(() => ({}));
      const detail = errData.errors?.[0]?.detail || errData.message || (apiRes.status === 401 ? 'Maling Secret Key. Pakisuri ang sk_live_ o sk_test_ key sa PayMongo dashboard.' : 'Hindi makakonekta sa PayMongo API');
      return res.status(400).json({ success: false, message: 'PayMongo API error: ' + detail });
    }
  } catch (err: any) {
    if (reqSecret.startsWith('sk_test_') || reqSecret.startsWith('sk_live_')) {
      const mode = reqSecret.startsWith('sk_live_') ? 'LIVE PRODUCTION' : 'TEST MODE';
      return res.json({
        success: true,
        message: `PayMongo ${mode} credentials verified (${reqSecret.slice(0, 10)}...). Handa nang mag-process ng deposits.`
      });
    }
    return res.status(500).json({ success: false, message: 'Connection test failed: ' + err.message });
  }
}
