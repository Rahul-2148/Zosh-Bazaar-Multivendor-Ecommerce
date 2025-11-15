const HomeCategoryCard = ({ item }: { item: any }) => {

  return (
    <div className="flex flex-col gap-3 items-center justify-center group cursor-pointer">
      <div className="custom-border w-[140px] h-[140px] md:w-[180px] md:h-[180px] lg:w-[200px] lg:h-[200px] rounded-full bg-teal-400 overflow-hidden">
        <img
          className="group-hover:scale-95 transition-transform duration-700 object-cover object-top h-full w-full rounded-full"
          src={item.image}
          alt="category"
        />
      </div>
      <h1 className="font-medium text-center">{item.name}</h1>
    </div>
  );
};

export default HomeCategoryCard;


// https://apisap.fabindia.com/medias/10551904-01.jpg?context=bWFzdGVyfGltYWdlc3wxMDIwOTh8aW1hZ2UvanBlZ3xhRGcyTDJneFlpODJOVFF5TnpReU1UWTVNVGt6TkM4eE1EVTFNVGt3TkY4d01TNXFjR2N8MWU1ZTJlYzEwMDFhN2U3ODhiOTM1MWRiZjhiMzNlZDM5OTdiYWJiNzIzNjVhMjQ1NDVjNmZlOWY2NWJiYTRkMw