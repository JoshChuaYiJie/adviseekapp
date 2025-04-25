
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppliedProgrammes } from '@/components/sections/AppliedProgrammes';
import { MyResume } from '@/components/sections/MyResume';
import { ApplyNow } from '@/components/sections/ApplyNow';
import { MockInterviews } from '@/components/sections/MockInterviews';
import { GetPaid } from '@/components/sections/GetPaid';

interface DashboardProps {
  selectedSection: string;
}

const Dashboard = ({ selectedSection }: DashboardProps) => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">{t('navigation.' + selectedSection.replace('-', '_'))}</h1>
      {selectedSection === 'applied-programmes' && <AppliedProgrammes />}
      {selectedSection === 'my-resume' && <MyResume />}
      {selectedSection === 'apply-now' && <ApplyNow />}
      {selectedSection === 'mock-interviews' && <MockInterviews />}
      {selectedSection === 'get-paid' && <GetPaid />}
    </div>
  );
};

export default Dashboard;
