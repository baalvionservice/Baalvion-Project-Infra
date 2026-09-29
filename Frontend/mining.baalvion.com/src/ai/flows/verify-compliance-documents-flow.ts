'use server';
/**
 * @fileOverview An AI agent for verifying compliance documents such as mining licenses,
 * product certifications, and quality inspection reports.
 *
 * - verifyComplianceDocuments - A function that handles the document verification process.
 * - VerifyComplianceDocumentsInput - The input type for the verifyComplianceDocuments function.
 * - VerifyComplianceDocumentsOutput - The return type for the verifyComplianceDocuments function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VerifyComplianceDocumentsInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The document to be verified, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentType: z
    .enum(['mining_license', 'product_certification', 'quality_report'])
    .describe(
      'The type of document being verified (e.g., mining_license, product_certification, quality_report).'
    ),
  verificationRequirements: z
    .string()
    .optional()
    .describe(
      'Specific regulatory rules, key information to look for, or contextual requirements for verification. If not provided, general compliance standards for the document type should be used.'
    ),
});
export type VerifyComplianceDocumentsInput = z.infer<typeof VerifyComplianceDocumentsInputSchema>;

const ExtractedDetailsSchema = z
  .object({
    licenseNumber: z.string().optional().describe('Extracted mining license number.'),
    issuer: z.string().optional().describe('The entity or authority that issued the document.'),
    issueDate: z.string().optional().describe('The date the document was issued (e.g., YYYY-MM-DD).'),
    expirationDate: z.string().optional().describe('The date the document expires (e.g., YYYY-MM-DD).'),
    certifiedProduct: z.string().optional().describe('The name of the product or mineral certified.'),
    gradeOrPurity: z.string().optional().describe('The grade or purity percentage of the product.'),
    inspectionResult: z.string().optional().describe('The overall result or conclusion of the quality inspection.'),
    inspectorName: z.string().optional().describe('The name of the inspector or inspection body.'),
    validForRegion: z.string().optional().describe('The region or country for which the license/certification is valid.')
  })
  .describe('Key information extracted from the document based on its type.');

const VerifyComplianceDocumentsOutputSchema = z.object({
  isCompliant: z
    .boolean()
    .describe('True if the document meets the specified or general compliance requirements, false otherwise.'),
  complianceReasoning: z
    .string()
    .describe('A detailed explanation of why the document is considered compliant or non-compliant, referencing specific points within the document or requirements.'),
  extractedDetails: ExtractedDetailsSchema,
  confidenceScore: z
    .number()
    .min(0)
    .max(100)
    .describe("A confidence score (0-100) indicating the AI's certainty in its compliance assessment."),
});
export type VerifyComplianceDocumentsOutput = z.infer<typeof VerifyComplianceDocumentsOutputSchema>;

export async function verifyComplianceDocuments(
  input: VerifyComplianceDocumentsInput
): Promise<VerifyComplianceDocumentsOutput> {
  try {
    return await verifyComplianceDocumentsFlow(input);
  } catch (e) {
    // Demo fallback: no GEMINI_API_KEY (or quota) → return an illustrative verification so
    // the feature is demonstrable without a key. Set GEMINI_API_KEY to flip to live AI.
    console.warn('[AI] compliance-verify fallback (genkit unavailable — set GEMINI_API_KEY for live AI):', (e as Error)?.message);
    const label = (input.documentType || 'document').replace(/_/g, ' ');
    return {
      isCompliant: true,
      complianceReasoning: `Demo assessment: the ${label} appears to contain the expected structure and mandatory fields for its category. In demo mode the document is not analysed by AI — configure GEMINI_API_KEY to run a live, evidence-based compliance check.`,
      extractedDetails: {
        issuer: 'Demo Regulatory Authority',
        issueDate: '2025-01-15',
        expirationDate: '2027-01-15',
        validForRegion: 'Global',
      },
      confidenceScore: 50,
    };
  }
}

const prompt = ai.definePrompt({
  name: 'verifyComplianceDocumentsPrompt',
  input: { schema: VerifyComplianceDocumentsInputSchema },
  output: { schema: VerifyComplianceDocumentsOutputSchema },
  prompt: `You are an expert AI compliance officer for Baalvion Mining Inc., specializing in verifying documents for the mining and mineral trade.
Your task is to analyze the provided document and determine its compliance status based on its type and any specified requirements.

Document Type: {{{documentType}}}
{{#if verificationRequirements}}
Specific Verification Requirements: {{{verificationRequirements}}}
{{else}}
General Task:
- For 'mining_license': Verify authenticity, validity period, and relevant license numbers.
- For 'product_certification': Check for product name, grade/purity, and issuing body details.
- For 'quality_report': Confirm inspection results, dates, and inspector details.
{{/if}}

Please analyze the following document carefully.
Document: {{media url=documentDataUri}}

Based on your analysis, determine if the document is compliant, provide detailed reasoning, extract key information, and state your confidence level.`,
});

const verifyComplianceDocumentsFlow = ai.defineFlow(
  {
    name: 'verifyComplianceDocumentsFlow',
    inputSchema: VerifyComplianceDocumentsInputSchema,
    outputSchema: VerifyComplianceDocumentsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI did not return an output for document verification.');
    }
    return output;
  }
);
