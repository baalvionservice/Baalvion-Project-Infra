
'use client';

import { useState } from 'react';
import PinEntry from './pin-entry';
import PortalDashboard from './portal-dashboard';
import type { PortalConfig } from './page';

interface ClientPortalPageProps {
    portal: PortalConfig;
    initialAccess: boolean;
}

async function setSessionCookie(portalId: string) {
    const response = await fetch('/api/portal/auth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ portalId }),
    });
    return response.ok;
}

export default function ClientPortalPage({ portal, initialAccess }: ClientPortalPageProps) {
    const hasPin = !!portal.pin;
    const [hasAccess, setHasAccess] = useState(initialAccess);

    const handlePinSuccess = async () => {
        const success = await setSessionCookie(portal.id);
        if (success) {
            setHasAccess(true);
        }
    };

    if (hasPin && !hasAccess) {
        return <PinEntry portal={portal} onSuccess={handlePinSuccess} />;
    }

    return <PortalDashboard portal={portal} />;
}
