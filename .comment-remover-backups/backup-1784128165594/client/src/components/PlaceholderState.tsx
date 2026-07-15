import React, { ReactNode } from "react";
import { motion, Variants } from "framer-motion";

interface EmptyStateProps {
    icon: React.ElementType;
    title: string;
    description: string;
    action?: ReactNode;
    className?: string;
    minHeight?: string; // Bring this back so you can tweak it per-page if needed
    'data-testid'?: string;
}
const variants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.3 } }
};
const PlaceholderState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    action,
    className = "",
    minHeight = "min-h-[66dvh]",
    'data-testid': dataTestId
}) => {
    return (
        <motion.div
            data-testid={dataTestId}
            variants={variants}
            className={`flex-1 w-full flex flex-col items-center justify-center text-center ${minHeight} gap-3 md:gap-5 overflow-hidden ${className}`}
        >
            <div className="bg-white/5 border border-white/10 p-4 rounded-full shadow-sm relative z-10">
                <Icon className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans relative z-10">
                {title}
            </h3>

            <p className="text-sm sm:text-base text-gray-400 font-mono max-w-xs sm:max-w-md relative z-10 leading-relaxed">
                {description}
            </p>

            {/* If an action is passed down, it will render here */}
            {action && <div className="relative z-10">{action}</div>}
        </motion.div>
    );
};

export default PlaceholderState;