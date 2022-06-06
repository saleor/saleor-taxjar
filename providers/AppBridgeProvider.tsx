import { App, createApp } from "@saleor/app-bridge";
import { createContext, useMemo, PropsWithChildren, useState, useEffect } from "react";

interface IAppContext {
  app?: App;
  isAuthorized: boolean,
}

const app = typeof window !== "undefined" ? createApp():undefined; 


export const AppContext = createContext<IAppContext>({ app: undefined , isAuthorized: false,});

const AppBridgeProvider: React.FC<PropsWithChildren<{}>> = (props) => {
  const [isAuthorized, setIsAuthorized] = useState(!!app?.getState()?.token);
  useEffect(() => {
    if (app) {
      const unsubscribe = app.subscribe("handshake", (payload) => {
        setIsAuthorized(!!payload.token);
      });

      return () => {
        unsubscribe();
      };
    }
  }, []);
  return <AppContext.Provider value={{ app, isAuthorized }} {...props} />;
};

export default AppBridgeProvider;
