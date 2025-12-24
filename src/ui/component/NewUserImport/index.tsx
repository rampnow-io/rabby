import { UIContainer } from '@/ui/provider';
import { Image } from '@repo/ui/primitives';
export const UiProvider = ({
  children,
}: React.PropsWithChildren<{ children: React.ReactNode }>) => {
  return (
    <div className="relative items-center justify-center overflow-hidden lg:flex lg:min-h-screen lg:bg-[#1A412C]">
      <img
        src="https://cdn.rampnow.io/image/background/default.png"
        alt="Background"
        className="hidden lg:block absolute inset-0 h-full w-full object-cover "
      />
      <img
        src="https://cdn.rampnow.io/image/icon/general/logo-green.svg"
        width={149.75}
        height={23}
        className="hide-on-mobile fixed left-10 top-8 z-10 m-4"
        draggable={false}
        alt="Logo"
      />
      <UIContainer isOnboarding={true}>{children}</UIContainer>
    </div>
  );
};
