
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface WelcomeBrandEmailProps {
  brandName?: string;
}

export const WelcomeBrandEmail = ({
  brandName = "Brand Partner",
}: WelcomeBrandEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Baalvion Connect – Start scaling with AI creators.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Text style={logoText}>Baalvion <span style={{ color: "#6C3AE8" }}>Connect</span></Text>
        </Section>
        <Heading style={h1}>Welcome to the Future of Marketing, {brandName}!</Heading>
        <Text style={text}>
          We're thrilled to have you onboard. Baalvion Connect is designed to take the guesswork out of influencer marketing using our proprietary AI matching engine.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href="https://baalvion-connect.vercel.app/dashboard/campaigns/new">
            Launch Your First Campaign
          </Button>
        </Section>
        <Text style={text}>
          Here's how to get started:
        </Text>
        <ul style={list}>
          <li>Define your project goals and budget in the campaign builder.</li>
          <li>Let our AI identify the top matching creators for your niche.</li>
          <li>Fund the secure escrow to start collaborating with confidence.</li>
        </ul>
        <Hr style={hr} />
        <Text style={footer}>
          Baalvion Connect, Inc. • Global Marketplace for Creative Talent
          <br />
          <Link href="https://baalvion-connect.vercel.app/unsubscribe" style={link}>
            Unsubscribe from these alerts
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeBrandEmail;

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
  color: "#6C3AE8",
  textDecoration: "underline",
};
