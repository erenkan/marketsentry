import mongoose, { Schema, Document } from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables
const mongoDBUri = process.env.MONGODB_URI; // Accessing the MongoDB URI from .env variables
if (!mongoDBUri) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env"
  );
}
// Initialize MongoDB connection
mongoose
  .connect(mongoDBUri, {})
  .then(() => console.log("MongoDB connected successfully."))
  .catch((error) => console.error("MongoDB connection error:", error));

interface IProductDetails extends Document {
  productName: string;
  inStock: boolean;
  price: number;
  oldPrice?: number;
  url: string;
  chatId: number;
}

const ProductDetailsSchema: Schema = new Schema({
  productName: { type: String, required: true },
  inStock: { type: Boolean, required: true },
  price: { type: Number, required: true },
  oldPrice: { type: Number },
  url: { type: String, required: true },
  chatId: { type: Number, required: true },
});

const ProductDetails = mongoose.model<IProductDetails>(
  "ProductDetails",
  ProductDetailsSchema
);

export const saveProductDetails = async (details: IProductDetails) => {
  const productDetails = new ProductDetails(details);
  await productDetails.save();
};

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

export const getProductDetailsByUser = async (chatId: number) => {
  return ProductDetails.find({ chatId });
};

export const deleteProductFromMonitor = async (
  productName: string,
  chatId: string
) => {
  const result = await ProductDetails.deleteOne({ productName, chatId });
  return result;
};

export const deleteAllProductsForUser = async (chatId: number) => {
  const result = await ProductDetails.deleteMany({ chatId });
  return result;
};
