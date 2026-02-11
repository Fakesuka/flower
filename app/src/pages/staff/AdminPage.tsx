import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { http } from '@/lib/http';
import { useAuthStore } from '@/store/authStore';
import type { Store } from '@/types/api';

interface UserRow {
  id: number;
  username: string;
  role: 'admin' | 'florist';
  store_id: number | null;
}

export function AdminPage() {
  const token = useAuthStore((s) => s.token)!;
  const logout = useAuthStore((s) => s.logout);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [storeId, setStoreId] = useState<number | ''>('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [u, s, st] = await Promise.all([
        http<UserRow[]>('/users', {}, token),
        http<Store[]>('/stores', {}, token),
        http<any>('/admin/stats', {}, token),
      ]);
      setUsers(u);
      setStores(s);
      setStats(st);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => { void load(); }, []);

  const createFlorist = async (e: FormEvent) => {
    e.preventDefault();
    await http('/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, role: 'florist', store_id: storeId === '' ? null : Number(storeId) }),
    }, token);
    setUsername('');
    setPassword('');
    setStoreId('');
    await load();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Admin Panel</h1>
        <button className="px-3 py-2 rounded border" onClick={logout}>Logout</button>
      </header>
      {error && <div className="p-2 bg-red-50 text-red-600 rounded">{error}</div>}

      <section className="border rounded p-4">
        <h2 className="font-medium mb-2">Флористы (CRUD users)</h2>
        <form className="grid md:grid-cols-4 gap-2 mb-3" onSubmit={createFlorist}>
          <input className="border rounded p-2" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" required />
          <input className="border rounded p-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" required />
          <select className="border rounded p-2" value={storeId} onChange={(e) => setStoreId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">store</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button className="rounded bg-rose-500 text-white">Создать</button>
        </form>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b"><th>ID</th><th>Username</th><th>Role</th><th>Store</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b"><td>{u.id}</td><td>{u.username}</td><td>{u.role}</td><td>{u.store_id ?? '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border rounded p-4">
        <h2 className="font-medium mb-2">Статистика</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">По статусам</h3>
            <table className="w-full text-sm">
              <tbody>
                {(stats?.byStatus || []).map((row: any) => (
                  <tr key={row.status}><td>{row.status}</td><td>{row.orders_count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="h-64">
            <h3 className="text-sm font-medium mb-2">Выручка (PAID/COMPLETED)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.revenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#d98f9a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
