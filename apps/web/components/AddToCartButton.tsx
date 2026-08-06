'use client';

interface Props {
  product: { _id: string; name: string; sellingPrice: number; image?: string; stock: number };
}

export default function AddToCartButton({ product }: Props) {
  function addToCart() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex((i: any) => i._id === product._id);
    if (idx > -1) cart[idx].qty += 1;
    else cart.push({ _id: product._id, name: product.name, price: product.sellingPrice, image: product.image, qty: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
  }

  if (product.stock === 0) {
    return <button disabled className="w-full bg-gray-200 text-gray-400 py-3 rounded-xl font-medium cursor-not-allowed">Out of Stock</button>;
  }

  return (
    <button onClick={addToCart}
      className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
      Add to Cart
    </button>
  );
}
