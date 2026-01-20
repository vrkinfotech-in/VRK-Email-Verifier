import React from 'react';

const SubHeader = ({ onClose }) => (
    <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <div
            onClick={onClose}
            className="flex items-center gap-3 cursor-pointer group"
        >
            <img src="/logo.png" alt="Logo" className="h-8 opacity-80 group-hover:opacity-100 transition-opacity" />
            <span className="text-slate-300 font-bold group-hover:text-white transition-colors">VRK Email Verifier</span>
        </div>
        <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800"
        >
            ✕ Close
        </button>
    </nav>
);

export default SubHeader;
