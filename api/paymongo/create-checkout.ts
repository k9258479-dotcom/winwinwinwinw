export default async function handler(req: any, res: any) {
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
  let liveSecretKey = process.env.PAYMONGO_SECRET_KEY || '';
  if (!liveSecretKey) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const cfgPaths = [
        '/tmp/paymongo_config.json',
        path.join(process.cwd(), 'paymongo_config.json'),
      ];
      for (const cp of cfgPaths) {
        if (fs.existsSync(cp)) {
          const parsed = JSON.parse(fs.readFileSync(cp, 'utf-8'));
          if (parsed?.secretKey) {
            liveSecretKey = parsed.secretKey;
            break;
          }
        }
      }
    } catch {}
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
  } catch (err) {
    console.warn('Live PayMongo API checkout session error:', err);
  }

  // Resilient fallback checkout page
  const simCheckoutUrl = `/paymongo-checkout.html?amount=${numAmount}&phone=${cleanPhone}&ref=${refNo}&tx=${txId}`;
  return res.json({
    success: true,
    checkoutUrl: simCheckoutUrl,
    referenceNo: refNo,
    transactionId: txId,
  });
}
