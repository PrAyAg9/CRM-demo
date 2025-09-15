describe("Campaign Management", () => {
  beforeEach(() => {
    cy.visit("/campaigns");
  });

  it("should display campaigns page", () => {
    cy.contains("Campaigns").should("be.visible");
  });

  it("should allow creating a new campaign through wizard", () => {
    cy.get("[data-cy=create-campaign-btn]").click();

    // Step 1: Select template
    cy.get("[data-cy=template-card]").first().click();

    // Step 2: Configure content
    cy.get("[data-cy=campaign-name-input]").type("Test Campaign");
    cy.get("[data-cy=campaign-content-textarea]")
      .clear()
      .type("Hello {{firstName}}, welcome to our store!");
    cy.get("[data-cy=next-btn]").click();

    // Step 3: Select audience
    cy.get("[data-cy=audience-all]").click();
    cy.get("[data-cy=next-btn]").click();

    // Step 4: Schedule
    cy.get("[data-cy=schedule-immediate]").click();
    cy.get("[data-cy=next-btn]").click();

    // Step 5: Review and create
    cy.contains("Test Campaign").should("be.visible");
    cy.get("[data-cy=create-campaign-btn]").click();

    cy.contains("Campaign created successfully").should("be.visible");
  });

  it("should allow using AI segment builder", () => {
    cy.visit("/segments");

    cy.get("[data-cy=ai-segment-tab]").click();

    cy.get("[data-cy=natural-language-input]").type(
      "customers who spent more than $500 last month"
    );
    cy.get("[data-cy=generate-segments-btn]").click();

    cy.contains("AI Segment Suggestions").should("be.visible");
    cy.get("[data-cy=segment-suggestion]")
      .first()
      .within(() => {
        cy.get("[data-cy=create-segment-btn]").click();
      });

    cy.contains("Segment created successfully").should("be.visible");
  });

  it("should show campaign analytics", () => {
    // Assuming there's at least one campaign
    cy.get("[data-cy=campaign-row]")
      .first()
      .within(() => {
        cy.get("[data-cy=analytics-btn]").click();
      });

    cy.contains("Campaign Analytics").should("be.visible");
    cy.contains("Open Rate").should("be.visible");
    cy.contains("Click Rate").should("be.visible");
  });
});
