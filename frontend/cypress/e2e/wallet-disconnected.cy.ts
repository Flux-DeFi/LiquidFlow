describe("Wallet-Disconnected Read-Only State", () => {
  /** Important: these tests do NOT mock the wallet — the app loads without any
   *  wallet connection, simulating a first-time visitor or a user who hasn't
   *  installed the Freighter extension. */

  it("should render the landing page without errors when no wallet is connected", () => {
    cy.visit("/", { log: false });

    // Navbar with branding and Connect Wallet button
    cy.contains("FlowFi").should("be.visible");
    cy.contains("button", "Connect Wallet").should("be.visible");

    // Hero section
    cy.contains("Real-Time").should("be.visible");
    cy.contains("Money Streaming").should("be.visible");

    // CTA / navigation — "Launch App" link
    cy.contains("a", "Launch App").should("be.visible");

    // Features section
    cy.contains("Features").should("be.visible");

    // FAQ section
    cy.contains("FAQ").should("be.visible");

    // Footer
    cy.contains("LiquidFlow").should("be.visible");

    // Verify no console errors
    cy.window().then((win) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const logs = (win as any).__cypress_consoleErrors || [];
      expect(logs).to.have.length(0);
    });
  });

  it("should display the Connect Wallet prompt on the dashboard when not connected", () => {
    cy.visit("/dashboard");

    // The dashboard page explicitly checks status !== "connected" and shows
    // a "Connect Your Wallet" prompt
    cy.contains("h2", "Connect Your Wallet").should("be.visible");
    cy.contains(
      "You need to connect your Stellar wallet to access the LiquidFlow dashboard.",
    ).should("be.visible");
  });

  it("should display the Connect Wallet prompt on incoming streams when not connected", () => {
    cy.visit("/incoming");

    // The AppShell + wallet context should gate this page
    cy.contains("button", "Connect Wallet").should("be.visible");
  });

  it("should display the Connect Wallet prompt on create-stream when not connected", () => {
    cy.visit("/create-stream");

    // The create-stream form requires wallet — the wallet context should
    // gate it, or the form itself should be in a disabled state
    cy.contains("button", "Connect Wallet").should("be.visible");
  });

  it("should open the Connect Wallet modal when clicking Connect Wallet button", () => {
    cy.visit("/");

    cy.contains("button", "Connect Wallet").click();

    // The modal should be visible
    cy.get('[role="dialog"]').should("be.visible");
    cy.contains('[role="dialog"]', "Connect Wallet").should("be.visible");

    // Should list Freighter as a wallet option
    cy.contains('[role="dialog"] button', "Freighter").should("be.visible");

    // Close the modal
    cy.get("body").click(0, 0);
    cy.get('[role="dialog"]').should("not.exist");
  });

  it("should navigate to the landing page via Launch App without wallet", () => {
    cy.visit("/");

    cy.contains("a", "Launch App").click();

    // The Launch App link goes to /app — should either render the landing
    // page or redirect back since no wallet is connected
    cy.url().should("include", "/app");
    cy.contains("button", "Connect Wallet").should("be.visible");
  });
});