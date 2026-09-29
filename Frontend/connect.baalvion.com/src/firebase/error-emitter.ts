
'use client';

import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

class ErrorEmitter extends EventEmitter {
  emitPermissionError(error: FirestorePermissionError) {
    this.emit('permission-error', error);
  }
}

export const errorEmitter = new ErrorEmitter();
