'use strict';
const { Router } = require('express');
const ctrl = require('../controller/taxonomyController');
const authorCtrl = require('../controller/authorController');
const { loadCmsRole, requireCmsRole } = require('../middleware/cmsAccess');
const { validate } = require('../middleware/validate');
const { createCategorySchema, updateCategorySchema, reorderCategoriesSchema, createTagSchema, updateTagSchema } = require('../validators/taxonomySchemas');
const { createAuthorSchema, updateAuthorSchema } = require('../validators/authorSchemas');

const router = Router({ mergeParams: true }); // receives websiteId from parent

// Categories — /cms/websites/:websiteId/categories
router.get('/categories', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.listCategories);
router.post('/categories', loadCmsRole, requireCmsRole('cms_editor'), validate(createCategorySchema), ctrl.createCategory);
router.post('/categories/reorder', loadCmsRole, requireCmsRole('cms_editor'), validate(reorderCategoriesSchema), ctrl.reorderCategories);
router.patch('/categories/:categoryId', loadCmsRole, requireCmsRole('cms_editor'), validate(updateCategorySchema), ctrl.updateCategory);
router.delete('/categories/:categoryId', loadCmsRole, requireCmsRole('cms_editor'), ctrl.deleteCategory);

// Tags — /cms/websites/:websiteId/tags
router.get('/tags', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.listTags);
router.post('/tags', loadCmsRole, requireCmsRole('cms_editor'), validate(createTagSchema), ctrl.createTag);
router.patch('/tags/:tagId', loadCmsRole, requireCmsRole('cms_editor'), validate(updateTagSchema), ctrl.updateTag);
router.delete('/tags/:tagId', loadCmsRole, requireCmsRole('cms_editor'), ctrl.deleteTag);

// Authors / contributors — /cms/websites/:websiteId/authors
router.get('/authors', loadCmsRole, requireCmsRole('cms_viewer'), authorCtrl.listAuthors);
router.post('/authors', loadCmsRole, requireCmsRole('cms_editor'), validate(createAuthorSchema), authorCtrl.createAuthor);
router.patch('/authors/:authorId', loadCmsRole, requireCmsRole('cms_editor'), validate(updateAuthorSchema), authorCtrl.updateAuthor);
router.delete('/authors/:authorId', loadCmsRole, requireCmsRole('cms_editor'), authorCtrl.deleteAuthor);

module.exports = router;
