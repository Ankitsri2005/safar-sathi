import { encrypt, decrypt, maskIdNumber, maskPhone, isEncrypted } from "../../utils/encryption";

describe("Encryption Utilities", () => {
  describe("encrypt / decrypt", () => {
    it("encrypts and decrypts a string round-trip", () => {
      const plaintext = "Aadhaar-1234-5678-9012";
      const encrypted = encrypt(plaintext);
      expect(encrypted).not.toBe(plaintext);
      expect(isEncrypted(encrypted)).toBe(true);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("produces different ciphertext for same plaintext (random IV)", () => {
      const a = encrypt("hello");
      const b = encrypt("hello");
      expect(a).not.toBe(b);
    });

    it("decrypt returns original string if not in iv:tag:cipher format", () => {
      const plain = "not-encrypted-data";
      expect(decrypt(plain)).toBe(plain);
    });

    it("isEncrypted detects 3-part colon-separated strings", () => {
      expect(isEncrypted("abc:def:ghi")).toBe(true);
      expect(isEncrypted("abc:def")).toBe(false);
      expect(isEncrypted("no-colons")).toBe(false);
      expect(isEncrypted("a:b:c:d")).toBe(false);
    });

    it("handles empty string", () => {
      const encrypted = encrypt("");
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe("");
    });

    it("handles unicode strings", () => {
      const text = "नमस्ते tourist 🎒";
      const encrypted = encrypt(text);
      expect(decrypt(encrypted)).toBe(text);
    });
  });

  describe("maskIdNumber", () => {
    it("masks a 12-digit Aadhaar number showing first 2 and last 2", () => {
      const result = maskIdNumber("123456789012");
      expect(result).toBe("12********12");
    });

    it("masks a passport number", () => {
      const result = maskIdNumber("AB1234567");
      expect(result).toBe("AB*****67");
    });

    it("returns '***' for short strings (< 6 chars)", () => {
      expect(maskIdNumber("12345")).toBe("***");
      expect(maskIdNumber("abc")).toBe("***");
    });

    it("returns '***' for empty string", () => {
      expect(maskIdNumber("")).toBe("***");
    });

    it("masks exactly 6-char string correctly", () => {
      const result = maskIdNumber("123456");
      expect(result).toBe("12**56");
    });
  });

  describe("maskPhone", () => {
    it("masks Indian phone number showing last 4 digits", () => {
      const result = maskPhone("9876543210");
      expect(result).toBe("******3210");
    });

    it("masks short phone showing last 4", () => {
      const result = maskPhone("1234");
      expect(result).toBe("1234");
    });

    it("returns '****' for phone shorter than 4", () => {
      expect(maskPhone("123")).toBe("****");
      expect(maskPhone("")).toBe("****");
    });

    it("masks 10-digit number correctly", () => {
      const result = maskPhone("0123456789");
      expect(result).toBe("******6789");
    });
  });
});
