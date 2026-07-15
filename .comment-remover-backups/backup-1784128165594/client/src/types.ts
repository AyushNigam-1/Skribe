import { LucideIcon } from "lucide-react";
import { GetScriptByIdQuery } from "./graphql/generated/graphql";

export interface DropdownOption {
    id: string | number;
    name: string;
    [key: string]: any;
}

export interface DropdownProps {
    options: DropdownOption[];
    value: DropdownOption;
    onChange: (value: DropdownOption) => void;
    className?: string;
    icon?: LucideIcon;
    collapseOnMobile?: boolean;
}

export interface GenresProps {
    selectedGenres: string[];
    onGenreChange: (genres: string[]) => void;
}

export interface SearchProps {
    value: string;
    setSearch: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export interface MenuItem {
    name: string;
    icon: LucideIcon;
    route: string;
}

export interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

export interface TabsProps {
    setTab?: (tab: string) => void;
    tab?: string;
    scriptId?: string;
    isEditorOrOwner?: boolean;
}

export interface TabItem {
    icon: LucideIcon;
    name: string;
    pathMatch: string;
    route: string;
    isRightStart?: boolean;
}

// --- Types & Hardcoded Data ---
export interface VisibilityOption {
    id: number;
    name: string;
    description: string;
}

export interface Option {
    id: number;
    name: string;
}

export interface ContributeModalProps {
    scriptId?: string;
    paragraphId?: string;
    refetch: () => void;
    variant?: "header" | "empty" | "edit";
    mode?: "create" | "edit";
    initialContent?: string;
}

export interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
    title?: string;
    description?: string;
}

export interface Comment {
    text: string;
    createdAt: string | number;
    author: {
        id: string
        name?: string;
        username?: string;
    };
}

export interface DiscussionPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isDesktop: boolean;
    comments: Comment[];
    onAddComment: (text: string) => Promise<void>;
    isCommenting: boolean;
    formatDate: (timestamp?: string | number) => string;
    currentUserName?: string;
}

export interface InviteCollaboratorProps {
    scriptId: string;
}



export interface Paragraph {
    author?: {
        id: string;
        name: string;
    };
}

export interface ScriptDetailsContext {
    data?: GetScriptByIdQuery;
    loading: boolean;
    refetch: () => void;
    isEditorOrOwner: boolean;
    currentUserRole: string;
    setTab: (tab: string) => void;
}

export interface Contributor {
    id: string;
    name: string;
    count: number;
}


export interface DraftCardProps {
    script: {
        id: string;
        title: string;
        createdAt?: string | null;
        description?: string | null;
        likes?: any[] | null;
        dislikes?: any[] | null;
        languages?: string[] | null;
        genres?: string[] | null;
        author?: { name: string } | null;
    };
}