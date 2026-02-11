import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiUrl } from '@/lib/http';

export function OrderStatusPage() {
  const { id } = useParams();
  const [status, setStatus] = useState('NEW');
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`${apiUrl}/orders/${id}/status`);
        if (!res.ok) return;
        const json = await res.json();
        if (json?.data?.status) setStatus(json.data.status);
        if (json?.data?.payment_link) setPaymentLink(json.data.payment_link);
      } catch {
        // optional endpoint may be absent
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [id]);

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <Link to="/" className="underline">← На главную</Link>
      <h1 className="text-2xl font-semibold">Заказ #{id}</h1>
      <div className="border rounded p-4">
        <p className="text-sm text-gray-600">Текущий статус</p>
        <p className="text-lg font-medium">{status}</p>
      </div>

      {paymentLink ? (
        <a href={paymentLink} target="_blank" className="inline-block px-4 py-2 rounded bg-emerald-600 text-white" rel="noreferrer">
          Перейти к оплате
        </a>
      ) : (
        <p className="text-sm text-gray-600">Ссылка на оплату появится после подтверждения флористом.</p>
      )}
    </div>
  );
}
