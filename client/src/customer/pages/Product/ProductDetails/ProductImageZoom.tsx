import React, { useState, useRef, useCallback } from "react";
import {
  AddShoppingCart,
  FlashOn,
  ShareOutlined,
  ZoomIn,
  CheckCircle,
} from "@mui/icons-material";
import SaveButton from "../../Wishlist/components/SaveButton";

interface ProductImageZoomProps {
  images: string[];
  selectedImageIndex: number;
  onSelectImage: (index: number) => void;
  title: string;
  product: any;
  variantId?: string;
  onAddToCart: () => void;
  onBuyNow: () => void;
  isOutOfStock?: boolean;
  cartSuccess?: boolean;
}

export const ProductImageZoom: React.FC<ProductImageZoomProps> = ({
  images,
  selectedImageIndex,
  onSelectImage,
  title,
  product,
  variantId,
  onAddToCart,
  onBuyNow,
  isOutOfStock = false,
  cartSuccess = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [zoomBackgroundPos, setZoomBackgroundPos] = useState("0% 0%");
  const [copiedLink, setCopiedLink] = useState(false);

  const activeImage = images[selectedImageIndex] || images[0] || "";

  // Lens size in pixels
  const LENS_SIZE = 150;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      // Calculate cursor position relative to container
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      // Keep lens centered on cursor and clamped within image boundaries
      const halfLens = LENS_SIZE / 2;
      let x = cursorX - halfLens;
      let y = cursorY - halfLens;

      const maxX = rect.width - LENS_SIZE;
      const maxY = rect.height - LENS_SIZE;

      if (x < 0) x = 0;
      if (y < 0) y = 0;
      if (x > maxX) x = maxX;
      if (y > maxY) y = maxY;

      setLensPos({ x, y });

      // Calculate percentage for 2.5x high-res background zoom
      const percentX = maxX > 0 ? (x / maxX) * 100 : 0;
      const percentY = maxY > 0 ? (y / maxY) * 100 : 0;
      setZoomBackgroundPos(`${percentX.toFixed(2)}% ${percentY.toFixed(2)}%`);
    },
    [LENS_SIZE]
  );

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Gallery Main Container */}
      <div className="flex flex-col-reverse lg:flex-row gap-3 sm:gap-4 relative">
        {/* Left Thumbnails Strip (Desktop: Vertical, Mobile: Horizontal) */}
        {images.length > 1 && (
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto w-full lg:w-20 max-h-[500px] scrollbar-thin py-1 shrink-0">
            {images.map((img, idx) => {
              const isSelected = selectedImageIndex === idx;
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => onSelectImage(idx)}
                  onMouseEnter={() => onSelectImage(idx)}
                  className={`w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-xl overflow-hidden p-1 transition-all bg-card cursor-pointer shrink-0 border-2 ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/25 shadow-sm scale-102"
                      : "border-border/80 hover:border-primary/50 opacity-75 hover:opacity-100"
                  }`}
                  title={`View image ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`${title} thumbnail ${idx + 1}`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Main Stage Image with Interactive Lens Zoom */}
        <div className="relative flex-1 bg-card rounded-2xl sm:rounded-3xl border border-border/80 p-4 sm:p-6 flex items-center justify-center min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] shadow-xs select-none">
          {/* Wishlist Floating Button */}
          <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-background/80 dark:bg-card/80 backdrop-blur-md border border-border/70 flex items-center justify-center text-foreground hover:text-primary transition-all shadow-2xs hover:scale-105 cursor-pointer"
              title={copiedLink ? "Link Copied!" : "Share Product"}
            >
              {copiedLink ? (
                <CheckCircle sx={{ fontSize: 18 }} className="text-emerald-500" />
              ) : (
                <ShareOutlined sx={{ fontSize: 18 }} />
              )}
            </button>
            <SaveButton
              product={product}
              variantId={variantId}
              variant="icon"
              size="small"
            />
          </div>

          {/* Hover Zoom Prompt Badge */}
          <div className="hidden lg:flex items-center gap-1 absolute top-3.5 left-3.5 z-10 px-2.5 py-1 rounded-full bg-muted/60 dark:bg-surface/70 border border-border/60 text-[10px] font-bold text-muted-foreground uppercase tracking-wider backdrop-blur-xs pointer-events-none">
            <ZoomIn sx={{ fontSize: 14 }} className="text-primary" />
            <span>Hover to zoom</span>
          </div>

          {/* Image Stage Container with Mouse Tracking */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative w-full h-full max-h-[460px] flex items-center justify-center cursor-crosshair overflow-hidden"
          >
            <img
              src={activeImage}
              alt={title}
              className="max-h-[440px] w-auto max-w-full object-contain pointer-events-none transition-transform duration-200"
            />

            {/* Hover Magnifying Lens Box (Desktop only) */}
            {isHovering && (
              <div
                style={{
                  width: `${LENS_SIZE}px`,
                  height: `${LENS_SIZE}px`,
                  left: `${lensPos.x}px`,
                  top: `${lensPos.y}px`,
                }}
                className="hidden lg:block absolute pointer-events-none border-2 border-primary bg-primary/20 backdrop-blur-[1px] shadow-sm rounded-lg"
              />
            )}
          </div>

          {/* Floating High-Resolution Zoom Window (Appears to the right on hover) */}
          {isHovering && (
            <div
              style={{
                backgroundImage: `url(${activeImage})`,
                backgroundPosition: zoomBackgroundPos,
                backgroundRepeat: "no-repeat",
                backgroundSize: "260%",
              }}
              className="hidden lg:block absolute left-[calc(100%+16px)] top-0 w-[540px] h-[540px] bg-card border-2 border-primary/30 rounded-3xl shadow-2xl z-50 overflow-hidden pointer-events-none animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs uppercase tracking-wider">
                Ultra HD Zoom (2.6x)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Signature Action Buttons (Directly Under Main Image) */}
      <div className="flex items-center gap-3 pt-1">
        {/* ADD TO CART - Amber Yellow Button */}
        <button
          type="button"
          onClick={onAddToCart}
          disabled={isOutOfStock}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 px-4 rounded-xl text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-sm transition-all select-none cursor-pointer ${
            isOutOfStock
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-[#ff9f00] hover:bg-[#f39700] active:scale-[0.98] shadow-amber-500/25"
          }`}
        >
          <AddShoppingCart sx={{ fontSize: 20 }} />
          <span>{cartSuccess ? "✓ Added to Bag" : "Add to Cart"}</span>
        </button>

        {/* BUY NOW - Coral Orange Button */}
        <button
          type="button"
          onClick={onBuyNow}
          disabled={isOutOfStock}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 px-4 rounded-xl text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-sm transition-all select-none cursor-pointer ${
            isOutOfStock
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-[#fb641b] hover:bg-[#e85b17] active:scale-[0.98] shadow-orange-500/25"
          }`}
        >
          <FlashOn sx={{ fontSize: 20 }} />
          <span>Buy Now</span>
        </button>
      </div>
    </div>
  );
};

export default ProductImageZoom;
