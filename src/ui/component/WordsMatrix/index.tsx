import React from 'react';
import clsx from 'clsx';
import MnemonicsInputs from './MnemonicsInputs';
import IconCloseSvg from 'ui/assets/close-icon.svg';

const ITEM_H = 40;
const ROW_COUNT = 3;

type Props = {
  className?: string;
  rowCount?: number;
  words?: string[];
  errorIndexes?: number[];
  focusable?: boolean;
  focusingIndex?: number;
  onFocusWord?: (_: { word: string; index: number }) => void;
  closable?: boolean;
  onCloseWord?: (_: { word: string; index: number }) => void;
};

function WordsMatrix({
  className,
  rowCount = ROW_COUNT,
  words = [],
  focusable = true,
  focusingIndex = -1,
  onFocusWord,
  errorIndexes = [],
  closable = true,
  onCloseWord,
}: Props) {
  const [checkedWords, setCheckedWords] = React.useState<string[]>(words);

  React.useEffect(() => {
    setCheckedWords(words);
  }, [words]);

  return (
    <div
      className={clsx(
        'grid grid-cols-3 w-full sm:grid-cols-2 gap-[26px] overflow-y-auto',
        className
      )}
      style={{
        gridTemplateRows: `repeat(${rowCount}, ${ITEM_H}px)`,
      }}
    >
      {checkedWords.map((word, idx) => {
        const number = idx + 1;
        return (
          <div
            key={idx}
            className="relative flex h-[40px] overflow-hidden rounded-[10px] border bg-white cursor-pointer"
            onClick={() => {
              if (focusable) {
                onFocusWord?.({ word, index: idx });
              }
            }}
          >
            {/* Number box */}
            <div className="flex w-8 items-center justify-center border-r border-[var(--r-neutral-line)] text-[14px] text-secondary-foreground font-medium">
              {number}
            </div>

            <div className="flex px-2 flex-1 items-center text-[16px] font-medium text-primary-foreground ">
              {word}
            </div>

            {closable && word && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseWord?.({ word, index: idx });
                }}
              >
                <img src={IconCloseSvg} alt="close" className="h-2 w-2" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

WordsMatrix.MnemonicsInputs = MnemonicsInputs;
export default WordsMatrix;
