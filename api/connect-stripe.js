import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://artwave-sigma.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const { userId, email, returnUrl } = req.body;

    const account = await stripe.accounts.create({
      type: 'express',
      email: email,
      metadata: { artwave_user_id: userId },
      capabilities: {
        card_payments: { requested: true },
        transfers:     { requested: true },
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account:     account.id,
      refresh_url: `https://artwave-sigma.vercel.app/artwave-dashboard.html?stripe=refresh`,
      return_url:  returnUrl || `https://artwave-sigma.vercel.app/artwave-dashboard.html?stripe=success`,
      type:        'account_onboarding',
    });

    res.status(200).json({ accountId: account.id, url: accountLink.url });

  } catch (err) {
    console.error('Stripe Connect error:', err);
    res.status(500).json({ error: err.message });
  }
}
