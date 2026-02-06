import React from 'react';
import Select from 'react-select';

/**
 * Multi-select dropdown component for branch selection
 * Styled to match application theme with Tailwind colors
 */
const BranchMultiSelect = ({ 
  availableBranches, 
  selectedBranches,
  onChange,
  isDisabled 
}) => {

  console.log(availableBranches);
  const options = availableBranches.map(cabang => ({
    value: cabang.id,
    label: cabang.namaCabang,
  }));
  
  const value = options.filter(opt => selectedBranches.includes(opt.value));
  
  const handleChange = (selected) => {
    const branchIds = selected && selected.length > 0 
      ? selected.map(opt => opt.value) 
      : (availableBranches.length > 0 ? [availableBranches[0].id] : []);
    onChange(branchIds);
  };
  
  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '38px',
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      '&:hover': { borderColor: '#3b82f6' },
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      opacity: isDisabled ? 0.6 : 1,
      cursor: isDisabled ? 'not-allowed' : 'default',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#dbeafe',
      borderRadius: '4px',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#1e40af',
      fontSize: '0.875rem',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#1e40af',
      ':hover': {
        backgroundColor: '#bfdbfe',
        color: '#1e3a8a',
      },
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: '0.875rem',
      color: '#9ca3af',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? '#3b82f6' 
        : state.isFocused 
          ? '#eff6ff' 
          : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      fontSize: '0.875rem',
      cursor: 'pointer',
      ':active': {
        backgroundColor: '#3b82f6',
      },
    }),
  };
  
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Cabang
      </label>
      <Select
        isMulti
        options={options}
        value={value}
        onChange={handleChange}
        isDisabled={isDisabled}
        placeholder="Pilih cabang..."
        noOptionsMessage={() => 'Tidak ada cabang tersedia'}
        styles={customStyles}
        className="text-sm"
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        isSearchable={true}
      />
      {isDisabled && (
        <p className="text-xs text-gray-500 mt-1">
          Anda hanya memiliki akses ke 1 cabang
        </p>
      )}
      {!isDisabled && selectedBranches.length > 0 && (
        <p className="text-xs text-gray-600 mt-1">
          {selectedBranches.length} cabang dipilih
        </p>
      )}
    </div>
  );
};

export default BranchMultiSelect;
