// Root layout — wraps every page with global styles and metadata
import './globals.css';

export const metadata = {
  title: 'Student Contact Dashboard',
  description: 'View and manage student contact records from Google Sheets',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
