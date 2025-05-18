
import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    // Use local ref if none is provided
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const resolvedRef = ref || internalRef;
    
    // Handle focus and cursor position
    React.useEffect(() => {
      const currentElement = resolvedRef as React.RefObject<HTMLTextAreaElement>;
      if (currentElement?.current && document.activeElement === currentElement.current) {
        // Move cursor to end of text when content changes
        const length = currentElement.current.value.length;
        currentElement.current.setSelectionRange(length, length);
      }
    }, [props.value, resolvedRef]);

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
