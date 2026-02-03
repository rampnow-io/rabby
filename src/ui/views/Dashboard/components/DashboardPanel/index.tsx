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
    <div className="bg-white rounded-t-[24px] px-[16px] pt-[14px] pb-[12px] flex flex-col h-full">
      <Tabs defaultValue="assets" className="flex flex-col h-full">
        <TabsList className="bg-white justify-start shrink-0 sticky top-0 z-10 w-full py-2">
          <TabsTrigger className={className} value="assets">
            Assets
          </TabsTrigger>
          <TabsTrigger className={className} value="activity">
            Activity
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="assets" className="h-full">
            <AssetList visible={true} onClose={() => {}} />
          </TabsContent>

          <TabsContent value="activity" className="h-full">
            <HistoryList />
          </TabsContent>
        </div>
      </Tabs>

      <RateModal />
    </div>
  );
};
