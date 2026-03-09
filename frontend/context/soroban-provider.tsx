"use client";

import React from "react";
import { SorobanReactProvider } from "@soroban-react/core";
import { testnet } from "@soroban-react/chains";
import { freighter } from "@soroban-react/freighter";

const chains = [testnet];
const connectors = [freighter()];

export function SorobanProvider({ children }: { children: React.ReactNode }) {
  return (
    <SorobanReactProvider
      chains={chains}
      connectors={connectors}
      appName="LiquidFlow"
    >
      {children}
    </SorobanReactProvider>
  );
}
