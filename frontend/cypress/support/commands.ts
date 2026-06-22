/* eslint-disable @typescript-eslint/no-namespace */
export {};

declare global {
  namespace Cypress {
    interface Chainable {
      mockFreighterWallet(): Chainable<void>;
      connectWalletViaUI(): Chainable<void>;
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
