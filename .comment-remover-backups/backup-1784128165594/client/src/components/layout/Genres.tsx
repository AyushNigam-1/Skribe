import { Tag, XCircle } from "lucide-react";
import { GenresProps } from "../../types";

const Genres = ({ selectedGenres, onGenreChange }: GenresProps) => {
  const genres = [
    { name: "Fantasy" },
    { name: "Science Fiction" },
    { name: "Mystery" },
    { name: "Thriller" },
    { name: "Romance" },
    { name: "Horror" },
    { name: "Non-fiction" },
    { name: "Biography" },
    { name: "Self-help" },
  ];

  const handleSelection = (genreName: string) => {
    const updatedGenres = selectedGenres.includes(genreName)
      ? selectedGenres.filter((g) => g !== genreName)
      : [...selectedGenres, genreName];

    onGenreChange(updatedGenres);
  };

  return (
    <div className="w-full relative">
      <div className="flex overflow-x-auto gap-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:justify-center">
        {genres.map((genre) => {
          const isSelected = selectedGenres.includes(genre.name);

          return (
            <button
              key={genre.name}
              onClick={() => handleSelection(genre.name)}
              className={`
                group shrink-0 snap-start flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-semibold transition-all duration-300 active:scale-95 backdrop-blur-md
                ${isSelected
                  ? "bg-white/10 border border-white/30 text-gray-100 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20"
                }
              `}
            >
              {isSelected ? (
                <XCircle className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:rotate-90 text-white" />
              ) : (
                <Tag className="w-4 h-4 shrink-0 text-gray-500 group-hover:text-white transition-colors" />
              )}
              <span className="whitespace-nowrap tracking-tight">
                {genre.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Genres;