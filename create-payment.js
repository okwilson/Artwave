const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const { amount, commissionId, commissionTitle, clientEmail, artistName, paymentType } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // 50/50 split — each payment is half the total
    const halfCents    = Math.round((amount / 2) * 100);
    const platformFee  = Math.round(halfCents * 0.07);
    const artistPayout = halfCents - platformFee;
    const isDeposit    = paymentType === 'deposit';
    const label        = isDeposit ? '50% Deposit' : 'Final 50% Payment';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${commissionTitle || 'Artwave Commission'} — ${label}`,
            description: `${isDeposit ? 'Deposit to begin work' : 'Final payment on delivery'} · Artist receives $${(artistPayout/100).toFixed(2)}`,
          },
          unit_amount: halfCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `https://artwave-sigma.vercel.app/artwave-commissions.html?payment=success&commission=${commissionId}&type=${paymentType}`,
      cancel_url:  `https://artwave-sigma.vercel.app/artwave-commissions.html?payment=cancelled`,
      customer_email: clientEmail || undefined,
      metadata: {
        commission_id: commissionId || '',
        payment_type:  paymentType || 'deposit',
        platform_fee:  platformFee.toString(),
        artist_payout: artistPayout.toString(),
      },
    });

    res.status(200).json({ url: session.url, sessionId: session.id });

  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
