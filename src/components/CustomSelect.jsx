import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from './ui';

export const CustomSelect = ({
    label,
    value,
    onChange,
    options = [],
    placeholder = "Sélectionner...",
    required = false,
    name,
    error,
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('');
    const dropdownRef = useRef(null);

    // Trouver le label de l'option sélectionnée
    useEffect(() => {
        const selected = options.find(opt => opt.value === value);
        setSelectedLabel(selected ? selected.label : '');
    }, [value, options]);

    // Fermer le dropdown quand on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        // Simuler un événement onChange comme un vrai select
        const syntheticEvent = {
            target: {
                name: name,
                value: option.value
            }
        };
        onChange(syntheticEvent);
        setIsOpen(false);
    };

    return (
        <div className={cn("flex flex-col gap-1", className)} ref={dropdownRef}>
            {label && (
                <label className="text-sm font-medium text-secondary-700">
                    {label}
                </label>
            )}

            <div className="relative">
                {/* Bouton principal */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        'w-full px-4 py-2 border rounded-lg outline-none transition-all text-left flex items-center justify-between',
                        'border-secondary-300 focus:border-esi-500 focus:ring-2 focus:ring-esi-100',
                        'bg-white cursor-pointer hover:border-secondary-400',
                        error && 'border-red-500 focus:ring-red-100',
                        !selectedLabel && 'text-secondary-400'
                    )}
                >
                    <span>{selectedLabel || placeholder}</span>
                    <ChevronDown
                        className={cn(
                            "w-4 h-4 text-secondary-400 transition-transform",
                            isOpen && "rotate-180"
                        )}
                    />
                </button>

                {/* Dropdown menu */}
                {isOpen && (
                    <div className="absolute z-[100] w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {/* Option vide pour "Sélectionner..." */}
                        {placeholder && (
                            <div
                                onClick={() => handleSelect({ value: '', label: '' })}
                                className={cn(
                                    "px-4 py-2 cursor-pointer transition-colors flex items-center justify-between",
                                    "hover:bg-esi-50 text-secondary-400",
                                    !value && "bg-esi-50"
                                )}
                            >
                                <span>{placeholder}</span>
                                {!value && <Check className="w-4 h-4 text-esi-600" />}
                            </div>
                        )}

                        {/* Options */}
                        {options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => handleSelect(option)}
                                className={cn(
                                    "px-4 py-2 cursor-pointer transition-colors flex items-center justify-between",
                                    "hover:bg-esi-50 text-secondary-900",
                                    value === option.value && "bg-esi-50 font-medium"
                                )}
                            >
                                <span>{option.label}</span>
                                {value === option.value && (
                                    <Check className="w-4 h-4 text-esi-600" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Input caché pour la validation du formulaire */}
            <input
                type="hidden"
                name={name}
                value={value || ''}
                required={required}
            />

            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
};
