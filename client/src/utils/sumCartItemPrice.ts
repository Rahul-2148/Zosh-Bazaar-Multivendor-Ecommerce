export const sumCartItemSellingPrice = (items: any[]) => {
    return items.reduce((total, item) => total + item.sellingPrice * item.quantity, 0);
}

export const sumCartItemMrpPrice = (items: any[]) => {
    return items.reduce((total, item) => total + item.mrpPrice * item.quantity, 0);
}