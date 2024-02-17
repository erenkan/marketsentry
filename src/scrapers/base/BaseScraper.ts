import IProductDetails from "../../models/ProductModel";

export interface BaseScraper {
  getProductDetailsByUrl(productUrl: string): Promise<IProductDetails>;
  close(): Promise<void>;
}
