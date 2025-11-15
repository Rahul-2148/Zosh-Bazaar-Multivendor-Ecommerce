export const calculateDiscountPercentage = (mrpPrice, sellingPrice) => {
  if (mrpPrice <= 0) {
    return 0;
    // throw new Error("MRP price should be greater than 0");
  }

  if (sellingPrice <= 0) {
    throw new Error("Selling price should be greater than 0");
  }

  const discount = mrpPrice - sellingPrice;

  return Math.round((discount / mrpPrice) * 100);
};