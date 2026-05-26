
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

interface PaymentReceivedEmailProps {
  userName?: string;
  amount?: string;
  txId?: string;
}

export const PaymentReceivedEmail = ({
  userName = "Creator",
  amount = "₹15,000",
  txId = "TX-9028374",
}: PaymentReceivedEmailProps) => (
  <Html>
    <Head />
    <Preview>Payment Confirmed: {amount} has landed in your wallet.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Text style={logoText}>Baalvion <span style={{ color: "#10B981" }}>Payout</span></Text>
        </Section>
        <Heading style={h1}>Funds Transferred! ✅</Heading>
        <Text style={text}>
          Hi {userName}, great work on your recent campaign. We've successfully transferred your earnings from escrow to your wallet.
        </Text>
        
        <Section style={card}>
          <div style={flexRow}>
            <span style={label}>Amount Released</span>
            <span style={value}>{amount}</span>
          </div>
          <Hr style={{ margin: "15px 0", borderColor: "#f1f5f9" }} />
          <div style={flexRow}>
            <span style={label}>Transaction Ref</span>
            <span style={value}>#{txId}</span>
          </div>
          <Button style={button} href="https://baalvion-connect.vercel.app/dashboard/creator/wallet">
            Withdraw Funds
          </Button>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>
          Official Payout Advice • Baalvion Connect Finance
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PaymentReceivedEmail;

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
  border: "1px solid #e2e8f0",
  borderRadius: "24px",
  padding: "32px",
  margin: "32px 0",
};

const flexRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const label = {
  fontSize: "12px",
  fontWeight: "bold",
  color: "#94a3b8",
  textTransform: "uppercase" as const,
};

const value = {
  fontSize: "18px",
  fontWeight: "black",
  color: "#1e293b",
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
  marginTop: "30px",
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
