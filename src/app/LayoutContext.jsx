import { createContext, useContext } from "react";

const LayoutContext = createContext({
  hideBottomNav: false,
  setHideBottomNav: () => {},
});

export function useLayout() {
  return useContext(LayoutContext);
}

export function LayoutProvider({ value, children }) {
  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}
