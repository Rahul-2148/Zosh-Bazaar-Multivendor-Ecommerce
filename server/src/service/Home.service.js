import HomeCategorySection from "../domain/HomeCategorySection.js";
import DealService from "../service/deal.service.js";

class HomeService {
  async createHomePageData(allCategories) {
    const gridCategories = allCategories.filter(
      (category) => category.section === HomeCategorySection.GRID
    );

    const shopByCategories = allCategories.filter(
      (category) => category.section === HomeCategorySection.SHOP_BY_CATEGORIES
    );

    const electronicsCategories = allCategories.filter(
      (category) => category.section === HomeCategorySection.ELECTRONICS_CATEGORIES
    );

    const dealCategories = allCategories.filter(
      (category) => category.section === HomeCategorySection.DEALS
    );

    const deals = await DealService.getDeals();

    const home = {
      grid: gridCategories,
      shopByCategories: shopByCategories,
      electronicsCategories: electronicsCategories,
      deals: deals,
      dealCategories: dealCategories,
    };
    return home;
  }
}

export default new HomeService();
