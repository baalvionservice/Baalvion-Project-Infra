'use strict';
// Real queue/inventory counts for the admin console landing page. Every number is a COUNT(*)
// over live tables; nothing here is estimated or simulated.
const { Op } = require('sequelize');
const db = require('../models');

async function overview() {
    const today = new Date().toISOString().slice(0, 10);
    const [
        clubs, listings, upcomingEvents, activeGigs,
        pendingBookings, pendingApplications, pendingProfiles, pendingEmployers,
        submittedReports, hunters, unreadThreads,
    ] = await Promise.all([
        db.NightClub.count({ where: { status: 'active' } }),
        db.LocalListing.count({ where: { status: 'active' } }),
        db.ClubEvent.count({ where: { status: 'active', event_date: { [Op.gte]: today } } }),
        db.NightGig.count({ where: { status: 'active', event_date: { [Op.gte]: today } } }),
        db.ClubBooking.count({ where: { status: 'pending' } }),
        db.LocalApplication.count({ where: { status: 'pending' } }),
        db.NightProfile.count({ where: { status: 'pending' } }),
        db.NightEmployer.count({ where: { status: 'pending' } }),
        db.BountyReport.count({ where: { status: 'submitted' } }),
        db.BountyParticipant.count(),
        db.BountyMessage.count({ where: { from_admin: false, read_by_recipient: false }, distinct: true, col: 'thread_user_id' }),
    ]);
    return {
        inventory: { clubs, listings, upcomingEvents, activeGigs, hunters },
        queues: { pendingBookings, pendingApplications, pendingProfiles, pendingEmployers, submittedReports, unreadThreads },
    };
}

module.exports = { overview };
