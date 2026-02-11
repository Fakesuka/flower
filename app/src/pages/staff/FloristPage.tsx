import { useEffect, useMemo, useState } from 'react';
import { http } from '@/lib/http';
import { useAuthStore } from '@/store/authStore';
import type { Order, Product, Story } from '@/types/api';


interface OrderItem {
  product_id?: number;
  qty: number;
  price?: number;
  name: string;
}

export function FloristPage() {
  const token = useAuthStore((s) => s.token)!;
  const logout = useAuthStore((s) => s.logout);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAll = async () => {
    try {
      const [o, p, s] = await Promise.all([
        http<Order[]>('/orders', {}, token),
        http<Product[]>('/products'),
        http<Story[]>('/stories'),
      ]);
      setOrders(o);
      setProducts(p);
      setStories(s);
      if (selectedOrder) {
        const fresh = o.find((x) => x.id === selectedOrder.id);
        setSelectedOrder(fresh || null);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => { void loadAll(); }, []);

  const orderItems = useMemo(() => {
    if (!selectedOrder) return [] as OrderItem[];
    try {
      return JSON.parse(selectedOrder.items_json) as OrderItem[];
    } catch {
      return [];
    }
  }, [selectedOrder]);

  const acceptOrder = async () => {
    if (!selectedOrder) return;
    try {
      await http(`/orders/${selectedOrder.id}/accept`, { method: 'POST', body: JSON.stringify({}) }, token);
      setMessage('Заказ принят');
      await loadAll();
    } catch (e: any) {
      if (e.status === 409) setMessage('Заказ уже принят другой точкой');
      else setError(e.message);
    }
  };

  const setStatus = async (status: string, msg?: string) => {
    if (!selectedOrder) return;
    await http(`/orders/${selectedOrder.id}/status`, { method: 'POST', body: JSON.stringify({ status, message: msg }) }, token);
    await loadAll();
  };

  const addEvent = async (event_type: 'COMMENT' | 'CONTACT_ATTEMPT' | 'STATUS_CHANGE', msg: string) => {
    if (!selectedOrder || !msg) return;
    await http(`/orders/${selectedOrder.id}/events`, { method: 'POST', body: JSON.stringify({ event_type, message: msg }) }, token);
    setMessage('Событие добавлено');
  };

  const callPaymentLink = async () => {
    if (!selectedOrder) return;
    try {
      const data = await http<any>(`/orders/${selectedOrder.id}/create-payment-link`, { method: 'POST', body: JSON.stringify({}) }, token);
      setMessage(data.payment_link ? `Ссылка: ${data.payment_link}` : 'Запрос payment link отправлен');
      await setStatus('PAYMENT_LINK_SENT');
    } catch {
      setMessage('Backend endpoint payment-link пока недоступен');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Florist Panel</h1>
        <button className="px-3 py-2 rounded border" onClick={logout}>Logout</button>
      </header>

      {error && <div className="p-2 bg-red-50 text-red-600 rounded">{error}</div>}
      {message && <div className="p-2 bg-emerald-50 text-emerald-700 rounded">{message}</div>}

      <div className="grid md:grid-cols-3 gap-4">
        <section className="border rounded p-3 md:col-span-1">
          <h2 className="font-medium mb-2">Заказы</h2>
          <div className="space-y-2 max-h-[500px] overflow-auto">
            {orders.map((o) => (
              <button key={o.id} className="w-full text-left border rounded p-2" onClick={() => setSelectedOrder(o)}>
                <div>#{o.id} · {o.status}</div>
                <div className="text-xs text-gray-600">{o.delivery_type} · assigned: {o.assigned_store_id ?? '—'}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="border rounded p-3 md:col-span-2">
          <h2 className="font-medium mb-2">Карточка заказа</h2>
          {!selectedOrder && <p className="text-sm text-gray-600">Выберите заказ</p>}
          {selectedOrder && (
            <div className="space-y-3">
              <div className="text-sm">
                <div>Клиент: {selectedOrder.customer_name}, {selectedOrder.customer_phone}</div>
                <div>Комментарий: {selectedOrder.customer_comment || '—'}</div>
              </div>
              <div className="text-sm">Товары: {orderItems.map((i) => `${i.name} x${i.qty}`).join(', ')}</div>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={acceptOrder}>Принять</button>
                <button
                  className="px-3 py-1 rounded border disabled:opacity-50"
                  onClick={() => setStatus('IN_PROGRESS')}
                  disabled={selectedOrder.status !== 'PAID'}
                  title={selectedOrder.status !== 'PAID' ? 'Доступно после оплаты (PAID)' : ''}
                >
                  Начать сборку
                </button>
                <button className="px-3 py-1 rounded border" onClick={() => setStatus('READY')}>Готов</button>
                <button className="px-3 py-1 rounded border" onClick={() => setStatus('OUT_FOR_DELIVERY')}>Доставляется</button>
                <button className="px-3 py-1 rounded border" onClick={() => setStatus('COMPLETED')}>Завершён</button>
                <button
                  className="px-3 py-1 rounded border"
                  onClick={() => {
                    const text = prompt('Комментарий: нет в наличии / нужна замена') || '';
                    void setStatus('NEED_CUSTOMER_CONFIRMATION', text);
                    if (text) void addEvent('COMMENT', text);
                  }}
                >
                  Нужна замена
                </button>
                <button className="px-3 py-1 rounded border" onClick={callPaymentLink}>Отправить ссылку на оплату</button>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <h2 className="font-medium mb-2">Products CRUD (общие)</h2>
          <div className="space-y-2 max-h-60 overflow-auto">
            {products.map((p) => <div key={p.id} className="text-sm border rounded p-2">#{p.id} {p.name} — {p.price} ₽</div>)}
          </div>
        </div>
        <div className="border rounded p-3">
          <h2 className="font-medium mb-2">Stories CRUD (общие)</h2>
          <div className="space-y-2 max-h-60 overflow-auto">
            {stories.map((s) => <div key={s.id} className="text-sm border rounded p-2">#{s.id} {s.title}</div>)}
          </div>
        </div>
      </section>
    </div>
  );
}
