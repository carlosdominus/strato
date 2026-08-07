import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (SelectOption | string)[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  icon?: React.ReactNode;
  labelPrefix?: string;
  alignRight?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  buttonClassName = '',
  icon,
  labelPrefix,
  alignRight = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value) || {
    value,
    label: value || placeholder || 'Selecione...',
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-white/95 hover:bg-white border border-[#11310C]/15 text-[#11310C] text-xs font-extrabold cursor-pointer transition-all shadow-xs focus:outline-none focus:border-[#11310C]/40 ${buttonClassName}`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {icon}
          {labelPrefix && <span className="text-[#11310C]/60 font-semibold">{labelPrefix}</span>}
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#11310C]/60 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 min-w-[170px] max-w-[280px] max-h-60 overflow-y-auto bg-white/95 backdrop-blur-xl rounded-2xl border border-[#11310C]/15 shadow-2xl p-1.5 z-50 space-y-0.5 animate-in fade-in zoom-in-95 ${
            alignRight ? 'right-0' : 'left-0'
          }`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#11310C] text-[#FAFBF6]'
                    : 'text-[#11310C] hover:bg-[#F8F9F3]'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#C4C240] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
