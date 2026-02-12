import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/Admin/DataTable';
import { ResourceModal } from '../../components/Admin/ResourceModal';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        setLoading(true);
        try {
            const response = await api.get('/salles');
            const mappedRooms = response.data.data.salles.map(s => ({
                id: s.id,
                nom: s.nom,
                capacite: s.capacite,
                type: s.type,
                disponible: s.disponible
            }));
            setRooms(mappedRooms);
        } catch (error) {
            console.error("Erreur chargement salles", error);
            addToast("Impossible de charger la liste des salles.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setCurrentRoom(null);
        setModalOpen(true);
    };

    const handleEdit = (room) => {
        setCurrentRoom(room);
        setModalOpen(true);
    };

    const handleDelete = async (room) => {
        if (window.confirm(`Voulez-vous vraiment supprimer la salle ${room.nom} ?`)) {
            try {
                await api.delete(`/salles/${room.id}`);
                addToast("Salle supprimée avec succès.", "success");
                loadRooms();
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
                capacite: parseInt(formData.capacite),
                type: formData.type,
                disponible: formData.disponible === 'true' || formData.disponible === true
            };

            if (currentRoom) {
                await api.put(`/salles/${currentRoom.id}`, payload);
                addToast("Salle modifiée avec succès.", "success");
            } else {
                await api.post('/salles', payload);
                addToast("Salle ajoutée avec succès.", "success");
            }

            setModalOpen(false);
            loadRooms();
        } catch (error) {
            console.error("Erreur enregistrement", error);
            addToast("Erreur lors de l'enregistrement: " + (error.response?.data?.message || error.message), "error");
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        { key: 'nom', label: 'Nom' },
        { key: 'type', label: 'Type' },
        { key: 'capacite', label: 'Capacité' },
        {
            key: 'disponible',
            label: 'Disponible',
            render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {value ? 'Oui' : 'Non'}
                </span>
            )
        }
    ];

    const formFields = useMemo(() => [
        { name: 'nom', label: 'Nom de la salle', required: true },
        { name: 'capacite', label: 'Capacité', type: 'number', required: true },
        {
            name: 'type',
            label: 'Type',
            type: 'select',
            required: true,
            options: [
                { value: 'Amphi', label: 'Amphithéâtre' },
                { value: 'TD', label: 'Salle TD' },
                { value: 'TP', label: 'Salle TP' },
                { value: 'Labo', label: 'Laboratoire' }
            ]
        },
        {
            name: 'disponible',
            label: 'Disponible',
            type: 'select',
            required: true,
            options: [
                { value: 'true', label: 'Oui' },
                { value: 'false', label: 'Non' }
            ]
        }
    ], []);

    return (
        <>
            <DataTable
                title="Gestion des Salles"
                columns={columns}
                data={rooms}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
                addButtonLabel="Ajouter une salle"
            />

            <ResourceModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                title={currentRoom ? "Modifier la salle" : "Ajouter une salle"}
                fields={formFields}
                initialData={currentRoom}
                loading={actionLoading}
            />
        </>
    );
};

export default Rooms;
