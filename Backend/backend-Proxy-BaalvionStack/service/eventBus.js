const EventEmitter = require('events');

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.socketServer = null;
    }

    attachSocketServer(io) {
        this.socketServer = io;
    }

    publish(event) {
        this.emit(event.type, event);

        if (this.socketServer) {
            this.socketServer.to(`org:${event.orgId}`).emit('event', event);
            this.socketServer.to(`org:${event.orgId}`).emit(event.type, event);
        }
    }
}

module.exports = new EventBus();