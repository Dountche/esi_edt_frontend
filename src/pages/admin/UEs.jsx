import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/Admin/DataTable';
import { ResourceModal } from '../../components/Admin/ResourceModal';
import { CustomSelect } from '../../components/CustomSelect';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const UEs = () => {
    const [ues, setUes] = useState([]);
    const [classes, setClasses] = useState([]);
    const [domaines, setDomaines] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentUE, setCurrentUE] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { addToast } = useToast();

    // Charger les classes et domaines au montage
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [classesRes, domainesRes] = await Promise.all([
                    api.get('/classes'),
                    api.get('/domaines')
                ]);

                // Classes
                const mappedClasses = classesRes.data.data.classes.map(c => ({
                    value: c.id,
                    label: c.nom
                }));
                setClasses(mappedClasses);

                if (mappedClasses.length > 0) {
                    setSelectedClassId(mappedClasses[0].value);
                }

                // Domaines
                const mappedDomaines = domainesRes.data.data.map(d => ({
                    value: d.id,
                    label: d.nom
                }));
                setDomaines(mappedDomaines);

            } catch (error) {
                console.error("Erreur chargement données", error);
                addToast("Impossible de charger les données initiales.", "error");
            }
        };
        loadInitialData();
    }, []);

    // Charger les UEs quand la classe sélectionnée change
    useEffect(() => {
        if (selectedClassId) {
            loadUEs(selectedClassId);
        } else {
            setUes([]);
        }
    }, [selectedClassId]);

    const loadUEs = async (classId) => {
        setLoading(true);
        try {
            const response = await api.get(`/ues?classe_id=${classId}`);
            // Map ues to include domaine info if returned by backend (assuming backend includes 'domaine' association)
            const mappedUEs = response.data.data.ues.map(ue => ({
                ...ue,
                domaine_nom: ue.domaine?.nom || '-'
            }));
            setUes(mappedUEs);
        } catch (error) {
            console.error("Erreur chargement UEs", error);
            addToast("Impossible de charger les UEs.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        if (!selectedClassId) {
            addToast("Veuillez sélectionner une classe d'abord.", "warning");
            return;
        }
        setCurrentUE({ classe_id: parseInt(selectedClassId) }); // Pré-remplir la classe
        setModalOpen(true);
    };

    const handleEdit = (ue) => {
        setCurrentUE(ue);
        setModalOpen(true);
    };

    const handleDelete = async (ue) => {
        if (window.confirm(`Voulez-vous vraiment supprimer l'UE ${ue.nom} ?`)) {
            try {
                await api.delete(`/ues/${ue.id}`);
                addToast("UE supprimée avec succès.", "success");
                loadUEs(selectedClassId);
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
                code: formData.code,
                nom: formData.nom,
                domaine_id: formData.domaine_id ? parseInt(formData.domaine_id) : null
            };

            if (!currentUE || !currentUE.id) {
                payload.classe_id = parseInt(formData.classe_id);
            }

            if (currentUE && currentUE.id) {
                await api.put(`/ues/${currentUE.id}`, payload);
                addToast("UE modifiée avec succès.", "success");
            } else {
                await api.post('/ues', payload);
                addToast("UE ajoutée avec succès.", "success");
            }

            setModalOpen(false);
            loadUEs(selectedClassId);
        } catch (error) {
            console.error("Erreur enregistrement", error);
            addToast("Erreur lors de l'enregistrement: " + (error.response?.data?.message || error.message), "error");
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        { key: 'code', label: 'Code' },
        { key: 'nom', label: 'Nom' },
        { key: 'domaine_nom', label: 'Domaine' },
        { key: 'nombre_matieres', label: 'Matières' },
        { key: 'volume_horaire_total', label: 'Vol. Horaire' },
        { key: 'coefficient_total', label: 'Coeff. Total' }
    ];

    const formFields = useMemo(() => [
        { name: 'code', label: 'Code UE', required: true, placeholder: 'Ex: UE11' },
        { name: 'nom', label: 'Nom de l\'UE', required: true, placeholder: 'Ex: Algorithmique' },
        {
            name: 'classe_id',
            label: 'Classe',
            type: 'select',
            required: true,
            options: classes,
            disabled: true // On force la création dans la classe courante pour éviter les erreurs
        },
        {
            name: 'domaine_id',
            label: 'Domaine',
            type: 'select',
            required: false,
            options: domaines
        }
    ], [classes, domaines]);

    return (
        <div className="space-y-6">
            {/* Filtre Classe Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-secondary-200 flex items-center gap-4">
                <span className="text-secondary-700 font-medium whitespace-nowrap">Filtrer par classe :</span>
                <div className="flex-1 max-w-xs">
                    <CustomSelect
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        options={classes}
                        placeholder="Sélectionner une classe..."
                    />
                </div>
            </div>

            <DataTable
                title={`Unités d'Enseignement ${selectedClassId ? classes.find(c => c.value == selectedClassId)?.label.replace(/(.*)/, " - $1") : ''}`}
                columns={columns}
                data={ues}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
                addButtonLabel="Ajouter une UE"
            />

            <ResourceModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                title={currentUE && currentUE.id ? "Modifier l'UE" : "Ajouter une UE"}
                fields={formFields}
                initialData={currentUE}
                loading={actionLoading}
            />
        </div>
    );
};

export default UEs;
