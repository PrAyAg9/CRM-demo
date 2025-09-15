import request from "supertest";
import { describe, test, expect, beforeEach } from "@jest/globals";
const app: any = require("../../app");
import Campaign from "../../models/Campaign";
import Customer from "../../models/Customer";

describe("Campaign API", () => {
  beforeEach(async () => {
    // Create test customers for campaigns
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

  describe("POST /api/campaigns", () => {
    it("should create a new email campaign", async () => {
      const campaignData = {
        name: "Test Email Campaign",
        type: "email",
        subject: "Test Subject",
        content: "Hello {{firstName}}, this is a test email!",
        audienceType: "all",
        schedulingType: "immediate",
      };

      const response = await request(app)
        .post("/api/campaigns")
        .send(campaignData)
        .expect(201);

      expect(response.body).toHaveProperty("_id");
      expect(response.body.name).toBe(campaignData.name);
      expect(response.body.type).toBe(campaignData.type);
      expect(response.body.status).toBe("draft");
    });

    it("should create a campaign with segment rules", async () => {
      const campaignData = {
        name: "Segment Campaign",
        type: "email",
        subject: "High Value Customers",
        content: "Thank you for being a valued customer!",
        audienceType: "segment",
        segmentRules: {
          id: "root",
          logic: "AND",
          rules: [
            {
              id: "rule1",
              field: "totalSpent",
              operator: "greater_than",
              value: 800,
              type: "number",
            },
          ],
        },
        schedulingType: "immediate",
      };

      const response = await request(app)
        .post("/api/campaigns")
        .send(campaignData)
        .expect(201);

      expect(response.body.audienceType).toBe("segment");
      expect(response.body.segmentRules).toBeDefined();
    });

    it("should return 400 for invalid campaign type", async () => {
      const campaignData = {
        name: "Invalid Campaign",
        type: "invalid_type",
        content: "Test content",
        audienceType: "all",
        schedulingType: "immediate",
      };

      await request(app).post("/api/campaigns").send(campaignData).expect(400);
    });
  });

  describe("GET /api/campaigns", () => {
    beforeEach(async () => {
      await Campaign.create([
        {
          name: "Campaign 1",
          type: "email",
          subject: "Subject 1",
          content: "Content 1",
          audienceType: "all",
          schedulingType: "immediate",
          status: "draft",
        },
        {
          name: "Campaign 2",
          type: "sms",
          content: "SMS Content",
          audienceType: "all",
          schedulingType: "immediate",
          status: "sent",
        },
      ]);
    });

    it("should return all campaigns", async () => {
      const response = await request(app).get("/api/campaigns").expect(200);

      expect(response.body.campaigns).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it("should filter campaigns by status", async () => {
      const response = await request(app)
        .get("/api/campaigns?status=draft")
        .expect(200);

      expect(response.body.campaigns).toHaveLength(1);
      expect(response.body.campaigns[0].status).toBe("draft");
    });

    it("should filter campaigns by type", async () => {
      const response = await request(app)
        .get("/api/campaigns?type=sms")
        .expect(200);

      expect(response.body.campaigns).toHaveLength(1);
      expect(response.body.campaigns[0].type).toBe("sms");
    });
  });

  describe("PATCH /api/campaigns/:id/status", () => {
    it("should update campaign status", async () => {
      const campaign = await Campaign.create({
        name: "Test Campaign",
        type: "email",
        subject: "Test Subject",
        content: "Test content",
        audienceType: "all",
        schedulingType: "immediate",
        status: "draft",
      });

      const response = await request(app)
        .patch(`/api/campaigns/${campaign._id}/status`)
        .send({ status: "scheduled" })
        .expect(200);

      expect(response.body.status).toBe("scheduled");
    });

    it("should return 400 for invalid status", async () => {
      const campaign = await Campaign.create({
        name: "Test Campaign",
        type: "email",
        subject: "Test Subject",
        content: "Test content",
        audienceType: "all",
        schedulingType: "immediate",
        status: "draft",
      });

      await request(app)
        .patch(`/api/campaigns/${campaign._id}/status`)
        .send({ status: "invalid_status" })
        .expect(400);
    });
  });

  describe("DELETE /api/campaigns/:id", () => {
    it("should delete a draft campaign", async () => {
      const campaign = await Campaign.create({
        name: "Test Campaign",
        type: "email",
        subject: "Test Subject",
        content: "Test content",
        audienceType: "all",
        schedulingType: "immediate",
        status: "draft",
      });

      await request(app).delete(`/api/campaigns/${campaign._id}`).expect(200);

      const deletedCampaign = await Campaign.findById(campaign._id);
      expect(deletedCampaign).toBeNull();
    });

    it("should not delete a sent campaign", async () => {
      const campaign = await Campaign.create({
        name: "Test Campaign",
        type: "email",
        subject: "Test Subject",
        content: "Test content",
        audienceType: "all",
        schedulingType: "immediate",
        status: "sent",
      });

      await request(app).delete(`/api/campaigns/${campaign._id}`).expect(400);

      const existingCampaign = await Campaign.findById(campaign._id);
      expect(existingCampaign).not.toBeNull();
    });
  });
});
