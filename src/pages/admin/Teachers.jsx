import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/Admin/DataTable';
import { ResourceModal } from '../../components/Admin/ResourceModal';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const Teachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentTeacher, setCurrentTeacher] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        loadTeachers();
    }, []);

    const loadTeachers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/teachers');
            const mappedTeachers = response.data.data.professeurs.map(p => ({
                id: p.id,
                nom: p.user.nom,
                prenom: p.user.prenom,
                email: p.user.email,
                grade: p.grade || '-',
                specialite: p.specialite || '-',
                telephone: p.user.telephone || '-'
            }));
            setTeachers(mappedTeachers);
        } catch (error) {
            console.error("Erreur chargement professeurs", error);
            addToast("Impossible de charger la liste des professeurs.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setCurrentTeacher(null);
        setModalOpen(true);
    };

    const handleEdit = (teacher) => {
        setCurrentTeacher(teacher);
        setModalOpen(true);
    };

    const handleDelete = async (teacher) => {
        if (window.confirm(`Voulez-vous vraiment supprimer ${teacher.prenom} ${teacher.nom} ?`)) {
            try {
                await api.delete(`/teachers/${teacher.id}`);
                addToast("Professeur supprimé avec succès.", "success");
                loadTeachers(); // Recharger la liste
            } catch (error) {
                console.error("Erreur suppression", error);
                addToast("Erreur lors de la suppression.", "error");
            }
        }
    };

    const handleSubmit = async (formData) => {
        setActionLoading(true);
        try {
            // Reconstruire l'objet pour l'API
            const payload = {
                nom: formData.nom,
                prenom: formData.prenom,
                email: formData.email,
                telephone: formData.telephone,
                grade: formData.grade,
                specialite: formData.specialite
            };

            // Ajout du mot de passe par défaut pour la création
            if (!currentTeacher) {
                payload.mot_de_passe = 'pass1234';
            }

            if (currentTeacher) {
                await api.put(`/teachers/${currentTeacher.id}`, payload);
                addToast("Professeur modifié avec succès.", "success");
            } else {
                await api.post('/teachers', payload);
                addToast("Professeur ajouté avec succès.", "success");
            }

            setModalOpen(false);
            loadTeachers();
        } catch (error) {
            console.error("Erreur enregistrement", error);
            addToast("Erreur lors de l'enregistrement: " + (error.response?.data?.message || error.message), "error");
        } finally {
            setActionLoading(false);
        }
    };

    const formFields = useMemo(() => [
        { name: 'nom', label: 'Nom', required: true },
        { name: 'prenom', label: 'Prénom', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'telephone', label: 'Téléphone' },
        { name: 'grade', label: 'Grade' },
        { name: 'specialite', label: 'Spécialité' }
    ], []);

    const columns = [
        { key: 'nom', label: 'Nom' },
        { key: 'prenom', label: 'Prénom' },
        { key: 'email', label: 'Email' },
        { key: 'grade', label: 'Grade' },
        { key: 'specialite', label: 'Spécialité' },
    ];

    return (
        <>
            <DataTable
                title="Gestion des Enseignants"
                columns={columns}
                data={teachers}
                loading={loading}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                addButtonLabel="Nouveau Professeur"
            />

            <ResourceModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                title={currentTeacher ? "Modifier l'enseignant" : "Nouvel enseignant"}
                fields={formFields}
                initialData={currentTeacher}
                loading={actionLoading}
            />
        </>
    );
};

export default Teachers;
