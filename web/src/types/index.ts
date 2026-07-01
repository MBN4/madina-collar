export type ProductAttribute = {
  id: number;
  type: 'category' | 'color' | 'width' | 'size';
  value: string;
  hex_code?: string | null;
  in_stock: boolean;
};

export type PriceMatrix = {
  id: number;
  categoryId: number;
  colorId: number;
  widthId: number | null;
  sizeId: number;
  price: number;
};

export type Style = {
  id: number;
  name: string;
  qualityId: number;
  ProductAttributes: ProductAttribute[];
  PriceMatrices: PriceMatrix[];
};

export type Quality = {
  id: number;
  name: string;
  image_url: string;
  price: number;
  tag?: string;
  Styles: Style[];
};

export type OrderItem = {
  id: number;
  quality: string;
  style: string;
  category: string;
  color: string;
  width?: string | null;
  size: string;
  quantity: number;
  price_at_purchase: number;
};

export type Order = {
  id: number;
  total_amount: number;
  payment_method: string;
  bilti_info: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
};
