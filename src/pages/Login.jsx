import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../components/ui';
import { GraduationCap, Lock, Mail } from 'lucide-react';
import logoESI from '../assets/logoESI.png';
import { APP_NAME, SCHOOL_NAME } from '../config';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Identifiants incorrects. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-secondary-50">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex w-1/2 bg-esi-900 relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-esi-900/90 z-10" />
                <img
                    src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
                    alt="Campus"
                    className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay"
                />
                <div className="relative z-20 text-white max-w-lg p-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-white rounded-xl shadow-lg">
                            <img src={logoESI} alt={`Logo ${APP_NAME}`} className="w-12 h-12 object-contain" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">{SCHOOL_NAME}</h1>
                            <p className="text-esi-200">Excellence & Innovation</p>
                        </div>
                    </div>
                    <h2 className="text-4xl font-bold leading-tight mb-6">
                        Plateforme de Gestion des Emplois du Temps
                    </h2>
                    <p className="text-lg text-esi-100/90 leading-relaxed">
                        Optimisez la gestion académique avec notre solution centralisée.
                        Visualisation en temps réel, gestion des salles et suivi pédagogique.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-secondary-900">Connexion</h2>
                        <p className="text-secondary-500 mt-2">Accédez à votre espace ESI</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Email Institutionnel"
                            type="email"
                            placeholder="professeur@inphb.ci"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={<Mail className="w-5 h-5" />}
                            required
                        />

                        <Input
                            label="Mot de passe"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={<Lock className="w-5 h-5" />}
                            required
                        />

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
                                ⚠️ {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full py-3 text-lg"
                            disabled={loading}
                        >
                            {loading ? 'Connexion en cours...' : 'Se connecter'}
                        </Button>
                    </form>

                    <div className="text-center mt-6 space-y-2">
                        <p className="text-sm text-secondary-500">
                            Pas encore de compte ? <a href="/register" className="text-esi-600 hover:underline font-medium">Créer un compte</a>
                        </p>
                        <p className="text-sm text-secondary-500">
                            Problème de connexion ? <a href="#" className="text-esi-600 hover:underline">Contacter le support</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
