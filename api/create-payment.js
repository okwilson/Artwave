import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://artwave-sigma.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const { amount, artistStripeId, commissionId, commissionTitle, clientEmail, artistName } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const totalCents  = Math.round(amount * 100);
    const platformFee = Math.round(totalCents * 0.07);

    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: commissionTitle || 'Artwave Commission',
            description: `Commission with ${artistName || 'artist'} via Artwave`,
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `https://artwave-sigma.vercel.app/artwave-commissions.html?payment=success&commission=${commissionId}`,
      cancel_url:  `https://artwave-sigma.vercel.app/artwave-commissions.html?payment=cancelled`,
      customer_email: clientEmail || undefined,
      metadata: {
        commission_id:    commissionId || '',
        platform_fee:     platformFee.toString(),
        artist_stripe_id: artistStripeId || '',
      },
    };

    if (artistStripeId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFee,
        transfer_data: { destination: artistStripeId },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.status(200).json({ url: session.url, sessionId: session.id });

  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
}
