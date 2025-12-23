import { Zap, Users, Star, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const getIconComponent = (iconNumber: number) => {
    const iconMap = new Map<number, React.ComponentType<any>>([
        [1, Zap],
        [2, Users],
        [3, Star],
    ]);
    return iconMap.get(iconNumber);
};

const TITLE_DEFINITIONS = [
    { name: "CEO", gradient: "from-yellow-400 to-amber-600" },
    { name: "BornToBoost", gradient: "from-blue-400 to-purple-600" },
    { name: "President", gradient: "from-red-500 to-blue-600" },
    { name: "Founder figure", gradient: "from-emerald-400 to-cyan-500" },
    { name: "OG", gradient: "from-indigo-500 to-pink-500" },
];

export const getTitleGradient = (titleName: string) => {
    const def = TITLE_DEFINITIONS.find(t => t.name === titleName);
    return def?.gradient || "from-gray-900 to-gray-600";
};

interface UserTitleProps {
    title: string;
    className?: string;
}

export const UserTitle = ({ title, className }: UserTitleProps) => {
    const gradient = getTitleGradient(title);
    return (
        <span className={cn(
            "text-[10px] font-bold bg-clip-text text-transparent bg-gradient-to-r",
            gradient,
            className
        )}>
            {title}
        </span>
    );
};

interface UserIconProps {
    iconNumber: number;
    className?: string;
}

export const UserIcon = ({ iconNumber, className }: UserIconProps) => {
    const Icon = getIconComponent(iconNumber);
    if (!Icon) return null;
    
    let iconClass = "text-primary";
    if (iconNumber === 1) iconClass = "text-yellow-500 fill-yellow-500";
    if (iconNumber === 2) iconClass = "text-blue-500 fill-blue-500";
    if (iconNumber === 3) iconClass = "text-purple-500 fill-purple-500";

    return (
        <div className={cn("inline-flex items-center justify-center", className)}>
            <Icon className={cn("w-3.5 h-3.5", iconClass)} />
        </div>
    );
};
