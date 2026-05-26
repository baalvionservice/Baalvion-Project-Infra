'use strict';
module.exports = {
    userRepo:       require('./UserRepository'),
    orgRepo:        require('./OrgRepository'),
    sessionRepo:    require('./SessionRepository'),
    rtRepo:         require('./RefreshTokenRepository'),
    inviteRepo:     require('./InvitationRepository'),
    auditRepo:      require('./AuditLogRepository'),
};
