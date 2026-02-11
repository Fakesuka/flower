import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { http } from '@/lib/http';
import { useClientStore } from '@/store/clientStore';
import type { Product, Story } from '@/types/api';

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [error, setError] = useState('');
  const addToCart = useClientStore((s) => s.addToCart);

  useEffect(() => {
    Promise.all([http<Product[]>('/products'), http<Story[]>('/stories')])
      .then(([p, s]) => {
        setProducts(p);
        setStories(s);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Flower Shop PWA</h1>
        <div className="flex gap-3">
          <Link to="/checkout" className="underline">Checkout</Link>
          <Link to="/login" className="underline">Staff Login</Link>
        </div>
      </header>

      {error && <div className="p-3 rounded bg-red-50 text-red-600">{error}</div>}

      <section>
        <h2 className="font-medium mb-2">Stories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stories.map((story) => (
            <div key={story.id} className="border rounded p-2">
              <img src={story.image || '/icons/icon-192.svg'} alt={story.title} className="h-24 w-full object-cover rounded" />
              <p className="text-sm mt-2">{story.title}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-medium mb-2">Каталог</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {products.map((product) => (
            <div key={product.id} className="border rounded p-3">
              <img src={product.image || '/icons/icon-192.svg'} alt={product.name} className="h-32 w-full object-cover rounded" />
              <div className="mt-2 font-medium">{product.name}</div>
              <div className="text-sm text-gray-600">{product.price} ₽</div>
              <button className="mt-2 px-3 py-2 rounded bg-rose-500 text-white text-sm" onClick={() => addToCart(product)}>
                В корзину
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
