import React from 'react';

export const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => {
  return (
    <textarea
      {...props}
      ref={(node) => {
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        if (node) {
          node.style.height = 'auto';
          node.style.height = `${node.scrollHeight + 2}px`;
          setTimeout(() => {
            if (node) {
              node.style.height = 'auto';
              node.style.height = `${node.scrollHeight + 2}px`;
            }
          }, 10);
        }
      }}
      onInput={(e) => {
        const target = e.currentTarget;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight + 2}px`;
        if (props.onInput) props.onInput(e);
      }}
      className={`${props.className || ''} resize-none overflow-hidden`}
    />
  );
});

AutoResizeTextarea.displayName = 'AutoResizeTextarea';
