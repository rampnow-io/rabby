import React from 'react';
import { X } from 'lucide-react';

export default function BottomFlotingSheet({ open, onClose, children }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl p-6 transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <X
          onClick={onClose}
          size={22}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        />
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
        {children}
      </div>
    </>
  );
}
