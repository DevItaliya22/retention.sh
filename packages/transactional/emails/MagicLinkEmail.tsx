import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export interface MagicLinkEmailProps {
  url: string;
  appName?: string;
  expiresInMinutes?: number;
}

export function MagicLinkEmail({
  url,
  appName = "DY",
  expiresInMinutes = 5,
}: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sign in to {appName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Sign in to {appName}</Heading>

          <Section style={section}>
            <Text style={text}>
              Click the button below to sign in to your account. This link will
              expire in {expiresInMinutes} minutes.
            </Text>

            <Button style={button} href={url}>
              Sign in to {appName}
            </Button>

            <Text style={textMuted}>
              If the button doesn&apos;t work, copy and paste this link into
              your browser:
            </Text>
            <Link style={link} href={url}>
              {url}
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            If you didn&apos;t request this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Default export for React Email preview
export default MagicLinkEmail;

// =============================================================================
// STYLES
// =============================================================================

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "0 0 24px",
  color: "#1a1a1a",
};

const section: React.CSSProperties = {
  padding: "0 24px",
};

const text: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#4a4a4a",
  margin: "0 0 24px",
};

const textMuted: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#6b7280",
  margin: "24px 0 8px",
};

const button: React.CSSProperties = {
  backgroundColor: "#18181b",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "14px 24px",
};

const link: React.CSSProperties = {
  fontSize: "14px",
  color: "#2563eb",
  wordBreak: "break-all" as const,
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const footer: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  textAlign: "center" as const,
  margin: "0",
};
