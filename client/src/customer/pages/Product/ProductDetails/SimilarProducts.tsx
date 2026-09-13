import ProductCard from "../ProductCard";

const product = {
  images: [
    "https://www.tankori.in/cdn/shop/files/IMG_3285.jpg?v=1712813962&width=1200",
    "https://www.tankori.in/cdn/shop/files/IMG_3286.jpg?v=1712813963&width=1200",
    "https://www.tankori.in/cdn/shop/files/IMG_3281.jpg?v=1715155472&width=1200",
    "https://www.tankori.in/cdn/shop/files/IMG_3279.jpg?v=1715155472&width=1200",
    "https://www.tankori.in/cdn/shop/files/IMG_3270.jpg?v=1715155472&width=1200",
    "https://www.tankori.in/cdn/shop/files/IMG_3273.jpg?v=1715155472&width=1200",
    "https://www.tankori.in/cdn/shop/files/IMG_3275.jpg?v=1715155472&width=1200",
    "https://www.tankori.in/cdn/shop/files/IMG_3277.jpg?v=1715155472&width=1200",
  ],
  seller: {
    businessName: "Pablo Clothing",
  },
};

const SimilarProducts = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
      {Array.from({ length: 6 }).map((item, index) => (
        <ProductCard key={index} item={product} />
      ))}
    </div>
  );
};

export default SimilarProducts;
