import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/Admin/DataTable';
import { ResourceModal } from '../../components/Admin/ResourceModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Check, X } from 'lucide-react';

const Indisponibilites = () => {
    const [indisponibilites, setIndisponibilites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentIndispo, setCurrentIndispo] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { addToast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/indisponibilites');
            setIndisponibilites(response.data.data.indisponibilites);
        } catch (error) {
            console.error("Erreur chargement indisponibilités", error);
            addToast("Impossible de charger les données.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setCurrentIndispo(null);
        setModalOpen(true);
    };

    const handleDelete = async (item) => {
        if (window.confirm("Voulez-vous supprimer cette demande ?")) {
            try {
                await api.delete(`/indisponibilites/${item.id}`);
                addToast("Demande supprimée.", "success");
                loadData();
            } catch (error) {
                console.error("Erreur suppression", error);
                addToast("Erreur lors de la suppression.", "error");
            }
        }
    };

    const handleApprove = async (item) => {
        if (window.confirm("Approuver cette indisponibilité ? Cela annulera les cours impactés.")) {
            try {
                await api.put(`/indisponibilites/${item.id}`, { statut: 'approuvé' });
                addToast("Indisponibilité approuvée.", "success");
                loadData();
            } catch (error) {
                console.error("Erreur approbation", error);
                addToast("Erreur lors de l'approbation.", "error");
            }
        }
    };

    const handleReject = async (item) => {
        if (window.confirm("Rejeter cette demande ?")) {
            try {
                await api.put(`/indisponibilites/${item.id}`, { statut: 'rejeté' });
                addToast("Indisponibilité rejetée.", "success");
                loadData();
            } catch (error) {
                console.error("Erreur rejet", error);
                addToast("Erreur lors du rejet.", "error");
            }
        }
    };

    const handleSubmit = async (formData) => {
        setActionLoading(true);
        try {
            await api.post('/indisponibilites', {
                date: formData.date,
                heure_debut: formData.heure_debut,
                heure_fin: formData.heure_fin,
                motif: formData.motif
            });
            addToast("Demande envoyée avec succès.", "success");
            setModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Erreur enregistrement", error);
            const msg = error.response?.data?.message || error.message;
            addToast("Erreur: " + msg, "error");
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        {
            key: 'date',
            label: 'Date',
            render: (val) => new Date(val).toLocaleDateString()
        },
        {
            key: 'creneau',
            label: 'Horaires',
            render: (_, row) => `${row.heure_debut?.substring(0, 5)} - ${row.heure_fin?.substring(0, 5)}`
        },
        { key: 'motif', label: 'Motif' },
        {
            key: 'statut',
            label: 'Statut',
            render: (val) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${val === 'approuvé' ? 'bg-green-100 text-green-800' :
                        val === 'rejeté' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                    }`}>
                    {val.charAt(0).toUpperCase() + val.slice(1)}
                </span>
            )
        },
        // Show Prof info only for RUP (since Prof sees own list)
        ...(user?.role === 'RUP' ? [{
            key: 'professeur',
            label: 'Professeur',
            render: (_, row) => row.professeur?.user ? `${row.professeur.user.nom} ${row.professeur.user.prenom}` : '-'
        }] : []),
        {
            key: 'actions_custom',
            label: 'Actions',
            render: (_, row) => (
                <div className="flex gap-2 justify-end">
                    {/* Professor actions: Delete if pending */}
                    {user?.role === 'PROFESSEUR' && row.statut === 'en_attente' && (
                        <button
                            onClick={() => handleDelete(row)}
                            className="text-red-500 hover:text-red-700 text-xs underline"
                        >
                            Annuler
                        </button>
                    )}
                    {/* RUP actions: Approve/Reject if pending */}
                    {user?.role === 'RUP' && row.statut === 'en_attente' && (
                        <>
                            <button
                                onClick={() => handleApprove(row)}
                                className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                                title="Approuver"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                onClick={() => handleReject(row)}
                                className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                title="Rejeter"
                            >
                                <X size={16} />
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    const formFields = [
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'heure_debut', label: 'Heure de début', type: 'time', required: true },
        { name: 'heure_fin', label: 'Heure de fin', type: 'time', required: true },
        { name: 'motif', label: 'Motif', type: 'textarea', required: true }
    ];

    return (
        <>
            <DataTable
                title="Indisponibilités et Absences"
                columns={columns}
                data={indisponibilites}
                loading={loading}
                // Only Professor can add requests
                onAdd={user?.role === 'PROFESSEUR' ? handleAdd : undefined}
                addButtonLabel="Signaler une absence"
            // Standard edit/delete disabled in favor of custom actions
            />

            <ResourceModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                title="Signaler une indisponibilité"
                fields={formFields}
                loading={actionLoading}
            />
        </>
    );
};

export default Indisponibilites;
