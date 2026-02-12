import { Menu, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui';
import NotificationBell from './NotificationBell';

export const Header = ({ onMenuClick }) => {
    const { user } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 hover:bg-secondary-100 rounded-lg text-secondary-600"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-semibold text-secondary-800 hidden md:block">
                    Bienvenue, {user?.prenom} {user?.nom}
                </h2>
            </div>

            <div className="flex items-center gap-4">
                <NotificationBell />

                <div className="flex items-center gap-3 pl-4 border-l border-secondary-200">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-secondary-900">{user?.prenom} {user?.nom}</p>
                        <p className="text-xs text-secondary-500">{user?.role?.nom || 'Utilisateur'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-esi-100 flex items-center justify-center text-esi-700 font-bold border-2 border-white shadow-sm">
                        {user?.prenom?.[0]}{user?.nom?.[0]}
                    </div>
                </div>
            </div>
        </header>
    );
};
