import { cn } from '../ui';

export const CourseCard = ({ course, style, onClick }) => {
    return (
        <div
            className={cn(
                "absolute rounded-lg p-2 text-xs border shadow-sm cursor-pointer hover:shadow-md transition-all overflow-hidden flex flex-col gap-1",
                !course.color && "bg-gray-100 border-gray-200 text-gray-700"
            )}
            style={{
                ...style,
                backgroundColor: course.color ? course.color : undefined,
                color: course.color ? '#fff' : undefined, // Assuming dark color for text if bg is set, or better, calculate contrast. For now white text if color set.
                borderColor: course.color ? course.color : undefined
            }}
            onClick={onClick}
        >
            <div className="font-bold truncate text-sm">{course.matiere}</div>
            <div className="truncate opacity-90">{course.professeur}</div>
            <div className="flex justify-between items-end mt-auto opacity-75 text-[10px]">
                <span>{course.salle}</span>
            </div>
        </div>
    );
};
