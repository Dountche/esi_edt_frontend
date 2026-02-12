import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Edit, Trash2, Plus } from 'lucide-react';
import { Button, Input } from '../ui';

export const DataTable = ({
    columns,
    data,
    onEdit,
    onDelete,
    onAdd,
    title,
    addButtonLabel = "Ajouter",
    loading = false
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = data.filter(item =>
        columns.some(col => {
            const value = item[col.key];
            return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold text-secondary-900">{title}</h2>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-esi-500 focus:border-esi-500 outline-none transition-all"
                        />
                    </div>
                    {onAdd && (
                        <Button onClick={onAdd} className="flex-shrink-0 flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">{addButtonLabel}</span>
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary-50 text-secondary-500 font-medium border-b border-secondary-200">
                            <tr>
                                {columns.map((col) => (
                                    <th key={col.key} className="px-6 py-3 whitespace-nowrap">
                                        {col.label}
                                    </th>
                                ))}
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-secondary-500">
                                        Chargement en cours...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-secondary-500">
                                        {searchTerm ? "Aucun résultat trouvé" : "Aucune donnée trouvée"}
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-secondary-50 transition-colors">
                                        {columns.map((col) => (
                                            <td key={col.key} className="px-6 py-3 whitespace-nowrap text-secondary-900">
                                                {col.render ? col.render(item[col.key], item) : item[col.key]}
                                            </td>
                                        ))}
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => onEdit && onEdit(item)}
                                                    className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete && onDelete(item)}
                                                    className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Simplifiée pour l'instant) */}
                {!loading && filteredData.length > 0 && (
                    <div className="px-6 py-3 border-t border-secondary-200 bg-secondary-50 flex justify-between items-center text-xs text-secondary-500">
                        <span>Affichage de {filteredData.length} résultats</span>
                        <div className="flex gap-1">
                            <button className="p-1 hover:bg-white rounded border border-transparent hover:border-secondary-200 disabled:opacity-50" disabled>
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button className="p-1 hover:bg-white rounded border border-transparent hover:border-secondary-200 disabled:opacity-50" disabled>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
