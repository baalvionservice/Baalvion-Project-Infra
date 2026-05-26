
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

interface DisputeNoticeEmailProps {
  userName?: string;
  campaignTitle?: string;
  disputeId?: string;
}

export const DisputeNoticeEmail = ({
  userName = "User",
  campaignTitle = "Summer Vibes Promo",
  disputeId = "DIS-49283",
}: DisputeNoticeEmailProps) => (
  <Html>
    <Head />
    <Preview>Urgent: A dispute has been filed regarding campaign {campaignTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Text style={logoText}>Baalvion <span style={{ color: "#ef4444" }}>Safety</span></Text>
        </Section>
        <Heading style={h1}>Dispute Filed 🛡️</Heading>
        <Text style={text}>
          Hi {userName}, an official dispute has been filed regarding the project <strong>{campaignTitle}</strong>. 
        </Text>
        <Text style={text}>
          Escrowed funds for this project have been temporarily locked until a resolution is reached by our mediation team.
        </Text>
        
        <Section style={card}>
          <Text style={label}>Dispute Case ID</Text>
          <Text style={value}>{disputeId}</Text>
          <Button style={button} href="https://baalvion-connect.vercel.app/dashboard/creator/campaigns">
            View Mediation Hub
          </Button>
        </Section>

        <Section style={warningBox}>
          <Text style={warningText}>
            Please upload all relevant evidence (chat logs, raw files) to the project workspace within 48 hours to ensure a fair resolution.
          </Text>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>
          Baalvion Connect Arbitration Team • Impartial & Secure
        </Text>
      </Container>
    </Body>
  </Html>
);

export default DisputeNoticeEmail;

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
  color: "#ef4444",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "20px 0",
};

const text = {
  color: "#475569",
  fontSize: "16px",
  lineHeight: "26px",
  textAlign: "left" as const,
};

const card = {
  backgroundColor: "#fff",
  border: "1px solid #fecaca",
  borderRadius: "24px",
  padding: "32px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const label = {
  fontSize: "10px",
  fontWeight: "bold",
  color: "#94a3b8",
  textTransform: "uppercase" as const,
  margin: "0 0 5px",
};

const value = {
  fontSize: "20px",
  fontWeight: "black",
  color: "#1e293b",
  margin: "0 0 25px",
};

const button = {
  backgroundColor: "#1e293b",
  borderRadius: "12px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "16px 24px",
};

const warningBox = {
  padding: "20px",
  backgroundColor: "#fff1f2",
  borderRadius: "16px",
  border: "1px solid #ffe4e6",
};

const warningText = {
  fontSize: "13px",
  color: "#9f1239",
  fontWeight: "bold",
  lineHeight: "20px",
  margin: "0",
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
