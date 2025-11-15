import DealCard from "./DealCard";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Deal = () => {
  const settings = {
    dots: false,
    infinite: true,
    slidesToShow: 6,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 0, // no pause
    speed: 3000, // smooth long scroll
    cssEase: "linear", // continuous flow
    arrows: false,
    pauseOnHover: true,
  };

  return (
    <div className="py-5 lg:px-20">
      <div className="slide-container">
        <Slider {...settings}>
          {[...Array(12)].map((_, index) => (
            <div key={index} className="px-2">
              <DealCard
                deal={{
                  image:
                    "https://m.media-amazon.com/images/I/71-uT-Mj0aL._SX679_.jpg",
                  discount: "10",
                }}
              />
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default Deal;
