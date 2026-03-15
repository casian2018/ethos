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
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-2xl border px-4 py-3 text-sm font-medium",
            "ring-offset-background transition-all duration-300",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Variant styles
            variant === "default" && "border-input bg-background/85 backdrop-blur",
            variant === "filled" && "border-transparent bg-secondary/90",
            variant === "outline" && "border-primary/40 bg-white/80",
            // Error state
            error && "border-destructive focus-visible:ring-destructive",
            // Icon offset
            icon && "pl-11",
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
