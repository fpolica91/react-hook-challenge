import React, { useState, useEffect, useMemo } from "react";
import { MdAddShoppingCart } from "react-icons/md";

import { ProductList } from "./styles";
import { api } from "../../services/api";
import { formatPrice } from "../../util/format";
import { useCart } from "../../hooks/useCart";

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface ProductFormatted extends Product {
  priceFormatted: string;
}

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {
  const [products, setProducts] = useState<ProductFormatted[]>([]);
  const { addProduct, cart } = useCart();

  const cartItemsAmount = useMemo(() => {
    return cart.reduce((sumAmount, product) => {
      sumAmount[product.id] = product.amount;
      return sumAmount;
    }, {} as CartItemsAmount);
  }, [cart]);

  const productsFormatted = useMemo(() => {
    return products.map((p) => ({
      ...p,
      priceFormatted: formatPrice(p.price),
    }));
  }, [products]);

  useEffect(() => {
    async function loadProducts() {
      const response = await api.get("/products");
      const { data } = response;
      setProducts(data);
    }

    loadProducts();
  }, []);

  function handleAddProduct(id: number) {
    addProduct(id);
  }

  return (
    <ProductList>
      {productsFormatted.map((p) => {
        return (
          <li key={p.id}>
            <img src={p.image} alt={p.title} />
            <strong>{p.title}</strong>
            <span>{p.priceFormatted}</span>
            <button
              type="button"
              data-testid="add-product-button"
              onClick={() => handleAddProduct(p.id)}
            >
              <div data-testid="cart-product-quantity">
                <MdAddShoppingCart size={16} color="#FFF" />
                {cartItemsAmount[p.id] || 0}
              </div>

              <span>ADICIONAR AO CARRINHO</span>
            </button>
          </li>
        );
      })}
    </ProductList>
  );
};

export default Home;
