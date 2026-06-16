'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    dialectOptions: { ssl: buildPgSsl() },
    logging: config.env === 'development' ? console.log : false,
    define: { underscored: true, timestamps: true },
});

const db = { sequelize, Sequelize };

db.Agent = require('./agents')(sequelize, DataTypes);
db.Property = require('./properties')(sequelize, DataTypes);
db.PropertyImage = require('./property_images')(sequelize, DataTypes);
db.PropertyDocument = require('./property_documents')(sequelize, DataTypes);
db.Viewing = require('./viewings')(sequelize, DataTypes);
db.Inquiry = require('./inquiries')(sequelize, DataTypes);
db.Favorite = require('./favorites')(sequelize, DataTypes);

// Agent <-> Property
db.Agent.hasMany(db.Property, { foreignKey: 'agent_id', as: 'properties' });
db.Property.belongsTo(db.Agent, { foreignKey: 'agent_id', as: 'agent' });

// Property <-> PropertyImage
db.Property.hasMany(db.PropertyImage, { foreignKey: 'property_id', as: 'images' });
db.PropertyImage.belongsTo(db.Property, { foreignKey: 'property_id', as: 'property' });

// Property <-> PropertyDocument
db.Property.hasMany(db.PropertyDocument, { foreignKey: 'property_id', as: 'documents' });
db.PropertyDocument.belongsTo(db.Property, { foreignKey: 'property_id', as: 'property' });

// Property <-> Viewing
db.Property.hasMany(db.Viewing, { foreignKey: 'property_id', as: 'viewings' });
db.Viewing.belongsTo(db.Property, { foreignKey: 'property_id', as: 'property' });

// Agent <-> Viewing
db.Agent.hasMany(db.Viewing, { foreignKey: 'agent_id', as: 'viewings' });
db.Viewing.belongsTo(db.Agent, { foreignKey: 'agent_id', as: 'agent' });

// Property <-> Inquiry
db.Property.hasMany(db.Inquiry, { foreignKey: 'property_id', as: 'inquiries' });
db.Inquiry.belongsTo(db.Property, { foreignKey: 'property_id', as: 'property' });

// Agent <-> Inquiry
db.Agent.hasMany(db.Inquiry, { foreignKey: 'agent_id', as: 'inquiries' });
db.Inquiry.belongsTo(db.Agent, { foreignKey: 'agent_id', as: 'agent' });

// Property <-> Favorite
db.Property.hasMany(db.Favorite, { foreignKey: 'property_id', as: 'favorites' });
db.Favorite.belongsTo(db.Property, { foreignKey: 'property_id', as: 'property' });

module.exports = db;
