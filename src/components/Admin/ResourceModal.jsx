import { useEffect, useState } from 'react';
import { Button, Input } from '../ui';
import { CustomSelect } from '../CustomSelect';
import { X } from 'lucide-react';

export const ResourceModal = ({
    isOpen,
    onClose,
    onSubmit,
    title,
    fields,
    initialData = null,
    loading = false
}) => {
    const [formData, setFormData] = useState({});

    // Reset form when modal opens or initialData changes
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Pour l'édition, on pré-remplit
                setFormData(initialData);
            } else {
                // Pour la création, on initialise les champs
                const initial = {};
                fields.forEach(f => initial[f.name] = '');
                setFormData(initial);
            }
        }
    }, [isOpen, initialData, fields]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-visible animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-secondary-100">
                    <h3 className="text-lg font-semibold text-secondary-900">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-secondary-100 rounded text-secondary-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {fields.map((field) => (
                        <div key={field.name}>
                            {field.type === 'select' ? (
                                <CustomSelect
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    onChange={handleChange}
                                    required={field.required}
                                    options={field.options}
                                    placeholder="Sélectionner..."
                                    label={
                                        <>
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </>
                                    }
                                />
                            ) : (
                                <>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    <Input
                                        type={field.type || 'text'}
                                        name={field.name}
                                        value={formData[field.name] || ''}
                                        onChange={handleChange}
                                        required={field.required}
                                        placeholder={field.placeholder}
                                    />
                                </>
                            )}
                        </div>
                    ))}

                    <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100 mt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
