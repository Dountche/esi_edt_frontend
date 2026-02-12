import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/Admin/DataTable';
import { ResourceModal } from '../../components/Admin/ResourceModal';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const Filieres = () => {
    const [filieres, setFilieres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentFiliere, setCurrentFiliere] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        loadFilieres();
    }, []);

    const loadFilieres = async () => {
        setLoading(true);
        try {
            const response = await api.get('/filieres');
            setFilieres(response.data.data.filieres);
        } catch (error) {
            console.error("Erreur chargement filières", error);
            addToast("Impossible de charger les filières.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setCurrentFiliere(null);
        setModalOpen(true);
    };

    const handleEdit = (filiere) => {
        setCurrentFiliere(filiere);
        setModalOpen(true);
    };

    const handleDelete = async (filiere) => {
        if (window.confirm(`Voulez-vous vraiment supprimer la filière ${filiere.nom} ?`)) {
            try {
                await api.delete(`/filieres/${filiere.id}`);
                addToast("Filière supprimée avec succès.", "success");
                loadFilieres();
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

            if (currentFiliere) {
                await api.put(`/filieres/${currentFiliere.id}`, payload);
                addToast("Filière modifiée avec succès.", "success");
            } else {
                await api.post('/filieres', payload);
                addToast("Filière ajoutée avec succès.", "success");
            }

            setModalOpen(false);
            loadFilieres();
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
        { name: 'nom', label: 'Nom de la filière', required: true, placeholder: 'Ex: Ingénierie' },
        { name: 'description', label: 'Description (optionnel)' }
    ], []);

    return (
        <>
            <DataTable
                title="Gestion des Filières"
                columns={columns}
                data={filieres}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
                addButtonLabel="Ajouter une filière"
            />

            <ResourceModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                title={currentFiliere ? "Modifier la filière" : "Ajouter une filière"}
                fields={formFields}
                initialData={currentFiliere}
                loading={actionLoading}
            />
        </>
    );
};

export default Filieres;
