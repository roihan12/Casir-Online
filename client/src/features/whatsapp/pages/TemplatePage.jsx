import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FaPlus, FaEdit, FaTrash, FaFileAlt, FaTimes } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import whatsappService from '../services/whatsappService';
import { toast } from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(1, 'Nama template wajib diisi'),
  content: z.string().min(1, 'Isi template wajib diisi'),
  category: z.string().min(1, 'Kategori wajib diisi'),
});

const TemplatePage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Fetch templates data
  const { data: templatesResponse, isLoading } = useQuery({
    queryKey: ['whatsappTemplates'],
    queryFn: whatsappService.getTemplates,
  });
  
  const templates = templatesResponse?.data || templatesResponse?.results || templatesResponse || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const openModal = (template = null) => {
    setEditingTemplate(template);
    if (template) {
      reset(template);
    } else {
      reset({ name: '', content: '', category: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: whatsappService.createTemplate,
    onSuccess: () => {
      toast.success('Template berhasil ditambahkan');
      queryClient.invalidateQueries(['whatsappTemplates']);
      closeModal();
    },
    onError: (err) => toast.error('Gagal tambah template: ' + err.message)
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => whatsappService.updateTemplate(id, data),
    onSuccess: () => {
      toast.success('Template berhasil diperbarui');
      queryClient.invalidateQueries(['whatsappTemplates']);
      closeModal();
    },
    onError: (err) => toast.error('Gagal update template: ' + err.message)
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: whatsappService.deleteTemplate,
    onSuccess: () => {
      toast.success('Template berhasil dihapus');
      queryClient.invalidateQueries(['whatsappTemplates']);
    },
    onError: (err) => toast.error('Gagal hapus template: ' + err.message)
  });

  const onSubmit = (data) => {
    const payload = { ...data, templateType: data.category.toUpperCase() };
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus template ini?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaFileAlt className="text-orange-600" />
            Template Pesan
           </h1>
           <p className="text-gray-500 text-sm mt-1">Kelola template pesan untuk respon cepat</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
        >
          <FaPlus /> Tambah Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full uppercase tracking-wide">
                {template.category}
              </span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openModal(template)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                >
                  <FaEdit />
                </button>
                <button 
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">{template.name}</h3>
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
              {template.content}
            </p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                {editingTemplate ? 'Edit Template' : 'Template Baru'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition">
                <FaTimes size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Template</label>
                <input
                  {...register('name')}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Contoh: Greeting Pagi"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  {...register('category')}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="">Pilih Kategori</option>
                  <option value="Greeting">Greeting</option>
                  <option value="Order">Order</option>
                  <option value="Payment">Payment</option>
                  <option value="Promotion">Promotion</option>
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pesan</label>
                <textarea
                  {...register('content')}
                  rows="4"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Tulis pesan Anda disini..."
                ></textarea>
                 <p className="text-xs text-gray-500 mt-1">Gunakan [Variable] untuk data dinamis.</p>
                {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>}
              </div>

              <div className="flex justify-end pt-4 gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatePage;
