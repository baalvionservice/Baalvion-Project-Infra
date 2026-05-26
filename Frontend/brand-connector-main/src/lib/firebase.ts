
'use client';

import { initializeFirebase } from '@/firebase';

// Re-exporting for backward compatibility, 
// though preferred usage is via the FirebaseProvider hooks.
const { auth, db, app } = initializeFirebase();
const storage = null; // Placeholder if needed

export { auth, db, app, storage };
