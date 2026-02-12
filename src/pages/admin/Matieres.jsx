import { useState, useEffect, useMemo } from 'react';
import { CustomSelect } from '../../components/CustomSelect';
import { DataTable } from '../../components/Admin/DataTable';
import { ResourceModal } from '../../components/Admin/ResourceModal';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const Matieres = () => {
    const [matieres, setMatieres] = useState([]);
    const [classes, setClasses] = useState([]);
    const [ues, setUes] = useState([]);
    const [dfrs, setDfrs] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedUeId, setSelectedUeId] = useState('');

    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentMatiere, setCurrentMatiere] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { addToast } = useToast();

    // 1. Charger les classes et les DFRs au montage
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [classesRes, dfrsRes] = await Promise.all([
                    api.get('/classes'),
                    api.get('/dfrs')
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

                // DFRs
                const mappedDfrs = dfrsRes.data.data.map(d => ({
                    value: d.id,
                    label: d.nom
                }));
                setDfrs(mappedDfrs);

            } catch (error) {
                console.error("Erreur chargement données", error);
                addToast("Impossible de charger les données initiales.", "error");
            }
        };
        loadInitialData();
    }, []);

    // 2. Charger les UEs quand la classe change
    useEffect(() => {
        if (selectedClassId) {
            loadUEs(selectedClassId);
            // On reset la sélection d'UE quand on change de classe
            setSelectedUeId('');
        } else {
            setUes([]);
            setMatieres([]);
        }
    }, [selectedClassId]);

    // 3. Charger les matières quand la classe ou l'UE change
    useEffect(() => {
        if (selectedClassId) {
            loadMatieres();
        }
    }, [selectedClassId, selectedUeId]);

    const loadUEs = async (classId) => {
        try {
            const response = await api.get(`/ues?classe_id=${classId}`);
            const mappedUEs = response.data.data.ues.map(ue => ({
                value: ue.id,
                label: `${ue.code} - ${ue.nom}`
            }));
            setUes(mappedUEs);
        } catch (error) {
            console.error("Erreur chargement UEs", error);
            addToast("Impossible de charger les UEs.", "error");
        }
    };

    const loadMatieres = async () => {
        setLoading(true);
        try {
            // Si une UE est sélectionnée, on filtre par UE
            // Sinon on filtre par Classe (toutes les matières de la classe)
            const query = selectedUeId
                ? `ue_id=${selectedUeId}`
                : `classe_id=${selectedClassId}`;

            const response = await api.get(`/matieres?${query}`);

            const mappedMatieres = response.data.data.matieres.map(m => ({
                id: m.id,
                code: m.code,
                nom: m.nom,
                coefficient: m.coefficient,
                volume_horaire: m.volume_horaire,
                periode: m.periode || '-',
                ue_nom: m.unite_enseignement?.nom || '-',
                ue_code: m.unite_enseignement?.code || '-',
                ue_id: m.ue_id,
                dfr_id: m.dfr_id,
                dfr_nom: m.dfr?.nom || '-'
            }));
            setMatieres(mappedMatieres);
        } catch (error) {
            console.error("Erreur chargement matières", error);
            addToast("Impossible de charger les matières.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        if (!selectedClassId) {
            addToast("Veuillez sélectionner une classe.", "warning");
            return;
        }

        // Si une UE est sélectionnée dans le filtre, on la pré-sélectionne
        // Sinon on laisse vide (l'utilisateur devra choisir)
        setCurrentMatiere({ ue_id: selectedUeId ? parseInt(selectedUeId) : '' });
        setModalOpen(true);
    };

    const handleEdit = (matiere) => {
        setCurrentMatiere({
            ...matiere,
            ue_id: matiere.ue_id // Assurons-nous que l'ID est bien passé pour le select
        });
        setModalOpen(true);
    };

    const handleDelete = async (matiere) => {
        if (window.confirm(`Voulez-vous vraiment supprimer la matière ${matiere.nom} ?`)) {
            try {
                await api.delete(`/matieres/${matiere.id}`);
                addToast("Matière supprimée avec succès.", "success");
                loadMatieres();
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
                ue_id: parseInt(formData.ue_id),
                dfr_id: formData.dfr_id ? parseInt(formData.dfr_id) : null,
                coefficient: parseFloat(formData.coefficient),
                volume_horaire: parseInt(formData.volume_horaire),
                periode: formData.periode
            };

            if (currentMatiere && currentMatiere.id) {
                await api.put(`/matieres/${currentMatiere.id}`, payload);
                addToast("Matière modifiée avec succès.", "success");
            } else {
                await api.post('/matieres', payload);
                addToast("Matière ajoutée avec succès.", "success");
            }

            setModalOpen(false);
            loadMatieres();
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
        { key: 'ue_code', label: 'UE' },
        { key: 'dfr_nom', label: 'DFR' },
        { key: 'volume_horaire', label: 'Vol. Horaire' },
        { key: 'coefficient', label: 'Coeff.' },
        { key: 'periode', label: 'Période' }
    ];

    const formFields = useMemo(() => [
        { name: 'code', label: 'Code Matière', required: true, placeholder: 'Ex: MATH101' },
        { name: 'nom', label: 'Nom de la matière', required: true, placeholder: 'Ex: Analyse 1' },
        {
            name: 'ue_id',
            label: 'Unité d\'Enseignement',
            type: 'select',
            required: true,
            options: ues
        },
        {
            name: 'dfr_id',
            label: 'Département (DFR)',
            type: 'select',
            required: false, // DFR is optional usually, or required? Let's make it optional for now or required if user says so. Backend said allowNull: true.
            options: dfrs
        },
        { name: 'volume_horaire', label: 'Volume Horaire', type: 'number', required: true },
        { name: 'coefficient', label: 'Coefficient', type: 'number', required: true },
        { name: 'periode', label: 'Période (S1, S2, Annuel)', placeholder: 'Ex: S1' }
    ], [ues, dfrs]);

    return (
        <div className="space-y-6">
            {/* Filtres Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-secondary-200 flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 flex-1">
                    <span className="text-secondary-700 font-medium whitespace-nowrap">Classe :</span>
                    <div className="w-full">
                        <CustomSelect
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            options={classes}
                            placeholder="Sélectionner une classe..."
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-1">
                    <span className="text-secondary-700 font-medium whitespace-nowrap">Filtrer par UE :</span>
                    <div className="w-full">
                        <CustomSelect
                            value={selectedUeId}
                            onChange={(e) => setSelectedUeId(e.target.value)}
                            options={ues}
                            placeholder="Toutes les UEs"
                            disabled={!selectedClassId}
                        />
                    </div>
                </div>
            </div>

            <DataTable
                title={`Matières (ECUE) ${selectedUeId ? '- ' + ues.find(u => u.value == selectedUeId)?.label : ''}`}
                columns={columns}
                data={matieres}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
                addButtonLabel="Ajouter une matière"
            />

            <ResourceModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                title={currentMatiere && currentMatiere.id ? "Modifier la matière" : "Ajouter une matière"}
                fields={formFields}
                initialData={currentMatiere}
                loading={actionLoading}
            />
        </div>
    );
};

export default Matieres;
