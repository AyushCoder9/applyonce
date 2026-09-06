import { describe, it, expect } from "vitest";
import { isFactKey } from "@applyonce/schema";
import { RECIPES, matchRecipe, resolveFields, matchGenericLabel } from "../src/recipes";
import type { DocLike } from "../src/recipes/types";

const fakeDoc = (url: string, selectors: string[]): DocLike => ({
  url,
  has: (selector: string) => selectors.includes(selector),
});

describe("matchRecipe", () => {
  it("matches bta-demo by URL and fingerprint", () => {
    const doc = fakeDoc("http://localhost:3301/apply/manual", ["#candidate_name"]);
    const recipe = matchRecipe(doc.url, doc);
    expect(recipe?.id).toBe("bta-demo");
  });

  it("does not match bta-demo if the fingerprint selector is missing (e.g. a different step of the same portal)", () => {
    const doc = fakeDoc("http://localhost:3301/apply/manual", []);
    const recipe = matchRecipe(doc.url, doc);
    expect(recipe?.id).not.toBe("bta-demo");
  });

  it("falls back to generic for an unknown portal", () => {
    const doc = fakeDoc("https://example-scholarship-portal.gov.in/apply", []);
    const recipe = matchRecipe(doc.url, doc);
    expect(recipe?.id).toBe("generic");
  });

  it("never returns null (generic always matches)", () => {
    const doc = fakeDoc("https://anything.example/whatever?x=1", []);
    expect(matchRecipe(doc.url, doc)).not.toBeNull();
  });

  it("respects match order — a more specific recipe wins over generic", () => {
    const doc = fakeDoc("https://scholarships.gov.in/apply/form", []);
    expect(matchRecipe(doc.url, doc)?.id).toBe("nsp");
  });
});

describe("resolveFields", () => {
  it("keeps only fields whose selector exists on the page", () => {
    const btaDemo = RECIPES.find((r) => r.id === "bta-demo")!;
    const doc = fakeDoc("http://localhost:3301/apply/manual", ["#candidate_name", "#dob", "#mobile"]);
    const resolved = resolveFields(btaDemo, doc);
    expect(resolved.map((f) => f.selector).sort()).toEqual(["#candidate_name", "#dob", "#mobile"]);
  });

  it("returns an empty list when no selectors are present", () => {
    const btaDemo = RECIPES.find((r) => r.id === "bta-demo")!;
    const doc = fakeDoc("http://localhost:3301/apply/manual", []);
    expect(resolveFields(btaDemo, doc)).toEqual([]);
  });
});

describe("every recipe field key is a real @applyonce/schema fact key", () => {
  for (const recipe of RECIPES) {
    it(`${recipe.id}`, () => {
      for (const field of recipe.fields) expect(isFactKey(field.key)).toBe(true);
    });
  }
});

describe("matchGenericLabel", () => {
  it("maps common label text to registry keys", () => {
    expect(matchGenericLabel("Candidate's Full Name")).toBe("identity.full_name");
    expect(matchGenericLabel("Father's Name")).toBe("family.father.name");
    expect(matchGenericLabel("Mother Name")).toBe("family.mother.name");
    expect(matchGenericLabel("Date of Birth")).toBe("identity.dob");
    expect(matchGenericLabel("DOB")).toBe("identity.dob");
    expect(matchGenericLabel("PIN Code")).toBe("address.permanent.pincode");
    expect(matchGenericLabel("Pincode")).toBe("address.permanent.pincode");
    expect(matchGenericLabel("Category")).toBe("category.social");
    expect(matchGenericLabel("12th Percentage")).toBe("education.class12.percentage");
    expect(matchGenericLabel("Intermediate %")).toBe("education.class12.percentage");
    expect(matchGenericLabel("Email Address")).toBe("contact.email_primary");
    expect(matchGenericLabel("Mobile Number")).toBe("contact.mobile_primary");
    expect(matchGenericLabel("Phone")).toBe("contact.mobile_primary");
    expect(matchGenericLabel("Gender")).toBe("identity.gender");
    expect(matchGenericLabel("State")).toBe("address.permanent.state");
    expect(matchGenericLabel("District")).toBe("address.permanent.district");
    expect(matchGenericLabel("PAN Number")).toBe("identity.pan");
    expect(matchGenericLabel("Aadhaar Number")).toBe("identity.aadhaar_last4");
  });

  it("is case-insensitive", () => {
    expect(matchGenericLabel("EMAIL")).toBe("contact.email_primary");
  });

  it("returns null for unrecognized labels", () => {
    expect(matchGenericLabel("Favourite colour")).toBeNull();
  });

  it("returns null for empty/whitespace text", () => {
    expect(matchGenericLabel("   ")).toBeNull();
  });

  it("first matching rule wins for ambiguous text", () => {
    // "Applicant State" could hit the name-ish "candidate|applicant" rule text-wise,
    // but that rule requires "full name" nearby too — this checks table order, not overlap.
    expect(matchGenericLabel("Candidate's State")).toBe("identity.full_name");
  });
});
