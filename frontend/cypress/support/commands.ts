/* eslint-disable @typescript-eslint/no-namespace */
export {};

declare global {
  namespace Cypress {
    interface Chainable {
      mockFreighterWallet(): Chainable<void>;
      connectWalletViaUI(): Chainable<void>;
      setMockWalletSession(): Chainable<void>;
    }
  }
}

const MOCK_PUBLIC_KEY =
  "GCFLOWFIFREIGHTERMOCKPUBKEY9Q6YB6PW46O67Q3N";

Cypress.Commands.add("mockFreighterWallet", () => {
  cy.window().then((win) => {
    if (!win.freighterApi) {
      Object.defineProperty(win, "freighterApi", {
        value: {
          getPublicKey: cy.stub().resolves(MOCK_PUBLIC_KEY),
          setAllowed: cy.stub().resolves(),
          isConnected: cy.stub().resolves(true),
          getNetwork: cy.stub().resolves("TESTNET"),
          getNetworkDetails: cy.stub().resolves({
            network: "TESTNET",
            networkPassphrase: "Test SDF Network ; September 2015",
          }),
          signTransaction: cy.stub().resolves("mock_signed_xdr"),
        },
        writable: true,
        configurable: true,
      });
    }
  });
});

Cypress.Commands.add("connectWalletViaUI", () => {
  cy.mockFreighterWallet();

  cy.contains("button", "Connect Wallet").click();

  cy.get('[role="dialog"]').should("be.visible");

  cy.contains('[role="dialog"] button', "Freighter").click();

  cy.get('[role="dialog"]').should("not.exist");
});

Cypress.Commands.add("setMockWalletSession", () => {
  const session = {
    walletId: "freighter",
    walletName: "Freighter",
    publicKey: MOCK_PUBLIC_KEY,
    connectedAt: new Date().toISOString(),
    network: "Stellar Testnet",
    mocked: true,
  };

  cy.window().then((win) => {
    win.localStorage.setItem(
      "flowfi.wallet.session.v1",
      JSON.stringify(session),
    );
  });
});
