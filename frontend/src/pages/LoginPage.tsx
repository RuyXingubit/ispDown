import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [cpf, setCpf] = useState('');
  const [pin, setPin] = useState('');
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpf.replace(/\D/g, ''), pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao acessar. Verifique CPF e PIN.');
      }

      localStorage.setItem('clientToken', data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Acesso do Cliente</h2>
      <form onSubmit={handleLogin}>
        <div className="input-group">
          <label>CPF</label>
          <input 
            type="text" 
            placeholder="000.000.000-00" 
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            required 
          />
        </div>
        <div className="input-group">
          <label>PIN (4 dígitos)</label>
          <input 
            type="password" 
            placeholder="****" 
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required 
          />
        </div>
        {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</p>}
        <button type="submit" className="btn btn-block" disabled={loading}>
          {loading ? 'Acessando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
