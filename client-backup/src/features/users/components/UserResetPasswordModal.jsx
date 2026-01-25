import React from "react";
import { Lock, Loader2 } from "lucide-react";
import Modal from "../../common/Modal";

const UserResetPasswordModal = ({ isOpen, onClose, selectedUser, onConfirm, isLoading }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Password"
    >
      <div className="p-6">
        <p className="text-gray-700 mb-4">
          Apakah Anda yakin ingin mereset password untuk user "
          {selectedUser?.namaLengkap}"? Email dengan instruksi reset password
          akan dikirimkan ke {selectedUser?.email}.
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
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Reset Password
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UserResetPasswordModal;
