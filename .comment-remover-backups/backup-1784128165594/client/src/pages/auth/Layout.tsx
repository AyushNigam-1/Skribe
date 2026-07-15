import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

const AuthLayout = () => {
  return (
    <div className="h-dvh w-full flex items-center justify-center bg-primary font-sans text-gray-200 selection:bg-white/20 overflow-hidden relative px-6 py-12 sm:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-30"
      >
        <Outlet />
      </motion.div>
    </div>
  );
};

export default AuthLayout;