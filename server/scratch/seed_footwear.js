import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const seedShoes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const { Product } = await import("../src/models/product.model.js");
    const { Seller } = await import("../src/models/seller.model.js");
    const existingSeller = await Seller.findOne();
    const sellerId = existingSeller ? existingSeller._id : new mongoose.Types.ObjectId();

    const sampleProducts = [
      {
        title: "Puma Flyer Runner Engineered Mesh Shoes",
        slug: "puma-flyer-runner-engineered-mesh-shoes",
        brand: "Puma",
        category: new mongoose.Types.ObjectId("6a9855cb0a4480d78246e8d7"),
        description: "Lightweight and breathable running shoes designed for ultimate everyday comfort and high-traction performance.",
        highlights: ["SoftFoam+ sockliner for step-in comfort", "EVA midsole provides lightweight cushioning", "Rubber outsole for durability"],
        sellingPrice: 2299,
        mrpPrice: 4999,
        discountPercent: 54,
        countInStock: 25,
        inStock: true,
        images: [
          "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80"
        ],
        ratings: { average: 4.3, count: 128 },
        status: "PUBLISHED",
        tags: ["shoes", "running", "sneakers", "footwear", "puma", "juta"]
      },
      {
        title: "Adidas Ultraboost Light Running Shoes",
        slug: "adidas-ultraboost-light-running-shoes",
        brand: "Adidas",
        category: new mongoose.Types.ObjectId("6a9855cb0a4480d78246e8d7"),
        description: "Experience epic energy return with the lightest Ultraboost ever made. Features Linear Energy Push and Continental Rubber outsole.",
        highlights: ["Light BOOST midsole", "PRIMEKNIT+ textile upper", "Continental Better Rubber"],
        sellingPrice: 7999,
        mrpPrice: 15999,
        discountPercent: 50,
        countInStock: 18,
        inStock: true,
        images: [
          "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&auto=format&fit=crop&q=80"
        ],
        ratings: { average: 4.7, count: 340 },
        status: "PUBLISHED",
        tags: ["shoes", "sneakers", "running", "footwear", "adidas", "juta"]
      },
      {
        title: "Campus Men's Rodeo Pro Walking Shoes",
        slug: "campus-mens-rodeo-pro-walking-shoes",
        brand: "Campus",
        category: new mongoose.Types.ObjectId("6a9855cb0a4480d78246e8d7"),
        description: "Breathable knitted mesh walking shoes built for Indian terrain with responsive pillowed sole.",
        highlights: ["Springy tech sole", "Air-mesh upper", "Anti-skid grip"],
        sellingPrice: 1099,
        mrpPrice: 1899,
        discountPercent: 42,
        countInStock: 45,
        inStock: true,
        images: [
          "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=80"
        ],
        ratings: { average: 4.2, count: 850 },
        status: "PUBLISHED",
        tags: ["shoes", "walking", "casual", "footwear", "campus", "juta"]
      },
      {
        title: "Sparx Men's SX0679G Casual Canvas Sneakers",
        slug: "sparx-mens-sx0679g-casual-canvas-sneakers",
        brand: "Sparx",
        category: new mongoose.Types.ObjectId("6a9855cb0a4480d78246e8d7"),
        description: "Rugged yet trendy canvas sneakers perfect for college, casual outings, and relaxed weekend styles.",
        highlights: ["High-density canvas", "Comfort cushion insole", "Vulcanized sole"],
        sellingPrice: 849,
        mrpPrice: 1299,
        discountPercent: 35,
        countInStock: 60,
        inStock: true,
        images: [
          "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80"
        ],
        ratings: { average: 4.1, count: 620 },
        status: "PUBLISHED",
        tags: ["shoes", "sneakers", "casual", "footwear", "sparx", "juta"]
      },
      {
        title: "Bata Formal Derby Dress Shoes for Men",
        slug: "bata-formal-derby-dress-shoes-for-men",
        brand: "Bata",
        category: new mongoose.Types.ObjectId("6a9855cb0a4480d78246e8d7"),
        description: "Timeless polished synthetic leather formal Derby shoes with arch support for executive office wear.",
        highlights: ["Gloss finish", "Ergonomic arch support", "Long-lasting PU sole"],
        sellingPrice: 1499,
        mrpPrice: 2499,
        discountPercent: 40,
        countInStock: 20,
        inStock: true,
        images: [
          "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&auto=format&fit=crop&q=80"
        ],
        ratings: { average: 4.4, count: 210 },
        status: "PUBLISHED",
        tags: ["shoes", "formal", "dress shoes", "footwear", "bata", "juta"]
      }
    ];

    for (const p of sampleProducts) {
      const exists = await Product.findOne({ slug: p.slug });
      if (!exists) {
        await Product.create({ ...p, seller: sellerId });
        console.log("Created product:", p.title);
      } else {
        console.log("Product already exists:", p.title);
      }
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedShoes();
