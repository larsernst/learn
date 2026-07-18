import { describe, expect, it } from "vitest";
import { canEditCourse, canViewCourse } from "@/lib/course-access";

type User = { sub: string; roles: string[] };

const admin: User = { sub: "admin-1", roles: ["admin"] };
const editor: User = { sub: "editor-1", roles: ["editor"] };
const owner: User = { sub: "owner-1", roles: [] };
const editorOwner: User = { sub: "editor-1", roles: ["editor"] };
const stranger: User = { sub: "stranger-1", roles: [] };

describe("canViewCourse", () => {
  it("allows anyone to view a published course", () => {
    expect(canViewCourse(null, { status: "published", ownerId: null })).toBe(true);
    expect(canViewCourse(stranger, { status: "published", ownerId: "owner-1" })).toBe(true);
  });

  it("denies anonymous users access to a draft", () => {
    expect(canViewCourse(null, { status: "draft", ownerId: null })).toBe(false);
  });

  it("denies strangers access to someone else's draft", () => {
    expect(canViewCourse(stranger, { status: "draft", ownerId: "owner-1" })).toBe(false);
  });

  it("allows the owner to view their own draft", () => {
    expect(canViewCourse(owner, { status: "draft", ownerId: "owner-1" })).toBe(true);
  });

  it("allows admins to view any draft", () => {
    expect(canViewCourse(admin, { status: "draft", ownerId: "someone-else" })).toBe(true);
    expect(canViewCourse(admin, { status: "draft", ownerId: null })).toBe(true);
  });

  it("denies a draft with no owner for non-admins", () => {
    expect(canViewCourse(owner, { status: "draft", ownerId: null })).toBe(false);
  });
});

describe("canEditCourse", () => {
  it("denies anonymous users", () => {
    expect(canEditCourse(null, { ownerId: null })).toBe(false);
    expect(canEditCourse(null, { ownerId: "owner-1" })).toBe(false);
  });

  it("allows admins to edit any course", () => {
    expect(canEditCourse(admin, { ownerId: null })).toBe(true);
    expect(canEditCourse(admin, { ownerId: "someone-else" })).toBe(true);
  });

  it("allows an editor to edit their own course", () => {
    expect(canEditCourse(editorOwner, { ownerId: "editor-1" })).toBe(true);
  });

  it("denies an editor editing someone else's course", () => {
    expect(canEditCourse(editor, { ownerId: "owner-1" })).toBe(false);
  });

  it("denies a plain owner (without editor role) editing their own course", () => {
    expect(canEditCourse(owner, { ownerId: "owner-1" })).toBe(false);
  });

  it("denies strangers editing someone else's course", () => {
    expect(canEditCourse(stranger, { ownerId: "owner-1" })).toBe(false);
  });

  it("denies editing a course with no owner for non-admins", () => {
    expect(canEditCourse(editor, { ownerId: null })).toBe(false);
  });
});
