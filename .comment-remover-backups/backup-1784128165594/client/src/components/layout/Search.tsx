import React from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { SearchProps } from "../../types";


const Search: React.FC<SearchProps> = ({
  value,
  setSearch,
  placeholder = "Search...",
  className = "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleClear = () => {
    setSearch("");
  };

  return (
    <div className={clsx("relative group flex items-center w-full", className)}>
      <SearchIcon className="absolute left-4 size-4 text-gray-500 group-focus-within:text-white transition-colors duration-300 pointer-events-none z-10" />

      <label htmlFor="Search" className="sr-only">
        Search
      </label>

      <input
        type="text"
        id="Search"
        value={value} // 🚨 FIX: Input is now strictly controlled by the parent
        onChange={handleChange}
        placeholder={placeholder}
        className={clsx(
          "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-10 text-sm text-gray-200 placeholder-gray-500 outline-none font-sans shadow-sm",
          "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "focus:bg-white/10 focus:border-white/20 focus:ring-2 focus:ring-blue-500/40"
        )}
      />

      <AnimatePresence>
        {value && ( // 🚨 FIX: Now checks the parent's value to show/hide the X
          <motion.button
            initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 45 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={handleClear}
            className="absolute right-2 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Search;