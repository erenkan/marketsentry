import mongoose, { Schema, Document } from "mongoose";
import dotenv from "dotenv";
import IProductDetails from "../models/ProductModel";

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

const ProductDetailsSchema: Schema = new Schema({
  productName: { type: String, required: true },
  inStock: { type: Boolean, required: true },
  price: { type: Number, required: true },
  url: { type: String, required: true },
  chatId: { type: Number, required: true },
});

export const ProductDetails = mongoose.model<IProductDetails>(
  "ProductDetails",
  ProductDetailsSchema
);

export const saveProductDetails = async (details: IProductDetails) => {
  const productDetails = new ProductDetails(details);
  await productDetails.save();
};

export const getProductDetailsByUser = async (chatId: number) => {
  return ProductDetails.find({ chatId });
};

export const deleteProductFromMonitor = async (
  chatId: number,
  productUrl: string
) => {
  const result = await ProductDetails.deleteOne({ productUrl, chatId });
  return result;
};

export const deleteAllProductsForUser = async (chatId: number) => {
  const result = await ProductDetails.deleteMany({ chatId });
  return result;
};
