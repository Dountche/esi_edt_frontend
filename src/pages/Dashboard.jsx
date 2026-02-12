import { useState, useEffect } from 'react';
import { Card } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Users,
    BookOpen,
    GraduationCap,
    Clock,
    Calendar,
    AlertCircle,
    CheckCircle2,
    FileText
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color = "bg-primary-50 text-primary-600", subtitle }) => (
    <Card className="p-6 flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-sm font-medium text-secondary-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-secondary-900">{value}</h3>
            {subtitle && <p className="text-xs text-secondary-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
    </Card>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [profStats, setProfStats] = useState(null); // Pour les RUPs qui sont aussi profs
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            try {
                let endpoint = '';
                if (user.role?.nom === 'RUP') {
                    endpoint = '/dashboard/rup';
                    // Les RUPs sont aussi des professeurs, récupérer leurs stats prof aussi
                    try {
                        const [rupResponse, profResponse] = await Promise.all([
                            api.get('/dashboard/rup'),
                            api.get('/dashboard/professeur')
                        ]);
                        setStats(rupResponse.data.data);
                        setProfStats(profResponse.data.data);
                    } catch (error) {
                        console.error("Erreur chargement stats RUP:", error);
                        // Si l'appel professeur échoue, charger au moins les stats RUP
                        try {
                            const rupResponse = await api.get('/dashboard/rup');
                            setStats(rupResponse.data.data);
                            setProfStats(null); // Pas de stats prof disponibles
                        } catch (rupError) {
                            console.error("Erreur chargement stats RUP uniquement:", rupError);
                        }
                    }
                } else if (user.role?.nom === 'PROFESSEUR') {
                    endpoint = '/dashboard/professeur';
                    const response = await api.get(endpoint);
                    setStats(response.data.data);
                } else if (user.role?.nom === 'ETUDIANT') {
                    endpoint = '/dashboard/etudiant';
                    const response = await api.get(endpoint);
                    setStats(response.data.data);
                }
            } catch (error) {
                console.error("Erreur chargement dashboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    if (loading) return <div className="p-8 text-center text-secondary-500">Chargement du tableau de bord...</div>;
    if (!stats) return <div className="p-8 text-center text-secondary-500">Impossible de charger les données.</div>;

    const renderRUPDashboard = () => (
        <>
            {/* Section Administrative */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-secondary-700 mb-4">📊 Gestion Administrative</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Classes"
                        value={stats.nombre_classes}
                        icon={BookOpen}
                        color="bg-blue-50 text-blue-600"
                    />
                    <StatCard
                        title="Étudiants"
                        value={stats.nombre_etudiants}
                        icon={GraduationCap}
                        color="bg-green-50 text-green-600"
                    />
                    <StatCard
                        title="Matières"
                        value={stats.nombre_matieres}
                        icon={FileText}
                        color="bg-purple-50 text-purple-600"
                    />
                    <StatCard
                        title="Alertes"
                        value={stats.indisponibilites_en_attente}
                        subtitle="Indisponibilités en attente"
                        icon={AlertCircle}
                        color="bg-red-50 text-red-600"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-esi-600" />
                        État des Emplois du temps
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-secondary-50 rounded-lg">
                            <span className="text-secondary-600">Publiés</span>
                            <span className="font-bold text-green-600">{stats.emplois_temps?.publié || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-secondary-50 rounded-lg">
                            <span className="text-secondary-600">Brouillons</span>
                            <span className="font-bold text-yellow-600">{stats.emplois_temps?.brouillon || 0}</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Semestre Actif</h3>
                    {stats.semestre_actif ? (
                        <div>
                            <p className="text-2xl font-bold text-esi-600">{stats.semestre_actif.nom}</p>
                            <p className="text-secondary-500 mt-2">
                                Du {new Date(stats.semestre_actif.date_debut).toLocaleDateString()} au {new Date(stats.semestre_actif.date_fin).toLocaleDateString()}
                            </p>
                        </div>
                    ) : (
                        <p className="text-secondary-500 italic">Aucun semestre actif</p>
                    )}
                </Card>
            </div>

            {/* Section Enseignement (si le RUP a des cours) */}
            {profStats && (
                <>
                    <div className="mb-6 mt-8">
                        <h2 className="text-lg font-semibold text-secondary-700 mb-4">👨‍🏫 Mon Enseignement</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                title="Volume Horaire"
                                value={`${profStats.volume_horaire_total}h`}
                                icon={Clock}
                                color="bg-blue-50 text-blue-600"
                            />
                            <StatCard
                                title="Mes Matières"
                                value={profStats.nombre_matieres}
                                icon={BookOpen}
                                color="bg-purple-50 text-purple-600"
                            />
                            <StatCard
                                title="Mes Classes"
                                value={profStats.nombre_classes}
                                icon={Users}
                                color="bg-green-50 text-green-600"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-secondary-800 mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-esi-600" />
                                Mes Prochains Cours
                            </h3>
                            <div className="space-y-3">
                                {profStats.prochains_cours?.length > 0 ? (
                                    profStats.prochains_cours.map((cours, idx) => (
                                        <div key={idx} className="p-3 border border-secondary-100 rounded-lg hover:bg-secondary-50 transition-colors">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-semibold text-secondary-900">{cours.matiere}</span>
                                                <span className="text-xs bg-esi-100 text-esi-700 px-2 py-0.5 rounded-full">{cours.jour}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-secondary-500">
                                                <span>{cours.heure_debut?.substring(0, 5)} - {cours.heure_fin?.substring(0, 5)}</span>
                                                <span>{cours.classe} • {cours.salle}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-secondary-500 italic text-center py-4">Aucun cours à venir prochainement</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </>

    );

    const renderProfDashboard = () => (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Volume Horaire"
                    value={`${stats.volume_horaire_total}h`}
                    icon={Clock}
                    color="bg-blue-50 text-blue-600"
                />
                <StatCard
                    title="Matières"
                    value={stats.nombre_matieres}
                    icon={BookOpen}
                    color="bg-purple-50 text-purple-600"
                />
                <StatCard
                    title="Classes"
                    value={stats.nombre_classes}
                    icon={Users}
                    color="bg-green-50 text-green-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-esi-600" />
                        Prochains Cours
                    </h3>
                    <div className="space-y-3">
                        {stats.prochains_cours?.length > 0 ? (
                            stats.prochains_cours.map((cours, idx) => (
                                <div key={idx} className="p-3 border border-secondary-100 rounded-lg hover:bg-secondary-50 transition-colors">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-semibold text-secondary-900">{cours.matiere}</span>
                                        <span className="text-xs bg-esi-100 text-esi-700 px-2 py-0.5 rounded-full">{cours.jour}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-secondary-500">
                                        <span>{cours.heure_debut?.substring(0, 5)} - {cours.heure_fin?.substring(0, 5)}</span>
                                        <span>{cours.classe} • {cours.salle}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-secondary-500 italic text-center py-4">Aucun cours à venir prochainement</p>
                        )}
                    </div>
                </Card>
            </div>

        </>
    );

    const renderStudentDashboard = () => (
        <>
            <div className="mb-6 bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                <h2 className="text-xl font-bold text-secondary-900">{stats.classe}</h2>
                <p className="text-secondary-500">{stats.annee_scolaire} • {stats.semestre_actif?.nom || 'Aucun semestre'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Mes Matières"
                    value={stats.nombre_matieres}
                    icon={BookOpen}
                    color="bg-blue-50 text-blue-600"
                />
                <StatCard
                    title="Unités d'Ens."
                    value={stats.nombre_ues}
                    icon={FileText}
                    color="bg-purple-50 text-purple-600"
                />
                <StatCard
                    title="Volume Total"
                    value={`${stats.volume_horaire_total}h`}
                    icon={Clock}
                    color="bg-green-50 text-green-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-esi-600" />
                        Prochain Cours
                    </h3>
                    {stats.prochain_cours ? (
                        <div className="p-4 bg-esi-50 border border-esi-100 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-xl font-bold text-esi-900">{stats.prochain_cours.matiere}</h4>
                                <span className="bg-white px-2 py-1 rounded text-xs font-semibold text-esi-700 shadow-sm">
                                    {stats.prochain_cours.jour}
                                </span>
                            </div>
                            <div className="space-y-1 text-esi-800">
                                <p className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 opacity-75" />
                                    {stats.prochain_cours.heure_debut?.substring(0, 5)} - {stats.prochain_cours.heure_fin?.substring(0, 5)}
                                </p>
                                <p className="flex items-center gap-2">
                                    <Users className="w-4 h-4 opacity-75" />
                                    {stats.prochain_cours.professeur}
                                </p>
                                <p className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 opacity-75" />
                                    {stats.prochain_cours.salle}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-secondary-500">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>Aucun cours prévu prochainement</p>
                        </div>
                    )}
                </Card>
            </div>
        </>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-secondary-900">Tableau de bord</h1>
                <p className="text-secondary-500">Bienvenue, {user?.prenom} {user?.nom}</p>
            </div>

            {user?.role?.nom === 'RUP' && renderRUPDashboard()}
            {user?.role?.nom === 'PROFESSEUR' && renderProfDashboard()}
            {user?.role?.nom === 'ETUDIANT' && renderStudentDashboard()}
        </div>
    );
};

export default Dashboard;
