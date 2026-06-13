import { useState } from 'react';
import AdminLogin from '../components/AdminLogin';
import AdminDashboard from '../components/AdminDashboard';
import ChangePasswordModal from '../components/ChangePasswordModal';

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(
    localStorage.getItem('adminMustChangePassword') === 'true'
  );

  const handleLoginSuccess = (newToken: string, mustChange: boolean) => {
    setToken(newToken);
    setMustChangePassword(mustChange);
    localStorage.setItem('adminToken', newToken);
    localStorage.setItem('adminMustChangePassword', String(mustChange));
  };

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
    localStorage.removeItem('adminMustChangePassword');
  };

  const handleLogout = () => {
    setToken(null);
    setMustChangePassword(false);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminMustChangePassword');
  };

  if (!token) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      <AdminDashboard token={token} onLogout={handleLogout} />
      {mustChangePassword && (
        <ChangePasswordModal token={token} onSuccess={handlePasswordChanged} />
      )}
    </>
  );
}
