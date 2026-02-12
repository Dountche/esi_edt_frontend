import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/Admin/DataTable';
import { ResourceModal } from '../../components/Admin/ResourceModal';
import { useToast } from '../../context/ToastContext';
import { File, FileSpreadsheet } from 'lucide-react';
import api from '../../services/api';

const Classes = () => {
    const [classes, setClasses] = useState([]);
    const [specialites, setSpecialites] = useState([]);
    const [salles, setSalles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentClass, setCurrentClass] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [classesResponse, specialitesResponse, sallesResponse] = await Promise.all([
                api.get('/classes'),
                api.get('/specialites'),
                api.get('/salles')
            ]);

            // Mapping des classes
            const mapClasse = (c) => ({
                id: c.id,
                nom: c.nom,
                specialite_nom: c.specialite?.nom || '-',
                specialite_id: c.specialite_id,
                salle_principale_nom: c.salle_principale?.nom || '-',
                salle_principale_id: c.salle_principale_id,
                annee_scolaire: c.annee_scolaire,
                nombre_etudiants: c.nombre_etudiants || 0,
                rup_nom: c.rup ? `${c.rup.prenom} ${c.rup.nom}` : '-',
                jour_eps: c.jour_eps,
                heure_debut_eps: c.heure_debut_eps,
                heure_fin_eps: c.heure_fin_eps
            });

            const mappedClasses = classesResponse.data.data.classes.map(mapClasse);
            setClasses(mappedClasses);

            // Mapping des spécialités pour le select
            const mappedSpecialites = specialitesResponse.data.data.specialites.map(s => ({
                value: s.id,
                label: `${s.nom} (${s.cycle?.nom || ''} - ${s.filiere?.nom || ''})`
            }));
            setSpecialites(mappedSpecialites);

            // Mapping des salles pour le select
            const mappedSalles = sallesResponse.data.data.salles.map(s => ({
                value: s.id,
                label: `${s.nom} (${s.type}, ${s.capacite} places)`
            }));
            setSalles(mappedSalles);

        } catch (error) {
            console.error("Erreur chargement données", error);
            addToast("Impossible de charger les données.", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadClassesOnly = async () => {
        setLoading(true);
        try {
            const response = await api.get('/classes');
            const mappedClasses = response.data.data.classes.map(c => ({
                id: c.id,
                nom: c.nom,
                specialite_nom: c.specialite?.nom || '-',
                specialite_id: c.specialite_id,
                salle_principale_nom: c.salle_principale?.nom || '-',
                salle_principale_id: c.salle_principale_id,
                annee_scolaire: c.annee_scolaire,
                nombre_etudiants: c.nombre_etudiants || 0,
                rup_nom: c.rup ? `${c.rup.prenom} ${c.rup.nom}` : '-',
                jour_eps: c.jour_eps,
                heure_debut_eps: c.heure_debut_eps,
                heure_fin_eps: c.heure_fin_eps
            }));
            setClasses(mappedClasses);
        } catch (error) {
            console.error("Erreur chargement classes", error);
            addToast("Impossible de mettre à jour la liste.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setCurrentClass(null);
        setModalOpen(true);
    };

    const handleEdit = (classItem) => {
        setCurrentClass({
            ...classItem,
            specialite_id: classItem.specialite_id,
            salle_principale_id: classItem.salle_principale_id,
            // Ensure time strings are properly formatted if needed, though input type="time" handles HH:MM usually
            heure_debut_eps: classItem.heure_debut_eps ? classItem.heure_debut_eps.substring(0, 5) : '',
            heure_fin_eps: classItem.heure_fin_eps ? classItem.heure_fin_eps.substring(0, 5) : ''
        });
        setModalOpen(true);
    };

    const handleDelete = async (classItem) => {
        if (window.confirm(`Voulez-vous vraiment supprimer la classe ${classItem.nom} ?`)) {
            try {
                await api.delete(`/classes/${classItem.id}`);
                addToast("Classe supprimée avec succès.", "success");
                loadClassesOnly();
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
                specialite_id: parseInt(formData.specialite_id),
                salle_principale_id: parseInt(formData.salle_principale_id),
                annee_scolaire: formData.annee_scolaire,
                jour_eps: formData.jour_eps || null,
                heure_debut_eps: formData.heure_debut_eps || null,
                heure_fin_eps: formData.heure_fin_eps || null
            };

            if (currentClass) {
                await api.put(`/classes/${currentClass.id}`, payload);
                addToast("Classe modifiée avec succès.", "success");
            } else {
                await api.post('/classes', payload);
                addToast("Classe ajoutée avec succès.", "success");
            }

            setModalOpen(false);
            loadClassesOnly();
        } catch (error) {
            console.error("Erreur enregistrement", error);
            addToast("Erreur lors de l'enregistrement: " + (error.response?.data?.message || error.message), "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleExportMaquette = async (classId, className, type) => {
        try {
            const response = await api.get(`/exports/maquette/${classId}/${type}`, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Maquette_${className.replace(/\s/g, '_')}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
            link.click();
        } catch (error) {
            console.error("Erreur export maquette", error);
            addToast("Erreur lors de l'export de la maquette.", "error");
        }
    };

    const columns = [
        { key: 'nom', label: 'Nom' },
        { key: 'specialite_nom', label: 'Spécialité' },
        { key: 'annee_scolaire', label: 'Année' },
        { key: 'salle_principale_nom', label: 'Salle principale' },
        { key: 'nombre_etudiants', label: 'Nb Etud.' },
        // Simple indicator for EPS config
        {
            key: 'jour_eps',
            label: 'Sport (EPS)',
            render: (_, row) => row.jour_eps ? `${row.jour_eps} ${row.heure_debut_eps?.substring(0, 5)}-${row.heure_fin_eps?.substring(0, 5)}` : '-'
        },
        {
            key: 'export',
            label: 'Maquette',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleExportMaquette(row.id, row.nom, 'pdf')}
                        className="p-1 hover:bg-secondary-100 text-red-600 rounded transition-colors"
                        title="Exporter Maquette PDF"
                    >
                        <File className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleExportMaquette(row.id, row.nom, 'excel')}
                        className="p-1 hover:bg-secondary-100 text-green-600 rounded transition-colors"
                        title="Exporter Maquette Excel"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    const formFields = useMemo(() => [
        { section: 'Informations Générales' }, // Using sections in modal if supported, or just flat
        { name: 'nom', label: 'Nom de la classe', required: true, placeholder: 'Ex: ING STIC 1A' },
        {
            name: 'specialite_id',
            label: 'Spécialité',
            type: 'select',
            required: true,
            options: specialites
        },
        {
            name: 'salle_principale_id',
            label: 'Salle principale',
            type: 'select',
            required: true,
            options: salles
        },
        {
            name: 'annee_scolaire',
            label: 'Année scolaire',
            required: true,
            placeholder: '2024-2025'
        },
        // EPS Section
        { section: 'Configuration Sport (EPS)' },
        {
            name: 'jour_eps',
            label: 'Jour de Sport',
            type: 'select',
            required: false,
            options: DAYS.map(d => ({ value: d, label: d }))
        },
        {
            name: 'heure_debut_eps',
            label: 'Début Sport',
            type: 'time',
            required: false
        },
        {
            name: 'heure_fin_eps',
            label: 'Fin Sport',
            type: 'time',
            required: false
        }
    ], [specialites, salles]);

    return (
        <>
            <DataTable
                title="Gestion des Classes"
                columns={columns}
                data={classes}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
                addButtonLabel="Ajouter une classe"
            />

            <ResourceModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                title={currentClass ? "Modifier la classe" : "Ajouter une classe"}
                fields={formFields}
                initialData={currentClass}
                loading={actionLoading}
            />
        </>
    );
};

export default Classes;
