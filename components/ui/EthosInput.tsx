import { cn } from "@/lib/utils";
import * as React from "react";

export interface EthosInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "outline" | "filled";
  error?: boolean;
  icon?: React.ReactNode;
}

const EthosInput = React.forwardRef<HTMLInputElement, EthosInputProps>(
  ({ className, type, variant = "default", error, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm",
            "ring-offset-background transition-all duration-300",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Variant styles
            variant === "default" && "border-input",
            variant === "filled" && "border-transparent bg-secondary",
            variant === "outline" && "border-2 border-primary/50",
            // Error state
            error && "border-destructive focus-visible:ring-destructive",
            // Icon offset
            icon && "pl-10",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-destructive">
            This field is required
          </p>
        )}
      </div>
    );
  }
);
EthosInput.displayName = "EthosInput";

export { EthosInput };
