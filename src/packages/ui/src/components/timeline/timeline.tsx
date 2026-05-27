import { cn } from '@repo/utils';
import { ReactNode } from 'react';
import { Image } from '../../primitives';
import { FailedIcon, PendingIcon, ProcessingIcon, SuccessIcon } from '../icon';

export enum TimelineStatus {
  SUCCESS = 'success',
  PENDING = 'pending',
  PROCESSING = 'processing',
  FAILED = 'failed',
}

export interface TimelineStep {
  title: React.ReactNode;
  description: React.ReactNode;
  status?: TimelineStatus;
  icon?: string;
  className?: string;
  image?: React.ReactNode;
}

interface TimelineProps {
  steps: TimelineStep[];
}

const statusIconMap: Record<TimelineStatus, ReactNode> = {
  [TimelineStatus.SUCCESS]: <SuccessIcon />,
  [TimelineStatus.PENDING]: <PendingIcon />,
  [TimelineStatus.PROCESSING]: <ProcessingIcon />,
  [TimelineStatus.FAILED]: <FailedIcon />,
};

const Timeline = ({ steps }: TimelineProps) => {
  return (
    <div className="flex flex-col justify-center w-full gap-7">
      {steps.map((step, index) => (
        <div className="flex flex-col w-full" key={index}>
          <div className="flex items-center gap-4 tracking-tight w-full">
            <div className="flex flex-col items-center gap-5">
              {step?.image ? (
                step?.image
              ) : step?.icon ? (
                <Image
                  src={step.icon}
                  width={50}
                  height={50}
                  draggable={false}
                  alt={`${String(step.title)} icon`}
                />
              ) : (
                statusIconMap[step.status ?? TimelineStatus.PENDING]
              )}
            </div>

            <div className="flex flex-col w-full">
              <h3
                className={cn(
                  'text-base font-medium text-black',
                  step.className
                )}
              >
                {step.title}
              </h3>
              <div className="text-sm text-[#6C6C76]">{step.description}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export { Timeline as TimeLine };
