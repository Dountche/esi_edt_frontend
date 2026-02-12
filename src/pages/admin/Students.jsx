import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/Admin/DataTable';
import { ResourceModal } from '../../components/Admin/ResourceModal';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentStudent, setCurrentStudent] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [studentsResponse, classesResponse] = await Promise.all([
                api.get('/students'),
                api.get('/classes')
            ]);

            // Mapping des étudiants
            const mappedStudents = studentsResponse.data.data.etudiants.map(e => ({
                id: e.id,
                matricule: e.matricule,
                nom: e.user.nom,
                prenom: e.user.prenom,
                email: e.user.email,
                telephone: e.user.telephone || '-',
                classe_id: e.classe_id,
                classe_nom: e.classe?.nom || '-'
            }));
            setStudents(mappedStudents);

            // Mapping des classes pour le select
            const mappedClasses = classesResponse.data.data.classes.map(c => ({
                value: c.id,
                label: c.nom
            }));
            setClasses(mappedClasses);

        } catch (error) {
            console.error("Erreur chargement données", error);
            addToast("Impossible de charger les données.", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadStudentsOnly = async () => {
        setLoading(true);
        try {
            const response = await api.get('/students');
            const mappedStudents = response.data.data.etudiants.map(e => ({
                id: e.id,
                matricule: e.matricule,
                nom: e.user.nom,
                prenom: e.user.prenom,
                email: e.user.email,
                telephone: e.user.telephone || '-',
                classe_id: e.classe_id,
                classe_nom: e.classe?.nom || '-'
            }));
            setStudents(mappedStudents);
        } catch (error) {
            console.error("Erreur chargement étudiants", error);
            addToast("Impossible de mettre à jour la liste.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setCurrentStudent(null);
        setModalOpen(true);
    };

    const handleEdit = (student) => {
        // Préparer les données pour le formulaire (aplatir la structure)
        setCurrentStudent({
            ...student,
            classe_id: student.classe_id // S'assurer que l'ID de la classe est bien passé
        });
        setModalOpen(true);
    };

    const handleDelete = async (student) => {
        if (window.confirm(`Voulez-vous vraiment supprimer l'étudiant ${student.prenom} ${student.nom} ?`)) {
            try {
                await api.delete(`/students/${student.id}`);
                addToast("Étudiant supprimé avec succès.", "success");
                loadStudentsOnly();
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
                nom: formData.nom,
                prenom: formData.prenom,
                email: formData.email,
                telephone: formData.telephone,
                matricule: formData.matricule,
                classe_id: parseInt(formData.classe_id) // S'assurer que c'est un nombre
            };

            if (!currentStudent) {
                // Mot de passe par défaut = Matricule
                payload.mot_de_passe = payload.matricule;
            }

            if (currentStudent) {
                await api.put(`/students/${currentStudent.id}`, payload);
                addToast("Étudiant modifié avec succès.", "success");
            } else {
                await api.post('/students', payload);
                addToast("Étudiant ajouté avec succès.", "success");
            }

            setModalOpen(false);
            loadStudentsOnly();
        } catch (error) {
            console.error("Erreur enregistrement", error);
            addToast("Erreur lors de l'enregistrement: " + (error.response?.data?.message || error.message), "error");
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        { key: 'matricule', label: 'Matricule' },
        { key: 'nom', label: 'Nom' },
        { key: 'prenom', label: 'Prénom' },
        { key: 'classe_nom', label: 'Classe' },
        { key: 'email', label: 'Email' },
        { key: 'telephone', label: 'Téléphone' }
    ];

    const formFields = useMemo(() => [
        { name: 'matricule', label: 'Matricule', required: true },
        { name: 'nom', label: 'Nom', required: true },
        { name: 'prenom', label: 'Prénom', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'telephone', label: 'Téléphone' },
        {
            name: 'classe_id',
            label: 'Classe',
            type: 'select',
            required: true,
            options: classes
        }
    ], [classes]);

    return (
        <>
            <DataTable
                title="Gestion des Étudiants"
                columns={columns}
                data={students}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
                addButtonLabel="Ajouter un étudiant"
            />

            <ResourceModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                title={currentStudent ? "Modifier l'étudiant" : "Ajouter un étudiant"}
                fields={formFields}
                initialData={currentStudent}
                loading={actionLoading}
            />
        </>
    );
};

export default Students;
