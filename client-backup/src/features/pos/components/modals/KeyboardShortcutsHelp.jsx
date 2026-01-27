import React from "react";
import { Keyboard, X } from "lucide-react";

// Modifikasi KeyboardShortcutsHelp component untuk menampilkan info lebih lengkap
const KeyboardShortcutsHelp = ({ show, setShow }) => {
  if (!show) return null;

  const shortcutGroups = [
    {
      title: "Navigation",
      shortcuts: [
        { key: "F1", description: "Bantuan Keyboard Shortcuts" },
        { key: "F2", description: "Fokus ke Pencarian Produk" },
        { key: "F3", description: "Tampilkan Kategori" },
        { key: "1-9", description: "Pilih Kategori 1-9" },
        { key: "Esc", description: "Tutup Modal / Bersihkan Pencarian" },
      ],
    },
    {
      title: "Cart & Products",
      shortcuts: [
        { key: "Ctrl+P", description: "Pembayaran Tunai" },
        { key: "Ctrl+Q", description: "Pembayaran QRIS" },
        { key: "Ctrl+M", description: "Toggle Mode Retail/Grosir" },
        { key: "Ctrl+C", description: "Pilih Pelanggan" },
        { key: "Ctrl+B", description: "Pilih Cabang" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Keyboard className="mr-2" size={20} /> Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setShow(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {shortcutGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6 last:mb-0">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-700">
                      {shortcut.description}
                    </span>
                    <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
          Tekan{" "}
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
            F1
          </kbd>{" "}
          kapan saja untuk menampilkan bantuan ini atau{" "}
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
            Esc
          </kbd>{" "}
          untuk menutup modal.
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;