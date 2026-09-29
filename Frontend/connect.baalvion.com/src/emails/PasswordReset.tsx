
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface PasswordResetEmailProps {
  resetLink?: string;
}

export const PasswordResetEmail = ({
  resetLink = "https://baalvion-connect.vercel.app/auth/reset-password?code=123",
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your Baalvion Connect password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Text style={logoText}>Baalvion <span style={{ color: "#6C3AE8" }}>Security</span></Text>
        </Section>
        <Heading style={h1}>Password Reset Request</Heading>
        <Text style={text}>
          We received a request to reset the password for your Baalvion account. Click the button below to set a new password.
        </Text>
        
        <Section style={buttonContainer}>
          <Button style={button} href={resetLink}>
            Reset Password
          </Button>
        </Section>

        <Text style={textSmall}>
          If you didn't request this change, you can safely ignore this email. This link will expire in 60 minutes.
        </Text>

        <Hr style={hr} />
        <Text style={footer}>
          Baalvion Connect Security Team
          <br />
          If you're having trouble clicking the button, copy and paste this URL into your browser:
          <br />
          <Link href={resetLink} style={linkSmall}>{resetLink}</Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;

const main = {
  backgroundColor: "#f9fafb",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
};

const logoContainer = {
  padding: "20px 0",
};

const logoText = {
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: "#1e293b",
};

const h1 = {
  color: "#1e293b",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "20px 0",
};

const text = {
  color: "#475569",
  fontSize: "16px",
  lineHeight: "26px",
  textAlign: "center" as const,
};

const textSmall = {
  color: "#94a3b8",
  fontSize: "14px",
  lineHeight: "22px",
  textAlign: "center" as const,
  marginTop: "20px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#6C3AE8",
  borderRadius: "12px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "16px 24px",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "20px 0",
};

const footer = {
  color: "#94a3b8",
  fontSize: "11px",
  lineHeight: "20px",
  textAlign: "center" as const,
};

const linkSmall = {
  color: "#6C3AE8",
  fontSize: "10px",
  textDecoration: "none",
};
