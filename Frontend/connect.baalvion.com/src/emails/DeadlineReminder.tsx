
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

interface DeadlineReminderEmailProps {
  userName?: string;
  campaignTitle?: string;
  deadlineDate?: string;
  hoursLeft?: number;
}

export const DeadlineReminderEmail = ({
  userName = "Creator",
  campaignTitle = "Smart Home Tech Review",
  deadlineDate = "July 28, 2024",
  hoursLeft = 24,
}: DeadlineReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>`Action Required: ${(hoursLeft).toString()} hours left for your submission!`</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Text style={logoText}>Baalvion <span style={{ color: "#F97316" }}>Alert</span></Text>
        </Section>
        <Heading style={h1}>Approaching Deadline ⏰</Heading>
        <Text style={text}>
          Hi {userName}, this is a reminder that your deliverable for <strong>{campaignTitle}</strong> is due in {hoursLeft} hours.
        </Text>
        
        <Section style={card}>
          <Text style={label}>Due Date</Text>
          <Text style={value}>{deadlineDate}</Text>
          <Button style={button} href="https://baalvion-connect.vercel.app/dashboard/creator/campaigns">
            Submit Your Work
          </Button>
        </Section>

        <Section style={infoBox}>
          <Text style={infoText}>
            Maintaining a high delivery score increases your AI match rate by up to 40%. Don't miss out on future high-tier campaigns!
          </Text>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>
          Need more time? Communicate directly with the brand in the message center.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default DeadlineReminderEmail;

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

const card = {
  backgroundColor: "#fff",
  border: "1px solid #fed7aa",
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
  fontSize: "24px",
  fontWeight: "black",
  color: "#f97316",
  margin: "0 0 25px",
};

const button = {
  backgroundColor: "#f97316",
  borderRadius: "12px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "16px 24px",
};

const infoBox = {
  padding: "20px",
  backgroundColor: "#eff6ff",
  borderRadius: "16px",
  border: "1px solid #dbeafe",
};

const infoText = {
  fontSize: "13px",
  color: "#1e40af",
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
