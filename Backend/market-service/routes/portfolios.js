'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/portfolioController');

router.get('/', authMiddleware, ctrl.listPortfolios);
router.post('/', authMiddleware, ctrl.createPortfolio);
router.get('/:id', authMiddleware, ctrl.getPortfolio);
router.patch('/:id', authMiddleware, ctrl.updatePortfolio);
router.delete('/:id', authMiddleware, ctrl.deletePortfolio);
router.get('/:id/performance', authMiddleware, ctrl.getPerformance);
router.post('/:id/holdings', authMiddleware, ctrl.addHolding);
router.delete('/:id/holdings/:symbol', authMiddleware, ctrl.removeHolding);

module.exports = router;
