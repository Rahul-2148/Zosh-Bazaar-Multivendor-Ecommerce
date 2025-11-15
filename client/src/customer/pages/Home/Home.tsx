import { Storefront } from "@mui/icons-material";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Deal from "./Deal/Deal";
import ElectronicCategory from "./ElectronicCategory";
import HomeGrid from "./Grid/Grid";
import HomeCategory from "./HomeCategory/HomeCategory";
import sellerBannerImage from "../../../assets/seller_banner_image.jpg";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      <ElectronicCategory />
      <section>
        <HomeGrid />
      </section>
      <section className="pt-7">
        <h1 className="text-3xl font-bold text-center pb-5">
          Deals of the Day
        </h1>
        <Deal />
      </section>
      <section className="pt-7">
        <h1 className="text-3xl font-bold text-center pb-5">
          Shop By Category
        </h1>
        <HomeCategory />
      </section>
      <section className="relative lg:px-20 h-[200px] lg:h-[450px] object-cover">
        <img src={sellerBannerImage} alt="become_seller banner" />
        <div className="absolute top-1/2 left-4 lg:left-[15rem] transform -translate-y-1/2 font-semibold lg:text-4xl space-y-3">
          <h1 className="">Sell Your Products</h1>
          <p className="text-lg md:text-2xl">
            With{" "}
            <strong className="logo text-3xl md:text-5xl pl-2">
              zosh bazaar
            </strong>
          </p>

          <div className="pt-6 justify-center">
            <Button
              onClick={() => navigate("/become-seller")}
              startIcon={<Storefront />}
              variant="contained"
            >
              Become Seller
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
