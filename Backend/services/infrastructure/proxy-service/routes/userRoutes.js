const express = require('express');
const router = express.Router();

const userController = require('../controller/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

router.route('/me').get(authMiddleware, userController.getProfile);
router.route('/change-password').post(authMiddleware, validate(schemas.changePasswordSchema), userController.changePassword);

router.route('/')
	.get(authMiddleware, requirePermission('user:view'), userController.listUsers);

router.route('/invite')
	.post(authMiddleware, requirePermission('user:invite'), validate(schemas.inviteUserSchema), userController.inviteUser);

router.route('/:id')
	.put(authMiddleware, requirePermission('user:update'), validate(schemas.genericObjectSchema), userController.updateUser)
	.delete(authMiddleware, requirePermission('user:delete'), userController.deleteUser);

router.route('/:id/role')
	.put(authMiddleware, requirePermission('user:update'), validate(schemas.roleSchema), userController.updateRole);

router.route('/:id/suspend')
	.post(authMiddleware, requirePermission('user:suspend'), userController.suspend);

router.route('/:id/reactivate')
	.post(authMiddleware, requirePermission('user:suspend'), userController.reactivate);

module.exports = router;