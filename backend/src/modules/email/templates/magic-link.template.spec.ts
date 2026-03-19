import { renderMagicLinkEmail } from "@modules/email/templates/magic-link.template";

describe("renderMagicLinkEmail", () => {
  const testLink = "https://gamenight.hub/auth/magic?token=test-token-123";

  it("should return an HTML string containing the magic link", () => {
    const html = renderMagicLinkEmail({ link: testLink });

    expect(html).toContain(testLink);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("should contain a CTA button with the link", () => {
    const html = renderMagicLinkEmail({ link: testLink });

    expect(html).toContain(`<a href="${testLink}"`);
    expect(html).toContain("Sign in to GameNight Hub");
  });

  it("should contain the expiry notice", () => {
    const html = renderMagicLinkEmail({ link: testLink });

    expect(html).toContain("This link expires in 1 hour");
  });

  it("should contain the ignore notice", () => {
    const html = renderMagicLinkEmail({ link: testLink });

    expect(html).toContain("you can safely ignore this email");
  });

  it("should use custom app name when provided", () => {
    const html = renderMagicLinkEmail({ link: testLink, appName: "My App" });

    expect(html).toContain("My App");
    expect(html).toContain("Sign in to My App");
  });
});
