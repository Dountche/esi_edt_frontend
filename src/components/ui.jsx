import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const Button = ({ className, variant = 'primary', ...props }) => {
    const variants = {
        primary: 'bg-esi-500 hover:bg-esi-600 text-white shadow-sm hover:shadow-md',
        secondary: 'border border-esi-500 text-esi-500 hover:bg-esi-50',
        ghost: 'text-esi-700 hover:bg-secondary-100',
        danger: 'bg-red-500 text-white hover:bg-red-600',
    };

    return (
        <button
            className={cn(
                'px-6 py-2.5 rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
                variants[variant],
                className
            )}
            {...props}
        />
    );
};

export const Input = ({ className, label, error, ...props }) => {
    return (
        <div className="flex flex-col gap-1">
            {label && <label className="text-sm font-medium text-secondary-700">{label}</label>}
            <input
                className={cn(
                    'w-full px-4 py-2 border rounded-lg outline-none transition-all',
                    'border-secondary-300 focus:border-esi-500 focus:ring-2 focus:ring-esi-100',
                    error && 'border-red-500 focus:ring-red-100',
                    className
                )}
                {...props}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
};

export const Card = ({ className, children, ...props }) => {
    return (
        <div
            className={cn(
                'bg-white rounded-xl shadow-sm border border-secondary-200 p-6',
                'hover:shadow-md transition-shadow duration-300',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export const Select = ({ className, label, error, children, ...props }) => {
    return (
        <div className="flex flex-col gap-1">
            {label && <label className="text-sm font-medium text-secondary-700">{label}</label>}
            <select
                className={cn(
                    'w-full px-4 py-2 border rounded-lg outline-none transition-all',
                    'border-secondary-300 focus:border-esi-500 focus:ring-2 focus:ring-esi-100',
                    'bg-white cursor-pointer',
                    error && 'border-red-500 focus:ring-red-100',
                    className
                )}
                {...props}
            >
                {children}
            </select>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
};
