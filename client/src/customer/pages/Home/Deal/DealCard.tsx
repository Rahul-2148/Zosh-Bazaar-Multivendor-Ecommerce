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

  return (
    <div
      onClick={handleNavigate}
      className="group cursor-pointer rounded-xl overflow-hidden border border-border/80 bg-card shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
    >
      <div className="w-full h-[180px] sm:h-[210px] overflow-hidden bg-muted/60 relative">
        <img
          className="w-full h-full object-cover object-top group-hover:scale-108 transition-transform duration-500"
          src={deal.image || deal.category?.image}
          alt={deal.name || "Deal"}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute top-2.5 left-2.5 bg-destructive text-destructive-foreground font-black text-xs px-2.5 py-0.5 rounded-full shadow-md tracking-tight">
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
