
import React from 'react';

interface TabButtonProps {
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ onClick, isActive, children }) => {
  const activeClasses = 'bg-violet-600 text-white';
  const inactiveClasses = 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600';

  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 sm:px-4 text-sm font-medium rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 ${isActive ? activeClasses : inactiveClasses}`}
    >
      {children}
    </button>
  );
};

export default TabButton;
