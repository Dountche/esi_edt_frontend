import { useMemo } from 'react';
import { CourseCard } from './CourseCard';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7h à 19h
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export const WeekView = ({ courses, onCourseClick }) => {

    // Fonction Helper pour calculer la position
    const getPosition = (heureDebut, heureFin, jourIndex) => {
        const [hDebut, mDebut] = heureDebut.split(':').map(Number);
        const [hFin, mFin] = heureFin.split(':').map(Number);

        const startMinutes = (hDebut - 7) * 60 + mDebut;
        const durationMinutes = (hFin - hDebut) * 60 + (mFin - mDebut);

        return {
            top: `${(startMinutes / 60) * 64}px`, // 64px = 4rem (hauteur d'une heure)
            height: `${(durationMinutes / 60) * 64}px`,
            left: `${jourIndex * (100 / 6)}%`, // 6 jours
            width: `${100 / 6}%`
        };
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
            {/* Header Jours */}
            <div className="flex border-b border-secondary-200">
                <div className="w-16 flex-shrink-0 border-r border-secondary-100 bg-secondary-50"></div>
                <div className="flex-1 grid grid-cols-6 divide-x divide-secondary-100">
                    {DAYS.map((day) => (
                        <div key={day} className="py-3 text-center text-sm font-semibold text-secondary-700 bg-secondary-50">
                            {day}
                        </div>
                    ))}
                </div>
            </div>

            {/* Grille Horaire Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative h-[600px]"> {/* Fixation de hauteur pour test */}
                <div className="flex min-h-[800px]">
                    {/* Colonne Heures */}
                    <div className="w-16 flex-shrink-0 border-r border-secondary-100 bg-white">
                        {HOURS.map((hour) => (
                            <div key={hour} className="h-16 border-b border-secondary-50 text-xs text-secondary-400 text-right pr-2 pt-2 relative">
                                <span className="-top-3 relative">{hour}:00</span>
                            </div>
                        ))}
                    </div>

                    {/* Zone de contenu (Grille + Cours) */}
                    <div className="flex-1 relative bg-white bg-grid-pattern">
                        {/* Lignes horizontales pour les heures */}
                        {HOURS.map((hour) => (
                            <div key={hour} className="h-16 border-b border-dashed border-secondary-100"></div>
                        ))}

                        {/* Séparateurs verticaux des jours */}
                        <div className="absolute inset-0 grid grid-cols-6 divide-x divide-transparent pointer-events-none">
                            {DAYS.map((_, i) => (
                                <div key={i} className="border-r border-dashed border-secondary-100 h-full"></div>
                            ))}
                        </div>

                        {/* Affichage des Cours */}
                        {courses.map((course) => {
                            const style = getPosition(course.heureDebut, course.heureFin, course.jour - 1); // Jour 1 = Lundi = Index 0
                            return (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    style={style}
                                    onClick={() => onCourseClick?.(course)}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
