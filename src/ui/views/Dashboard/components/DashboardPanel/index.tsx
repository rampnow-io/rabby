import RateModal from '@/ui/component/RateModal/RateModal';

import React from 'react';

import { AssetList } from '@/ui/views/CommonPopup/AssetList/AssetList';
import { ApprovalsTabPane } from '@/ui/views/DesktopProfile/components/ApprovalsTabPane';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/primitives';
import { HistoryList } from '@/ui/views/History/components/HistoryList';

const className =
  '!bg-white data-[state=active]:!bg-white shadow-none data-[state=active]:!hover:bg-white data-[state=active]:shadow-none w-16';

export const DashboardPanel: React.FC = () => {
  return (
    <div className="relative !bg-white rounded-t-[24px] px-[16px] pt-[14px] pb-[12px] h-[420px] flex flex-col">
      <Tabs defaultValue="tokens" className="flex flex-col h-full">
        <TabsList className="bg-white justify-start shrink-0">
          <TabsTrigger className={className} value="Assets">
            Assets
          </TabsTrigger>
          <TabsTrigger className={className} value="transactions">
            Activity
          </TabsTrigger>
          <TabsTrigger className={className} value="approvals">
            Approvals
          </TabsTrigger>
        </TabsList>

        {/* IMPORTANT */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="tokens" className="h-full">
            <AssetList visible={true} onClose={() => {}} />
          </TabsContent>

          <TabsContent value="transactions" className="h-full">
            <HistoryList />
          </TabsContent>

          <TabsContent value="approvals" className="h-full">
            <ApprovalsTabPane isDesktop={false} />
          </TabsContent>
        </div>
      </Tabs>

      <RateModal />
    </div>
  );
};
