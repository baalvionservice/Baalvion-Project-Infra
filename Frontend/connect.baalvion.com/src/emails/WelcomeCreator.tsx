
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

interface WelcomeCreatorEmailProps {
  userName?: string;
}

export const WelcomeCreatorEmail = ({
  userName = "Creator",
}: WelcomeCreatorEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Baalvion – Your career on autopilot starts now.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Text style={logoText}>Baalvion <span style={{ color: "#F97316" }}>Creator</span></Text>
        </Section>
        <Heading style={h1}>Welcome to the Inner Circle, {userName}!</Heading>
        <Text style={text}>
          You've just joined the world's most advanced marketplace for high-performance talent. Baalvion uses AI to pitch you directly to the brands that fit your style.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href="https://baalvion-connect.vercel.app/dashboard/creator/portfolio">
            Complete Your Portfolio
          </Button>
        </Section>
        <Text style={text}>
          How to maximize your earnings:
        </Text>
        <ul style={list}>
          <li>Connect your social channels to verify your reach.</li>
          <li>Set your base rates so brands know your value.</li>
          <li>Apply to featured campaigns in the Discovery feed.</li>
        </ul>
        <Hr style={hr} />
        <Text style={footer}>
          Baalvion Connect • Secure Payments & AI Matchmaking
          <br />
          <Link href="https://baalvion-connect.vercel.app/unsubscribe" style={link}>
            Manage email preferences
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeCreatorEmail;

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
  margin: "30px 0",
};

const text = {
  color: "#475569",
  fontSize: "16px",
  lineHeight: "26px",
  textAlign: "left" as const,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#F97316",
  borderRadius: "12px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "16px 24px",
};

const list = {
  color: "#475569",
  fontSize: "14px",
  lineHeight: "24px",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "20px 0",
};

const footer = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "22px",
  textAlign: "center" as const,
};

const link = {
  color: "#F97316",
  textDecoration: "underline",
};
