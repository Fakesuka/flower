import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      const role = useAuthStore.getState().user?.role;
      navigate(role === 'admin' ? '/admin' : '/florist');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4 mt-20 border rounded-xl">
      <h1 className="text-xl font-semibold">Staff Login</h1>
      <form onSubmit={submit} className="space-y-3 mt-4">
        <input className="border rounded p-2 w-full" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input className="border rounded p-2 w-full" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="w-full px-4 py-2 rounded bg-rose-500 text-white">Login</button>
      </form>
      {user && <p className="text-xs mt-3 text-gray-500">Вы вошли как {user.username}</p>}
      <Link to="/" className="text-sm underline mt-3 inline-block">В клиентскую зону</Link>
    </div>
  );
}
