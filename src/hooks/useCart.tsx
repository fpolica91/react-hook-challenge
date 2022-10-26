import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const itemInCart = cart.find((ci) => ci.id === productId);
      if (itemInCart) {
        const { amount: currentAmount } = itemInCart;
        const { data } = await api.get<Stock>(`/stock/${productId}`);
        if (!(data.amount > itemInCart.amount)) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }
        const updatedCart = cart.map((product) => {
          return product.id === productId
            ? { ...product, amount: currentAmount + 1 }
            : product;
        });
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
        return;
      }
      const { data } = await api.get<Product>(`products/${productId}`);
      const updatedCart = [...cart, { ...data, amount: 1 }];
      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productAlreadyExists = cart.find(
        (product) => product.id === productId
      );

      if (!productAlreadyExists) throw Error();
      const productsInCart = cart.filter((prod) => prod.id !== productId);

      setCart(productsInCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(productsInCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) return;
      const { data: stock } = await api.get<Stock>(`stock/${productId}`);
      const productIsAvailableInStock = stock.amount >= amount;
      if (!productIsAvailableInStock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      const doesProductExit = cart.find((product) => product.id === productId);
      if (!doesProductExit) throw Error();

      const updatedCart = cart.map((product) => {
        return product.id === productId ? { ...product, amount } : product;
      });

      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
