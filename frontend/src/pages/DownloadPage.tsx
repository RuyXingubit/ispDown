import { useParams } from 'react-router-dom';

export default function DownloadPage() {
  const { fileId } = useParams();

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Baixar Arquivo</h2>
      <p style={{ textAlign: 'center', marginBottom: '1.5rem' }}>ID do arquivo: {fileId}</p>
      <button className="btn">Iniciar Download Seguro</button>
    </div>
  );
}
