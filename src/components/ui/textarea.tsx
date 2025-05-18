
import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    // Use local ref if none is provided
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const resolvedRef = ref || internalRef;
    
    // Store the current selection position
    const [selection, setSelection] = React.useState<{start: number | null, end: number | null}>({
      start: null, 
      end: null
    });
    
    // Save selection position before component updates
    React.useEffect(() => {
      const currentElement = resolvedRef as React.RefObject<HTMLTextAreaElement>;
      if (currentElement?.current && document.activeElement === currentElement.current) {
        setSelection({
          start: currentElement.current.selectionStart,
          end: currentElement.current.selectionEnd
        });
      }
    });
    
    // Restore focus and selection after render
    React.useEffect(() => {
      const currentElement = resolvedRef as React.RefObject<HTMLTextAreaElement>;
      if (currentElement?.current && selection.start !== null && selection.end !== null) {
        // If this textarea had focus before, restore it
        if (document.activeElement instanceof HTMLElement && 
            (document.activeElement.tagName === 'BODY' || 
             document.activeElement.tagName === 'TEXTAREA')) {
          currentElement.current.focus();
          currentElement.current.setSelectionRange(selection.start, selection.end);
        }
      }
    }, [selection, resolvedRef]);

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={resolvedRef}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
