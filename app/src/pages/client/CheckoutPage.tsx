import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { http } from '@/lib/http';
import { useClientStore } from '@/store/clientStore';
import type { Store } from '@/types/api';

export function CheckoutPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [pickupStoreId, setPickupStoreId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerComment, setCustomerComment] = useState('');
  const [error, setError] = useState('');
  const cart = useClientStore((s) => s.cart);
  const clearCart = useClientStore((s) => s.clearCart);
  const navigate = useNavigate();

  useEffect(() => {
    http<Store[]>('/stores').then((data) => {
      setStores(data);
      if (data[0]) setPickupStoreId(data[0].id);
    }).catch((e) => setError(e.message));
  }, []);

  const total = useMemo(() => cart.reduce((sum, i) => sum + i.product.price * i.qty, 0), [cart]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const order = await http<any>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          delivery_type: deliveryType,
          pickup_store_id: deliveryType === 'pickup' ? pickupStoreId : null,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_comment: customerComment,
          items: cart.map((i) => ({ product_id: i.product.id, qty: i.qty, price: i.product.price, name: i.product.name })),
          total_price: total,
        }),
      });
      clearCart();
      navigate(`/order/${order.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Link to="/" className="underline">← Назад в каталог</Link>
      <h1 className="text-2xl font-semibold mt-2">Оформление заказа</h1>
      <p className="text-sm text-gray-600">После создания заказа статус: "Ожидает подтверждения флористом"</p>

      <form className="space-y-3 mt-4" onSubmit={submit}>
        <div>
          <label className="block text-sm">Тип получения</label>
          <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value as any)} className="border rounded p-2 w-full">
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>

        {deliveryType === 'pickup' && (
          <div>
            <label className="block text-sm">Точка самовывоза</label>
            <select
              value={pickupStoreId ?? ''}
              onChange={(e) => setPickupStoreId(Number(e.target.value))}
              className="border rounded p-2 w-full"
            >
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        <input className="border rounded p-2 w-full" placeholder="Имя" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        <input className="border rounded p-2 w-full" placeholder="Телефон" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
        <textarea className="border rounded p-2 w-full" placeholder="Комментарий" value={customerComment} onChange={(e) => setCustomerComment(e.target.value)} />

        <div className="border rounded p-3 text-sm">
          Позиций: {cart.length}, сумма: <b>{total} ₽</b>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button className="px-4 py-2 rounded bg-rose-500 text-white" disabled={cart.length === 0}>Создать заказ</button>
      </form>
    </div>
  );
}
