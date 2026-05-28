const authService = require('../service/authService');
const userService = require('../service/userService');
const store = require('../service/platformStore');
const inviteStore = require('../utils/inviteStore');
const config = require('../config/appConfig');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const setRefreshCookie = (res, refreshToken) => {
    res.cookie(config.refreshCookieName, refreshToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

const clearRefreshCookie = (res) => {
    res.clearCookie(config.refreshCookieName);
};

const register = async (req, res, next) => {
    try {
        const user = await userService.createUser(req.body);
        return sendSuccess(req, res, authService.sanitizeUser(user), 201);
    } catch (error) {
        return next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const result = await authService.login({
            email: req.body.email,
            password: req.body.password,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        setRefreshCookie(res, result.refreshToken);
        return sendSuccess(req, res, {
            token: result.token,
            refreshToken: result.refreshToken,
            user: result.user,
        });
    } catch (error) {
        return next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.[config.refreshCookieName] || req.body.refreshToken;
        await authService.logout({
            refreshToken,
            sessionId: req.auth?.sessionId,
            userId: req.auth?.userId,
            orgId: req.auth?.organizationId,
        });
        clearRefreshCookie(res);
        return sendSuccess(req, res, null, 200);
    } catch (error) {
        return next(error);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const token = req.cookies?.[config.refreshCookieName] || req.body.refreshToken;
        const result = await authService.refresh(token);
        // Refresh tokens rotate on every use — reset the cookie to the new value.
        if (result.refreshToken) setRefreshCookie(res, result.refreshToken);
        return sendSuccess(req, res, result);
    } catch (error) {
        return next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        await authService.forgotPassword(req.body);
        return sendSuccess(req, res, null, 200);
    } catch (error) {
        return next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        await authService.resetPassword(req.body);
        return sendSuccess(req, res, null, 200);
    } catch (error) {
        return next(error);
    }
};

const verifyEmail = async (req, res, next) => {
    try {
        await authService.verifyEmail(req.body);
        return sendSuccess(req, res, null, 200);
    } catch (error) {
        return next(error);
    }
};

const enableMfa = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await authService.enableMfa(req.auth));
    } catch (error) {
        return next(error);
    }
};

const verifyMfa = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await authService.verifyMfa(req.auth, req.body.code));
    } catch (error) {
        return next(error);
    }
};

const disableMfa = async (req, res, next) => {
    try {
        await authService.disableMfa(req.auth);
        return sendSuccess(req, res, null, 200);
    } catch (error) {
        return next(error);
    }
};

const validateInvite = async (req, res, next) => {
    try {
        const { token } = req.query;
        if (!token) throw new AppError('MISSING_TOKEN', 'Token is required', 400);
        const invite = inviteStore.findByToken(token);
        if (!invite) throw new AppError('INVALID_TOKEN', 'Invitation token is invalid or has expired', 400);
        const org = await store.getById('organizations', invite.orgId);
        return sendSuccess(req, res, {
            email: invite.email,
            role: invite.role,
            orgName: org?.name || 'Baalvion NetStack',
            expiresAt: invite.expiresAt,
        });
    } catch (error) {
        return next(error);
    }
};

const acceptInvite = async (req, res, next) => {
    try {
        const { token, email, password, fullName } = req.body;
        if (!token) throw new AppError('MISSING_TOKEN', 'Token is required', 400);

        const invite = inviteStore.findByToken(token);
        if (!invite) throw new AppError('INVALID_TOKEN', 'Invitation token is invalid or has expired', 400);
        if (invite.email.toLowerCase() !== email.toLowerCase())
            throw new AppError('EMAIL_MISMATCH', 'Email does not match the invitation', 400);

        // Create the user account
        const user = await userService.createUser({
            email: invite.email,
            password,
            fullName: fullName || invite.name,
            orgId: invite.orgId,
            role: invite.role,
        });

        // Add to org membership
        await store.insert('orgMemberships', {
            orgId: invite.orgId,
            userId: user.id,
            role: invite.role,
            invitedBy: invite.invitedBy,
            status: 'active',
        });

        // Consume the invite token
        inviteStore.remove(token);

        // Log them in immediately
        const result = await authService.login({
            email: invite.email,
            password,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        setRefreshCookie(res, result.refreshToken);
        return sendSuccess(req, res, {
            token: result.token,
            refreshToken: result.refreshToken,
            user: result.user,
        }, 201);
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    register,
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    verifyEmail,
    enableMfa,
    verifyMfa,
    disableMfa,
    validateInvite,
    acceptInvite,
};