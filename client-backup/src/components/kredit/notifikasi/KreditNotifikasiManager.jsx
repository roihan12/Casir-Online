import React from 'react';
import { useCreatePaymentReminderNotifications, useSendPendingNotifications } from '../../../hooks/useKreditNotifikasi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '../../ui/card';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from '../../ui/form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Loader2, Bell, Send } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../../ErrorFallback';

// Skema validasi untuk pengaturan notifikasi pengingat
const reminderSchema = z.object({
  daysBefore: z.coerce.number().int().min(1).max(30),
  daysAfter: z.coerce.number().int().min(1).max(30),
  metodePengiriman: z.array(z.string()).min(1, {
    message: "Pilih minimal satu metode pengiriman",
  }),
});

const metodePengirimanOptions = [
  { id: "EMAIL", label: "Email" },
  { id: "SMS", label: "SMS" },
  { id: "WHATSAPP", label: "WhatsApp" },
  { id: "APP_NOTIFICATION", label: "Notifikasi Aplikasi" },
];

const KreditNotifikasiManager = () => {
  // Mutations untuk membuat dan mengirim notifikasi
  const createReminders = useCreatePaymentReminderNotifications();
  const sendPending = useSendPendingNotifications();

  // Setup form dengan react-hook-form dan zod
  const form = useForm({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      daysBefore: 3,
      daysAfter: 1,
      metodePengiriman: ["EMAIL", "APP_NOTIFICATION"],
    },
  });

  // Handler untuk submit form
  const onSubmit = async (data) => {
    try {
      await createReminders.mutateAsync(data);
    } catch (error) {
      console.error('Error creating payment reminders:', error);
    }
  };

  // Handler untuk mengirim notifikasi tertunda
  const handleSendPendingNotifications = async () => {
    try {
      await sendPending.mutateAsync();
    } catch (error) {
      console.error('Error sending pending notifications:', error);
    }
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kartu untuk membuat notifikasi pengingat */}
        <Card>
          <CardHeader>
            <CardTitle>Buat Notifikasi Pengingat Pembayaran</CardTitle>
            <CardDescription>
              Buat notifikasi pengingat pembayaran kredit secara otomatis berdasarkan tanggal jatuh tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="daysBefore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hari Sebelum Jatuh Tempo</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={30} {...field} />
                      </FormControl>
                      <FormDescription>
                        Jumlah hari sebelum tanggal jatuh tempo untuk mengirim pengingat
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="daysAfter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hari Setelah Jatuh Tempo</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={30} {...field} />
                      </FormControl>
                      <FormDescription>
                        Jumlah hari setelah tanggal jatuh tempo untuk mengirim pengingat keterlambatan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="metodePengiriman"
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel>Metode Pengiriman</FormLabel>
                        <FormDescription>
                          Pilih metode pengiriman notifikasi
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {metodePengirimanOptions.map((option) => (
                          <FormField
                            key={option.id}
                            control={form.control}
                            name="metodePengiriman"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={option.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(option.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, option.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== option.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {option.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createReminders.isPending}
                >
                  {createReminders.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Membuat Notifikasi...
                    </>
                  ) : (
                    <>
                      <Bell className="mr-2 h-4 w-4" />
                      Buat Notifikasi Pengingat
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Kartu untuk mengirim notifikasi tertunda */}
        <Card>
          <CardHeader>
            <CardTitle>Kirim Notifikasi Tertunda</CardTitle>
            <CardDescription>
              Kirim semua notifikasi kredit yang belum terkirim (status PENDING)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-gray-50">
                <h3 className="text-sm font-medium mb-2">Tentang Notifikasi Tertunda</h3>
                <p className="text-sm text-gray-500">
                  Notifikasi tertunda adalah notifikasi yang telah dibuat tetapi belum dikirim ke pelanggan.
                  Klik tombol di bawah untuk mengirim semua notifikasi tertunda sekarang.
                </p>
              </div>
              
              <Button 
                className="w-full"
                onClick={handleSendPendingNotifications}
                disabled={sendPending.isPending}
              >
                {sendPending.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim Notifikasi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Kirim Semua Notifikasi Tertunda
                  </>
                )}
              </Button>
              
              {sendPending.isSuccess && (
                <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm">
                  Berhasil mengirim {sendPending.data?.data?.length || 0} notifikasi tertunda.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default KreditNotifikasiManager;
