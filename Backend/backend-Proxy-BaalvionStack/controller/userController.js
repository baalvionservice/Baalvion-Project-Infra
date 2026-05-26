const userService = require('../service/userService');
const { sendSuccess, sendPaginated } = require('../utils/response');


const register = async (req, res, next) => {
    try {
        const user = await userService.createUser(req.body);
        return sendSuccess(req, res, user, 201);
    } catch (error) {
        return next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await userService.loginUser(email, password);
        return sendSuccess(req, res, result);
    } catch (error) {
        return next(error);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const newAccessToken = await userService.refreshAccessToken(refreshToken);
        return sendSuccess(req, res, { token: newAccessToken });
    } catch (error) {
        return next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await userService.getUserProfile(userId);
        return sendSuccess(req, res, user);
    } catch (error) {
        return next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;
        await userService.changePassword(userId, oldPassword, newPassword);
        return sendSuccess(req, res, null, 200);
    } catch (error) {
        return next(error);
    }
};

const listUsers = async (req, res, next) => {
    try {
        return sendPaginated(req, res, await userService.listUsers(req.auth, req.query));
    } catch (error) {
        return next(error);
    }
};

const inviteUser = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await userService.inviteUser(req.auth, req.body), 201);
    } catch (error) {
        return next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await userService.updateUser(req.auth, req.params.id, req.body));
    } catch (error) {
        return next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        await userService.deleteUser(req.auth, req.params.id);
        return sendSuccess(req, res, null, 200);
    } catch (error) {
        return next(error);
    }
};

const updateRole = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await userService.updateUserRole(req.auth, req.params.id, req.body.role));
    } catch (error) {
        return next(error);
    }
};

const suspend = async (req, res, next) => {
    try {
        await userService.suspendUser(req.auth, req.params.id);
        return sendSuccess(req, res, null, 200);
    } catch (error) {
        return next(error);
    }
};

const reactivate = async (req, res, next) => {
    try {
        await userService.reactivateUser(req.auth, req.params.id);
        return sendSuccess(req, res, null, 200);
    } catch (error) {
        return next(error);
    }
};


module.exports = {
    register,
    login,
    refreshToken,
    getProfile,
    changePassword,
    listUsers,
    inviteUser,
    updateUser,
    deleteUser,
    updateRole,
    suspend,
    reactivate,
};