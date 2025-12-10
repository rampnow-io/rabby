import { CDN_URL, Image } from '../primitives';

interface LoaderProps {
  text?: string;
  disabled?: boolean;
}

function Loader({ text = 'Please wait', disabled = false }: LoaderProps) {
  if (disabled) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <Image
        src={`${CDN_URL}/image/banner/loader-circle.gif`}
        width={171}
        height={171}
        draggable={false}
        alt="Loading Spinner"
      />
      <div className="text-m mt-5 text-center">{text}</div>
    </div>
  );
}

Loader.displayName = 'Loader';

export { Loader };
