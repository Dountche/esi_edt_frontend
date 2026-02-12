import { useState, useEffect, useMemo } from 'react';
import { WeekView } from '../../components/Schedule/WeekView';
import { CustomSelect } from '../../components/CustomSelect';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Plus, Save, Trash2, X, File, FileSpreadsheet } from 'lucide-react';

const WEEKS = Array.from({ length: 16 }, (_, i) => ({ value: i + 1, label: `Semaine ${i + 1}` }));

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const ScheduleManager = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    // Selection State
    const [selectedClasse, setSelectedClasse] = useState('');
    const [selectedSemestre, setSelectedSemestre] = useState('');
    const [selectedWeek, setSelectedWeek] = useState(1);

    // Data State
    const [classes, setClasses] = useState([]);
    const [semestres, setSemestres] = useState([]);
    const [emploiTemps, setEmploiTemps] = useState(null); // The current EmploiTemps object
    const [creneaux, setCreneaux] = useState([]); // Filtered for current week
    const [loading, setLoading] = useState(false);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCreneau, setEditingCreneau] = useState(null);

    // Options for Selects
    const classeOptions = useMemo(() => classes.map(c => ({ value: c.id, label: c.nom })), [classes]);
    const semestreOptions = useMemo(() => semestres.map(s => ({ value: s.id, label: `${s.nom} (${s.annee_scolaire})` })), [semestres]);

    // Initial Load
    useEffect(() => {
        const loadResources = async () => {
            try {
                const [classRes, semRes] = await Promise.all([
                    api.get('/classes'),
                    api.get('/semestres')
                ]);
                setClasses(classRes.data.data.classes);
                setSemestres(semRes.data.data.semestres);

                // Auto-select active semester
                const activeSem = semRes.data.data.semestres.find(s => s.actif);
                if (activeSem) setSelectedSemestre(activeSem.id);

            } catch (error) {
                console.error("Erreur chargement ressources", error);
                addToast("Erreur chargement des données", "error");
            }
        };
        loadResources();
    }, []);

    // Load Schedule when Classe or Semestre changes
    useEffect(() => {
        if (selectedClasse && selectedSemestre) {
            loadEmploiTemps();
        } else {
            setEmploiTemps(null);
            setCreneaux([]);
        }
    }, [selectedClasse, selectedSemestre]);

    const loadEmploiTemps = async () => {
        setLoading(true);
        try {
            // Fetch EDT by class AND semester using the search endpoint
            // The backend returns { data: { emplois_temps: [...] } }
            const response = await api.get(`/emplois-temps?classe_id=${selectedClasse}&semestre_id=${selectedSemestre}`);
            console.log("EDT Search Response:", response.data);

            const edts = response.data.data.emplois_temps;

            if (edts && edts.length > 0) {
                // We found the EDT. Now we need to fetch its details (creneaux) because getAll might not include full details 
                // (Controller says getAll includes creneaux IDs but maybe not full content? 
                // Line 163 in controller: includes Creneau (attributes id only?) 
                // Wait, Controller line 180: "creneaux: undefined" (removed detail).
                // So getAll DOES NOT return creneaux details. We must fetch by ID to get details.
                const summaryEDT = edts[0];

                // Fetch full details
                const detailResponse = await api.get(`/emplois-temps/${summaryEDT.id}`);
                setEmploiTemps(detailResponse.data.data.emploi_temps);
            } else {
                setEmploiTemps(null);
                setCreneaux([]);
            }

        } catch (error) {
            console.error("Erreur chargement EDT", error);
            // If 404, it means no EDT for this class at all?
            setEmploiTemps(null);
            setCreneaux([]);
        } finally {
            setLoading(false);
        }
    };

    // Update displayed creneaux when week changes
    useEffect(() => {
        if (emploiTemps) {
            filterCreneauxForWeek(emploiTemps.creneaux || [], selectedWeek);
        }
    }, [selectedWeek, emploiTemps]);

    const filterCreneauxForWeek = (allCreneaux, week) => {
        const weekly = allCreneaux.filter(c => c.semaine_numero == week && !c.annule);
        // Map to WeekView format
        // WeekView expects: { id, jour (1-6), heureDebut 'HH:MM', heureFin, ...rest }
        // Backend: jour_semaine (String), heure_debut (String), ...

        const dayMap = { 'Lundi': 1, 'Mardi': 2, 'Mercredi': 3, 'Jeudi': 4, 'Vendredi': 5, 'Samedi': 6 };

        const formatted = weekly.map(c => ({
            id: c.id,
            jour: dayMap[c.jour_semaine],
            heureDebut: c.heure_debut?.substring(0, 5), // Remove seconds if simple Time
            heureFin: c.heure_fin?.substring(0, 5),
            matiere: c.matiere?.nom || 'Cours',
            professeur: `${c.professeur?.user?.nom || ''} ${c.professeur?.user?.prenom || ''}`,
            salle: c.salle?.nom || '',
            color: c.matiere?.dfr?.couleur, // Extract DFR color
            original: c
        }));

        setCreneaux(formatted);
    };

    const handleExport = async (type) => {
        if (!emploiTemps) return;
        try {
            const response = await api.get(`/exports/emploi-temps/${emploiTemps.id}/${type}`, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `EDT_${selectedClasse}_S${selectedSemestre}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
            link.click();
        } catch (error) {
            console.error("Erreur export", error);
            addToast("Erreur lors de l'export.", "error");
        }
    };

    const handleCreateEDT = async () => {
        try {
            const res = await api.post('/emplois-temps', {
                classe_id: selectedClasse,
                semestre_id: selectedSemestre
            });
            addToast("Emploi du temps initialisé", "success");
            loadEmploiTemps(); // Reload to get it
        } catch (error) {
            console.error("Erreur creation EDT", error);
            addToast("Erreur lors de l'initialisation", "error");
        }
    };

    const handleAddSlot = () => {
        setEditingCreneau(null);
        setModalOpen(true);
    };

    const handleEditSlot = (course) => {
        // Prepare data for modal
        setEditingCreneau(course.original);
        setModalOpen(true);
    };

    const handleSaveCreneau = async (data) => {
        try {
            // data contains: jour_semaine, heure_debut, ...
            const payload = {
                ...data,
                emploi_temps_id: emploiTemps.id,
                semaine_numero: selectedWeek
            };

            if (editingCreneau) {
                // For update, exclude emploi_temps_id as it cannot be changed and is not in Joi schema
                const { emploi_temps_id, ...updatePayload } = payload;
                await api.put(`/creneaux/${editingCreneau.id}`, updatePayload);
                addToast("Cours modifié", "success");
            } else {
                await api.post('/creneaux', payload);
                addToast("Cours ajouté", "success");
            }

            setModalOpen(false);
            loadEmploiTemps(); // Reload to refresh grid
        } catch (error) {
            console.error("Erreur sauvegarde créneau:", error);

            const msg = error.response?.data?.message || "Erreur de sauvegarde";
            const conflicts = error.response?.data?.conflits;

            let displayMsg = msg;
            if (conflicts && conflicts.length > 0) {
                // Try to extract readable details if possible, or just keep generic
                displayMsg = `${msg}. Vérifiez que le Professeur ou la Salle ne sont pas déjà occupés.`;
            }

            addToast(displayMsg, "error");
        }
    };

    const handleDeleteCreneau = async () => {
        if (!editingCreneau) return;
        if (window.confirm("Supprimer ce créneau ?")) {
            try {
                await api.delete(`/creneaux/${editingCreneau.id}`);
                addToast("Cours supprimé", "success");
                setModalOpen(false);
                loadEmploiTemps();
            } catch (e) {
                addToast("Erreur suppression", "error");
            }
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-secondary-200">
                <div className="flex flex-wrap gap-4 items-center w-full xl:w-auto">
                    <div className="w-64">
                        <CustomSelect
                            value={selectedSemestre}
                            onChange={(e) => setSelectedSemestre(e.target.value)}
                            options={semestreOptions}
                            placeholder="Choisir un semestre"
                        />
                    </div>
                    <div className="w-64">
                        <CustomSelect
                            value={selectedClasse}
                            onChange={(e) => setSelectedClasse(e.target.value)}
                            options={classeOptions}
                            placeholder="Choisir une classe"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <div className="w-40">
                        <CustomSelect
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                            options={WEEKS}
                            placeholder="Semaine"
                        />
                    </div>

                    {emploiTemps && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleExport('pdf')}
                                className="p-2 hover:bg-secondary-50 text-secondary-600 rounded-lg border border-secondary-200 shadow-sm flex items-center gap-2 transition-colors"
                                title="Exporter en PDF"
                            >
                                <File className="w-4 h-4 text-red-500" />
                            </button>
                            <button
                                onClick={() => handleExport('excel')}
                                className="p-2 hover:bg-secondary-50 text-secondary-600 rounded-lg border border-secondary-200 shadow-sm flex items-center gap-2 transition-colors"
                                title="Exporter en Excel"
                            >
                                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                            </button>

                            <div className="h-6 w-px bg-secondary-200 mx-1"></div>

                            <button
                                onClick={handleAddSlot}
                                className="bg-esi-600 text-white px-4 py-2 rounded-lg hover:bg-esi-700 flex items-center gap-2 transition-colors whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Ajouter</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 relative">
                {!selectedClasse || !selectedSemestre ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-secondary-50 rounded-xl border-2 border-dashed border-secondary-200">
                        <p className="text-secondary-500">Sélectionnez une classe et un semestre pour gérer l'emploi du temps</p>
                    </div>
                ) : !emploiTemps ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary-50 rounded-xl border-2 border-dashed border-secondary-200 gap-4">
                        <p className="text-secondary-500">Aucun emploi du temps initialisé pour cette période.</p>
                        <button
                            onClick={handleCreateEDT}
                            className="bg-esi-600 text-white px-4 py-2 rounded-lg hover:bg-esi-700 transition-colors"
                        >
                            Initialiser l'emploi du temps
                        </button>
                    </div>
                ) : (
                    <WeekView
                        courses={creneaux}
                        onCourseClick={handleEditSlot}
                    />
                )}
            </div>

            {modalOpen && (
                <CreneauModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSaveCreneau}
                    onDelete={handleDeleteCreneau}
                    initialData={editingCreneau}
                    classeId={selectedClasse}
                    semestreId={selectedSemestre}
                />
            )}
        </div>
    );
};

// Modal for Adding/Editing Slot
const CreneauModal = ({ isOpen, onClose, onSave, onDelete, initialData, classeId, semestreId }) => {
    const [formData, setFormData] = useState({
        jour_semaine: initialData?.jour_semaine || 'Lundi',
        heure_debut: initialData?.heure_debut?.substring(0, 5) || '07:30',
        heure_fin: initialData?.heure_fin?.substring(0, 5) || '09:30',
        matiere_id: initialData?.matiere_id || '',
        professeur_id: initialData?.professeur_id || '',
        salle_id: initialData?.salle_id || ''
    });

    // Attributions loaded filters
    const [attributions, setAttributions] = useState([]); // Will store attributions to guide choices
    const [salles, setSalles] = useState([]);

    // Options derived from attributions
    // Attributions link Class -> Matiere -> Prof.
    // So we should list valid combinations.
    // Strategy: List Matieres available (via attributions). When Matiere selected, filter Profs.

    const [matieresOptions, setMatieresOptions] = useState([]);
    const [profsOptions, setProfsOptions] = useState([]);
    const [sallesOptions, setSallesOptions] = useState([]);

    useEffect(() => {
        if (!isOpen) return;

        const loadData = async () => {
            // Fetch Salles
            const salleRes = await api.get('/salles');
            setSallesOptions(salleRes.data.data.salles.map(s => ({ value: s.id, label: `${s.nom} (${s.capacite}p)` })));

            // Fetch Attributions for this Class & Semestre
            // Need API endpoint change or use existing filters.
            // GET /attributions?classe_id=X&semestre_id=Y
            const attrRes = await api.get(`/attributions?classe_id=${classeId}&semestre_id=${semestreId}`);
            setAttributions(attrRes.data.data.attributions);

            // Extract Matieres from attributions
            // Distinct matieres
            const mats = [];
            const matIds = new Set();
            attrRes.data.data.attributions.forEach(a => {
                if (!matIds.has(a.matiere_id)) {
                    matIds.add(a.matiere_id);
                    mats.push({ value: a.matiere_id, label: `${a.matiere.code} - ${a.matiere.nom}` });
                }
            });
            setMatieresOptions(mats);

            // Initial profs if editing
            if (initialData?.matiere_id) {
                updateProfsForMatiere(initialData.matiere_id, attrRes.data.data.attributions);
            }
        };
        loadData();
    }, [isOpen, classeId, semestreId, initialData]);

    const updateProfsForMatiere = (matId, attrs = attributions) => {
        // Filter attributions for this matiere
        const relevant = attrs.filter(a => a.matiere_id == matId);
        const profs = relevant.map(a => ({
            value: a.professeur_id,
            label: `${a.professeur.user.nom} ${a.professeur.user.prenom}`
        }));
        setProfsOptions(profs);

        // Auto-select first prof if only one and none selected
        if (profs.length === 1 && !formData.professeur_id) {
            setFormData(prev => ({ ...prev, professeur_id: profs[0].value }));
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => {
            const newState = { ...prev, [field]: value };
            // If Matiere changes, update Profs list and reset prof
            if (field === 'matiere_id') {
                updateProfsForMatiere(value);
                newState.professeur_id = '';
            }
            return newState;
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-secondary-900">
                        {initialData ? "Modifier le cours" : "Ajouter un cours"}
                    </h2>
                    <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Jour</label>
                            <CustomSelect
                                value={formData.jour_semaine}
                                onChange={(e) => handleChange('jour_semaine', e.target.value)}
                                options={DAYS.map(d => ({ value: d, label: d }))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Heure Début</label>
                            <input
                                type="time"
                                value={formData.heure_debut}
                                onChange={(e) => handleChange('heure_debut', e.target.value)}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-esi-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Heure Fin</label>
                            <input
                                type="time"
                                value={formData.heure_fin}
                                onChange={(e) => handleChange('heure_fin', e.target.value)}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-esi-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Matière</label>
                        <CustomSelect
                            value={formData.matiere_id}
                            onChange={(e) => handleChange('matiere_id', e.target.value)}
                            options={matieresOptions}
                            placeholder="Choisir une matière"
                            disabled={matieresOptions.length === 0}
                        />
                        {matieresOptions.length === 0 && (
                            <p className="text-xs text-amber-600 mt-1">Aucune matière attribuée pour cette classe/semestre.</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Professeur</label>
                        <CustomSelect
                            value={formData.professeur_id}
                            onChange={(e) => handleChange('professeur_id', e.target.value)}
                            options={profsOptions}
                            placeholder="Choisir un professeur"
                            disabled={!formData.matiere_id}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Salle</label>
                        <CustomSelect
                            value={formData.salle_id}
                            onChange={(e) => handleChange('salle_id', e.target.value)}
                            options={sallesOptions}
                            placeholder="Choisir une salle"
                        />
                    </div>

                    <div className="flex justify-between pt-4 mt-6 border-t border-secondary-100">
                        {initialData ? (
                            <button
                                onClick={onDelete}
                                className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                            </button>
                        ) : <div></div>}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50 font-medium"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => onSave(formData)}
                                className="px-4 py-2 bg-esi-600 text-white rounded-lg hover:bg-esi-700 font-medium flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleManager;
