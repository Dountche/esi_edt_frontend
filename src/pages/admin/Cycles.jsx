import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/Admin/DataTable';
import { ResourceModal } from '../../components/Admin/ResourceModal';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const Cycles = () => {
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentCycle, setCurrentCycle] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        loadCycles();
    }, []);

    const loadCycles = async () => {
        setLoading(true);
        try {
            const response = await api.get('/cycles');
            setCycles(response.data.data.cycles);
        } catch (error) {
            console.error("Erreur chargement cycles", error);
            addToast("Impossible de charger les cycles.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setCurrentCycle(null);
        setModalOpen(true);
    };

    const handleEdit = (cycle) => {
        setCurrentCycle(cycle);
        setModalOpen(true);
    };

    const handleDelete = async (cycle) => {
        if (window.confirm(`Voulez-vous vraiment supprimer le cycle ${cycle.nom} ?`)) {
            try {
                await api.delete(`/cycles/${cycle.id}`);
                addToast("Cycle supprimé avec succès.", "success");
                loadCycles();
            } catch (error) {
                console.error("Erreur suppression", error);
                const errorMsg = error.response?.data?.message || "Erreur lors de la suppression.";
                addToast(errorMsg, "error");
            }
        }
    };

    const handleSubmit = async (formData) => {
        setActionLoading(true);
        try {
            const payload = {
                nom: formData.nom,
                description: formData.description || ''
            };

            if (currentCycle) {
                await api.put(`/cycles/${currentCycle.id}`, payload);
                addToast("Cycle modifié avec succès.", "success");
            } else {
                await api.post('/cycles', payload);
                addToast("Cycle ajouté avec succès.", "success");
            }

            setModalOpen(false);
            loadCycles();
        } catch (error) {
            console.error("Erreur enregistrement", error);
            addToast("Erreur lors de l'enregistrement: " + (error.response?.data?.message || error.message), "error");
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        { key: 'nom', label: 'Nom' },
        { key: 'description', label: 'Description' }
    ];

    const formFields = useMemo(() => [
        { name: 'nom', label: 'Nom du cycle', required: true, placeholder: 'Ex: Licence, Master' },
        { name: 'description', label: 'Description (optionnel)' }
    ], []);

    return (
        <>
            <DataTable
                title="Gestion des Cycles"
                columns={columns}
                data={cycles}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
                addButtonLabel="Ajouter un cycle"
            />

            <ResourceModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                title={currentCycle ? "Modifier le cycle" : "Ajouter un cycle"}
                fields={formFields}
                initialData={currentCycle}
                loading={actionLoading}
            />
        </>
    );
};

export default Cycles;
