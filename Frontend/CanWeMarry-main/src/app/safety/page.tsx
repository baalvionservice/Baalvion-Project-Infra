import Link from 'next/link';
import { ButtonLink, Card, CardBody, Container, Section } from '@/components/ui';
import { PageHeader } from '@/components/site/page-header';
import { SITE } from '@/lib/site';
import { publicMetadata } from '@/lib/seo';



export const metadata = publicMetadata({
  title: 'Trust and safety',
  description: 'How consent, privacy, moderation and reporting work on CanWeMarry, and when to look for professional help.',
  path: '/safety',
});

export default function SafetyPage() {
  return (
    <>
      <PageHeader
        title="Trust and safety"
        lead="What we expect of everyone here, what we do about it when those expectations are not met, and where to turn when this platform is not the right help."
      />

      <Container width="prose" className="space-y-12 py-12">
        {/* Emergency guidance goes first. Someone scanning this page in a hurry needs it
            before anything else, not after four sections of policy. */}
        <Card>
          <CardBody>
            <h2 className="heading text-base">If someone is in danger right now</h2>
            <p className="mt-2 text-ui leading-relaxed">
              Contact your local emergency number. {SITE.name} cannot respond quickly and does not
              monitor cases in real time — reports are read by people, in working hours, and that is
              too slow for an emergency.
            </p>
            <div className="mt-4">
              <ButtonLink href="/resources?category=SAFETY" variant="secondary" size="sm">Safety resources</ButtonLink>
            </div>
          </CardBody>
        </Card>

        <Section title="Consent" as="h2">
          <div className="space-y-4 text-body leading-relaxed">
            <p>
              A case about a relationship inevitably concerns people who never agreed to be
              discussed on a website. That shapes how the platform is built, not just what we ask
              of you.
            </p>
            <p>
              You can invite someone into a case, but only they can accept. Not you, not a
              moderator, not an administrator — there is no override anywhere in the system.
              Until they accept, nobody can tell who they are: others see a relationship
              (&ldquo;a family member was invited&rdquo;) and nothing more.
            </p>
            <p>
              There is no field anywhere for the name, address, phone number or photograph of
              someone who has not consented. That is a property of the database, not a rule we
              are asking you to follow, so there is nothing to leak.
            </p>
            <p>
              Anyone who accepts can withdraw later. Withdrawal takes effect immediately and is
              final — a declined or withdrawn invitation cannot be re-sent, so nobody can be worn
              down by repetition.
            </p>
          </div>
        </Section>

        <Section title="Privacy" as="h2">
          <div className="space-y-4 text-body leading-relaxed">
            <p>
              Every case starts private, visible to nobody but you. Your profile is not
              discoverable until you turn that on, and your location stays hidden by default.
              Each of those is a decision you make deliberately, rather than something you have
              to notice and undo.
            </p>
            <p>
              A case you cannot see returns the same &ldquo;not found&rdquo; as one that does not
              exist. That is on purpose: telling somebody &ldquo;you are not allowed to see this
              case&rdquo; would confirm the case is real, which is exactly what a relative
              searching for it would want to know.
            </p>
            <p>
              Deleting a case removes its discussion, its supporters and its participant records
              with it. Nothing you wrote is kept behind for other people to read.
            </p>
          </div>
        </Section>

        <Section title="Respectful participation" as="h2">
          <div className="space-y-4 text-body leading-relaxed">
            <p>
              People here are in the middle of something painful, and often have not decided what
              they want. Useful support usually sounds like &ldquo;here is what happened when I
              tried that&rdquo; rather than &ldquo;here is what you should do&rdquo;.
            </p>
            <p>
              You can disagree with someone&rsquo;s choices. Say so kindly, once, and let it rest.
              Contempt, pile-ons and repeated pressure are not disagreement.
            </p>
            <p>
              There is no downvote on this platform, and there will not be one. Reactions are
              supportive only — that removes a whole category of behaviour rather than moderating
              it after the fact.
            </p>
          </div>
        </Section>

        <Section title="What is never allowed" as="h2">
          <ul className="space-y-3 text-body leading-relaxed">
            {[
              'Threats of any kind, against anyone, including people who are not on this platform.',
              'Harassment, intimidation or organising others to contact, confront or pressure someone.',
              'Publishing identifying information about a person who has not consented — a name, an address, a workplace, a photograph.',
              'Impersonating someone else, or claiming professional credentials you do not hold.',
              'Using a case to build a case against a family member, rather than to seek support.',
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <span aria-hidden="true" className="mt-1.5 text-danger">—</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-body leading-relaxed">
            This is a support platform. It is not a tool for confronting families, and an account
            used that way is removed.
          </p>
        </Section>

        <Section title="Reporting" as="h2">
          <div className="space-y-4 text-body leading-relaxed">
            <p>
              Anything here can be reported — a case, a comment, a post, a profile, a community.
              Reports describing a threat, coercion or a risk of self-harm go to the top of the
              queue automatically, without waiting for a human to sort them.
            </p>
            <p>
              Your name is not shown to the person you reported. You can see what happened to your
              own reports at{' '}
              <Link href="/me/reports" className="focus-ring rounded-sm font-medium text-accent-strong underline underline-offset-2">
                your report history
              </Link>, though not the moderator&rsquo;s internal notes.
            </p>
            <p>
              <span className="font-medium">Reporting something does not hide it.</span> Withholding
              content is a moderator&rsquo;s decision, so that a report cannot be used as a mute
              button against a case somebody dislikes.
            </p>
          </div>
        </Section>

        <Section title="Moderation" as="h2">
          <div className="space-y-4 text-body leading-relaxed">
            <p>
              Moderators can withhold content, lock a discussion, warn an account or suspend one.
              Every action requires a written reason and is recorded — an action nobody can
              review afterwards is indistinguishable from an arbitrary one.
            </p>
            <p>
              A moderator cannot read the audit trail, administer accounts, or appoint another
              moderator. Those are separate powers held by administrators, and the separation is
              enforced by the server rather than by convention.
            </p>
            <p>
              If you are warned or suspended, you are told, and you are told why.
            </p>
          </div>
        </Section>

        <Section title="When professional help is the right answer" as="h2">
          <div className="space-y-4 text-body leading-relaxed">
            <p>
              Community support is genuinely useful for feeling less alone and for hearing how
              other people handled a conversation. It is not a substitute for a professional, and
              there are situations where you should go straight to one:
            </p>
            <ul className="space-y-3">
              {[
                'You feel unsafe, or someone has threatened you.',
                'You are being prevented from leaving, working, studying, or contacting people.',
                'Your passport, money or documents are being withheld.',
                'You are being pressured towards a marriage you have not agreed to.',
                'You are struggling to cope, or thinking about harming yourself.',
                'You need to know your actual legal position rather than a general summary.',
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <span aria-hidden="true" className="mt-1.5 text-accent">—</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p>
              The resource directory lists mediation services, counsellors, legal-information
              providers and safety organisations, each added and checked by a volunteer. We do not
              provide legal, medical or psychological advice ourselves, and nothing on this site
              is advice about your particular circumstances.
            </p>
            <div className="pt-2">
              <ButtonLink href="/resources" variant="secondary">Browse resources</ButtonLink>
            </div>
          </div>
        </Section>
      </Container>
    </>
  );
}