import { Router } from 'express';
import { get, run } from '../db';
import { conflict, notFound } from '../lib/errors';
import { getPaymentProvider } from '../payments';
import { markPaymentAsPaid } from '../payments/service';

const router = Router();

router.get('/mock/:paymentId', async (req, res, next) => {
  try {
    const paymentId = Number(req.params.paymentId);
    const payment = await get<any>('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (!payment) throw notFound('Payment not found');

    if (payment.status === 'PAID') {
      return res.send(`<!doctype html><html><body><h2>Payment #${paymentId} already paid</h2></body></html>`);
    }

    res.send(`<!doctype html>
<html>
  <body style="font-family:Arial;max-width:500px;margin:40px auto;">
    <h2>Mock Payment</h2>
    <p>Payment #${paymentId}</p>
    <p>Amount: ${payment.amount} ${payment.currency}</p>
    <form method="post" action="/pay/mock/${paymentId}/pay">
      <button style="padding:10px 14px;">Pay</button>
    </form>
  </body>
</html>`);
  } catch (e) {
    next(e);
  }
});

router.post('/mock/:paymentId/pay', async (req, res, next) => {
  try {
    const paymentId = Number(req.params.paymentId);
    await markPaymentAsPaid(paymentId, 'Mock payment completed by customer');
    res.send(`<!doctype html><html><body><h2>Payment successful</h2><p>Payment #${paymentId} marked as PAID.</p></body></html>`);
  } catch (e) {
    next(e);
  }
});

router.post('/webhook/:provider', async (req, res, next) => {
  try {
    const providerName = req.params.provider as 'mock';
    const provider = getPaymentProvider(providerName, `${req.protocol}://${req.get('host')}`);
    const parsed = await provider.parseWebhook(req.body);

    const payment = await get<any>('SELECT * FROM payments WHERE id = ?', [parsed.paymentId]);
    if (!payment) throw notFound('Payment not found');

    if (parsed.status === 'PAID') {
      await markPaymentAsPaid(parsed.paymentId, `Webhook confirmed by ${provider.name}`);
    } else {
      if (payment.status === 'PAID') throw conflict('Paid payment cannot change status');
      await run('UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [parsed.status, parsed.paymentId]);
    }

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
