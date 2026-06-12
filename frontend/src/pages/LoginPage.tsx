import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [cpf, setCpf] = useState('');
  const [pin, setPin] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simular login bem sucedido
    navigate('/upload');
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
        <button type="submit" className="btn">Entrar</button>
      </form>
    </div>
  );
}
