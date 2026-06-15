'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb', fontFamily: 'var(--font, system-ui)' }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, textAlign: 'center', marginBottom: 24, color: '#111' }}>Tạo tài khoản</h1>
        
        {error && <div style={{ padding: 12, background: '#fee2e2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>{error}</div>}
        {success && <div style={{ padding: 12, background: '#d1fae5', color: '#059669', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>{success}</div>}

        <button 
          onClick={handleGoogleLogin}
          style={{ width: '100%', padding: '12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '1rem', fontWeight: 600, color: '#374151', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 18, height: 18 }} />
          Đăng ký bằng Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ padding: '0 10px', color: '#6b7280', fontSize: '0.85rem' }}>hoặc dùng email</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Email</label>
            <input 
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, outline: 'none', fontSize: '1rem', color: '#111' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Mật khẩu (ít nhất 6 ký tự)</label>
            <input 
              type="password" required minLength={6}
              value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, outline: 'none', fontSize: '1rem', color: '#111' }}
            />
          </div>
          <button 
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', background: '#0ea5e9', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 8 }}
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: '#6b7280' }}>
          Đã có tài khoản? <Link href="/login" style={{ color: '#0ea5e9', fontWeight: 600, textDecoration: 'none' }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
