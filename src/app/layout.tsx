import type { ReactNode } from "react";
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="app-body">
        <main className="app-shell">{children}</main>
      </body>
    </html>
  );
}
