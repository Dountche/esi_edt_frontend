import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/Admin/DataTable';
import { ResourceModal } from '../../components/Admin/ResourceModal';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const DFR = () => {
    const [dfrs, setDfrs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentDfr, setCurrentDfr] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/dfrs');
            // Backend returns { success: true, data: [...] }
            setDfrs(response.data.data || []);
        } catch (error) {
            console.error("Erreur chargement DFRs", error);
            addToast("Impossible de charger les DFRs.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setCurrentDfr(null);
        setModalOpen(true);
    };

    const handleEdit = (dfr) => {
        setCurrentDfr(dfr);
        setModalOpen(true);
    };

    const handleDelete = async (dfr) => {
        if (window.confirm(`Voulez-vous vraiment supprimer le DFR ${dfr.nom} ?`)) {
            try {
                await api.delete(`/dfrs/${dfr.id}`);
                addToast("DFR supprimé avec succès.", "success");
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
            if (currentDfr) {
                await api.put(`/dfrs/${currentDfr.id}`, formData);
                addToast("DFR modifié avec succès.", "success");
            } else {
                await api.post('/dfrs', formData);
                addToast("DFR ajouté avec succès.", "success");
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
        { key: 'nom', label: 'Nom' },
        {
            key: 'couleur',
            label: 'Couleur',
            render: (value) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: value }}></div>
                    <span>{value}</span>
                </div>
            )
        },
        { key: 'description', label: 'Description' }
    ];

    const formFields = useMemo(() => [
        { name: 'nom', label: 'Nom', required: true },
        {
            name: 'couleur',
            label: 'Couleur',
            type: 'color', // Use native color picker
            required: true,
            defaultValue: '#ffffff'
        },
        { name: 'description', label: 'Description', type: 'textarea' }
    ], []);

    return (
        <>
            <DataTable
                title="Gestion des DFR"
                columns={columns}
                data={dfrs}
                loading={loading}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                addButtonLabel="Nouveau DFR"
            />

            <ResourceModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                title={currentDfr ? "Modifier le DFR" : "Nouveau DFR"}
                fields={formFields}
                initialData={currentDfr}
                loading={actionLoading}
            />
        </>
    );
};

export default DFR;
