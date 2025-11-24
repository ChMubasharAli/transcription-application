import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAnnouncements } from '@/components/admin/sections/AdminAnnouncements';
import { AdminDomains } from '@/components/admin/sections/AdminDomains';
import { AdminUsers } from '@/components/admin/sections/AdminUsers';
import { AdminSettings } from '@/components/admin/sections/AdminSettings';
import { AdminVocabulary } from '@/components/admin/sections/AdminVocabulary';
import { AdminRapidReview } from '@/components/admin/sections/AdminRapidReview';
import { AdminMockTests } from '@/components/admin/sections/AdminMockTests';

export const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState('announcements');

  const renderSection = () => {
    switch (activeSection) {
      case 'announcements':
        return <AdminAnnouncements />;
      case 'domains':
        return <AdminDomains />;
      case 'mock-tests':
        return <AdminMockTests />;
      case 'users':
        return <AdminUsers />;
      case 'vocabulary':
        return <AdminVocabulary />;
      case 'rapid-review':
        return <AdminRapidReview />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <AdminAnnouncements />;
    }
  };

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderSection()}
    </AdminLayout>
  );
};