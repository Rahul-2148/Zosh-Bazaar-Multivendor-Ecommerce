import { useAppSelector } from "../../../Redux Toolkit/Store";
import ElectronicCategoryCard from "./ElectronicCategoryCard";

const ElectronicCategory = () => {
  const { homeCategory } = useAppSelector((store) => store);

  return (
    <div className="flex flex-wrap justify-between py-5 lg:px-20 border-b border-gray-300">
      {homeCategory.homeCategories?.electronicsCategories?.slice(0, 10).map((item: any) => (
        <ElectronicCategoryCard key={item.categoryId} item={item} />
      ))}
    </div>
  );
};

export default ElectronicCategory;

// const electronics = [
//   {
//     section: "ELECTRONICS_CATEGORIES",
//     name: "Laptops",
//     image:
//       "https://rukminim2.flixcart.com/image/832/832/xif0q/computer/7/8/4/-original-imahayjpdhdyghzh.jpeg?q=70&crop=false",
//     categoryId: "laptops",
//   },
//   {
//     section: "ELECTRONICS_CATEGORIES",
//     name: "Mobiles",
//     image:
//       "https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/x/v/y/-original-imah4jz66dmcwhmd.jpeg?q=70&crop=false",
//     categoryId: "mobiles",
//   },
//   {
//     section: "ELECTRONICS_CATEGORIES",
//     name: "smartwatch",
//     image:
//       "https://rukminim2.flixcart.com/image/832/832/xif0q/smartwatch/k/p/t/-original-imah4jnd4hhwrsph.jpeg?q=70&crop=false",
//     categoryId: "smartwatch",
//   },
//   {
//     section: "ELECTRONICS_CATEGORIES",
//     name: "Headphones",
//     image:
//       "https://rukminim2.flixcart.com/image/832/832/xif0q/headphone/m/c/v/wh-ult900n-sony-original-imahf82ahfgazhbz.jpeg?q=70&crop=false",
//     categoryId: "headphones_headsets",
//   },
//   {
//     section: "ELECTRONICS_CATEGORIES",
//     name: "Speakers",
//     image:
//       "https://rukminim2.flixcart.com/image/832/832/xif0q/speaker/mobile-tablet-speaker/c/b/w/zeb-county-pro-11-zeb-pspk55-zebronics-original-imahem34ffxgzdhk.jpeg?q=70&crop=false",
//     categoryId: "speakers",
//   },
//   {
//     section: "ELECTRONICS_CATEGORIES",
//     name: "TV",
//     image:
//       "https://rukminim2.flixcart.com/image/832/832/xif0q/television/n/j/0/-original-imahcsfhhbnpzt5z.jpeg?q=70&crop=false",
//     categoryId: "television",
//   },
//   {
//     section: "ELECTRONICS_CATEGORIES",
//     name: "Cameras",
//     image:
//       "https://rukminim2.flixcart.com/image/832/832/k3q76a80/camera/m/c/4/sony-apsc-ilce-6100-b-in5-mirrorless-original-imafm6nu2zq8xstc.jpeg?q=70&crop=false",
//     categoryId: "cameras",
//   },
// ];
