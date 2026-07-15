import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authClient } from "../../lib/authClient";

const resetSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error("Missing reset token. Please request a new link.");
            navigate("/forgot-password");
        }
    }, [token, navigate]);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
        mode: "onChange",
    });

    const onSubmit = async (data: ResetFormValues) => {
        if (!token) return;

        setLoading(true);
        const { error } = await authClient.resetPassword({
            newPassword: data.password,
            token: token,
        });
        setLoading(false);

        if (error) {
            toast.error(error.message || "Invalid or expired token.");
            return;
        }

        setIsSuccess(true);
        toast.success("Password reset successfully!");

        setTimeout(() => {
            navigate("/login");
        }, 2000);
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1, ease: "easeOut" } },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-[420px] mx-auto flex flex-col gap-8 p-8 sm:p-10 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl relative"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col items-center text-center gap-4">


                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
                        {isSuccess ? "All Set!" : "New Password"}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1.5 font-mono px-2">
                        {isSuccess
                            ? "Your password has been reset successfully. Redirecting you to login..."
                            : "Please enter your new credentials to regain access."}
                    </p>
                </div>
            </motion.div>

            {!isSuccess && (
                <motion.form variants={itemVariants} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

                    {/* New Password Field */}
                    <div className="flex flex-col gap-1.5 w-full">
                        <label htmlFor="password" className="text-[10px] sm:text-xs font-mono text-gray-400 uppercase tracking-widest ml-1">
                            New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="password"
                                id="password"
                                required
                                placeholder="••••••••"
                                {...register("password")}
                                className={`w-full bg-white/5 border ${errors.password ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-white/30"} rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:bg-white/10 outline-none transition-all text-sm font-sans`}
                            />
                        </div>
                        <AnimatePresence>
                            {errors.password && (
                                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-400 text-xs ml-1 mt-0.5 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {errors.password.message}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="flex flex-col gap-1.5 w-full">
                        <label htmlFor="confirmPassword" className="text-[10px] sm:text-xs font-mono text-gray-400 uppercase tracking-widest ml-1">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="password"
                                id="confirmPassword"
                                required
                                placeholder="••••••••"
                                {...register("confirmPassword")}
                                className={`w-full bg-white/5 border ${errors.confirmPassword ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-white/30"} rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:bg-white/10 outline-none transition-all text-sm font-sans`}
                            />
                        </div>
                        <AnimatePresence>
                            {errors.confirmPassword && (
                                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-400 text-xs ml-1 mt-0.5 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {errors.confirmPassword.message}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !isValid}
                        className="w-full flex justify-center items-center font-mono gap-2 bg-white hover:bg-gray-200 text-black py-3.5 rounded-xl transition-all duration-200 font-bold text-sm active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                        {loading ? <Loader2 className="size-5 animate-spin" /> : "Reset Password"}
                    </button>
                </motion.form>
            )}
        </motion.div>
    );
};

export default ResetPassword;