import React from 'react';
import { useParams } from 'react-router-dom';
import KreditNotifikasiDetail from '../components/kredit/notifikasi/KreditNotifikasiDetail';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../components/ErrorFallback';

const KreditNotifikasiDetailPage = () => {
  const { id } = useParams();

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-2xl font-bold mb-6">Detail Notifikasi Kredit</h1>
      
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <KreditNotifikasiDetail />
      </ErrorBoundary>
    </div>
  );
};

export default KreditNotifikasiDetailPage;
