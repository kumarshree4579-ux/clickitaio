'use client';
import Link from 'next/link';

interface Props {
  product: {
    _id: string;
    name: string;
    slug: string;
    mrp: number;
    sellingPrice: number;
    images: { url: string; alt?: string }[];
    isFeatured?: boolean;
    isNewArrival?: boolean;
    stock?: number;
  };
}

export default function ProductCard({ product }: Props) {
  const discount = product.mrp > product.sellingPrice
    ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
    : 0;

  function addToCart() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex((i: any) => i._id === product._id);
    if (idx > -1) cart[idx].qty += 1;
    else cart.push({ _id: product._id, name: product.name, price: product.sellingPrice, image: product.images[0]?.url, qty: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
  }

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      <Link href={`/products/${product._id}`}>
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {product.images[0] ? (
            <img src={product.images[0].url} alt={product.images[0].alt || product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">📦</div>
          )}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{discount}% off</span>
          )}
          {product.isNewArrival && (
            <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">New</span>
          )}
        </div>
      </Link>
      <div className="p-3">
        <Link href={`/products/${product._id}`}>
          <p className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-blue-600">{product.name}</p>
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-bold text-gray-900">₹{product.sellingPrice}</span>
          {discount > 0 && <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>}
        </div>
        {product.stock === 0 ? (
          <p className="text-xs text-red-500 mt-2">Out of stock</p>
        ) : (
          <button onClick={addToCart}
            className="mt-2 w-full bg-blue-600 text-white text-xs py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
