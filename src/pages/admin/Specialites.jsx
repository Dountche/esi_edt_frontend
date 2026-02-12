import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/Admin/DataTable';
import { ResourceModal } from '../../components/Admin/ResourceModal';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const Specialites = () => {
    const [specialites, setSpecialites] = useState([]);
    const [filieres, setFilieres] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentSpecialite, setCurrentSpecialite] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [specialitesResponse, filieresResponse, cyclesResponse] = await Promise.all([
                api.get('/specialites'),
                api.get('/filieres'),
                api.get('/cycles')
            ]);

            // Mapping des spécialités
            const mappedSpecialites = specialitesResponse.data.data.specialites.map(s => ({
                id: s.id,
                nom: s.nom,
                filiere_nom: s.filiere?.nom || '-',
                filiere_id: s.filiere_id,
                cycle_nom: s.cycle?.nom || '-',
                cycle_id: s.cycle_id,
                annee: s.annee,
                description: s.description || ''
            }));
            setSpecialites(mappedSpecialites);

            // Mapping des filières pour le select
            const mappedFilieres = filieresResponse.data.data.filieres.map(f => ({
                value: f.id,
                label: f.nom
            }));
            setFilieres(mappedFilieres);

            // Mapping des cycles pour le select
            const mappedCycles = cyclesResponse.data.data.cycles.map(c => ({
                value: c.id,
                label: c.nom
            }));
            setCycles(mappedCycles);

        } catch (error) {
            console.error("Erreur chargement données", error);
            addToast("Impossible de charger les données.", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadSpecialitesOnly = async () => {
        setLoading(true);
        try {
            const response = await api.get('/specialites');
            const mappedSpecialites = response.data.data.specialites.map(s => ({
                id: s.id,
                nom: s.nom,
                filiere_nom: s.filiere?.nom || '-',
                filiere_id: s.filiere_id,
                cycle_nom: s.cycle?.nom || '-',
                cycle_id: s.cycle_id,
                annee: s.annee,
                description: s.description || ''
            }));
            setSpecialites(mappedSpecialites);
        } catch (error) {
            console.error("Erreur chargement spécialités", error);
            addToast("Impossible de mettre à jour la liste.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setCurrentSpecialite(null);
        setModalOpen(true);
    };

    const handleEdit = (specialite) => {
        setCurrentSpecialite({
            ...specialite,
            filiere_id: specialite.filiere_id,
            cycle_id: specialite.cycle_id
        });
        setModalOpen(true);
    };

    const handleDelete = async (specialite) => {
        if (window.confirm(`Voulez-vous vraiment supprimer la spécialité ${specialite.nom} ?`)) {
            try {
                await api.delete(`/specialites/${specialite.id}`);
                addToast("Spécialité supprimée avec succès.", "success");
                loadSpecialitesOnly();
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
                filiere_id: parseInt(formData.filiere_id),
                cycle_id: parseInt(formData.cycle_id),
                annee: parseInt(formData.annee),
                description: formData.description || ''
            };

            if (currentSpecialite) {
                await api.put(`/specialites/${currentSpecialite.id}`, payload);
                addToast("Spécialité modifiée avec succès.", "success");
            } else {
                await api.post('/specialites', payload);
                addToast("Spécialité ajoutée avec succès.", "success");
            }

            setModalOpen(false);
            loadSpecialitesOnly();
        } catch (error) {
            console.error("Erreur enregistrement", error);
            addToast("Erreur lors de l'enregistrement: " + (error.response?.data?.message || error.message), "error");
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        { key: 'nom', label: 'Nom' },
        { key: 'filiere_nom', label: 'Filière' },
        { key: 'cycle_nom', label: 'Cycle' },
        { key: 'annee', label: 'Année' }
    ];

    const formFields = useMemo(() => [
        { name: 'nom', label: 'Nom de la spécialité', required: true, placeholder: 'Ex: STIC' },
        {
            name: 'filiere_id',
            label: 'Filière',
            type: 'select',
            required: true,
            options: filieres
        },
        {
            name: 'cycle_id',
            label: 'Cycle',
            type: 'select',
            required: true,
            options: cycles
        },
        {
            name: 'annee',
            label: 'Année',
            type: 'select',
            required: true,
            options: [
                { value: '1', label: '1ère année' },
                { value: '2', label: '2ème année' },
                { value: '3', label: '3ème année' }
            ]
        },
        { name: 'description', label: 'Description (optionnel)' }
    ], [filieres, cycles]);

    return (
        <>
            <DataTable
                title="Gestion des Spécialités"
                columns={columns}
                data={specialites}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
                addButtonLabel="Ajouter une spécialité"
            />

            <ResourceModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                title={currentSpecialite ? "Modifier la spécialité" : "Ajouter une spécialité"}
                fields={formFields}
                initialData={currentSpecialite}
                loading={actionLoading}
            />
        </>
    );
};

export default Specialites;
