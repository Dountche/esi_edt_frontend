import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    Users,
    GraduationCap,
    School,
    BookOpen,
    Settings,
    LogOut,
    Menu,
    ChevronDown,
    ChevronRight,
    Building2,
    Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from './ui';
import logoESI from '../assets/logoESI.png';
import { APP_NAME } from '../config';

const SidebarItem = ({ icon: Icon, label, to, active }) => (
    <NavLink
        to={to}
        className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1 text-sm ",
            active
                ? "bg-esi-50 text-esi-700 font-medium"
                : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
        )}
    >
        <Icon className={cn("w-4 h-4", active ? "text-esi-600" : "text-secondary-400")} />
        <span>{label}</span>
    </NavLink>
);

const SidebarGroup = ({ title, icon: Icon, children, initialOpen = false }) => {
    const [isOpen, setIsOpen] = useState(initialOpen);

    return (
        <div className="mb-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-secondary-500 uppercase tracking-wider hover:bg-secondary-50 rounded-lg transition-colors mb-1"
            >
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{title}</span>
                </div>
                {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>

            <div className={cn(
                "space-y-0.5 overflow-hidden transition-all duration-200 ease-in-out pl-2 border-l border-secondary-100 ml-3",
                isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            )}>
                {children}
            </div>
        </div>
    );
};

export const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { logout } = useAuth();

    // Helper to keep groups open if active item is inside
    const isActive = (path) => location.pathname.startsWith(path);

    // Group active logic
    const isPedaActive = isActive('/dashboard/ues') || isActive('/dashboard/matieres') || isActive('/dashboard/attributions');
    const isScolActive = isActive('/dashboard/classes') || isActive('/dashboard/students');
    const isResActive = isActive('/dashboard/teachers') || isActive('/dashboard/rooms');
    const isParamActive = isActive('/dashboard/filieres') || isActive('/dashboard/cycles') || isActive('/dashboard/specialites') || isActive('/dashboard/semestres') || isActive('/dashboard/dfr') || isActive('/dashboard/domaines');

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-secondary-200 transform transition-transform duration-200 ease-in-out lg:transform-none flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-secondary-100">
                    <img src={logoESI} alt={`Logo ${APP_NAME}`} className="w-10 h-10 mr-3" />
                    <span className="text-xl font-bold text-secondary-900">{APP_NAME}</span>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">

                    {/* Menu Principal (Toujours visible) */}
                    <div className="mb-6">
                        <h3 className="px-3 text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-2">
                            Menu Principal
                        </h3>
                        <SidebarItem
                            icon={LayoutDashboard}
                            label="Tableau de bord"
                            to="/dashboard"
                            active={location.pathname === '/dashboard'}
                        />
                        <SidebarItem
                            icon={Calendar}
                            label="Emploi du temps"
                            to="/dashboard/schedule"
                            active={location.pathname === '/dashboard/schedule'}
                        />
                    </div>

                    {/* Groupes Déroulants - RUP Uniquement */}
                    {location.pathname.startsWith('/dashboard') && useAuth().user?.role?.nom === 'RUP' && (
                        <>
                            <SidebarGroup title="Scolarité" icon={School} initialOpen={isScolActive}>
                                <SidebarItem
                                    icon={BookOpen}
                                    label="Classes"
                                    to="/dashboard/classes"
                                    active={isActive('/dashboard/classes')}
                                />
                                <SidebarItem
                                    icon={GraduationCap}
                                    label="Étudiants"
                                    to="/dashboard/students"
                                    active={isActive('/dashboard/students')}
                                />
                            </SidebarGroup>

                            <SidebarGroup title="Pédagogie" icon={BookOpen} initialOpen={isPedaActive}>
                                <SidebarItem
                                    icon={BookOpen}
                                    label="Unités d'Ens."
                                    to="/dashboard/ues"
                                    active={isActive('/dashboard/ues')}
                                />
                                <SidebarItem
                                    icon={BookOpen}
                                    label="Matières"
                                    to="/dashboard/matieres"
                                    active={isActive('/dashboard/matieres')}
                                />
                                <SidebarItem
                                    icon={Briefcase}
                                    label="Attributions"
                                    to="/dashboard/attributions"
                                    active={isActive('/dashboard/attributions')}
                                />
                                <SidebarItem
                                    icon={Calendar}
                                    label="Gestion EDT"
                                    to="/dashboard/schedule-manager"
                                    active={isActive('/dashboard/schedule-manager')}
                                />
                            </SidebarGroup>

                            <SidebarGroup title="Ressources" icon={Users} initialOpen={isResActive}>
                                <SidebarItem
                                    icon={Users}
                                    label="Enseignants"
                                    to="/dashboard/teachers"
                                    active={isActive('/dashboard/teachers')}
                                />
                                <SidebarItem
                                    icon={Building2}
                                    label="Salles"
                                    to="/dashboard/rooms"
                                    active={isActive('/dashboard/rooms')}
                                />
                                <SidebarItem
                                    icon={BookOpen}
                                    label="Indisponibilités"
                                    to="/dashboard/indisponibilites"
                                    active={isActive('/dashboard/indisponibilites')}
                                />
                            </SidebarGroup>

                            <SidebarGroup title="Paramètres" icon={Settings} initialOpen={isParamActive}>
                                <SidebarItem
                                    icon={Settings}
                                    label="Filières"
                                    to="/dashboard/filieres"
                                    active={isActive('/dashboard/filieres')}
                                />
                                <SidebarItem
                                    icon={Settings}
                                    label="Spécialités"
                                    to="/dashboard/specialites"
                                    active={isActive('/dashboard/specialites')}
                                />
                                <SidebarItem
                                    icon={Settings}
                                    label="Cycles"
                                    to="/dashboard/cycles"
                                    active={isActive('/dashboard/cycles')}
                                />
                                <SidebarItem
                                    icon={Calendar}
                                    label="Semestres"
                                    to="/dashboard/semestres"
                                    active={isActive('/dashboard/semestres')}
                                />
                                <SidebarItem
                                    icon={Building2}
                                    label="DFR"
                                    to="/dashboard/dfr"
                                    active={isActive('/dashboard/dfr')}
                                />
                                <SidebarItem
                                    icon={BookOpen}
                                    label="Domaines"
                                    to="/dashboard/domaines"
                                    active={isActive('/dashboard/domaines')}
                                />
                            </SidebarGroup>
                        </>
                    )}

                    {/* Menus spécifiques Professeur */}
                    {useAuth().user?.role?.nom === 'PROFESSEUR' && (
                        <SidebarGroup title="Espace Professeur" icon={Briefcase} initialOpen={true}>
                            <SidebarItem
                                icon={BookOpen}
                                label="Indisponibilités"
                                to="/dashboard/indisponibilites"
                                active={isActive('/dashboard/indisponibilites')}
                            />
                        </SidebarGroup>
                    )}

                </div>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-secondary-100">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Déconnexion</span>
                    </button>
                </div>
            </aside>
        </>
    );
};
