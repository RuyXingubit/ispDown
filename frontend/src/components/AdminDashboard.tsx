import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

// Validação matemática de CPF (algoritmo da Receita Federal)
function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // todos iguais

  const nums = digits.split('').map(Number);

  // Primeiro dígito verificador
  const sum1 = nums.slice(0, 9).reduce((acc, n, i) => acc + n * (10 - i), 0);
  const r1 = sum1 % 11;
  const d1 = r1 < 2 ? 0 : 11 - r1;
  if (nums[9] !== d1) return false;

  // Segundo dígito verificador
  const sum2 = nums.slice(0, 10).reduce((acc, n, i) => acc + n * (11 - i), 0);
  const r2 = sum2 % 11;
  const d2 = r2 < 2 ? 0 : 11 - r2;
  return nums[10] === d2;
}

// Formata CPF: 00000000000 → 000.000.000-00
function formatCPF(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2');
}

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

  // Modal novo cliente
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal confirmação de exclusão
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

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

    // Valida CPF antes de enviar
    const rawCpf = newCpf.replace(/\D/g, '');
    if (!validateCPF(rawCpf)) {
      setCpfError('CPF inválido. Verifique os dígitos.');
      return;
    }

    setSaving(true);
    setError('');
    setCpfError('');

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName, cpf: rawCpf, pin: newPin })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao criar cliente');
      }

      setShowModal(false);
      setNewName('');
      setNewCpf('');
      setCpfError('');
      setNewPin('');
      fetchClients();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (client: Client) => {
    const newStatus = !client.IsActive;
    try {
      const res = await fetch(`/api/admin/clients/${client.ID}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: newStatus })
      });
      if (!res.ok) throw new Error('Erro ao atualizar status');
      setClients(prev => prev.map(c => c.ID === client.ID ? { ...c, IsActive: newStatus } : c));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientToDelete.ID}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao excluir cliente');
      setClientToDelete(null);
      fetchClients();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2 className="admin-title">Painel do Provedor</h2>
        <div className="admin-header-actions">
          <button className="btn" onClick={() => setShowModal(true)}>+ Adicionar Cliente</button>
          <button className="btn btn-secondary" onClick={onLogout}>Sair</button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-card">
        <h3 className="admin-card-title">Lista de Clientes</h3>

        {loading ? (
          <p className="admin-empty">Carregando...</p>
        ) : clients.length === 0 ? (
          <p className="admin-empty">Nenhum cliente cadastrado ainda.</p>
        ) : (
          <>
            {/* Tabela — visível em telas médias/grandes */}
            <div className="clients-table-wrapper">
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Status</th>
                    <th className="col-actions">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.ID} className={c.IsActive ? '' : 'row-inactive'}>
                      <td>{c.ID}</td>
                      <td>{c.Name}</td>
                      <td className="cpf-cell">{c.CPF}</td>
                      <td>
                        <span className={`status-badge ${c.IsActive ? 'status-active' : 'status-inactive'}`}>
                          {c.IsActive ? '● Ativo' : '● Suspenso'}
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="row-actions">
                          <button
                            className={`action-btn ${c.IsActive ? 'action-suspend' : 'action-reactivate'}`}
                            onClick={() => handleToggleStatus(c)}
                            title={c.IsActive ? 'Suspender e bloquear links' : 'Reativar e liberar links'}
                          >
                            {c.IsActive ? 'Suspender' : 'Reativar'}
                          </button>
                          <button
                            className="action-btn action-delete"
                            onClick={() => setClientToDelete(c)}
                            title="Excluir permanentemente"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards — visível apenas em telas pequenas */}
            <div className="clients-cards">
              {clients.map(c => (
                <div key={c.ID} className={`client-card ${c.IsActive ? '' : 'client-card-inactive'}`}>
                  <div className="client-card-header">
                    <div>
                      <div className="client-card-name">{c.Name}</div>
                      <div className="client-card-cpf">{c.CPF}</div>
                    </div>
                    <span className={`status-badge ${c.IsActive ? 'status-active' : 'status-inactive'}`}>
                      {c.IsActive ? '● Ativo' : '● Suspenso'}
                    </span>
                  </div>
                  <div className="client-card-footer">
                    <button
                      className={`action-btn ${c.IsActive ? 'action-suspend' : 'action-reactivate'}`}
                      onClick={() => handleToggleStatus(c)}
                    >
                      {c.IsActive ? 'Suspender' : 'Reativar'}
                    </button>
                    <button
                      className="action-btn action-delete"
                      onClick={() => setClientToDelete(c)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal: Novo Cliente */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box card" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Novo Cliente</h3>
            <form onSubmit={handleCreateClient}>
              <div className="input-group">
                <label>Nome Completo</label>
                <input required type="text" className="input" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div className="input-group">
                <label>CPF</label>
                <input
                  required
                  type="text"
                  className={`input ${cpfError ? 'input-error' : newCpf.replace(/\D/g,'').length === 11 && !cpfError ? 'input-valid' : ''}`}
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  value={newCpf}
                  onChange={e => {
                    const formatted = formatCPF(e.target.value);
                    setNewCpf(formatted);
                    const raw = formatted.replace(/\D/g, '');
                    if (raw.length === 11) {
                      setCpfError(validateCPF(raw) ? '' : 'CPF inválido. Verifique os dígitos.');
                    } else {
                      setCpfError('');
                    }
                  }}
                />
                {cpfError && <span className="field-error">{cpfError}</span>}
              </div>
              <div className="input-group">
                <label>PIN (4 dígitos)</label>
                <input required type="password" inputMode="numeric" maxLength={4} className="input" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Exclusão */}
      {clientToDelete && (
        <div className="modal-overlay" onClick={() => setClientToDelete(null)}>
          <div className="modal-box card" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title modal-title-danger">⚠️ Excluir Cliente</h3>
            <p style={{ marginBottom: '0.5rem' }}>
              Tem certeza que deseja excluir <strong>{clientToDelete.Name}</strong>?
            </p>
            <p className="modal-warning-text">
              Essa ação é <strong>irreversível</strong>. Todos os arquivos e links deste cliente serão deletados permanentemente do servidor.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setClientToDelete(null)} disabled={deleting}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDeleteClient} disabled={deleting}>
                {deleting ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
