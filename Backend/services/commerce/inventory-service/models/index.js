'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host, port: config.db.port, dialect: 'postgres', dialectOptions: { ssl: buildPgSsl() },
    logging: config.env === 'development' ? (sql) => console.log('[Inventory DB]', sql) : false,
    define: { schema: config.db.schema, underscored: true, timestamps: true },
    pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
});

const InventoryWarehouse   = require('./inventoryWarehouse')(sequelize, DataTypes);
const InventoryStock       = require('./inventoryStock')(sequelize, DataTypes);
const InventoryMovement    = require('./inventoryMovement')(sequelize, DataTypes);
const InventoryAdjustment  = require('./inventoryAdjustment')(sequelize, DataTypes);
const InventoryReservation = require('./inventoryReservation')(sequelize, DataTypes);

InventoryWarehouse.hasMany(InventoryStock, { foreignKey: 'warehouseId', as: 'stockItems' });
InventoryStock.belongsTo(InventoryWarehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

InventoryWarehouse.hasMany(InventoryMovement, { foreignKey: 'warehouseId', as: 'movements' });
InventoryMovement.belongsTo(InventoryWarehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

InventoryWarehouse.hasMany(InventoryReservation, { foreignKey: 'warehouseId', as: 'reservations' });
InventoryReservation.belongsTo(InventoryWarehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

const db = {
    sequelize, Sequelize, Op: Sequelize.Op,
    connectDB: async () => { await sequelize.authenticate(); console.log('[Inventory Service] Database connection established'); },
    InventoryWarehouse, InventoryStock, InventoryMovement, InventoryAdjustment, InventoryReservation,
};

module.exports = db;
