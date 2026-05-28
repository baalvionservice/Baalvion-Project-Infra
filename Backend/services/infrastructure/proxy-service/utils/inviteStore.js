'use strict';

// Shared in-memory store for pending invitations.
// Both platformController (writes) and authController (reads/consumes) use this.
const pendingInvites = [];

const findByToken = (token) =>
  pendingInvites.find(i => i.token === token && new Date(i.expiresAt) > new Date()) || null;

const remove = (token) => {
  const idx = pendingInvites.findIndex(i => i.token === token);
  if (idx !== -1) pendingInvites.splice(idx, 1);
};

module.exports = { pendingInvites, findByToken, remove };
