import { Link } from "react-router-dom";
import { ThumbsUp, ThumbsDown, Globe2 } from "lucide-react";
import { DraftCardProps } from "../../types";

const DraftCard = ({ script }: DraftCardProps) => {

  const formatDate = (timestamp?: string | null) => {
    if (!timestamp) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(Number(timestamp)));
  };

  return (
    <div className="group relative bg-white/5 rounded-2xl p-4 border border-white/10 font-mono hover:border-white/20 transition-all duration-500 flex flex-col h-full overflow-hidden">
      <Link
        to={`/timeline/${script.id}`}
        className="flex flex-col h-full cursor-pointer outline-none space-y-5 relative z-10"
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-extrabold text-white font-sans line-clamp-1 transition-colors tracking-tight">
            {script.title}
          </h2>
          <div className="flex items-center gap-1.5 text-gray-400 text-xs uppercase tracking-widest font-bold">
            ~ PUBLISHED ON: {formatDate(script.createdAt)}
          </div>
        </div>

        <p className="text-gray-300 line-clamp-4 leading-relaxed flex-grow">
          {script.description || "No description provided for this manuscript."}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-4 text-gray-300 text-sm font-bold">
            <div className="flex items-center gap-2 hover:text-blue-400 transition-colors">
              <ThumbsUp size={18} />
              <span>{script.likes?.length || 0}</span>
            </div>
            <div className="flex items-center gap-2 hover:text-red-300 transition-colors">
              <ThumbsDown size={18} />
              <span>{script.dislikes?.length || 0}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {script.languages && script.languages.length > 0 && (
              <span className="flex items-center gap-1.5 text-gray-300 rounded-lg text-xs font-bold uppercase tracking-wider">
                <Globe2 className="w-3 h-3" />
                {script.languages[0]}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default DraftCard;