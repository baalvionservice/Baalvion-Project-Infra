'use strict';
const { Router } = require('express');
const ctrl = require('../controller/storeController');
const { validate } = require('../middleware/validate');
const { loadStoreRole, requireStoreRole } = require('../middleware/commerceAccess');
const { createStoreSchema, updateStoreSchema, addMemberSchema, updateMemberRoleSchema } = require('../validators/storeSchemas');

const router = Router();

router.get('/', ctrl.listStores);
router.post('/', validate(createStoreSchema), ctrl.createStore);

router.get('/:storeId', loadStoreRole, ctrl.getStore);
router.patch('/:storeId', loadStoreRole, requireStoreRole('store_admin'), validate(updateStoreSchema), ctrl.updateStore);
router.delete('/:storeId', loadStoreRole, requireStoreRole('store_admin'), ctrl.deleteStore);

router.get('/:storeId/members', loadStoreRole, requireStoreRole('commerce_manager'), ctrl.listMembers);
router.post('/:storeId/members', loadStoreRole, requireStoreRole('store_admin'), validate(addMemberSchema), ctrl.addMember);
router.patch('/:storeId/members/:userId', loadStoreRole, requireStoreRole('store_admin'), validate(updateMemberRoleSchema), ctrl.updateMemberRole);
router.delete('/:storeId/members/:userId', loadStoreRole, requireStoreRole('store_admin'), ctrl.removeMember);

module.exports = router;
