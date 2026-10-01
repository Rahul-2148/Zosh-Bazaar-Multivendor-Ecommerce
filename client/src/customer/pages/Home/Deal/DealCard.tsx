import { useNavigate } from "react-router-dom";

const DealCard = ({ deal }: { deal: any }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    if (deal.categoryId) {
      navigate(`/products/${deal.categoryId}`);
    } else if (deal.category?.categoryId) {
      navigate(`/products/${deal.category.categoryId}`);
    } else {
      navigate(`/products?minDiscount=${deal.discount || 20}`);
    }
  };

  const fallbackImages: Record<string, string> = {
    fashion: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&auto=format&fit=crop&q=80",
    electronics: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80",
    home_furniture: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=80",
    beauty: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=80",
    footwear: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80",
    grocery: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80",
  };
  const catKey = (deal.categoryId || deal.category?.categoryId || "").toLowerCase();
  const imageUrl =
    deal.image ||
    deal.category?.image ||
    fallbackImages[catKey] ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80";

  return (
    <div
      onClick={handleNavigate}
      className="group cursor-pointer rounded-xl overflow-hidden border border-border/80 bg-card shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
    >
      <div className="w-full h-[150px] sm:h-[180px] md:h-[200px] overflow-hidden bg-muted/60 relative flex items-center justify-center">
        <img
          className="w-full h-full object-cover object-top group-hover:scale-108 transition-transform duration-500"
          src={imageUrl}
          alt={deal.name || "Deal"}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground font-black text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full shadow-md tracking-tight">
          {deal.discount || "Up to 50"}% OFF
        </div>
      </div>

      <div className="p-3.5 text-center bg-card space-y-1 border-t border-border/40">
        <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
          {deal.name || deal.category?.name || "Special Deal"}
        </p>
        <p className="text-xs text-primary font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          Shop Now →
        </p>
      </div>
    </div>
  );
};

export default DealCard;
