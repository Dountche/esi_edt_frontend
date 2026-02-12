import { useState, useEffect } from 'react';
import { WeekView } from '../components/Schedule/WeekView';
import { scheduleService } from '../services/scheduleService';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, FileSpreadsheet, File } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../services/api';

const Schedule = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (user) loadSchedule();
    }, [currentDate, user]);

    const loadSchedule = async () => {
        setLoading(true);
        try {
            const data = await scheduleService.getWeekSchedule(user);
            setCourses(data);
        } catch (error) {
            console.error("Erreur chargement emploi du temps", error);
        } finally {
            setLoading(false);
        }
    };

    const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    const handleExport = async (type) => {
        try {
            let url = '';
            const filename = `EDT_${type === 'pdf' ? 'Export.pdf' : 'Export.xlsx'}`;

            if (user.role.nom === 'PROFESSEUR' || user.role.nom === 'RUP') {
                // Pour les profs et RUPs, on exporte leur emploi du temps personnel
                if (user.professeur && user.professeur.id) {
                    url = `/exports/professeur/${user.professeur.id}/${type}`;
                } else {
                    alert("Impossible de trouver votre profil professeur.");
                    return;
                }
            } else if (user.role.nom === 'ETUDIANT') {
                if (user.etudiant && user.etudiant.classe_id) {
                    // Récupérer l'EDT actif de la classe
                    // On utilise l'endpoint existant qui retourne l'EDT de la classe
                    try {
                        const res = await api.get(`/emplois-temps/classe/${user.etudiant.classe_id}`);
                        if (res.data && res.data.success && res.data.data) {
                            const edtData = res.data.data;

                            // La structure retournée est { emploi_temps: object }
                            const edtObj = edtData.emploi_temps || edtData;
                            const edtId = edtObj.id;

                            if (edtId) {
                                url = `/exports/emploi-temps/${edtId}/${type}`;
                            } else {
                                alert("Aucun emploi du temps trouvé pour votre classe.");
                                return;
                            }
                        } else {
                            alert("Erreur lors de la récupération de l'emploi du temps.");
                            return;
                        }
                    } catch (err) {
                        console.error("Erreur fetch EDT classe", err);
                        alert("Impossible de récupérer l'emploi du temps de votre classe.");
                        return;
                    }
                } else {
                    alert("Profil étudiant incomplet.");
                    return;
                }
            }

            if (url) {
                const response = await api.get(url, { responseType: 'blob' });
                const blob = new Blob([response.data], { type: type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert("Export non disponible pour ce rôle.");
            }

        } catch (error) {
            console.error("Erreur export", error);
            alert("Erreur lors de l'export.");
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                        <CalendarIcon className="w-8 h-8 text-esi-600" />
                        Emploi du temps
                    </h1>
                    <p className="text-secondary-500">
                        Semaine du {format(weekStart, 'd MMMM', { locale: fr })} au {format(weekEnd, 'd MMMM yyyy', { locale: fr })}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleExport('pdf')}
                        className="p-2 hover:bg-secondary-50 text-secondary-600 rounded-lg border border-secondary-200 shadow-sm flex items-center gap-2 transition-colors"
                        title="Exporter en PDF"
                    >
                        <File className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium hidden md:inline">PDF</span>
                    </button>
                    <button
                        onClick={() => handleExport('excel')}
                        className="p-2 hover:bg-secondary-50 text-secondary-600 rounded-lg border border-secondary-200 shadow-sm flex items-center gap-2 transition-colors"
                        title="Exporter en Excel"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium hidden md:inline">Excel</span>
                    </button>

                    <div className="h-6 w-px bg-secondary-200 mx-2"></div>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-secondary-200 shadow-sm">
                        <button
                            onClick={prevWeek}
                            className="p-2 hover:bg-secondary-50 rounded-md text-secondary-600 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-50 rounded-md transition-colors"
                        >
                            Aujourd'hui
                        </button>
                        <button
                            onClick={nextWeek}
                            className="p-2 hover:bg-secondary-50 rounded-md text-secondary-600 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-secondary-200">
                    <p className="text-secondary-500">Chargement de l'emploi du temps...</p>
                </div>
            ) : (
                <div className="flex-1 min-h-0">
                    <WeekView courses={courses} onCourseClick={(c) => console.log('Cours:', c)} />
                </div>
            )}
        </div>
    );
};

export default Schedule;
