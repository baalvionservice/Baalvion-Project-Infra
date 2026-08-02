'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back home
          </Button>
        </Link>

        <article className="prose prose-sm dark:prose-invert max-w-none">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Data Deletion & Account Removal</h1>
            <p className="mt-4 text-lg text-muted-foreground">How to Delete Your Account and Data</p>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <section className="space-y-6 py-8 border-t border-border">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Account Deletion & Data Removal</h2>
              <p className="mt-4 text-foreground/80">
                We respect your privacy and give you full control over your data. You can delete your account and all associated data at any time.
              </p>
            </div>

            <div className="rounded-lg bg-yellow/10 border border-yellow/20 p-4">
              <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                ⚠️ Warning: Account deletion is permanent and cannot be undone. All data will be deleted within 30 days.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">Request Account Deletion</h3>
              <p className="mt-4 text-foreground/80">Follow these steps to delete your account:</p>
              <ol className="mt-4 space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">1.</span>
                  <span className="text-foreground/80">Log in to your ControlTheMarket account</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">2.</span>
                  <span className="text-foreground/80">Navigate to <strong>Settings</strong> → <strong>Account</strong> → <strong>Privacy & Data</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">3.</span>
                  <span className="text-foreground/80">Click <strong>"Request Account Deletion"</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">4.</span>
                  <span className="text-foreground/80">Review the deletion details</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">5.</span>
                  <span className="text-foreground/80">Confirm deletion (you'll need to re-enter your password)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">6.</span>
                  <span className="text-foreground/80">Confirmation email sent to your registered email address</span>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">What Gets Deleted</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">✓</span>
                  <span className="text-foreground/80"><strong>Profile Information:</strong> Name, email, phone, bio, avatar, location</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">✓</span>
                  <span className="text-foreground/80"><strong>Account Credentials:</strong> Password hash, authentication tokens, session data</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">✓</span>
                  <span className="text-foreground/80"><strong>Preferences & Settings:</strong> Notification settings, language, theme, saved filters</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">✓</span>
                  <span className="text-foreground/80"><strong>Activity History:</strong> Login history, device information, IP logs (after 7 days)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">✓</span>
                  <span className="text-foreground/80"><strong>Task Submissions:</strong> Code, files, and evaluation records (after 30 days retention for compliance)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">✓</span>
                  <span className="text-foreground/80"><strong>Communication Data:</strong> Messages, notifications (unless other users choose to retain)</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">What's Retained</h3>
              <p className="mt-4 text-foreground/80 mb-4">We retain the following for legal and operational reasons:</p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80"><strong>Transaction History:</strong> Invoices and payment records (required for tax and accounting compliance)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80"><strong>Anonymized Analytics:</strong> Aggregate usage data (cannot be linked back to you)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80"><strong>Abuse/Fraud Records:</strong> Information related to terms violation (if applicable)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80"><strong>Other Users' Data:</strong> Messages and interactions initiated by other users (deleted only if they also delete)</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">Deletion Timeline</h3>
              <div className="mt-4 space-y-3">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-primary text-primary-foreground h-8 w-8 flex items-center justify-center text-sm font-semibold">1</div>
                    <div className="h-8 w-0.5 bg-border"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Request Submitted</p>
                    <p className="text-sm text-muted-foreground">Your account is locked immediately. You can cancel within 24 hours.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-primary text-primary-foreground h-8 w-8 flex items-center justify-center text-sm font-semibold">2</div>
                    <div className="h-8 w-0.5 bg-border"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">24-Hour Grace Period</p>
                    <p className="text-sm text-muted-foreground">You can cancel deletion and restore access within 24 hours.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-primary text-primary-foreground h-8 w-8 flex items-center justify-center text-sm font-semibold">3</div>
                    <div className="h-8 w-0.5 bg-border"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Deletion Begins</p>
                    <p className="text-sm text-muted-foreground">After 24 hours, automated deletion process starts. Your account cannot be recovered.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-primary text-primary-foreground h-8 w-8 flex items-center justify-center text-sm font-semibold">4</div>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Completed (Within 30 Days)</p>
                    <p className="text-sm text-muted-foreground">All data deleted from our systems. Confirmation email sent.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">Download Your Data Before Deletion</h3>
              <p className="mt-4 text-foreground/80">
                Before requesting account deletion, you can download a copy of all your personal data:
              </p>
              <ol className="mt-4 space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">1.</span>
                  <span className="text-foreground/80">Go to <strong>Settings</strong> → <strong>Account</strong> → <strong>Privacy & Data</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">2.</span>
                  <span className="text-foreground/80">Click <strong>"Download My Data"</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">3.</span>
                  <span className="text-foreground/80">Select what data to include (profile, activity, submissions, etc.)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">4.</span>
                  <span className="text-foreground/80">Download starts immediately (JSON format)</span>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">Manual Deletion Request</h3>
              <p className="mt-4 text-foreground/80">
                If you cannot access your account or prefer a manual process, you can submit a deletion request directly:
              </p>
              <div className="mt-4 rounded-lg bg-secondary/5 border border-secondary/20 p-4 space-y-2">
                <p className="font-semibold text-foreground">Email: <a href="mailto:privacy@controlthemarket.com" className="text-primary underline">privacy@controlthemarket.com</a></p>
                <p className="text-sm text-foreground/80">Subject: "Account Deletion Request"</p>
                <p className="text-sm text-foreground/80">Include: Your email address, account username, and reason for deletion (optional)</p>
                <p className="text-sm text-foreground/80">Response time: Within 48 hours</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">Canceling Deletion</h3>
              <p className="mt-4 text-foreground/80">
                After you request deletion, you have 24 hours to cancel the request. After 24 hours, cancellation is no longer possible.
              </p>
              <p className="mt-4 text-foreground/80">
                To cancel:
              </p>
              <ol className="mt-4 space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">1.</span>
                  <span className="text-foreground/80">Check your email for the deletion confirmation</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">2.</span>
                  <span className="text-foreground/80">Click the <strong>"Cancel Deletion"</strong> link</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">3.</span>
                  <span className="text-foreground/80">Or log in and go to <strong>Settings</strong> → <strong>Cancel Deletion Request</strong></span>
                </li>
              </ol>
            </div>

            <div className="mt-8 rounded-lg bg-primary/5 border border-primary/10 p-4 space-y-3">
              <p className="text-sm text-foreground/80">
                <strong>Questions about data deletion?</strong> Contact our Privacy Team at{' '}
                <a href="mailto:privacy@controlthemarket.com" className="text-primary underline">
                  privacy@controlthemarket.com
                </a>
              </p>
              <p className="text-sm text-foreground/80">
                <strong>GDPR/Privacy Rights:</strong> We comply with GDPR and other data protection regulations. You have the right to deletion, access, and portability under applicable laws.
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
