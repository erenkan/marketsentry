import { ProductDetails, getProductDetailsByUser } from "../db";
import IProductDetails from "../models/ProductModel";

export async function getProductsToMonitor(chatId: number) {
  return await getProductDetailsByUser(chatId);
}

export const saveOrUpdateProductDetails = async (details: IProductDetails) => {
  const existingDetails = await ProductDetails.findOne({
    productName: details.productName,
    chatId: details.chatId,
  });

  if (existingDetails) {
    if (existingDetails.price !== details.price) {
      // Price has changed
      await ProductDetails.updateOne(
        { _id: existingDetails._id },
        { $set: { price: details.price, inStock: details.inStock } }
      );
      // Here, you could also implement sending a notification to the user about the price change
      return "priceUpdated"; // Indicate that the price was updated
    }

    if (existingDetails.inStock !== details.inStock) {
      // In stock status has changed
      await ProductDetails.updateOne(
        { _id: existingDetails._id },
        { $set: { inStock: details.inStock } }
      );
      // Here, you could also implement sending a notification to the user about the in stock status change
      return "inStockUpdated"; // Indicate that the in stock status was updated
    }

    return "noChange"; // Indicate no change in price
  } else {
    // No existing record, save a new one
    const productDetails = new ProductDetails(details);
    await productDetails.save();
    return "newRecord"; // Indicate a new record was created
  }
};
