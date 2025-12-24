import { Header } from '@repo/ui';
import { Description } from '@repo/ui/primitives';
import { cn } from '@repo/utils';

function SectionHeader({
  title,
  description,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-6 py-2', className)}>
      <Header>{title}</Header>
      {description ? (
        <Description className="mt-2">{description}</Description>
      ) : null}
    </div>
  );
}

export default SectionHeader;
