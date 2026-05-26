"use client";

/**
 * @fileOverview Baalvion Automated Invoice Generation Service
 *
 * Uses jsPDF to create tax-compliant documents for brand payments
 * and creator payouts.
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  FirebaseStorage,
} from "firebase/storage";
import { doc, updateDoc, Firestore } from "firebase/firestore";
import { Transaction } from "@/types";

interface InvoiceContext {
  userName: string;
  userAddress?: string;
  gstNumber?: string;
  campaignTitle?: string;
}

/**
 * Generates and uploads a PDF invoice for a specific transaction.
 */
export async function generateAndAttachInvoice(
  db: Firestore,
  storage: FirebaseStorage,
  tx: Transaction,
  context: InvoiceContext,
) {
  try {
    const docPdf = new jsPDF();
    const isBrandInvoice = tx.type === "ESCROW_LOCK" || tx.type === "DEPOSIT";
    const isCreatorPayout =
      tx.type === "ESCROW_RELEASE" || tx.type === "PAYOUT";
    const isRefund = tx.type === "REFUND";

    // 1. Header Branded Rect
    docPdf.setFillColor(108, 58, 232); // Baalvion Primary Purple
    docPdf.rect(0, 0, 210, 40, "F");

    docPdf.setTextColor(255, 255, 255);
    docPdf.setFontSize(22);
    docPdf.setFont("helvetica", "bold");
    docPdf.text("Baalvion Connect", 20, 20);

    docPdf.setFontSize(10);
    docPdf.setFont("helvetica", "normal");
    docPdf.text(
      isBrandInvoice
        ? "TAX INVOICE"
        : isRefund
          ? "REFUND CREDIT NOTE"
          : "PAYOUT ADVICE",
      20,
      30,
    );

    // 2. Metadata Section
    docPdf.setTextColor(100, 116, 139);
    docPdf.setFontSize(9);
    docPdf.text(
      `Document ID: ${tx.id.substring(0, 12).toUpperCase()}`,
      140,
      20,
    );
    docPdf.text(`Date: ${format(new Date(tx.createdAt), "PPP")}`, 140, 25);
    docPdf.text(`Status: ${tx.status}`, 140, 30);

    // 3. User Details
    docPdf.setTextColor(30, 41, 59);
    docPdf.setFontSize(12);
    docPdf.setFont("helvetica", "bold");
    docPdf.text(isRefund ? "Customer:" : "Bill To:", 20, 55);
    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(10);
    docPdf.text(context.userName, 20, 62);
    if (context.userAddress)
      docPdf.text(context.userAddress, 20, 67, { maxWidth: 80 });
    if (context.gstNumber) docPdf.text(`GSTIN: ${context.gstNumber}`, 20, 77);

    // 4. Campaign Reference
    if (context.campaignTitle) {
      docPdf.setFont("helvetica", "bold");
      docPdf.text("Reference Project:", 120, 55);
      docPdf.setFont("helvetica", "normal");
      docPdf.text(context.campaignTitle, 120, 62, { maxWidth: 70 });
    }

    // 5. Line Items Table
    let tableData = [];
    let tableHeaders = [["Description", "Amount (INR)"]];

    if (isBrandInvoice) {
      const platformFee = Math.round(tx.amount * 0.15);
      const gst = Math.round((tx.amount + platformFee) * 0.18);
      tableData = [
        ["Campaign Budget Allocation", `INR ${tx.amount.toLocaleString()}`],
        ["Platform Service Fee (15%)", `INR ${platformFee.toLocaleString()}`],
        ["Integrated GST (18%)", `INR ${gst.toLocaleString()}`],
      ];
    } else if (isCreatorPayout) {
      const tds = Math.round(tx.amount * 0.1); // Mock 10% TDS
      tableData = [
        ["Campaign Earnings", `INR ${tx.amount.toLocaleString()}`],
        ["TDS Deduction (10%)", `- INR ${tds.toLocaleString()}`],
        [
          "Total Payout Authorized",
          `INR ${(tx.amount - tds).toLocaleString()}`,
        ],
      ];
    } else if (isRefund) {
      tableData = [
        ["Escrow Reversal", `INR ${tx.amount.toLocaleString()}`],
        ["Reason", tx.description],
      ];
    } else {
      tableData = [[tx.description, `INR ${tx.amount.toLocaleString()}`]];
    }

    autoTable(docPdf, {
      startY: 90,
      head: tableHeaders,
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [108, 58, 232], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 5 },
      foot: [["Total Value", `INR ${tx.amount.toLocaleString()}`]],
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [30, 41, 59],
        fontStyle: "bold",
      },
    });

    // 6. Footer Disclaimer
    const finalY = (docPdf as any).lastAutoTable.finalY + 20;
    docPdf.setFontSize(8);
    docPdf.setTextColor(148, 163, 184);
    docPdf.text(
      "This is a computer-generated document. No signature is required. Baalvion Connect acts as an escrow intermediary. Refunded funds are credited to the available wallet balance.",
      20,
      finalY,
      { maxWidth: 170 },
    );

    // 7. Upload to Firebase Storage
    const pdfBlob = docPdf.output("blob");
    const storagePath = `invoices/${tx.userId}/${tx.id}.pdf`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, pdfBlob);
    const downloadUrl = await getDownloadURL(storageRef);

    // 8. Link to Firestore Transaction
    await updateDoc(doc(db!, "transactions", tx.id), {
      receiptUrl: downloadUrl,
      updatedAt: new Date().toISOString(),
    });

    return downloadUrl;
  } catch (error) {
    console.error("Invoice Generation Failed:", error);
    return null;
  }
}
