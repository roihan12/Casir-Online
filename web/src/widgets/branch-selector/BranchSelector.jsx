import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useBranch } from '@shared/hooks';

/**
 * BranchSelector Widget
 * Dropdown to select active branch for multi-cabang
 */
const BranchSelector = ({ className = '' }) => {
  const { 
    activeBranch, 
    availableBranches, 
    switchBranch,
    hasMultipleBranches,
    activeBranchName,
  } = useBranch();

  // Don't show if user has only one branch
  if (!hasMultipleBranches) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 glass-surface rounded-xl text-gray-600 ${className}`}>
        <Building2 className="w-4 h-4" />
        <span className="text-sm font-medium">{activeBranchName}</span>
      </div>
    );
  }

  return (
    <Menu as="div" className={`relative ${className}`}>
      <Menu.Button className="flex items-center gap-2 px-3 py-2 glass-surface rounded-xl text-gray-600 hover:bg-white/60 transition-colors">
        <Building2 className="w-4 h-4" />
        <span className="text-sm font-medium">{activeBranchName}</span>
        <ChevronDown className="w-4 h-4" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right glass rounded-xl shadow-lg overflow-hidden z-50">
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-medium text-gray-400 uppercase">
              Pilih Cabang
            </p>
            {availableBranches.map((branch) => (
              <Menu.Item key={branch.cabangId}>
                {({ active }) => (
                  <button
                    onClick={() => switchBranch(branch.cabangId)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg text-left
                      ${active ? 'bg-indigo-50' : ''}
                      ${activeBranch?.cabangId === branch.cabangId ? 'text-indigo-600' : 'text-gray-700'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span className="text-sm font-medium">{branch.namaCabang}</span>
                      {branch.isPrimary && (
                        <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded">
                          Utama
                        </span>
                      )}
                    </div>
                    {activeBranch?.cabangId === branch.cabangId && (
                      <Check className="w-4 h-4 text-indigo-600" />
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default BranchSelector;
