import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/Admin/DataTable';
import { ResourceModal } from '../../components/Admin/ResourceModal';
import { useToast } from '../../context/ToastContext';
import { Check, Calendar } from 'lucide-react';
import api from '../../services/api';

const Semestres = () => {
    const [semestres, setSemestres] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentSemestre, setCurrentSemestre] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { addToast } = useToast();

    const loadSemestres = async () => {
        setLoading(true);
        try {
            const response = await api.get('/semestres');

            setSemestres(response.data.data.semestres);
        } catch (error) {

            addToast("Impossible de charger les semestres.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSemestres();
    }, []);

    const handleAdd = () => {
        setCurrentSemestre(null);
        setModalOpen(true);
    };

    const handleEdit = (semestre) => {
        setCurrentSemestre(semestre);
        setModalOpen(true);
    };

    const handleDelete = async (semestre) => {
        if (window.confirm(`Voulez-vous vraiment supprimer le semestre ${semestre.nom} (${semestre.annee_scolaire}) ?`)) {
            try {
                await api.delete(`/semestres/${semestre.id}`);
                addToast("Semestre supprimé avec succès.", "success");
                loadSemestres();
            } catch (error) {
                console.error("Erreur suppression", error);
                const errorMsg = error.response?.data?.message || "Erreur lors de la suppression.";
                addToast(errorMsg, "error");
            }
        }
    };

    const handleActivate = async (semestre) => {
        if (semestre.actif) return; // Déjà actif

        try {
            await api.put(`/semestres/${semestre.id}/activer`);
            addToast(`Le semestre ${semestre.nom} est maintenant actif.`, "success");
            loadSemestres();
        } catch (error) {
            console.error("Erreur activation", error);
            addToast("Erreur lors de l'activation du semestre.", "error");
        }
    };

    const handleSubmit = async (formData) => {
        setActionLoading(true);
        try {
            // On exclut 'id', 'createdAt', 'updatedAt' du payload car l'API ne les attend pas dans le body (validation Joi strict)
            const { id, createdAt, updatedAt, ...rest } = formData;

            const payload = {
                ...rest,
                actif: formData.actif === 'true' || formData.actif === true
            };

            if (currentSemestre && currentSemestre.id) {
                await api.put(`/semestres/${currentSemestre.id}`, payload);
                addToast("Semestre modifié avec succès.", "success");
            } else {
                await api.post('/semestres', payload);
                addToast("Semestre ajouté avec succès.", "success");
            }

            setModalOpen(false);
            loadSemestres();
        } catch (error) {
            console.error("Erreur enregistrement", error);
            addToast("Erreur lors de l'enregistrement: " + (error.response?.data?.message || error.message), "error");
        } finally {
            setActionLoading(false);
        }
    };

    // Helper pour formater la date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        // Vérifier si la date est valide
        if (isNaN(date.getTime())) return dateString; // Retourner la string brute si parsing échoue
        return date.toLocaleDateString();
    };

    // Colonnes personnalisées pour inclure le statut et le bouton d'activation
    const columns = [
        { key: 'nom', label: 'Nom' },
        { key: 'annee_scolaire', label: 'Année Scolaire' },
        {
            key: 'date_debut',
            label: 'Début',
            render: (value) => formatDate(value)
        },
        {
            key: 'date_fin',
            label: 'Fin',
            render: (value) => formatDate(value)
        },
        {
            key: 'actif',
            label: 'Statut',
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    {value ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Actif
                        </span>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleActivate(row); }}
                            className="bg-white border border-secondary-300 text-secondary-700 hover:bg-secondary-50 px-2 py-1 rounded text-xs transition-colors"
                            title="Activer ce semestre"
                        >
                            Activer
                        </button>
                    )}
                </div>
            )
        }
    ];

    const formFields = useMemo(() => [
        { name: 'nom', label: 'Nom du semestre', required: true, placeholder: 'Ex: Semestre 1' },
        { name: 'annee_scolaire', label: 'Année scolaire', required: true, placeholder: 'Ex: 2024-2025' },
        { name: 'date_debut', label: 'Date de début', type: 'date', required: true },
        { name: 'date_fin', label: 'Date de fin', type: 'date', required: true },
        {
            name: 'actif',
            label: 'Statut',
            type: 'select',
            required: true,
            options: [
                { value: false, label: 'Inactif' },
                { value: true, label: 'Actif' }
            ]
        }
    ], []);

    return (
        <div className="space-y-6">
            <DataTable
                title="Gestion des Semestres"
                columns={columns}
                data={semestres}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
                addButtonLabel="Ajouter un semestre"
            />

            <ResourceModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                title={currentSemestre && currentSemestre.id ? "Modifier le semestre" : "Ajouter un semestre"}
                fields={formFields}
                initialData={currentSemestre}
                loading={actionLoading}
            />
        </div>
    );
};

export default Semestres;
