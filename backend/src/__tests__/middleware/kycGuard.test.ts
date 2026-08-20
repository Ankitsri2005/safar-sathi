import { Request, Response, NextFunction } from "express";
import { restrictKycData } from "../../middleware/kycGuard";
import { UserRole } from "../../types";

function mockReq(role?: UserRole): Request {
  return {
    user: role ? { userId: "u1", role } : undefined,
  } as unknown as Request;
}

describe("KYC Guard Middleware", () => {
  it("calls next() to register the json interceptor", () => {
    const req = mockReq(UserRole.POLICE);
    let capturedData: any = null;
    const res: any = {
      json: function (data: any) { capturedData = data; return res; },
    };
    const next = jest.fn();

    restrictKycData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("masks id_number and phone for police role", () => {
    const req = mockReq(UserRole.POLICE);
    let capturedData: any = null;
    const res: any = {
      json: function (data: any) { capturedData = data; return res; },
    };
    const next = jest.fn();
    restrictKycData(req, res, next);

    const testData = { id_number: "123456789012", phone: "9876543210", full_name: "Test" };
    res.json(testData);

    expect(testData.id_number).toBe("12********12");
    expect(testData.phone).toBe("******3210");
  });

  it("does NOT mask for admin role", () => {
    const req = mockReq(UserRole.ADMIN);
    let capturedData: any = null;
    const res: any = {
      json: function (data: any) { capturedData = data; return res; },
    };
    const next = jest.fn();
    restrictKycData(req, res, next);

    const testData = { id_number: "123456789012", phone: "9876543210" };
    res.json(testData);

    expect(testData.id_number).toBe("123456789012");
    expect(testData.phone).toBe("9876543210");
  });

  it("does NOT mask for verification role", () => {
    const req = mockReq(UserRole.VERIFICATION);
    let capturedData: any = null;
    const res: any = {
      json: function (data: any) { capturedData = data; return res; },
    };
    const next = jest.fn();
    restrictKycData(req, res, next);

    const testData = { id_number: "AB1234567", phone: "1234567890" };
    res.json(testData);

    expect(testData.id_number).toBe("AB1234567");
    expect(testData.phone).toBe("1234567890");
  });

  it("masks array of tourists for non-privileged role", () => {
    const req = mockReq(UserRole.POLICE);
    const res: any = {
      json: function (data: any) { return res; },
    };
    const next = jest.fn();
    restrictKycData(req, res, next);

    const testData = [
      { id_number: "111111111111", phone: "1111111111", name: "A" },
      { id_number: "222222222222", phone: "2222222222", name: "B" },
    ];
    res.json(testData);

    expect(testData[0].id_number).toBe("11********11");
    expect(testData[1].id_number).toBe("22********22");
  });

  it("masks nested tourist in array items", () => {
    const req = mockReq(UserRole.POLICE);
    const res: any = {
      json: function (data: any) { return res; },
    };
    const next = jest.fn();
    restrictKycData(req, res, next);

    const testData = [
      {
        tourist: { id_number: "123456789012", phone: "9876543210" },
        status: "active",
      },
    ];
    res.json(testData);

    expect(testData[0].tourist.id_number).toBe("12********12");
    expect(testData[0].tourist.phone).toBe("******3210");
  });

  it("masks paginated response with .data array", () => {
    const req = mockReq(UserRole.POLICE);
    const res: any = {
      json: function (data: any) { return res; },
    };
    const next = jest.fn();
    restrictKycData(req, res, next);

    const testData = {
      data: [
        { id_number: "123456789012", phone: "9876543210" },
      ],
      total: 1,
    };
    res.json(testData);

    expect(testData.data[0].id_number).toBe("12********12");
    expect(testData.data[0].phone).toBe("******3210");
  });

  it("does nothing with null data", () => {
    const req = mockReq(UserRole.POLICE);
    const res: any = {
      json: function (data: any) { return res; },
    };
    const next = jest.fn();
    restrictKycData(req, res, next);

    expect(() => res.json(null)).not.toThrow();
  });

  it("masks data when no user on request (secure default)", () => {
    const req = mockReq(undefined);
    const res: any = {
      json: function (data: any) { return res; },
    };
    const next = jest.fn();
    restrictKycData(req, res, next);

    const testData = { id_number: "123456789012", phone: "9876543210" };
    res.json(testData);

    // No user = defaults to masking (secure by default)
    expect(testData.id_number).toBe("12********12");
    expect(testData.phone).toBe("******3210");
  });
});
