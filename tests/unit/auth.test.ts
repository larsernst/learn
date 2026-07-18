import { describe, expect, it } from "vitest";
import { isAdmin, isEditor } from "@/lib/auth";

describe("isAdmin", () => {
  it("returns true when the user has the admin role", () => {
    expect(isAdmin({ roles: ["admin"] })).toBe(true);
    expect(isAdmin({ roles: ["other", "admin"] })).toBe(true);
  });

  it("returns false when the user lacks the admin role", () => {
    expect(isAdmin({ roles: [] })).toBe(false);
    expect(isAdmin({ roles: ["editor"] })).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe("isEditor", () => {
  it("returns true when the user has the editor role", () => {
    expect(isEditor({ roles: ["editor"] })).toBe(true);
    expect(isEditor({ roles: ["editor", "other"] })).toBe(true);
  });

  it("returns true when the user is an admin (admins are implicitly editors)", () => {
    expect(isEditor({ roles: ["admin"] })).toBe(true);
  });

  it("returns false when the user has neither role", () => {
    expect(isEditor({ roles: [] })).toBe(false);
    expect(isEditor({ roles: ["user"] })).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isEditor(null)).toBe(false);
    expect(isEditor(undefined)).toBe(false);
  });
});
