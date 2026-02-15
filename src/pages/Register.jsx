import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Lock, Mail, Phone, GraduationCap, Briefcase, School } from 'lucide-react';
import logoESI from '../assets/logoESI.png';
import { APP_NAME } from '../config';

const Register = () => {
    const [role, setRole] = useState('ETUDIANT'); // 'ETUDIANT' or 'PROFESSEUR'
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        mot_de_passe: '',
        telephone: '',
        matricule: '', // Etudiant only
        classe_id: '', // Etudiant only
        grade: '', // Prof only
        specialite: '' // Prof only
    });
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        // Load classes for student registration
        if (role === 'ETUDIANT') {
            const loadClasses = async () => {
                try {
                    // We might need a public endpoint for classes if this page is public
                    // Assuming /classes is protected? Usually yes.
                    // If protected, we can't load classes for registration without being logged in.
                    // CHECK: Is /classes public? Usually not. 
                    // Workaround: If public registration needs class selection, backend must expose public classes list.
                    // Or we let them register without class and assign later? 
                    // Controller validation requires classe_id for students.
                    // Let's try fetching, if 401 we have a problem.
                    const res = await api.get('/classes/public');
                    setClasses(res.data.data.classes);
                } catch (error) {
                    console.error("Erreur chargement classes", error);
                    // If 401, maybe we can't register students publicly with class selection?
                    // For now, let's assume it might fail if not public.
                }
            };
            loadClasses();
        }
    }, [role]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Prepare payload
            const payload = {
                nom: formData.nom,
                prenom: formData.prenom,
                email: formData.email,
                mot_de_passe: formData.mot_de_passe,
                telephone: formData.telephone,
                role: role
            };

            if (role === 'ETUDIANT') {
                payload.matricule = formData.matricule;
                payload.classe_id = parseInt(formData.classe_id);
            } else if (role === 'PROFESSEUR') {
                payload.grade = formData.grade;
                payload.specialite = formData.specialite;
            }

            const response = await api.post('/auth/register', payload);
            addToast("Compte créé avec succès ! Connectez-vous.", "success");
            navigate('/login');

        } catch (error) {
            console.error("Erreur inscription", error);
            addToast(error.response?.data?.message || "Erreur lors de l'inscription", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row">

                {/* Left Side: Infos / Branding */}
                <div className="md:w-1/3 bg-esi-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
                    <div className="absolute w-64 h-64 bg-esi-600/30 rounded-full -top-10 -left-10 blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-6 shadow-lg">
                            <img src={logoESI} alt="Logo ESI" className="w-12 h-12 object-contain" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Rejoignez {APP_NAME}</h1>
                        <p className="text-esi-200 text-sm">
                            Plateforme de gestion d'emploi du temps optimisée pour l'ESI.
                        </p>
                    </div>

                    <div className="relative z-10 mt-auto pt-8">
                        <p className="text-xs text-esi-300">
                            © {new Date().getFullYear()} {APP_NAME}. Tous droits réservés.
                        </p>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="md:w-2/3 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-secondary-900">Inscription</h2>
                        <div className="flex bg-secondary-100 p-1 rounded-lg">
                            <button
                                onClick={() => setRole('ETUDIANT')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${role === 'ETUDIANT' ? 'bg-white shadow text-secondary-900' : 'text-secondary-500 hover:text-secondary-700'
                                    }`}
                            >
                                Étudiant
                            </button>
                            <button
                                onClick={() => setRole('PROFESSEUR')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${role === 'PROFESSEUR' ? 'bg-white shadow text-secondary-900' : 'text-secondary-500 hover:text-secondary-700'
                                    }`}
                            >
                                Enseignant
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-secondary-700 mb-1">Nom</label>
                                <div className="relative">
                                    <User className="w-4 h-4 text-secondary-400 absolute left-3 top-2.5" />
                                    <input
                                        type="text"
                                        name="nom"
                                        required
                                        className="w-full pl-9 pr-3 py-2 border border-secondary-200 rounded-lg text-sm focus:ring-2 focus:ring-esi-500 outline-none transition-colors"
                                        placeholder="Kouadio"
                                        value={formData.nom}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-secondary-700 mb-1">Prénom</label>
                                <div className="relative">
                                    <User className="w-4 h-4 text-secondary-400 absolute left-3 top-2.5" />
                                    <input
                                        type="text"
                                        name="prenom"
                                        required
                                        className="w-full pl-9 pr-3 py-2 border border-secondary-200 rounded-lg text-sm focus:ring-2 focus:ring-esi-500 outline-none transition-colors"
                                        placeholder="Jean"
                                        value={formData.prenom}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-secondary-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-secondary-400 absolute left-3 top-2.5" />
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="w-full pl-9 pr-3 py-2 border border-secondary-200 rounded-lg text-sm focus:ring-2 focus:ring-esi-500 outline-none transition-colors"
                                    placeholder="jean.kouadio01@inphb.ci"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-secondary-700 mb-1">Téléphone</label>
                            <div className="relative">
                                <Phone className="w-4 h-4 text-secondary-400 absolute left-3 top-2.5" />
                                <input
                                    type="tel"
                                    name="telephone"
                                    className="w-full pl-9 pr-3 py-2 border border-secondary-200 rounded-lg text-sm focus:ring-2 focus:ring-esi-500 outline-none transition-colors"
                                    placeholder="+225 ..."
                                    value={formData.telephone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {role === 'ETUDIANT' && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div>
                                    <label className="block text-xs font-medium text-secondary-700 mb-1">Matricule</label>
                                    <div className="relative">
                                        <GraduationCap className="w-4 h-4 text-secondary-400 absolute left-3 top-2.5" />
                                        <input
                                            type="text"
                                            name="matricule"
                                            required={role === 'ETUDIANT'}
                                            className="w-full pl-9 pr-3 py-2 border border-secondary-200 rounded-lg text-sm focus:ring-2 focus:ring-esi-500 outline-none transition-colors"
                                            placeholder="01INP00001"
                                            value={formData.matricule}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-secondary-700 mb-1">Classe</label>
                                    <select
                                        name="classe_id"
                                        required={role === 'ETUDIANT'}
                                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg text-sm focus:ring-2 focus:ring-esi-500 outline-none transition-colors bg-white"
                                        value={formData.classe_id}
                                        onChange={handleChange}
                                    >
                                        <option value="">Choisir...</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.nom}</option>
                                        ))}
                                    </select>
                                    {classes.length === 0 && (
                                        <p className="text-[10px] text-amber-600 mt-1">Impossible de charger les classes (accès restreint?)</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {role === 'PROFESSEUR' && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div>
                                    <label className="block text-xs font-medium text-secondary-700 mb-1">Grade</label>
                                    <div className="relative">
                                        <Briefcase className="w-4 h-4 text-secondary-400 absolute left-3 top-2.5" />
                                        <input
                                            type="text"
                                            name="grade"
                                            className="w-full pl-9 pr-3 py-2 border border-secondary-200 rounded-lg text-sm focus:ring-2 focus:ring-esi-500 outline-none transition-colors"
                                            placeholder="Dr, Pr..."
                                            value={formData.grade}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-secondary-700 mb-1">Spécialité</label>
                                    <input
                                        type="text"
                                        name="specialite"
                                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg text-sm focus:ring-2 focus:ring-esi-500 outline-none transition-colors"
                                        placeholder="Informatique, Maths..."
                                        value={formData.specialite}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-secondary-700 mb-1">Mot de passe</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-secondary-400 absolute left-3 top-2.5" />
                                <input
                                    type="password"
                                    name="mot_de_passe"
                                    required
                                    minLength={8}
                                    className="w-full pl-9 pr-3 py-2 border border-secondary-200 rounded-lg text-sm focus:ring-2 focus:ring-esi-500 outline-none transition-colors"
                                    placeholder="••••••••"
                                    value={formData.mot_de_passe}
                                    onChange={handleChange}
                                />
                            </div>
                            <p className="text-[10px] text-secondary-400 mt-1">Minimum 8 caractères</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-esi-600 text-white py-2.5 rounded-lg font-medium hover:bg-esi-700 transition-colors focus:ring-4 focus:ring-esi-500/20 disabled:opacity-50 mt-4"
                        >
                            {loading ? 'Création en cours...' : "S'inscrire"}
                        </button>

                        <div className="text-center mt-4">
                            <p className="text-sm text-secondary-600">
                                Déjà un compte ?{' '}
                                <Link to="/login" className="text-esi-600 font-medium hover:text-esi-700 hover:underline">
                                    Se connecter
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
