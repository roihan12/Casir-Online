import React from 'react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertTitle className="text-lg font-semibold">Terjadi Kesalahan</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="text-sm text-red-700 mb-4">
          {error.message || 'Terjadi kesalahan yang tidak diketahui'}
        </div>
        <Button 
          variant="outline" 
          onClick={resetErrorBoundary}
          className="bg-white hover:bg-gray-100 text-red-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Coba Lagi
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default ErrorFallback;
