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
        'grid grid-cols-3 gap-2 overflow-hidden overflow-y-auto rounded-md bg-white text-center',
        className
      )}
      style={{
        gridTemplateRows: `repeat(${rowCount}, ${ITEM_H}px)`,
      }}
    >
      {checkedWords.map((word, idx) => {
        const number = idx + 1;
        const clearable = closable && !!word.trim();
        const errored = errorIndexes.includes(idx);
        const focused = focusingIndex === idx && !errored;

        return (
          <div
            key={`word-item-${word}-${idx}`}
            className="relative flex h-[40px] items-center justify-center rounded-xl border border-[1.5px] border-[var(--r-neutral-line)] bg-[rgba(217,217,217,0.2)] text-[16px] font-medium text-[var(--r-neutral-title-1)] cursor-pointer"
            onClick={() => {
              if (focusable) {
                onFocusWord?.({ word, index: idx });
              }
            }}
          >
            {/* Focus / Error Border */}
            {focused && (
              <div className="absolute inset-0 rounded-md border border-[var(--r-blue-default,#7084ff)]" />
            )}
            {errored && (
              <div className="absolute inset-0 rounded-md border border-[var(--r-red-default)]" />
            )}

            {/* Number */}
            <span className="absolute left-2 top-1 text-[10px] font-normal text-[var(--r-neutral-body)]">
              {number}.
            </span>

            {/* Word */}
            <span className="leading-[37px]">{word}</span>

            {/* Close Icon */}
            {clearable && (
              <button
                className="absolute right-2 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center"
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
