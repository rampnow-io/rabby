'use client';

import { json } from '@codemirror/lang-json';
import { githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror from '@uiw/react-codemirror';

export interface Props {
  data: string | object;
  onChange?: (value: string) => void;
}

function TextAreaEditor({ data, onChange }: Props) {
  const value = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  return (
    <CodeMirror
      value={value}
      theme={githubLight}
      extensions={[json()]}
      onChange={(value) => {
        onChange?.(value);
      }}
    />
  );
}

TextAreaEditor.displayName = 'TextAreaEditor';

export default TextAreaEditor;
