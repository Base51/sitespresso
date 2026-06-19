'use client';

import { useState, useRef } from 'react';
import type { CSSProperties } from 'react';

interface EditableFieldProps {
  value: string;
  original: string;
  onChange: (value: string) => void;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  style?: CSSProperties;
  multiline?: boolean;
}

export default function EditableField({
  value,
  original,
  onChange,
  tag: Tag = 'p',
  className = '',
  style,
  multiline = false,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function startEdit() {
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function commit(e: React.FocusEvent<HTMLTextAreaElement>) {
    const next = e.target.value.trim();
    if (next) onChange(next);
    setEditing(false);
  }

  const isModified = value !== original;

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        defaultValue={value}
        onBlur={commit}
        className={`w-full resize-none rounded border border-blue-400 bg-transparent px-1 py-0.5 outline-none ring-2 ring-blue-400 ${className}`}
        style={style}
        rows={multiline ? 4 : 2}
      />
    );
  }

  return (
    <span className="group relative inline-block">
      <Tag
        className={`cursor-text rounded transition hover:ring-2 hover:ring-blue-300/60 ${className}`}
        style={style}
        onClick={startEdit}
        title="Click to edit"
      >
        {value}
      </Tag>
      {isModified && (
        <button
          type="button"
          title="Revert to original"
          onClick={() => onChange(original)}
          className="absolute -right-5 top-0 hidden text-sm text-slate-400 hover:text-slate-200 group-hover:inline"
        >
          ↩
        </button>
      )}
    </span>
  );
}
