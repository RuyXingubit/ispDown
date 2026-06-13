import React, { useState, useEffect } from 'react';

interface Client {
  ID: number;
  Name: string;
  CPF: string;
  IsActive: boolean;
}

interface Props {
  token: string;
  onLogout: () => void;
}

export default function AdminDashboard({ token, onLogout }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao carregar clientes');
      const data = await res.json();
      setClients(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [token]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName, cpf: newCpf, pin: newPin })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao criar cliente');
      }

      // Sucesso
      setShowModal(false);
      setNewName('');
      setNewCpf('');
      setNewPin('');
      fetchClients(); // Recarrega a lista
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Painel do Provedor</h2>
        <div>
          <button className="btn" onClick={() => setShowModal(true)} style={{ marginRight: '1rem' }}>+ Adicionar Cliente</button>
          <button className="btn" onClick={onLogout} style={{ backgroundColor: '#666' }}>Sair</button>
        </div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div className="card">
        <h3>Lista de Clientes</h3>
        {loading ? (
          <p>Carregando...</p>
        ) : clients.length === 0 ? (
          <p style={{ marginTop: '1rem', color: '#888' }}>Nenhum cliente cadastrado ainda.</p>
        ) : (
          <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '0.5rem' }}>ID</th>
                  <th style={{ padding: '0.5rem' }}>Nome</th>
                  <th style={{ padding: '0.5rem' }}>CPF</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.ID} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '0.5rem' }}>{c.ID}</td>
                    <td style={{ padding: '0.5rem' }}>{c.Name}</td>
                    <td style={{ padding: '0.5rem' }}>{c.CPF}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{ color: c.IsActive ? '#4caf50' : '#f44336' }}>
                        {c.IsActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999
        }}>
          <div className="card" style={{ maxWidth: 400, width: '100%' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Novo Cliente</h3>
            <form onSubmit={handleCreateClient}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nome Completo</label>
                <input required type="text" className="input" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>CPF (apenas números)</label>
                <input required type="text" className="input" value={newCpf} onChange={e => setNewCpf(e.target.value.replace(/\D/g, ''))} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>PIN (4 dígitos)</label>
                <input required type="password" maxLength={4} className="input" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn" style={{ backgroundColor: '#666' }} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
