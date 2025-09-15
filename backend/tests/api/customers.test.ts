import request from "supertest";
import { describe, test, expect, beforeEach } from "@jest/globals";
const app: any = require("../../app");
import Customer from "../../models/Customer";

describe("Customer API", () => {
  describe("POST /api/customers", () => {
    it("should create a new customer", async () => {
      const customerData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        location: {
          street: "123 Main St",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "USA",
        },
      };

      const response = await request(app)
        .post("/api/customers")
        .send(customerData)
        .expect(201);

      expect(response.body).toHaveProperty("_id");
      expect(response.body.firstName).toBe(customerData.firstName);
      expect(response.body.email).toBe(customerData.email);
    });

    it("should return 400 for invalid email", async () => {
      const customerData = {
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email",
        phone: "+1234567890",
      };

      await request(app).post("/api/customers").send(customerData).expect(400);
    });

    it("should return 400 for duplicate email", async () => {
      const customerData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
      };

      // Create first customer
      await request(app).post("/api/customers").send(customerData).expect(201);

      // Try to create duplicate
      await request(app).post("/api/customers").send(customerData).expect(400);
    });
  });

  describe("GET /api/customers", () => {
    beforeEach(async () => {
      // Create test customers
      await Customer.create([
        {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "+1234567890",
          totalSpent: 1000,
          orderCount: 5,
        },
        {
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          phone: "+1234567891",
          totalSpent: 500,
          orderCount: 2,
        },
      ]);
    });

    it("should return all customers", async () => {
      const response = await request(app).get("/api/customers").expect(200);

      expect(response.body.customers).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it("should filter customers by total spent", async () => {
      const response = await request(app)
        .get("/api/customers?totalSpent[gte]=800")
        .expect(200);

      expect(response.body.customers).toHaveLength(1);
      expect(response.body.customers[0].email).toBe("john@example.com");
    });

    it("should paginate results", async () => {
      const response = await request(app)
        .get("/api/customers?page=1&limit=1")
        .expect(200);

      expect(response.body.customers).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.total).toBe(2);
    });
  });

  describe("PUT /api/customers/:id", () => {
    it("should update a customer", async () => {
      const customer = await Customer.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1234567890",
      });

      const updateData = {
        firstName: "Johnny",
        lastName: "Smith",
      };

      const response = await request(app)
        .put(`/api/customers/${customer._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe("Johnny");
      expect(response.body.lastName).toBe("Smith");
      expect(response.body.email).toBe("john@example.com"); // Should remain unchanged
    });

    it("should return 404 for non-existent customer", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      await request(app)
        .put(`/api/customers/${fakeId}`)
        .send({ firstName: "Test" })
        .expect(404);
    });
  });

  describe("DELETE /api/customers/:id", () => {
    it("should delete a customer", async () => {
      const customer = await Customer.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1234567890",
      });

      await request(app).delete(`/api/customers/${customer._id}`).expect(200);

      const deletedCustomer = await Customer.findById(customer._id);
      expect(deletedCustomer).toBeNull();
    });

    it("should return 404 for non-existent customer", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      await request(app).delete(`/api/customers/${fakeId}`).expect(404);
    });
  });
});
