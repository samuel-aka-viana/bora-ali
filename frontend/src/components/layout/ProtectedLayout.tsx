import { type ReactNode } from "react";
import { AccountMenu } from "./AccountMenu";

export function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pt-16">
      <AccountMenu />
      {children}
    </div>
  );
}
