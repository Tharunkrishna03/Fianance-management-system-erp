import type { Metadata } from "next";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import ToastProvider from "./toast-provider";

export const metadata: Metadata = {
  title: "Jewel Finance Login",
  description: "Backend-verified login page for Jewel Finance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('app-theme') || 'default';
                document.documentElement.dataset.theme = theme;
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
