import { useToast } from '../context/ToastContext';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from './ui';

export const ToastContainer = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={cn(
                        "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-[300px] max-w-sm",
                        toast.type === 'success' && "bg-green-600",
                        toast.type === 'error' && "bg-red-600",
                        toast.type === 'info' && "bg-blue-600",
                        toast.type === 'warning' && "bg-yellow-600"
                    )}
                >
                    <div className="flex-shrink-0">
                        {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
                        {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                        {toast.type === 'info' && <Info className="w-5 h-5" />}
                        {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                    </div>

                    <span className="flex-1 text-sm font-medium break-words leading-tight">{toast.message}</span>

                    <button
                        onClick={() => removeToast(toast.id)}
                        className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};
