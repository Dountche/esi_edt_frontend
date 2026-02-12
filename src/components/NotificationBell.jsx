import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data.data.notifications);
            setUnreadCount(response.data.data.non_lues);
        } catch (error) {
            console.error("Erreur chargement notifications", error);
        }
    };

    // Poll for notifications every 30 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await api.put(`/notifications/${id}/marquer-lu`);
            fetchNotifications(); // Refresh to update UI
        } catch (error) {
            console.error("Erreur marquage lu", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/marquer-toutes-lues');
            fetchNotifications();
        } catch (error) {
            console.error("Erreur marquage tout lu", error);
        }
    };

    const handleNotificationClick = (notif) => {
        if (!notif.lu) {
            handleMarkAsRead(notif.id, { stopPropagation: () => { } });
        }
        setIsOpen(false);
        // Navigate based on type if needed, currently no specific links in notif payload
        // future: if (notif.link) navigate(notif.link);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-secondary-500 hover:bg-secondary-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-esi-500 focus:ring-offset-2"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-secondary-100 overflow-hidden z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                    <div className="p-3 border-b border-secondary-100 flex justify-between items-center bg-secondary-50">
                        <h3 className="text-sm font-semibold text-secondary-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-esi-600 hover:text-esi-700 font-medium"
                            >
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-secondary-500">
                                Aucune notification
                            </div>
                        ) : (
                            <div className="divide-y divide-secondary-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-4 hover:bg-secondary-50 cursor-pointer transition-colors ${!notif.lu ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1">
                                                <p className={`text-sm ${!notif.lu ? 'font-semibold text-secondary-900' : 'text-secondary-700'}`}>
                                                    {notif.titre}
                                                </p>
                                                <p className="text-xs text-secondary-500 mt-1 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-secondary-400 mt-2">
                                                    {new Date(notif.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            {!notif.lu && (
                                                <div className="w-2 h-2 bg-esi-500 rounded-full flex-shrink-0 mt-1.5"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
