import { useState, Fragment, useEffect } from "react";
import { useApolloClient } from "@apollo/client";
import { Link } from "react-router-dom";
import { Bell, Heart, MessageSquare, Info, X, Loader as LoaderIcon, UserPlus, Trash2 } from "lucide-react";
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from "@headlessui/react";
import { useUserStore } from "../../store/useAuthStore";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import {
    useGetNotificationsQuery,
    useMarkAllNotificationsReadMutation,
    useDeleteNotificationMutation,
    useAcceptInvitationMutation,
    useDeclineInvitationMutation,
    GetNotificationsDocument
} from "../../graphql/generated/graphql";

const ENDPOINT = `http://${window.location.hostname}:3000`;

const NotificationModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [actionedNotifs, setActionedNotifs] = useState<Record<string, "ACCEPTED" | "DECLINED">>({});
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { user } = useUserStore();
    const client = useApolloClient();

    const { data, loading, error } = useGetNotificationsQuery({
        variables: { userId: user?.id || "" },
        skip: !user?.id,
        fetchPolicy: "cache-and-network",
    });

    const notifications = data?.getNotifications || [];
    const unreadCount = notifications.filter((n) => !n?.isRead).length;

    const [markAllRead] = useMarkAllNotificationsReadMutation({
        update(cache) {
            const existingData: any = cache.readQuery({
                query: GetNotificationsDocument, // Used generated Document
                variables: { userId: user?.id || "" },
            });

            if (existingData && existingData.getNotifications) {
                const updatedNotifications = existingData.getNotifications.map((notif: any) => ({
                    ...notif,
                    isRead: true,
                }));

                cache.writeQuery({
                    query: GetNotificationsDocument,
                    variables: { userId: user?.id || "" },
                    data: {
                        getNotifications: updatedNotifications,
                    },
                });
            }
        },
    });

    const [deleteNotification] = useDeleteNotificationMutation({
        update(cache, { data }, { variables }) {
            if (data?.deleteNotification) {
                const existingData: any = cache.readQuery({
                    query: GetNotificationsDocument,
                    variables: { userId: user?.id || "" },
                });

                if (existingData && existingData.getNotifications) {
                    const newNotifications = existingData.getNotifications.filter(
                        (notif: any) => notif.id !== variables?.id
                    );

                    cache.writeQuery({
                        query: GetNotificationsDocument,
                        variables: { userId: user?.id || "" },
                        data: {
                            getNotifications: newNotifications,
                        },
                    });
                }
            }
        }
    });

    const [acceptInvite, { loading: accepting }] = useAcceptInvitationMutation();
    const [declineInvite, { loading: declining }] = useDeclineInvitationMutation();

    const handleAccept = (e: React.MouseEvent, scriptId: string, notifId: string) => {
        e.preventDefault();
        e.stopPropagation();

        const promise = acceptInvite({ variables: { scriptId } }).then(() => {
            setActionedNotifs(prev => ({ ...prev, [notifId]: "ACCEPTED" }));

            setTimeout(() => {
                deleteNotification({ variables: { id: notifId } }).catch(console.error);
            }, 2000);
        });

        toast.promise(promise, {
            loading: "Accepting invitation...",
            success: "Invite Accepted! You are now a collaborator.",
            error: (err) => err.message || "Failed to accept invite.",
        });
    };

    const handleDecline = (e: React.MouseEvent, scriptId: string, notifId: string) => {
        e.preventDefault();
        e.stopPropagation();

        const promise = declineInvite({ variables: { scriptId } }).then(() => {
            setActionedNotifs(prev => ({ ...prev, [notifId]: "DECLINED" }));

            setTimeout(() => {
                deleteNotification({ variables: { id: notifId } }).catch(console.error);
            }, 2000);
        });

        toast.promise(promise, {
            loading: "Declining invitation...",
            success: "Invite Declined.",
            error: (err) => err.message || "Failed to decline invite.",
        });
    };

    const handleDelete = (e: React.MouseEvent, notifId: string) => {
        e.preventDefault();
        e.stopPropagation();

        setDeletingId(notifId);

        const promise = deleteNotification({ variables: { id: notifId } })
            .finally(() => setDeletingId(null));

        toast.promise(promise, {
            loading: "Deleting...",
            success: "Notification deleted",
            error: (err) => err.message || "Failed to delete notification"
        });
    };

    const extractScriptId = (link: string | null | undefined) => {
        if (!link) return "";
        const parts = link.split("/");
        return parts[parts.length - 1];
    };

    const handleCloseModal = () => {
        if (unreadCount > 0) {
            markAllRead();
        }
        setIsOpen(false);
    };

    useEffect(() => {
        if (!user?.id) return;

        const socket = io(ENDPOINT, {
            withCredentials: true,
        });

        socket.emit("setup", user.id);

        socket.on("new notification", (newNotif) => {
            client.cache.updateQuery(
                { query: GetNotificationsDocument, variables: { userId: user.id } },
                (prev: any) => {
                    if (!prev || !prev.getNotifications) return prev;
                    if (prev.getNotifications.some((n: any) => n.id === newNotif.id)) return prev;

                    return {
                        getNotifications: [newNotif, ...prev.getNotifications],
                    };
                }
            );
        });

        return () => {
            socket.disconnect();
        };
    }, [user?.id, client]);

    const getIcon = (type: string | null | undefined) => {
        switch (type) {
            case "LIKE": return <Heart className="w-4 h-4 text-gray-400" />;
            case "COMMENT": return <MessageSquare className="w-4 h-4 text-gray-400" />;
            case "REQUEST": return <UserPlus className="w-4 h-4 text-gray-400" />;
            default: return <Info className="w-4 h-4 text-gray-400" />;
        }
    };

    const formatTimeAgo = (timestamp: string | null | undefined) => {
        if (!timestamp) return "";
        const date = new Date(Number(timestamp));
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return "Just now";

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <Fragment>
            <button
                onClick={() => setIsOpen(true)}
                className={`group flex items-center gap-3 py-1 transition-all duration-300 outline-none relative overflow-hidden w-full font-mono ${isOpen ? "font-bold text-white pl-3" : "text-gray-400 hover:text-white pl-0"}`}
            >
                <div className={`absolute left-0 top-0 bottom-0 w-[2px] bg-gray-100 transition-transform duration-300 ease-out origin-center ${isOpen ? "scale-y-100" : "scale-y-0"}`} />
                <div className="relative flex items-center justify-center">
                    <Bell className={`w-5 h-5 shrink-0 transition-all duration-300 ${isOpen ? "stroke-[2.5px] scale-110 ml-1" : "stroke-2 opacity-70 group-hover:opacity-100 group-hover:scale-110"}`} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5 z-10">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 border border-[#161620]"></span>
                        </span>
                    )}
                </div>
                <span className="text-lg font-medium">Notifications</span>
            </button>

            <Dialog open={isOpen} onClose={handleCloseModal} className="relative z-50 font-mono">
                <DialogBackdrop transition className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ease-out data-[closed]:opacity-0" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel
                        transition
                        className="w-full max-w-xl h-[550px] transform overflow-hidden rounded-2xl bg-primary border border-white/10 text-left shadow-2xl transition-all duration-300 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 flex flex-col"
                    >
                        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5 shrink-0">
                            <DialogTitle as="h3" className="text-xl font-bold text-white font-sans tracking-tight">
                                Notifications
                            </DialogTitle>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                            {loading && !notifications.length ? (
                                <div className="flex justify-center items-center h-full">
                                    <LoaderIcon className="animate-spin text-white w-8 h-8 opacity-50" />
                                </div>
                            ) : error ? (
                                <div className="p-6 text-center text-red-400 font-semibold h-full flex items-center justify-center">
                                    Failed to load notifications.
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                                    <Bell className="w-12 h-12 text-gray-700" />
                                    <h4 className="text-lg font-bold text-white opacity-40">All caught up!</h4>
                                </div>
                            ) : (
                                <AnimatePresence initial={false}>
                                    {notifications.map((notif) => {
                                        if (!notif) return null;

                                        const fallbackPrimaryText = notif.message?.replace(/ on (your )?draft ".*?"/i, "").replace(/your draft/i, "your contribution") || "";
                                        const isDeleting = deletingId === notif.id;

                                        return (
                                            <motion.div
                                                key={notif.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="relative group/notif overflow-hidden border-b border-white/5 last:border-0"
                                            >
                                                <Link
                                                    to={notif.link || "#"}
                                                    onClick={handleCloseModal}
                                                    className={`flex items-start gap-4 px-3 py-5 md:p-5 hover:bg-white/5 transition-colors ${!notif.isRead ? "bg-blue-500/[0.03]" : ""}`}
                                                >
                                                    <div className={`shrink-0 mt-0.5 size-10 rounded-full border flex items-center justify-center transition-colors bg-white/5 border-white/10`}>
                                                        {getIcon(notif.type)}
                                                    </div>
                                                    <div className="flex flex-col gap-1 flex-1 min-w-0 pr-8">
                                                        <div className="flex justify-between items-start gap-4">
                                                            <p className={`font-semibold text-sm md:text-base leading-snug ${!notif.isRead ? "text-white font-semibold" : "text-gray-300"}`}>
                                                                {notif.draftTitle ? notif.message : fallbackPrimaryText}
                                                            </p>
                                                            {!notif.isRead && (
                                                                <div className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-blue-500" />
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {notif.draftTitle && (
                                                                <p className="text-xs text-gray-500 font-mono truncate">
                                                                    <span className="text-gray-300">- {notif.draftTitle}</span>
                                                                </p>
                                                            )}
                                                            {notif.draftTitle && <span className="text-gray-600 text-[10px]">•</span>}
                                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider shrink-0 mt-[1px]">
                                                                {formatTimeAgo(notif.createdAt)}
                                                            </span>
                                                        </div>

                                                        {notif.type === "REQUEST" && (
                                                            <div className="mt-2">
                                                                {actionedNotifs[notif.id] === "ACCEPTED" ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-[11px] font-bold uppercase tracking-wider border border-blue-500/20">
                                                                        Accepted ✓
                                                                    </span>
                                                                ) : actionedNotifs[notif.id] === "DECLINED" ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 text-gray-400 text-[11px] font-bold uppercase tracking-wider border border-white/10">
                                                                        Declined ✕
                                                                    </span>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            disabled={accepting || declining}
                                                                            onClick={(e) => handleAccept(e, extractScriptId(notif.link), notif.id)}
                                                                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-md transition-all disabled:opacity-50"
                                                                        >
                                                                            {accepting ? "..." : "Accept"}
                                                                        </button>
                                                                        <button
                                                                            disabled={accepting || declining}
                                                                            onClick={(e) => handleDecline(e, extractScriptId(notif.link), notif.id)}
                                                                            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-[11px] font-bold uppercase tracking-wider rounded-md transition-all disabled:opacity-50"
                                                                        >
                                                                            {declining ? "..." : "Decline"}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </Link>

                                                <div
                                                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out ${isDeleting
                                                        ? "opacity-100 pointer-events-auto"
                                                        : "opacity-100 pointer-events-auto md:opacity-0 md:pointer-events-none md:group-hover/notif:opacity-100 md:group-hover/notif:pointer-events-auto"
                                                        }`}
                                                >
                                                    <button
                                                        disabled={isDeleting}
                                                        onClick={(e) => handleDelete(e, notif.id)}
                                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors outline-none disabled:opacity-50"
                                                        title="Delete notification"
                                                    >
                                                        {isDeleting ? (
                                                            <LoaderIcon className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </Fragment>
    );
};

export default NotificationModal;