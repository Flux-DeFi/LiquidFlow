describe("Stream Creation Flow", () => {
  beforeEach(() => {
    cy.mockFreighterWallet();
  });

  it("should connect wallet and navigate to dashboard", () => {
    cy.visit("/");

    cy.contains("button", "Connect Wallet").should("be.visible").click();

    cy.get('[role="dialog"]').should("be.visible");
    cy.contains('[role="dialog"]', "Connect Wallet").should("be.visible");

    cy.contains('[role="dialog"] button', "Freighter").click();

    cy.get('[role="dialog"]', { timeout: 5000 }).should("not.exist");

    cy.visit("/dashboard");

    cy.contains("Dashboard").should("be.visible");
  });

  it("should navigate to create stream form", () => {
    cy.connectWalletViaUI();

    cy.visit("/create-stream");

    cy.get('[data-testid="create-stream-form"]').should("be.visible");

    cy.contains("h1", "Create Payment Stream").should("be.visible");
  });

  it("should display validation errors for empty form submission", () => {
    cy.connectWalletViaUI();

    cy.visit("/create-stream");

    cy.get('[data-testid="create-stream-form"]').should("be.visible");

    cy.get('[data-testid="btn-create-stream"]').click();

    cy.contains("Recipient address is required.").should("be.visible");
    cy.contains("Enter a valid positive amount.").should("be.visible");
    cy.contains("Enter a valid duration in seconds.").should("be.visible");
  });

  it("should display validation error for invalid recipient address", () => {
    cy.connectWalletViaUI();

    cy.visit("/create-stream");

    cy.get('[data-testid="input-recipient"]').type("invalid-address");
    cy.get('[data-testid="input-amount"]').type("100");
    cy.get('[data-testid="input-duration"]').type("3600");

    cy.get('[data-testid="btn-create-stream"]').click();

    cy.contains("Enter a valid Stellar public key").should("be.visible");
  });

  it("should successfully create a stream with valid form data", () => {
    cy.connectWalletViaUI();

    cy.visit("/create-stream");

    cy.get('[data-testid="create-stream-form"]').should("be.visible");

    cy.get('[data-testid="input-recipient"]')
      .type("GCVZBQ3ICVWI6HOPWNMCA4VOEVSLQWIKO7JIDNW3G766UICHZRN4XGJU");

    cy.get('[data-testid="select-token"]').select("USDC");

    cy.get('[data-testid="input-amount"]').type("500");

    cy.get('[data-testid="input-duration"]').type("86400");

    cy.get('[data-testid="btn-create-stream"]').should("be.enabled").click();

    cy.get('[data-testid="stream-success"]', { timeout: 10000 }).should(
      "be.visible",
    );

    cy.contains("Stream created successfully").should("be.visible");

    cy.get('[data-testid="stream-success"]').within(() => {
      cy.contains("ID:").should("be.visible");
    });
  });

  it("should select different tokens from the dropdown", () => {
    cy.connectWalletViaUI();

    cy.visit("/create-stream");

    cy.get('[data-testid="select-token"]').should("have.value", "");

    cy.get('[data-testid="select-token"] option').should("have.length", 3);

    cy.get('[data-testid="select-token"]').select("USDC");
    cy.get('[data-testid="select-token"]').should("contain", "USDC");

    cy.get('[data-testid="select-token"]').select("EURC");
    cy.get('[data-testid="select-token"]').should("contain", "EURC");

    cy.get('[data-testid="select-token"]').select("XLM");
    cy.get('[data-testid="select-token"]').should("contain", "XLM");
  });

  it("should complete the full critical path: connect wallet and create a stream", () => {
    cy.visit("/");

    cy.contains("button", "Connect Wallet").should("be.visible").click();

    cy.get('[role="dialog"]').should("be.visible");
    cy.contains('[role="dialog"] button', "Freighter").click();

    cy.get('[role="dialog"]', { timeout: 5000 }).should("not.exist");

    cy.visit("/create-stream");

    cy.get('[data-testid="create-stream-form"]').should("be.visible");

    cy.get('[data-testid="input-recipient"]')
      .type("GCVZBQ3ICVWI6HOPWNMCA4VOEVSLQWIKO7JIDNW3G766UICHZRN4XGJU");

    cy.get('[data-testid="select-token"]').select("USDC");

    cy.get('[data-testid="input-amount"]').type("1000");

    cy.get('[data-testid="input-duration"]').type("31536000");

    cy.get('[data-testid="btn-create-stream"]').click();

    cy.get('[data-testid="stream-success"]', { timeout: 10000 }).should(
      "be.visible",
    );

    cy.contains("Stream created successfully").should("be.visible");
    cy.contains("ID:").should("be.visible");
  });
});
