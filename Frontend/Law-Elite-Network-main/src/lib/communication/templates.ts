/**
 * @fileOverview External Communication Templates
 * High-fidelity messaging for the Law Elite Network.
 */

export const getEmailTemplate = (type: string, data: any) => {
  switch (type) {
    case "booking":
      return {
        subject: `Engagement Synchronized: Consultation with ${data.lawyerName}`,
        body: `
          Greetings,
          
          Your executive consultation with ${data.lawyerName} has been successfully synchronized within the Law Elite Network.
          
          Schedule: ${data.date} at ${data.time}
          Reference ID: ${data.bookingId}
          
          Please ensure your secure channel is active 5 minutes prior to the session.
          
          Regards,
          Network Intelligence Protocol
        `,
      };

    case "payment":
      return {
        subject: "Settlement Verified: Transaction Receipt",
        body: `
          A financial settlement of ₹${data.amount.toLocaleString()} has been successfully verified and secured in escrow.
          
          Transaction Reference: ${data.paymentId}
          Associated Engagement: #${data.bookingId}
          
          The practitioner has been notified of the secured funds.
          
          Regards,
          Law Elite Financial Gateway
        `,
      };

    default:
      return {
        subject: "Law Elite Network: System Update",
        body: "Your professional dossier has received a system update. Please review your dashboard for details.",
      };
  }
};

export const getWhatsAppMessage = (type: string, data: any) => {
  switch (type) {
    case "booking":
      return `⚖️ *Law Elite Engagement Verified*\n\nYour session with *${data.lawyerName}* is confirmed.\n🗓️ Date: ${data.date}\n⏰ Time: ${data.time}\n\n_Secure uplink active._`;

    case "reminder":
      return `⏰ *Executive Reminder*\n\nYour consultation is scheduled to commence in 30 minutes. Please initialize your secure channel.`;

    case "payment":
      return `💰 *Settlement Verified*\n\nYour payment of *₹${data.amount.toLocaleString()}* has been secured. Engagement #${data.bookingId} is now active.`;

    default:
      return `🔔 *Network Intelligence Update*\n\nPlease check your executive dashboard for new alerts.`;
  }
};
