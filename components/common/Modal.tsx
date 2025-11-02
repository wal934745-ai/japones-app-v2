import React from 'react';
import { XIcon } from '../icons/XIcon';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 relative max-w-4xl w-full"
                onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    aria-label="Close modal"
                >
                    <XIcon className="w-6 h-6" />
                </button>
                {children}
            </div>
        </div>
    );
};

export default Modal;