import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lavaca MNL",
  description: "Premium slow-cooked Angus roast beef, ready for pickup",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
