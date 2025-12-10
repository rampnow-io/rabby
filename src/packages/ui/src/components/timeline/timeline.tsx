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
              {step?.icon ? (
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
              <h3 className="text-base font-medium text-[#002C15]">
                {step.title}
              </h3>
              <p className="text-sm font-light text-[#6A6C6A]">
                {step.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export { Timeline as TimeLine };
