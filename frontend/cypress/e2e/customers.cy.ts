describe("Customer Management", () => {
  beforeEach(() => {
    // Mock authentication or use test account
    cy.visit("/login");

    // Add commands to login or mock auth state
    // For now, assume we're logged in and go to customers page
    cy.visit("/customers");
  });

  it("should display customers page", () => {
    cy.contains("Customers").should("be.visible");
  });

  it("should allow creating a new customer", () => {
    cy.get("[data-cy=add-customer-btn]").click();

    cy.get("[data-cy=first-name-input]").type("John");
    cy.get("[data-cy=last-name-input]").type("Doe");
    cy.get("[data-cy=email-input]").type("john.doe@example.com");
    cy.get("[data-cy=phone-input]").type("+1234567890");

    cy.get("[data-cy=save-customer-btn]").click();

    cy.contains("John Doe").should("be.visible");
  });

  it("should allow editing a customer", () => {
    // Assuming there's at least one customer
    cy.get("[data-cy=customer-row]")
      .first()
      .within(() => {
        cy.get("[data-cy=edit-btn]").click();
      });

    cy.get("[data-cy=first-name-input]").clear().type("Jane");
    cy.get("[data-cy=save-customer-btn]").click();

    cy.contains("Jane").should("be.visible");
  });

  it("should allow filtering customers", () => {
    cy.get("[data-cy=search-input]").type("john");

    // Should show only customers matching "john"
    cy.get("[data-cy=customer-row]").should("contain", "john");
  });
});
