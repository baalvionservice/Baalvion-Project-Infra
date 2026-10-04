'use strict';
// The wording and routing of every notification the site sends, in one place. Each function is
// fire-and-forget (see notify.js) so callers never await or handle errors.
const { notify, alertAdmins, fire } = require('./notify');

const date = (d) => (d ? String(d).slice(0, 10) : '');
const who = (r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'A guest';

module.exports = {
    // ── Clubs ────────────────────────────────────────────────────────────────
    bookingReceived(booking, club) {
        const kind = booking.kind === 'vip_table' ? 'VIP table request' : 'guest-list request';
        fire(notify({
            userId: booking.user_id, email: booking.email, type: 'booking', key: `booking-recv-${booking.id}`,
            title: `We received your ${kind}`,
            body: `${club.name}, ${date(booking.visit_date)}. The venue will confirm with you directly. Nothing is reserved or charged yet.`,
            url: '/clubs',
        }));
        if (club.contact_email) {
            fire(notify({
                email: club.contact_email, type: 'booking', key: `booking-venue-${booking.id}`,
                title: `New ${kind} for ${club.name}`,
                body: `${who(booking)} (${booking.phone}, ${booking.email}) for ${date(booking.visit_date)}.\n`
                    + (booking.kind === 'vip_table' ? `Group of ${booking.group_size}${booking.table_package ? `, package: ${booking.table_package}` : ''}.` : `${booking.males} guys, ${booking.females} girls.`)
                    + (booking.notes ? `\nNotes: ${booking.notes}` : ''),
            }));
        }
        fire(alertAdmins({ key: `booking-admin-${booking.id}`, title: `New ${kind}: ${club.name}`, body: `${who(booking)} for ${date(booking.visit_date)}.`, url: '/admin/clubs/bookings' }));
    },
    bookingDecided(booking, club) {
        const word = { confirmed: 'confirmed', declined: 'declined', cancelled: 'cancelled' }[booking.status];
        if (!word) return;
        fire(notify({
            userId: booking.user_id, email: booking.email, type: 'booking', key: `booking-${booking.status}-${booking.id}`,
            title: `Your request at ${club.name} was ${word}`,
            body: booking.status === 'confirmed'
                ? `${club.name} confirmed your request for ${date(booking.visit_date)}. Arrive early; entry is at the venue's discretion.`
                : `${club.name} could not take your request for ${date(booking.visit_date)}. You can try another date.`,
            url: '/clubs',
        }));
    },

    // ── Locals ───────────────────────────────────────────────────────────────
    localApplied(application, listing) {
        fire(notify({
            userId: application.user_id, email: application.email, type: 'application', key: `local-recv-${application.id}`,
            title: `Application sent: ${listing.title}`, body: 'Your application was submitted. The team will contact you using the details you gave.', url: `/locals/${listing.slug}`,
        }));
        fire(alertAdmins({ key: `local-admin-${application.id}`, title: `New application: ${listing.title}`, body: `${application.full_name} applied.`, url: '/admin/locals/applications' }));
    },
    localDecided(application, listing) {
        fire(notify({
            userId: application.user_id, email: application.email, type: 'application', key: `local-${application.status}-${application.id}`,
            title: `Your application was ${application.status}`, body: `${listing.title} (${listing.city}).`, url: `/locals/${listing.slug}`,
        }));
    },

    // ── Staffing ─────────────────────────────────────────────────────────────
    profileSubmitted(profile) {
        fire(alertAdmins({ key: `profile-admin-${profile.id}-${+new Date(profile.updatedAt || Date.now())}`, title: 'Candidate profile to verify', body: `${profile.full_name} (${profile.zone}).`, url: '/nightlife/verify' }));
    },
    profileReviewed(profile) {
        const ok = profile.status === 'verified';
        fire(notify({
            userId: profile.user_id, type: 'verification', key: `profile-${profile.status}-${profile.id}-${+new Date(profile.reviewed_at || Date.now())}`,
            title: ok ? 'Your candidate profile is verified' : 'Your candidate profile was not approved',
            body: ok ? 'You can now apply to gigs, and verified employers can find you.' : `${profile.review_note || 'No reason given.'} Update your profile and resubmit.`,
            url: '/nightlife/candidate',
        }));
    },
    employerSubmitted(employer) {
        fire(alertAdmins({ key: `employer-admin-${employer.id}-${+new Date(employer.updatedAt || Date.now())}`, title: 'Employer to verify', body: `${employer.business_name} (${employer.city}).`, url: '/nightlife/verify' }));
    },
    employerReviewed(employer) {
        const ok = employer.status === 'verified';
        fire(notify({
            userId: employer.user_id, type: 'verification', key: `employer-${employer.status}-${employer.id}-${+new Date(employer.reviewed_at || Date.now())}`,
            title: ok ? 'Your employer account is verified' : 'Your employer account was not approved',
            body: ok ? 'You can now post gigs and find candidates.' : `${employer.review_note || 'No reason given.'} Update your details and resubmit.`,
            url: '/nightlife/employer',
        }));
    },
    gigApplied(application, gig, employerUserId, candidateName) {
        fire(notify({
            userId: employerUserId, type: 'gig', key: `gig-app-${application.id}`,
            title: `New applicant for ${gig.title}`, body: `${candidateName} applied.`, url: '/nightlife/employer',
        }));
    },
    gigApplicationDecided(application, gig, candidateUserId) {
        if (!['shortlisted', 'hired', 'rejected'].includes(application.status)) return;
        fire(notify({
            userId: candidateUserId, type: 'gig', key: `gig-${application.status}-${application.id}`,
            title: application.status === 'hired' ? `You were hired: ${gig.title}` : `Your application was ${application.status}`,
            body: `${gig.title}, ${date(gig.event_date)}.`, url: '/nightlife/candidate',
        }));
    },

    // ── Education ────────────────────────────────────────────────────────────
    teacherSubmitted(teacher) {
        fire(alertAdmins({ key: `teacher-admin-${teacher.id}-${+new Date(teacher.updatedAt || Date.now())}`, title: 'Teacher application to review', body: `${teacher.display_name} (${teacher.subject}).`, url: '/admin/education/approvals' }));
    },
    teacherReviewed(teacher) {
        const ok = teacher.status === 'active';
        fire(notify({
            userId: teacher.user_id, type: 'education', key: `teacher-${teacher.status}-${teacher.id}-${+new Date(teacher.reviewed_at || Date.now())}`,
            title: ok ? 'You are approved to teach' : `Your teacher account was ${teacher.status}`,
            body: ok ? 'You are now listed on the Education page. Schedule your first session.' : teacher.review_note || 'No reason given.',
            url: '/teacher-dashboard',
        }));
    },
    enrollmentRequested(enrollment, session, teacherUserId, studentLabel) {
        fire(notify({
            userId: teacherUserId, type: 'education', key: `enroll-req-${enrollment.id}-${+new Date(enrollment.updatedAt || Date.now())}`,
            title: `New request for ${session.title}`, body: `${studentLabel || 'A student'} asked to join.`, url: '/teacher-dashboard/sessions',
        }));
    },
    enrollmentDecided(enrollment, session) {
        if (!['approved', 'declined'].includes(enrollment.status)) return;
        fire(notify({
            userId: enrollment.student_id, type: 'education', key: `enroll-${enrollment.status}-${enrollment.id}`,
            title: `Your request was ${enrollment.status}`,
            body: enrollment.status === 'approved' ? `${session.title} starts ${new Date(session.start_at).toUTCString()}. Open your dashboard for the join link.` : `${session.title}: the teacher could not take your request.`,
            url: '/student-dashboard/sessions',
        }));
    },
    sessionCancelled(session, studentIds) {
        for (const id of studentIds) {
            fire(notify({ userId: id, type: 'education', key: `session-cancel-${session.id}-${id}`, title: `Session cancelled: ${session.title}`, body: 'The teacher or an admin cancelled this session.', url: '/student-dashboard/sessions' }));
        }
    },

    // ── Bounty ───────────────────────────────────────────────────────────────
    bountyReportSubmitted(report, task) {
        fire(alertAdmins({ key: `bounty-report-${report.id}`, title: `Bounty report: ${report.title}`, body: `Task: ${task.title}.`, url: '/admin/bounty' }));
    },
    bountyReportReviewed(report) {
        fire(notify({
            userId: report.user_id, type: 'bounty', key: `bounty-${report.status}-${report.id}-${+new Date(report.reviewed_at || Date.now())}`,
            title: `Your bounty report is ${report.status}`, body: [report.reviewer_note, report.status === 'paid' ? 'A payout was recorded. Check My Reports.' : ''].filter(Boolean).join('\n') || report.title, url: '/bounty',
        }));
    },
    bountyAdminReply(threadUserId, messageId) {
        fire(notify({ userId: threadUserId, type: 'message', key: `bounty-reply-${messageId}`, title: 'The admin team replied', body: 'Open the bounty chat to read it.', url: '/bounty/chat' }));
    },
    bountyHunterMessage(messageId, label) {
        fire(alertAdmins({ key: `bounty-msg-${messageId}`, title: `New bounty chat message from ${label || 'a hunter'}`, body: 'Open the inbox to reply.', url: '/admin/bounty' }));
    },

    // ── KYC ──────────────────────────────────────────────────────────────────
    kycSubmitted(kycCase) {
        fire(alertAdmins({ key: `kyc-admin-${kycCase.id}-${+new Date(kycCase.updatedAt || Date.now())}`, title: 'Identity verification to review', body: `${kycCase.full_name} submitted ID documents.`, url: '/admin/kyc' }));
    },
    kycDecided(kycCase) {
        const ok = kycCase.status === 'approved';
        fire(notify({
            userId: kycCase.user_id, type: 'kyc', key: `kyc-${kycCase.status}-${kycCase.id}-${+new Date(kycCase.reviewed_at || Date.now())}`,
            title: ok ? 'You are verified' : 'Your identity verification was not approved',
            body: ok ? 'You can now buy listings that require verification.' : `${kycCase.rejection_reason || 'No reason given.'} You can submit again.`,
            url: '/kyc',
        }));
    },
};
