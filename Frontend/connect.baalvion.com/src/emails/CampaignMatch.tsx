
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

interface CampaignMatchEmailProps {
  userName?: string;
  campaignTitle?: string;
  budget?: string;
  matchScore?: number;
}

export const CampaignMatchEmail = ({
  userName = "Creator",
  campaignTitle = "Global Tech Review",
  budget = "₹15,000",
  matchScore = 98,
}: CampaignMatchEmailProps) => (
  <Html>
    <Head />
    <Preview>New High-Value Match Found: {campaignTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Text style={logoText}>Baalvion <span style={{ color: "#6C3AE8" }}>Match</span></Text>
        </Section>
        <Section style={badgeContainer}>
          <Text style={badge}>{matchScore}% AI MATCH</Text>
        </Section>
        <Heading style={h1}>We found a perfect fit for you, {userName}!</Heading>
        <Text style={text}>
          Our engine has identified a new campaign that perfectly aligns with your audience demographics and creative style.
        </Text>
        <Section style={card}>
          <Text style={cardTitle}>{campaignTitle}</Text>
          <Text style={cardDetail}>Estimated Budget: <strong>{budget}</strong></Text>
          <Button style={button} href="https://baalvion-connect.vercel.app/dashboard/creator/campaigns">
            View Campaign Details
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          This match was generated based on your verified performance metrics.
          <br />
          <Link href="https://baalvion-connect.vercel.app/settings" style={link}>
            Adjust matching preferences
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default CampaignMatchEmail;

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

const badgeContainer = {
  textAlign: "center" as const,
};

const badge = {
  display: "inline-block",
  padding: "4px 12px",
  backgroundColor: "rgba(108, 58, 232, 0.1)",
  color: "#6C3AE8",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "bold",
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

const card = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "24px",
  padding: "32px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const cardTitle = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#1e293b",
  margin: "0 0 10px",
};

const cardDetail = {
  fontSize: "14px",
  color: "#64748b",
  margin: "0 0 20px",
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
  fontSize: "12px",
  lineHeight: "22px",
  textAlign: "center" as const,
};

const link = {
  color: "#6C3AE8",
  textDecoration: "underline",
};
