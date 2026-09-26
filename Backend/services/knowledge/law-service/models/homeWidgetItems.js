'use strict';
module.exports = (sequelize, DataTypes) =>
    sequelize.define('HomeWidgetItem', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        widget: { type: DataTypes.STRING(20), allowNull: false },
        title: { type: DataTypes.STRING(300), allowNull: false },
        summary: { type: DataTypes.TEXT, defaultValue: '' },
        source_name: { type: DataTypes.STRING(200) },
        url: { type: DataTypes.TEXT },
        image_url: { type: DataTypes.TEXT },
        credit: { type: DataTypes.TEXT },
        value: { type: DataTypes.STRING(100) },
        extra: { type: DataTypes.JSONB, defaultValue: {} },
        event_at: { type: DataTypes.DATE },
        expires_at: { type: DataTypes.DATE },
        region: { type: DataTypes.STRING(10) },
        source_key: { type: DataTypes.STRING(300) },
        sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
        published: { type: DataTypes.BOOLEAN, defaultValue: false },
        archived: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, { schema: 'legal', tableName: 'home_widget_items', underscored: true, timestamps: true });
