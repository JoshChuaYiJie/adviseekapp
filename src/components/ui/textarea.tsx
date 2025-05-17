
import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    // Use local ref if none is provided
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const resolvedRef = ref || internalRef;
    
    // Maintain focus after parent rerenders
    React.useEffect(() => {
      const currentElement = resolvedRef as React.RefObject<HTMLTextAreaElement>;
      if (currentElement?.current && document.activeElement !== currentElement.current) {
        // If the textarea is meant to have focus
        if (document.activeElement instanceof HTMLElement && 
            document.activeElement.tagName === 'TEXTAREA') {
          currentElement.current.focus();
        }
      }
    });

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
