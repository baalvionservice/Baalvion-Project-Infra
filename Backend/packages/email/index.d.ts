// Type declarations for @baalvion/email

export type EmailCategory =
    | 'auth'
    | 'notifications'
    | 'security'
    | 'support'
    | 'billing'
    | 'invrel';

export interface SenderMap {
    auth: string;
    notifications: string;
    security: string;
    support: string;
    billing: string;
    invrel: string;
}

export interface EmailConfig {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    configurationSet: string;
    fromName: string;
    replyTo: string;
    unsubscribeMailto: string;
    appUrl: string;
    adminUrl: string;
    senders: SenderMap;
}

export interface Logger {
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    debug?(...args: any[]): void;
}

export interface EmailLogEntry {
    messageId: string;
    recipient: string;
    sender: string;
    template: string;
    category: string;
    status: string;
    timestamp: string;
    configurationSet?: string;
    error?: string;
}

export interface EmailLogStore {
    record(entry: EmailLogEntry): Promise<void>;
    updateStatus(messageId: string, status: string, event?: object): Promise<void>;
    get?(messageId: string): Promise<Record<string, string> | null>;
}

export interface SendResult {
    messageId: string | null;
    status: 'sent' | 'skipped' | 'failed' | string;
    error?: string;
}

export interface EmailServiceDeps {
    config?: EmailConfig;
    sesClient?: any;
    logger?: Logger;
    store?: EmailLogStore;
}

export class EmailService {
    constructor(deps?: EmailServiceDeps);
    isConfigured(): boolean;
    sendOTP(p: { to: string; code: string; expiresMinutes?: number; purpose?: string; idempotencyKey?: string }): Promise<SendResult>;
    sendVerificationEmail(p: { to: string; verifyUrl: string; email?: string; idempotencyKey?: string }): Promise<SendResult>;
    sendWelcomeEmail(p: { to: string; name?: string; ctaUrl?: string; idempotencyKey?: string }): Promise<SendResult>;
    sendPasswordReset(p: { to: string; resetUrl: string; expiresMinutes?: number; idempotencyKey?: string }): Promise<SendResult>;
    sendLoginAlert(p: { to: string; time?: any; location?: string; device?: string; ip?: string; secureUrl?: string; idempotencyKey?: string }): Promise<SendResult>;
    sendSecurityAlert(p: { to: string; reason?: string; time?: any; ip?: string; location?: string; riskScore?: number; secureUrl?: string; idempotencyKey?: string }): Promise<SendResult>;
    sendOrderNotification(p: { to: string; orderNumber: string; items?: any[]; total?: any; currency?: string; name?: string; orderUrl?: string; idempotencyKey?: string }): Promise<SendResult>;
    sendInvoice(p: { to: string; invoiceNumber: string; items?: any[]; total?: any; currency?: string; invoiceUrl?: string; name?: string; issuedAt?: any; dueAt?: any; status?: string; idempotencyKey?: string }): Promise<SendResult>;
    sendSupportReply(p: { to: string; message?: string; messageHtml?: string; subject?: string; ticketId?: string; agentName?: string; ticketUrl?: string; idempotencyKey?: string }): Promise<SendResult>;
    sendNewsletter(p: { to: string | string[]; subject?: string; title?: string; bodyHtml?: string; bodyText?: string; ctaUrl?: string; ctaLabel?: string; unsubscribeUrl?: string; idempotencyKey?: string }): Promise<SendResult>;
    send(p: { to: string | string[]; template: string; data?: object; idempotencyKey?: string }): Promise<SendResult>;
    sendRaw(p: { to: string | string[]; subject: string; html: string; text?: string; category?: EmailCategory; replyTo?: string; unsubscribeUrl?: string; idempotencyKey?: string; template?: string }): Promise<SendResult>;
}

export function createEmailService(deps?: EmailServiceDeps): EmailService;
export function loadConfig(overrides?: Partial<EmailConfig>): EmailConfig;
export function isSesConfigured(config: EmailConfig): boolean;
export function createSesClient(config: EmailConfig): any;
export function resolveSender(config: EmailConfig, category: EmailCategory): { address: string; from: string };
export function replyToFor(config: EmailConfig, category: EmailCategory): string | undefined;
export function htmlToText(html: string): string;
export const CATEGORIES: EmailCategory[];
export function withRetry<T>(fn: () => Promise<T>, opts?: object): Promise<T>;
export function isTransient(err: unknown): boolean;

export class NoopStore implements EmailLogStore {
    constructor(logger?: Logger);
    record(entry: EmailLogEntry): Promise<void>;
    updateStatus(messageId: string, status: string, event?: object): Promise<void>;
    get(): Promise<null>;
}
export function createRedisStore(redisClient: any, opts?: { prefix?: string; ttlSeconds?: number; logger?: Logger }): EmailLogStore;

export function renderTemplate(name: string, data: Record<string, any>, ctx: { appUrl: string; supportEmail: string; billingEmail: string }): { subject: string; html: string; text: string; category: EmailCategory };
export const TEMPLATE_NAMES: string[];

export interface SnsHandleResult {
    ok: boolean;
    type: string;
    action: string;
    status?: string;
    messageId?: string | null;
    subscribeUrl?: string;
}
export function handleSnsRequest(params: {
    body: string | object;
    store?: EmailLogStore;
    logger?: Logger;
    autoConfirm?: boolean;
    verify?: boolean;
}): Promise<SnsHandleResult>;
export function verifySnsSignature(message: object): Promise<boolean>;
export function parseSesEvent(sesEvent: object): {
    eventType: string;
    status: string;
    messageId: string | null;
    recipients: string[];
    detail: object;
};
