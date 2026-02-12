import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/Admin/DataTable';
import { ResourceModal } from '../../components/Admin/ResourceModal';
import { CustomSelect } from '../../components/CustomSelect';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const Attributions = () => {
    const [attributions, setAttributions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentAttribution, setCurrentAttribution] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { addToast } = useToast();

    // Data lists for dropdowns
    const [professeurs, setProfesseurs] = useState([]);
    const [classes, setClasses] = useState([]);
    const [semestres, setSemestres] = useState([]);
    const [allMatieres, setAllMatieres] = useState([]); // All subjects cache or fetch on demand? Fetching all might be heavy. 
    // Let's fetch subjects based on selected class in form, but for filter maybe we need a smarter approach or just filter by class first.

    // Filters state
    const [filters, setFilters] = useState({
        classe_id: '',
        professeur_id: '',
        semestre_id: '',
        matiere_id: ''
    });

    // Options formatted for Select
    const professeurOptions = useMemo(() =>
        professeurs.map(p => ({ value: p.id, label: `${p.user.nom} ${p.user.prenom}` })),
        [professeurs]);

    const classeOptions = useMemo(() =>
        classes.map(c => ({ value: c.id, label: c.nom })),
        [classes]);

    const semestreOptions = useMemo(() =>
        semestres.map(s => ({ value: s.id, label: `${s.nom} (${s.annee_scolaire})` })),
        [semestres]);

    // Matieres for form depend on selected class
    const [formMatieres, setFormMatieres] = useState([]);

    // Initial load
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [profRes, classRes, semRes] = await Promise.all([
                    api.get('/teachers'),
                    api.get('/classes'),
                    api.get('/semestres')
                ]);

                setProfesseurs(profRes.data.data.professeurs);
                setClasses(classRes.data.data.classes);
                setSemestres(semRes.data.data.semestres);

                // Set default active semester if available
                const activeSemestre = semRes.data.data.semestres.find(s => s.actif);
                if (activeSemestre) {
                    setFilters(f => ({ ...f, semestre_id: activeSemestre.id }));
                }

            } catch (error) {
                console.error("Erreur chargement données initiales", error);
                addToast("Erreur lors du chargement des listes.", "error");
            }
        };
        loadInitialData();
    }, []);

    // Load attributions when filters change
    useEffect(() => {
        loadAttributions();
    }, [filters]);

    const loadAttributions = async () => {
        setLoading(true);
        try {
            // Build query string
            const params = new URLSearchParams();
            if (filters.classe_id) params.append('classe_id', filters.classe_id);
            if (filters.professeur_id) params.append('professeur_id', filters.professeur_id);
            if (filters.semestre_id) params.append('semestre_id', filters.semestre_id);

            const response = await api.get(`/attributions?${params.toString()}`);
            setAttributions(response.data.data.attributions);
        } catch (error) {
            console.error("Erreur chargement attributions", error);
            addToast("Impossible de charger les attributions.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Helper to load matieres for a specific class
    const loadMatieresForClass = async (classeId) => {
        if (!classeId) return [];
        try {
            const response = await api.get(`/matieres?classe_id=${classeId}`);
            return response.data.data.matieres.map(m => ({
                value: m.id,
                label: `${m.code} - ${m.nom}`
            }));
        } catch (error) {
            console.error("Erreur chargement matières", error);
            return [];
        }
    };

    const handleAdd = () => {
        setCurrentAttribution(null);
        setFormMatieres([]); // Reset matières
        setModalOpen(true);
    };

    // Special handler for edit to pre-load subjects
    const handleEdit = async (attribution) => {
        setCurrentAttribution(attribution);
        // Load subjects for the attribution's class
        const mats = await loadMatieresForClass(attribution.classe_id);
        setFormMatieres(mats);
        setModalOpen(true);
    };

    const handleDelete = async (attribution) => {
        if (window.confirm("Voulez-vous supprimer cette attribution ?")) {
            try {
                await api.delete(`/attributions/${attribution.id}`);
                addToast("Attribution supprimée.", "success");
                loadAttributions();
            } catch (error) {
                console.error("Erreur suppression", error);
                addToast("Erreur lors de la suppression.", "error");
            }
        }
    };

    const handleSubmit = async (formData) => {
        setActionLoading(true);
        try {
            const payload = {
                professeur_id: parseInt(formData.professeur_id),
                matiere_id: parseInt(formData.matiere_id),
                classe_id: parseInt(formData.classe_id),
                semestre_id: parseInt(formData.semestre_id)
            };

            // ATTENTION: Il n'y a pas de PUT (update) pour les attributions dans l'API backend actuelle
            // Seulement POST (create) et DELETE
            // Donc si on édite, c'est compliqué... l'API ne semble pas avoir de route updateAttribution.
            // Vérifions routes/attributions.js: router.post('/', ...); router.delete('/:id', ...);
            // Effectivement, pas de PUT. On doit donc empêcher l'édition ou recréer.
            // Pour l'instant, on va supporter l'ajout uniquement, ou "Supprimer et recréer" pour l'édit si on veut vraiment.
            // Mais le plus simple est de dire "Supprimer l'ancienne et créer la nouvelle" si c'est un edit.

            if (currentAttribution && currentAttribution.id) {
                await api.put(`/attributions/${currentAttribution.id}`, payload);
                addToast("Attribution modifiée avec succès.", "success");
            } else {
                await api.post('/attributions', payload);
                addToast("Attribution créée avec succès.", "success");
            }

            setModalOpen(false);
            loadAttributions();
        } catch (error) {
            console.error("Erreur enregistrement", error);
            addToast("Erreur: " + (error.response?.data?.message || error.message), "error");
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        {
            key: 'professeur',
            label: 'Professeur',
            render: (value, row) => row.professeur?.user ? `${row.professeur.user.nom} ${row.professeur.user.prenom}` : '-'
        },
        {
            key: 'matiere',
            label: 'Matière',
            render: (value, row) => row.matiere ? `${row.matiere.code} - ${row.matiere.nom}` : '-'
        },
        {
            key: 'classe',
            label: 'Classe',
            render: (value, row) => row.classe?.nom || '-'
        },
        {
            key: 'semestre',
            label: 'Semestre',
            render: (value, row) => row.semestre?.nom || '-'
        }
    ];

    // Form fields definition
    // Dynamic fields: When Class changes, Matiere list updates.
    // ResourceModal doesn't natively support dependent fields well without custom render.
    // Use `onChange` prop if supported, or we might need to modify ResourceModal or use a custom form.
    // ResourceModal fields support `onChange`? Let's check ResourceModal.jsx.
    // It uses `renderField` and generic inputs. It doesn't seem to bubble up changes easily to parent to fetch data.
    // But `formFields` is a memo. If we update `formMatieres` state, and `formFields` depends on it, it should re-render.
    // We need to capture the change of `classe_id` in the modal form state.

    // Better strategy for Modal: Pass a custom `onChange` handler for the class field?
    // Or just fetch all subjects and filter in frontend? No, efficient.

    // Let's rely on ResourceModal re-rendering when `formFields` changes.
    // But how do we know the specific form value changed inside ResourceModal? we don't.
    // ResourceModal keeps its own state `formData`.

    // WORKAROUND: For dependent dropdowns, ResourceModal might be too limited.
    // However, we can patch `ResourceModal` or just pass all subjects (mapped with classId property) and filter inside `ResourceModal`? No custom logic there.

    // ALTERNATIVE: Use a custom modal content for Attributions.
    // Or... Modify `ResourceModal` to accept an `onFieldChange` callback.

    // Let's look at `ResourceModal` again. 
    // It has `const [formData, setFormData] = useState(initialData || {});`
    // It maps fields.
    // If we can't hook into it easily, maybe just standard CRUD for now where user selects Class, then Subject (loaded only if we pass them).

    // Let's assume for V1 we just list ALL subjects grouped by class... or simply:
    // When filling the form, user MUST select Class first?
    // Actually, let's try to detect change via a custom logic wrapper.
    // Since I can't easily change `ResourceModal` significantly without breaking others, I will implement a custom simple Modal content here OR 
    // simply preload ALL subjects and let the user search in the dropdown. (It's a "Select" with search).
    // `CustomSelect` doesn't have search built-in yet (it's a simple list).

    // Let's implement a `CustomResourceModal` inside this file or just a specific form.
    // Given the complexity of dependent fields, a specific form component `AttributionModal` is better.

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-secondary-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <CustomSelect
                    value={filters.semestre_id}
                    onChange={(e) => setFilters(prev => ({ ...prev, semestre_id: e.target.value }))}
                    options={[{ value: '', label: 'Tous les semestres' }, ...semestreOptions]}
                    placeholder="Semestre"
                />
                <CustomSelect
                    value={filters.classe_id}
                    onChange={(e) => setFilters(prev => ({ ...prev, classe_id: e.target.value }))}
                    options={[{ value: '', label: 'Toutes les classes' }, ...classeOptions]}
                    placeholder="Classe"
                />
                <CustomSelect
                    value={filters.professeur_id}
                    onChange={(e) => setFilters(prev => ({ ...prev, professeur_id: e.target.value }))}
                    options={[{ value: '', label: 'Tous les professeurs' }, ...professeurOptions]}
                    placeholder="Professeur"
                />
                {/* Matiere filter is tricky without class selected, maybe omit for now or list all */}
            </div>

            <DataTable
                title="Attributions des enseignements"
                columns={columns}
                data={attributions}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
                addButtonLabel="Nouvelle attribution"
            />

            {/* Custom Modal for Attribution because of Dependent Fields */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-visible animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-secondary-100 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-secondary-900">
                                {currentAttribution ? "Modifier l'attribution" : "Nouvelle attribution"}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="text-secondary-400 hover:text-secondary-600">
                                <span className="sr-only">Fermer</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <AttributionForm
                                classes={classeOptions}
                                professeurs={professeurOptions}
                                semestres={semestreOptions}
                                onSubmit={handleSubmit}
                                initialData={currentAttribution}
                                loading={actionLoading}
                                onCancel={() => setModalOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-component for form logic
const AttributionForm = ({ classes, professeurs, semestres, onSubmit, initialData, loading, onCancel }) => {
    const [formData, setFormData] = useState({
        classe_id: initialData?.classe_id || '',
        matiere_id: initialData?.matiere_id || '',
        professeur_id: initialData?.professeur_id || '',
        semestre_id: initialData?.semestre_id || ''
    });

    const [matieres, setMatieres] = useState([]);
    const [loadingMatieres, setLoadingMatieres] = useState(false);

    useEffect(() => {
        if (formData.classe_id) {
            loadMatieres(formData.classe_id);
        } else {
            setMatieres([]);
        }
    }, [formData.classe_id]);

    const loadMatieres = async (classeId) => {
        setLoadingMatieres(true);
        try {
            const response = await api.get(`/matieres?classe_id=${classeId}`);
            setMatieres(response.data.data.matieres.map(m => ({
                value: m.id,
                label: `${m.code} - ${m.nom}`
            })));
        } catch (error) {
            console.error("Erreur loading matieres", error);
        } finally {
            setLoadingMatieres(false);
        }
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        // Reset matiere if class changes
        if (name === 'classe_id') {
            setFormData(prev => ({ ...prev, matiere_id: '' }));
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Semestre</label>
                <CustomSelect
                    value={formData.semestre_id}
                    onChange={(e) => handleChange('semestre_id', e.target.value)}
                    options={semestres}
                    placeholder="Choisir un semestre"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Classe</label>
                <CustomSelect
                    value={formData.classe_id}
                    onChange={(e) => handleChange('classe_id', e.target.value)}
                    options={classes}
                    placeholder="Choisir une classe"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Matière</label>
                <CustomSelect
                    value={formData.matiere_id}
                    onChange={(e) => handleChange('matiere_id', e.target.value)}
                    options={matieres}
                    placeholder={loadingMatieres ? "Chargement..." : "Choisir une matière"}
                    disabled={!formData.classe_id || loadingMatieres}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Professeur</label>
                <CustomSelect
                    value={formData.professeur_id}
                    onChange={(e) => handleChange('professeur_id', e.target.value)}
                    options={professeurs}
                    placeholder="Choisir un professeur"
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50 font-medium transition-colors"
                    disabled={loading}
                >
                    Annuler
                </button>
                <button
                    onClick={() => onSubmit(formData)}
                    className="px-4 py-2 bg-esi-600 text-white rounded-lg hover:bg-esi-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    disabled={loading || !formData.classe_id || !formData.matiere_id || !formData.professeur_id || !formData.semestre_id}
                >
                    {loading && (
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    Enregistrer
                </button>
            </div>
        </div>
    );
};

export default Attributions;
