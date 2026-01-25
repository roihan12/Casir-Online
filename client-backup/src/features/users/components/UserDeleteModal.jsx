import React from "react";
import { Trash, Loader2 } from "lucide-react";
import Modal from "../../common/Modal";

const UserDeleteModal = ({ isOpen, onClose, selectedUser, onConfirm, isLoading }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfirmasi Hapus"
    >
      <div className="p-6">
        <p className="text-gray-700 mb-4">
          Apakah Anda yakin ingin menghapus user "{selectedUser?.namaLengkap}
          "? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
            disabled={isLoading}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash className="h-4 w-4 mr-2" />
                Hapus
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UserDeleteModal;
