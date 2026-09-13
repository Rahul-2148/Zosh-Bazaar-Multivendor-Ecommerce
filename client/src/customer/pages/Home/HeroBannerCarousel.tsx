import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Button } from "@mui/material";
import { ArrowForward, LocalOffer } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface HeroBannerProps {
  banners: any[];
}

export const HeroBannerCarousel: React.FC<HeroBannerProps> = ({ banners }) => {
  const navigate = useNavigate();

  const settings = {
    dots: true,
    infinite: banners.length > 1,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: false,
    dotsClass: "slick-dots !bottom-3",
  };

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm mx-3 sm:mx-6 lg:mx-16 xl:mx-20 mt-4 hero-banner-slider">
      <Slider {...settings}>
        {banners.map((banner, index) => (
          <div key={banner._id || index} className="relative outline-none">
            <div className="relative h-[240px] sm:h-[340px] md:h-[400px] lg:h-[440px] w-full overflow-hidden bg-muted">
              <img
                src={banner.image}
                alt={banner.title || "Marketplace Promotion"}
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center p-6 sm:p-12 lg:p-16">
                <div className="text-white space-y-3 max-w-lg">
                  {banner.badge && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider shadow-md">
                      <LocalOffer sx={{ fontSize: 13 }} />
                      {banner.badge}
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                    {banner.title}
                  </h2>
                  {banner.subtitle && (
                    <p className="text-xs sm:text-sm md:text-base text-gray-200 line-clamp-2">
                      {banner.subtitle}
                    </p>
                  )}
                  <div className="pt-2 sm:pt-4">
                    <Button
                      variant="contained"
                      color="primary"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate(banner.link || "/products/all")}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: { xs: "12px", sm: "14px" },
                        px: { xs: 2.5, sm: 3.5 },
                        py: { xs: 1, sm: 1.2 },
                        borderRadius: "0.85rem",
                        boxShadow: "0 4px 16px rgba(13, 148, 136, 0.4)",
                      }}
                    >
                      {banner.ctaText || "Shop Now"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default HeroBannerCarousel;
