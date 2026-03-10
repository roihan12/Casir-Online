import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FaRobot, FaBrain, FaLightbulb, FaSave, FaFlask } from 'react-icons/fa';

// Simplified version using react-icons and standard tailwind as per user request and my other pages style

const schema = z.object({
  agentName: z.string().min(1, 'Nama agent wajib diisi'),
  model: z.string().min(1, 'Model wajib dipilih'),
  temperature: z.number().min(0).max(1),
  systemPrompt: z.string().min(10, 'System prompt minimal 10 karakter'),
});

const AiAgentPage = () => {
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      agentName: 'Casir Assistant',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      systemPrompt: 'Kamu adalah asisten virtual untuk toko online Casir. Jawablah dengan sopan dan membantu. Fokus pada produk dan layanan kami.',
    }
  });

  const temperatureValue = watch("temperature");

  const onSubmit = (data) => {
    console.log('AI Config:', data);
    alert('Konfigurasi AI Agent disimpan!');
  };

  const handleTest = () => {
    if (!testInput.trim()) return;
    setIsTyping(true);
    // Mock AI Response
    setTimeout(() => {
        setTestOutput(`[AI Response Mock] Terima kasih telah bertanya tentang "${testInput}". Stok produk tersebut tersedia.`);
        setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaBrain className="text-teal-600" />
          AI Agent Smart Reply
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <div className="lg:col-span-2">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <FaRobot className="text-gray-500" />
                Konfigurasi Model
             </h2>
             
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Agent</label>
                        <input
                            {...register('agentName')}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                        />
                        {errors.agentName && <p className="text-red-500 text-xs mt-1">{errors.agentName.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">AI Model</label>
                        <select
                            {...register('model')}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                        >
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            <option value="gpt-4">GPT-4</option>
                            <option value="claude-3-haiku">Claude 3 Haiku</option>
                        </select>
                        {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Kreativitas (Temperature): {temperatureValue}</label>
                        <span className="text-xs text-gray-500">{temperatureValue < 0.5 ? 'Lebih Tepat' : 'Lebih Kreatif'}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1" 
                        {...register('temperature', { valueAsNumber: true })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt / Instruksi Dasar</label>
                    <textarea
                        {...register('systemPrompt')}
                        rows="6"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                        placeholder="Instruksikan bagaimana AI harus berperilaku..."
                    ></textarea>
                    {errors.systemPrompt && <p className="text-red-500 text-xs mt-1">{errors.systemPrompt.message}</p>}
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2 shadow-lg"
                    >
                        <FaSave /> Simpan Konfigurasi
                    </button>
                </div>
             </form>
           </div>
        </div>

        {/* Playground */}
        <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaFlask className="text-gray-500" />
                    Test Playground
                </h2>
                
                <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200 overflow-y-auto max-h-[300px]">
                    {!testOutput && !isTyping && (
                        <p className="text-gray-400 text-center text-sm italic mt-10">
                            Kirim pesan untuk melihat respon AI...
                        </p>
                    )}
                    {testOutput && (
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-sm text-gray-800">
                            <p className="font-semibold text-teal-600 text-xs mb-1">AI Agent:</p>
                            {testOutput}
                        </div>
                    )}
                    {isTyping && (
                        <div className="flex gap-1 mt-2">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <textarea
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
                        placeholder="Coba tanya sesuatu..."
                        rows="3"
                    ></textarea>
                    <button
                        type="button"
                        onClick={handleTest}
                        className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition flex items-center justify-center gap-2 text-sm"
                    >
                         <FaLightbulb /> Generate Response
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AiAgentPage;
