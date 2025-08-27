import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmail } from '../auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  async function submit(e: any) {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) return setError(error.message || 'Auth failed');
    nav('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="bg-white p-6 rounded shadow max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-4">Admin login</h2>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <label className="block text-xs font-medium text-gray-700">Email</label>
        <input className="w-full border rounded px-2 py-1 mb-3" value={email} onChange={e=>setEmail(e.target.value)} />
        <label className="block text-xs font-medium text-gray-700">Password</label>
        <input type="password" className="w-full border rounded px-2 py-1 mb-4" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 text-white py-2 rounded" disabled={loading}>{loading ? 'Signing...' : 'Sign in'}</button>
      </form>
    </div>
  );
}
