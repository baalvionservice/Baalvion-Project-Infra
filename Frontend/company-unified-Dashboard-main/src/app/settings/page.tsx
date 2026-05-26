'use client';

import { useState } from 'react';
import SettingsSidebar from './components/settings-sidebar';
import GeneralSettings from './components/general-settings';
import UsersRoles from './components/users-roles';
import BusinessManagement from './components/business-management';
import WhiteLabelSettings from './components/white-label-settings';

type SettingsSection = 'general' | 'users' | 'businesses' | 'integrations' | 'billing' | 'security' | 'white-label' | 'danger-zone';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">
          Manage your platform's configuration, users, and businesses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-1">
          <SettingsSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        </div>
        <div className="lg:col-span-4">
          {activeSection === 'general' && <GeneralSettings />}
          {activeSection === 'users' && <UsersRoles />}
          {activeSection === 'businesses' && <BusinessManagement />}
          {activeSection === 'white-label' && <WhiteLabelSettings />}
          
          {(activeSection !== 'general' && activeSection !== 'users' && activeSection !== 'businesses' && activeSection !== 'white-label') && (
             <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Content for {activeSection.replace('-', ' ')} goes here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
