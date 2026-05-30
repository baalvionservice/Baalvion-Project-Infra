const bcrypt = require('bcrypt');
const config = require('../config/appConfig');
const store = require('./platformStore');
const authService = require('./authService');
const { AppError } = require('../utils/errors');

const createUser = async (userData) => {
    const existing = await store.findUserByEmail(userData.email);
    if (existing) {
        throw new AppError('USER_EXISTS', 'User already exists', 400);
    }

    const passwordHash = await bcrypt.hash(userData.password, config.security.bcryptRounds);
    return store.insert('users', {
        orgId: userData.orgId || 'org_demo',
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        role: userData.role || 'viewer',
        status: userData.status || 'active',
        passwordHash,
        emailVerified: false,
        mfaEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
};

const existingUser = (email) => store.findUserByEmail(email);

const loginUser = (email, password) => authService.login({ email, password });

const refreshAccessToken = async (refreshToken) => {
    const result = await authService.refresh(refreshToken);
    return result.token;
};

const getUserProfile = async (userId) => {
    const user = await store.getById('users', userId);
    if (!user) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    return authService.sanitizeUser(user);
};

const updateProfile = async (auth, payload) => {
    const update = {};
    if (payload.name !== undefined) update.fullName = payload.name;
    if (payload.company !== undefined) update.company = payload.company;
    if (payload.timezone !== undefined) update.timezone = payload.timezone;
    const user = await store.update('users', auth.userId, update, auth.orgId);
    if (!user) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }
    return authService.sanitizeUser(user);
};

const changePassword = async (userId, oldPassword, newPassword) => {
    const user = await store.getById('users', userId);
    if (!user) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) {
        throw new AppError('INVALID_CREDENTIALS', 'Old password incorrect', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    await store.update('users', user.id, { passwordHash }, user.orgId);
};

const listUsers = async (auth, query) => {
    const users = await store.getCollection('users', auth.orgId);
    return store.paginate(users.map(authService.sanitizeUser), query.page, query.pageSize);
};

const inviteUser = async (auth, payload) => {
    const user = await createUser({ ...payload, orgId: auth.orgId, password: payload.password || 'InviteOnly123!' });
    await store.insert('orgMemberships', {
        orgId: auth.orgId,
        userId: user.id,
        role: user.role,
        invitedBy: auth.userId,
        createdAt: new Date().toISOString(),
    });
    authService.issueEvent('user.invited', auth.orgId, { userId: user.id, email: user.email, role: user.role });
    return authService.sanitizeUser(user);
};

const updateUser = async (auth, id, payload) => {
    const user = await store.update('users', id, payload, auth.orgId);
    if (!user) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    return authService.sanitizeUser(user);
};

const deleteUser = async (auth, id) => {
    const removed = await store.remove('users', id, auth.orgId);
    if (!removed) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }
};

const updateUserRole = async (auth, id, role) => {
    const user = await updateUser(auth, id, { role });
    authService.issueEvent('user.role.changed', auth.orgId, { userId: id, role });
    return user;
};

const suspendUser = async (auth, id, status = 'suspended') => {
    await updateUser(auth, id, { status });
};

const reactivateUser = async (auth, id) => {
    await updateUser(auth, id, { status: 'active' });
};

module.exports = {
    createUser,
    existingUser,
    loginUser,
    refreshAccessToken,
    getUserProfile,
    updateProfile,
    changePassword,
    listUsers,
    inviteUser,
    updateUser,
    deleteUser,
    updateUserRole,
    suspendUser,
    reactivateUser,
};