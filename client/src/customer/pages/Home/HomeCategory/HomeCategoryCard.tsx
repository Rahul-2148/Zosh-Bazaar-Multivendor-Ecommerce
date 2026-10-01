import { useNavigate } from "react-router-dom";
import { ArrowForward, LocalOfferOutlined } from "@mui/icons-material";

interface HomeCategoryCardProps {
  item: {
    name: string;
    categoryId: string;
    image: string;
    badge?: string;
    tagline?: string;
    offerText?: string;
  };
}

const HomeCategoryCard = ({ item }: HomeCategoryCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/products/${item.categoryId}`)}
      className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-xs hover:shadow-xl hover:border-primary/40 transition-all duration-300 cursor-pointer -translate-y-0 hover:-translate-y-1.5 w-full"
    >
      {/* 4:5 Aspect Ratio Curated Department Showcase Image */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted/60">
        <img
          src={item.image}
          alt={item.name || "Category Department"}
          className="h-full w-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Ambient Dark Scrim Gradient for Crisp Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent transition-opacity duration-300 group-hover:via-black/45" />

        {/* Top Floating Promotional Badge */}
        {item.badge && (
          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10">
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-background/95 dark:bg-card/90 text-foreground px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg backdrop-blur-md shadow-xs border border-border/50">
              <LocalOfferOutlined sx={{ fontSize: 12 }} className="text-primary" />
              {item.badge}
            </span>
          </div>
        )}

        {/* Bottom Content Area */}
        <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 text-white flex flex-col justify-end z-10">
          <h3 className="font-black text-sm sm:text-base tracking-tight text-white group-hover:text-primary transition-colors line-clamp-1 drop-shadow-sm">
            {item.name}
          </h3>

          {item.tagline && (
            <p className="text-[11px] sm:text-xs text-white/80 font-medium line-clamp-1 mt-0.5 drop-shadow-xs">
              {item.tagline}
            </p>
          )}

          {/* Action Row */}
          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/20">
            <span className="text-[11px] sm:text-xs font-extrabold text-white/95 group-hover:text-white flex items-center gap-1">
              Explore
              <ArrowForward
                sx={{ fontSize: 13 }}
                className="group-hover:translate-x-1 transition-transform duration-200"
              />
            </span>

            {item.offerText && (
              <span className="text-[10px] font-extrabold text-white/90 bg-white/20 hover:bg-white/25 px-2 py-0.5 rounded-full backdrop-blur-xs">
                {item.offerText}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeCategoryCard;