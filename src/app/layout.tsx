import { Plus_Jakarta_Sans } from 'next/font/google';
import Navbar from '@/components/layout/Navbar';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'Dev Tracker | Param',
  description: 'Live VS Code tracking dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      {/* Changed to an elegant off-black (#121212) */}
      <body className={`${jakarta.className} bg-[#121212] text-white antialiased min-h-screen selection:bg-yellow-500/30`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}