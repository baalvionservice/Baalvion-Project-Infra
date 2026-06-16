'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host, port: config.db.port, dialect: 'postgres',
    dialectOptions: { ssl: buildPgSsl() },
    logging: config.env === 'development' ? (sql) => console.log('[Commerce SQL]', sql) : false,
    define: { underscored: true, timestamps: true },
});

const db = { sequelize, Sequelize, Op: Sequelize.Op };

db.CommerceStore          = require('./commerceStore')(sequelize, DataTypes);
// commerce_store_members RETIRED: store/team roles are owned entirely by RBAC (rbac-service)
// via @baalvion/commerce-rbac. The model/association are removed so no local role state can be
// read or written. The table is dropped by migration 20260114-drop-commerce-store-members.
db.CommerceCategory       = require('./commerceCategory')(sequelize, DataTypes);
db.CommerceAttributeGroup = require('./commerceAttributeGroup')(sequelize, DataTypes);
db.CommerceAttribute      = require('./commerceAttribute')(sequelize, DataTypes);
db.CommerceProduct        = require('./commerceProduct')(sequelize, DataTypes);
db.CommerceProductVariant = require('./commerceProductVariant')(sequelize, DataTypes);
db.CommerceProductPricing = require('./commerceProductPricing')(sequelize, DataTypes);
db.CommerceProductMedia   = require('./commerceProductMedia')(sequelize, DataTypes);
db.CommerceCollection     = require('./commerceCollection')(sequelize, DataTypes);
db.CommerceCollectionProduct = require('./commerceCollectionProduct')(sequelize, DataTypes);
db.CommerceDiscount       = require('./commerceDiscount')(sequelize, DataTypes);
db.CommerceReview         = require('./commerceReview')(sequelize, DataTypes);

// Associations
db.CommerceStore.hasMany(db.CommerceCategory,     { foreignKey: 'storeId', as: 'categories' });
db.CommerceStore.hasMany(db.CommerceProduct,      { foreignKey: 'storeId', as: 'products' });
db.CommerceStore.hasMany(db.CommerceCollection,   { foreignKey: 'storeId', as: 'collections' });
db.CommerceStore.hasMany(db.CommerceDiscount,     { foreignKey: 'storeId', as: 'discounts' });

db.CommerceCategory.belongsTo(db.CommerceStore,   { foreignKey: 'storeId', as: 'store' });
db.CommerceCategory.belongsTo(db.CommerceCategory, { foreignKey: 'parentId', as: 'parent' });
db.CommerceCategory.hasMany(db.CommerceCategory,   { foreignKey: 'parentId', as: 'children' });
db.CommerceCategory.hasMany(db.CommerceProduct,    { foreignKey: 'categoryId', as: 'products' });

db.CommerceAttributeGroup.hasMany(db.CommerceAttribute, { foreignKey: 'groupId', as: 'attributes' });
db.CommerceAttribute.belongsTo(db.CommerceAttributeGroup, { foreignKey: 'groupId', as: 'group' });

db.CommerceProduct.belongsTo(db.CommerceStore,    { foreignKey: 'storeId', as: 'store' });
db.CommerceProduct.belongsTo(db.CommerceCategory, { foreignKey: 'categoryId', as: 'category' });
db.CommerceProduct.hasMany(db.CommerceProductVariant, { foreignKey: 'productId', as: 'variants' });
db.CommerceProduct.hasMany(db.CommerceProductPricing, { foreignKey: 'productId', as: 'pricing' });
db.CommerceProduct.hasMany(db.CommerceProductMedia,   { foreignKey: 'productId', as: 'media' });
db.CommerceProduct.hasMany(db.CommerceReview,         { foreignKey: 'productId', as: 'reviews' });

db.CommerceProductVariant.belongsTo(db.CommerceProduct, { foreignKey: 'productId', as: 'product' });
db.CommerceProductVariant.hasMany(db.CommerceProductPricing, { foreignKey: 'variantId', as: 'pricing' });

db.CommerceCollection.belongsTo(db.CommerceStore, { foreignKey: 'storeId', as: 'store' });
db.CommerceCollection.belongsToMany(db.CommerceProduct, { through: db.CommerceCollectionProduct, foreignKey: 'collectionId', otherKey: 'productId', as: 'products' });
db.CommerceProduct.belongsToMany(db.CommerceCollection, { through: db.CommerceCollectionProduct, foreignKey: 'productId', otherKey: 'collectionId', as: 'collections' });

db.connectDB = async () => { await sequelize.authenticate(); console.log('[Commerce] Database connection established'); };

module.exports = db;
