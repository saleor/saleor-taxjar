import React, { useEffect, PropsWithChildren } from "react";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@saleor/macaw-ui";

import "../styles/globals.css";
import AppBridgeProvider from "../providers/AppBridgeProvider";
import GraphQLProvider from "../providers/GraphQLProvider";
import Head from "next/head";

const SaleorApp = ({ Component, pageProps }: AppProps) => {
  useEffect(() => {
    const jssStyles = document.querySelector("#jss-server-side");
    if (jssStyles) {
      jssStyles?.parentElement?.removeChild(jssStyles);
    }
  }, []);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, user-scalable=no"
        />
      </Head>
      <AppBridgeProvider>
        <GraphQLProvider>
          {/* @ts-ignore React 17 <-> 18 type mismatch */}
          <ThemeProvider ssr={true}>
            <Component {...pageProps} />
          </ThemeProvider>
        </GraphQLProvider>
      </AppBridgeProvider>
    </>
  );
};

export default SaleorApp;
