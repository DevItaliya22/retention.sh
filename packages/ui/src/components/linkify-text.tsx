import * as React from "react";
import { LinkItEmail, LinkItUrl } from "react-linkify-it";

interface LinkifyTextProps {
  children: React.ReactNode;
  className?: string;
}

function LinkifyText({ children, className }: LinkifyTextProps) {
  return (
    <LinkItUrl className="text-primary hover:text-primary/80 underline">
      <LinkItEmail className="text-primary hover:text-primary/80 underline">
        <span className={className}>{children}</span>
      </LinkItEmail>
    </LinkItUrl>
  );
}

export { LinkifyText };
export type { LinkifyTextProps };
