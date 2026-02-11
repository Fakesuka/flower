import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

process.env.DB_PATH = 'data/test.sqlite';
process.env.JWT_SECRET = 'test-secret';

import { app } from '../app';
import { applyMigrations } from '../migrate';
import { run, exec } from '../db';
import { hashPassword } from '../lib/password';

async function createUser(username: string, role: 'admin' | 'florist', storeId: number | null, password = 'password123') {
  const hash = await hashPassword(password);
  await run('INSERT INTO users(username, password_hash, role, store_id) VALUES (?,?,?,?)', [username, hash, role, storeId]);
}

describe('auth, order race and payments', () => {
  beforeAll(async () => {
    await applyMigrations();
  });

  beforeEach(async () => {
    await exec(`
      DELETE FROM order_events;
      DELETE FROM payments;
      DELETE FROM orders;
      DELETE FROM users;
      DELETE FROM stores;
    `);

    await run('INSERT INTO stores(name, address) VALUES (?,?)', ['Store 1', 'Addr1']);
    await run('INSERT INTO stores(name, address) VALUES (?,?)', ['Store 2', 'Addr2']);

    await createUser('admin', 'admin', null);
    await createUser('fl1', 'florist', 1);
    await createUser('fl2', 'florist', 2);
  });

  it('login ok and failed', async () => {
    const ok = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'password123' });
    expect(ok.status).toBe(200);
    expect(ok.body.success).toBe(true);
    expect(ok.body.data.token).toBeTruthy();

    const fail = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'wrongpass' });
    expect(fail.status).toBe(401);
    expect(fail.body.success).toBe(false);
  });

  it('delivery race accept returns 409 for second florist', async () => {
    const create = await request(app).post('/api/orders').send({
      delivery_type: 'delivery',
      customer_name: 'Test',
      customer_phone: '+79990000000',
      items: [{ product_id: 1, qty: 1, price: 1000, name: 'Rose' }],
      total_price: 1000,
    });

    const orderId = create.body.data.id;

    const token1 = (await request(app).post('/api/auth/login').send({ username: 'fl1', password: 'password123' })).body.data.token;
    const token2 = (await request(app).post('/api/auth/login').send({ username: 'fl2', password: 'password123' })).body.data.token;

    const first = await request(app).post(`/api/orders/${orderId}/accept`).set('Authorization', `Bearer ${token1}`).send({});
    expect(first.status).toBe(200);

    const second = await request(app).post(`/api/orders/${orderId}/accept`).set('Authorization', `Bearer ${token2}`).send({});
    expect(second.status).toBe(409);
  });

  it('create payment link and pay flow to PAID', async () => {
    const create = await request(app).post('/api/orders').send({
      delivery_type: 'delivery',
      customer_name: 'Buyer',
      customer_phone: '+79990000000',
      items: [{ product_id: 1, qty: 1, price: 1500, name: 'Tulip' }],
      total_price: 1500,
    });
    const orderId = create.body.data.id;

    const floristToken = (await request(app).post('/api/auth/login').send({ username: 'fl1', password: 'password123' })).body.data.token;
    await request(app).post(`/api/orders/${orderId}/accept`).set('Authorization', `Bearer ${floristToken}`).send({});

    const createLink = await request(app)
      .post(`/api/orders/${orderId}/create-payment-link`)
      .set('Authorization', `Bearer ${floristToken}`)
      .send({});

    expect(createLink.status).toBe(200);
    expect(createLink.body.data.payment_url).toContain('/pay/mock/');

    const paymentId = createLink.body.data.id;
    const pay = await request(app).post(`/pay/mock/${paymentId}/pay`).send({});
    expect(pay.status).toBe(200);

    const status = await request(app).get(`/api/orders/${orderId}/status`);
    expect(status.body.data.status).toBe('PAID');
  });

  it('second mock pay returns 409', async () => {
    const create = await request(app).post('/api/orders').send({
      delivery_type: 'delivery',
      customer_name: 'Buyer',
      customer_phone: '+79990000000',
      items: [{ product_id: 1, qty: 1, price: 1500, name: 'Tulip' }],
      total_price: 1500,
    });
    const orderId = create.body.data.id;

    const floristToken = (await request(app).post('/api/auth/login').send({ username: 'fl1', password: 'password123' })).body.data.token;
    await request(app).post(`/api/orders/${orderId}/accept`).set('Authorization', `Bearer ${floristToken}`).send({});

    const createLink = await request(app)
      .post(`/api/orders/${orderId}/create-payment-link`)
      .set('Authorization', `Bearer ${floristToken}`)
      .send({});

    const paymentId = createLink.body.data.id;
    await request(app).post(`/pay/mock/${paymentId}/pay`).send({});
    const second = await request(app).post(`/pay/mock/${paymentId}/pay`).send({});
    expect(second.status).toBe(409);
  });
});
