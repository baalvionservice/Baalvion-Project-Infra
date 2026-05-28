const store = require('./platformStore');
const { AppError } = require('../utils/errors');

const listNotifications = (auth) => store.getCollection('notifications', auth.orgId);

const markRead = async (auth, id) => {
    const notification = await store.update('notifications', id, { read: true }, auth.orgId);
    if (!notification) {
        throw new AppError('NOTIFICATION_NOT_FOUND', 'Notification not found', 404);
    }
};

const markAllRead = async (auth) => {
    const notifications = await store.getCollection('notifications', auth.orgId);
    await Promise.all(notifications.map((item) => store.update('notifications', item.id, { read: true }, auth.orgId)));
};

module.exports = {
    listNotifications,
    markRead,
    markAllRead,
};