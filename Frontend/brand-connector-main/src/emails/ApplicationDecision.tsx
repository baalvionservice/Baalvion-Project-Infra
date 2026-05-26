
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

interface ApplicationDecisionEmailProps {
  userName?: string;
  campaignTitle?: string;
  isAccepted?: boolean;
}

export const ApplicationDecisionEmail = ({
  userName = "Creator",
  campaignTitle = "Urban Lifestyle Shoot",
  isAccepted = true,
}: ApplicationDecisionEmailProps) => (
  <Html>
    <Head />
    <Preview>Update regarding your application for {campaignTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Text style={logoText}>Baalvion <span style={{ color: "#6C3AE8" }}>Hiring</span></Text>
        </Section>
        <Heading style={h1}>
          {isAccepted ? "You're Hired! 🚀" : "Update on your application"}
        </Heading>
        <Text style={text}>
          Hi {userName}, the brand has reviewed your pitch for <strong>{campaignTitle}</strong>.
        </Text>
        
        {isAccepted ? (
          <Section style={cardSuccess}>
            <Text style={text}>
              Congratulations! Your application was accepted. The campaign funds are now secured in escrow. You can begin working on the deliverables.
            </Text>
            <Button style={button} href="https://baalvion-connect.vercel.app/dashboard/applications">
              Start Project Workspace
            </Button>
          </Section>
        ) : (
          <Section style={cardNeutral}>
            <Text style={text}>
              Thank you for applying. While we loved your portfolio, the brand has decided to move forward with other creators for this specific campaign.
            </Text>
            <Button style={buttonSecondary} href="https://baalvion-connect.vercel.app/dashboard/creator/campaigns">
              Find More Campaigns
            </Button>
          </Section>
        )}

        <Hr style={hr} />
        <Text style={footer}>
          Total security through Baalvion Escrow.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ApplicationDecisionEmail;

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
};

const cardSuccess = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: "24px",
  padding: "32px",
  margin: "32px 0",
};

const cardNeutral = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "24px",
  padding: "32px",
  margin: "32px 0",
};

const button = {
  backgroundColor: "#10B981",
  borderRadius: "12px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "16px 24px",
  marginTop: "20px",
};

const buttonSecondary = {
  backgroundColor: "#6C3AE8",
  borderRadius: "12px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "16px 24px",
  marginTop: "20px",
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
