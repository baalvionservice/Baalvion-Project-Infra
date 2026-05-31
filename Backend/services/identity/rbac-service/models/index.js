'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: config.env === 'development' ? false : false,
    define: { underscored: true, timestamps: true },
});

const db = { sequelize, Sequelize };

db.Tenant           = require('./tenant')(sequelize, DataTypes);
db.Role             = require('./role')(sequelize, DataTypes);
db.Permission       = require('./permission')(sequelize, DataTypes);
db.RolePermission   = require('./rolePermission')(sequelize, DataTypes);
db.RoleAssignment   = require('./roleAssignment')(sequelize, DataTypes);
db.Policy           = require('./policy')(sequelize, DataTypes);
db.SubjectAttribute = require('./subjectAttribute')(sequelize, DataTypes);
db.DecisionLog      = require('./decisionLog')(sequelize, DataTypes);

// ─── Associations ─────────────────────────────────────────────────────────────
// Tenant tree
db.Tenant.hasMany(db.Tenant, { as: 'children', foreignKey: 'parent_id' });
db.Tenant.belongsTo(db.Tenant, { as: 'parent', foreignKey: 'parent_id' });

// Tenant ⇄ Roles
db.Tenant.hasMany(db.Role, { foreignKey: 'tenant_id' });
db.Role.belongsTo(db.Tenant, { foreignKey: 'tenant_id' });

// Role hierarchy (self-reference)
db.Role.belongsTo(db.Role, { as: 'parentRole', foreignKey: 'parent_role_id' });

// Role ⇄ Permission (through role_permissions)
db.Role.belongsToMany(db.Permission, { through: db.RolePermission, foreignKey: 'role_id', otherKey: 'permission_id' });
db.Permission.belongsToMany(db.Role, { through: db.RolePermission, foreignKey: 'permission_id', otherKey: 'role_id' });
db.Role.hasMany(db.RolePermission, { foreignKey: 'role_id' });
db.RolePermission.belongsTo(db.Role, { foreignKey: 'role_id' });
db.RolePermission.belongsTo(db.Permission, { foreignKey: 'permission_id' });

// Role ⇄ Assignments
db.Role.hasMany(db.RoleAssignment, { foreignKey: 'role_id' });
db.RoleAssignment.belongsTo(db.Role, { foreignKey: 'role_id' });
db.RoleAssignment.belongsTo(db.Tenant, { foreignKey: 'tenant_id' });

// Tenant ⇄ Policies
db.Tenant.hasMany(db.Policy, { foreignKey: 'tenant_id' });
db.Policy.belongsTo(db.Tenant, { foreignKey: 'tenant_id' });

module.exports = db;
