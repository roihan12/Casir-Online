import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent } from '../components/ui/card';
import KreditNotifikasiList from '../components/kredit/notifikasi/KreditNotifikasiList';
import KreditNotifikasiManager from '../components/kredit/notifikasi/KreditNotifikasiManager';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../components/ErrorFallback';
import { Bell, Settings } from 'lucide-react';

const KreditNotifikasiPage = () => {
  const [activeTab, setActiveTab] = useState('daftar');

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-2xl font-bold mb-6">Manajemen Notifikasi Kredit</h1>
      
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Tabs 
          defaultValue="daftar" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="daftar" className="flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              Daftar Notifikasi
            </TabsTrigger>
            <TabsTrigger value="pengaturan" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Pengaturan Notifikasi
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="daftar" className="space-y-6">
            <KreditNotifikasiList />
          </TabsContent>
          
          <TabsContent value="pengaturan" className="space-y-6">
            <KreditNotifikasiManager />
          </TabsContent>
        </Tabs>
      </ErrorBoundary>
    </div>
  );
};

export default KreditNotifikasiPage;
