import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/Admin/DataTable';
import { ResourceModal } from '../../components/Admin/ResourceModal';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const Domaines = () => {
    const [domaines, setDomaines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentDomaine, setCurrentDomaine] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/domaines');
            setDomaines(response.data.data || []);
        } catch (error) {
            console.error("Erreur chargement domaines", error);
            addToast("Impossible de charger les domaines.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setCurrentDomaine(null);
        setModalOpen(true);
    };

    const handleEdit = (domaine) => {
        setCurrentDomaine(domaine);
        setModalOpen(true);
    };

    const handleDelete = async (domaine) => {
        if (window.confirm(`Voulez-vous vraiment supprimer le domaine ${domaine.nom} ?`)) {
            try {
                await api.delete(`/domaines/${domaine.id}`);
                addToast("Domaine supprimé avec succès.", "success");
                loadData();
            } catch (error) {
                console.error("Erreur suppression", error);
                addToast("Erreur lors de la suppression.", "error");
            }
        }
    };

    const handleSubmit = async (formData) => {
        setActionLoading(true);
        try {
            if (currentDomaine) {
                await api.put(`/domaines/${currentDomaine.id}`, formData);
                addToast("Domaine modifié avec succès.", "success");
            } else {
                await api.post('/domaines', formData);
                addToast("Domaine ajouté avec succès.", "success");
            }
            setModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Erreur enregistrement", error);
            addToast("Erreur lors de l'enregistrement.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        { key: 'nom', label: 'Nom' }
    ];

    const formFields = useMemo(() => [
        { name: 'nom', label: 'Nom', required: true }
    ], []);

    return (
        <>
            <DataTable
                title="Gestion des Domaines"
                columns={columns}
                data={domaines}
                loading={loading}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                addButtonLabel="Nouveau Domaine"
            />

            <ResourceModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                title={currentDomaine ? "Modifier le Domaine" : "Nouveau Domaine"}
                fields={formFields}
                initialData={currentDomaine}
                loading={actionLoading}
            />
        </>
    );
};

export default Domaines;
