import api from './api';

const DAY_MAPPING = {
    'Lundi': 1,
    'Mardi': 2,
    'Mercredi': 3,
    'Jeudi': 4,
    'Vendredi': 5,
    'Samedi': 6,
    'Dimanche': 7
};

export const scheduleService = {
    getWeekSchedule: async (user) => {
        try {
            let creneaux = [];

            if (user?.role?.nom === 'ETUDIANT' && user.etudiant?.classe_id) {
                // Pour un étudiant : récupérer l'EDT de sa classe
                const response = await api.get(`/emplois-temps/classe/${user.etudiant.classe_id}`);
                console.log('[ScheduleService] Response ETUDIANT:', response.data);
                creneaux = response.data.data.emploi_temps.creneaux || [];
            } else if ((user?.role?.nom === 'PROFESSEUR' || user?.role?.nom === 'RUP') && user.professeur?.id) {
                // Pour un professeur ou RUP : récupérer ses propres créneaux
                // Les RUPs sont aussi des professeurs et peuvent avoir des cours assignés
                const response = await api.get(`/creneaux?professeur_id=${user.professeur.id}`);
                creneaux = response.data.success ? response.data.data.creneaux : [];
            }

            // Mapper les données pour le composant
            return creneaux.map(c => ({
                id: c.id,
                matiere: c.matiere?.nom || 'Matière inconnue',
                professeur: c.professeur ? `${c.professeur.user.prenom} ${c.professeur.user.nom}` : '',
                salle: c.salle?.nom || 'Salle ?',
                classe: c.emploi_temps?.classe?.nom || '',
                jour: DAY_MAPPING[c.jour_semaine] || 1,
                heureDebut: c.heure_debut.substring(0, 5),
                heureFin: c.heure_fin.substring(0, 5),
                color: c.matiere?.dfr?.couleur || '#3B82F6', // Bleu par défaut
                type: 'cours' // Générique
            }));

        } catch (error) {
            console.error('[Schedule] Erreur chargement:', error);
            return [];
        }
    }
};

// Helper inutilisé mais gardé pour référence si besoin de fallback
const getColorByType = (type) => {
    return 'bg-blue-100 text-blue-700';
};
