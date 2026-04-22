import * as React from "react";

export function getStrictContext<T>(name?: string) {
  const Context = React.createContext<T | undefined>(undefined);

  const Provider = ({
    value,
    children,
  }: {
    value: T;
    children?: React.ReactNode;
  }) => <Context.Provider value={value}>{children}</Context.Provider>;

  const useSafeContext = () => {
    const context = React.useContext(Context);

    if (context === undefined) {
      throw new Error(`useContext must be used within ${name ?? "a Provider"}`);
    }

    return context;
  };

  return [Provider, useSafeContext] as const;
}
