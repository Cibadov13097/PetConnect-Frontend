import React, { createContext, useContext, useState } from "react";

const BasketContext = createContext<{ count: number; refresh: () => void }>({ count: 0, refresh: () => {} });

export const useBasket = () => useContext(BasketContext);

export const BasketProvider = ({ children }: { children: React.ReactNode }) => {
  const [count, setCount] = useState(() => {
    const basket = JSON.parse(sessionStorage.getItem("cart") || "[]");
    return basket.reduce((sum: number, item: any) => sum + (item.count || 1), 0);
  });

  const refresh = () => {
    const basket = JSON.parse(sessionStorage.getItem("cart") || "[]");
    setCount(basket.reduce((sum: number, item: any) => sum + (item.count || 1), 0));
  };

  return (
    <BasketContext.Provider value={{ count, refresh }}>
      {children}
    </BasketContext.Provider>
  );
};