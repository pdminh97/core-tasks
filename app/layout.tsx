import '@/styles/index.scss'
import { Inter } from 'next/font/google'
import {SideBar} from "@/components/SideBar";

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SideBar />
        <div className="h-full flex flex-row gap-10">
          <div className="w-full max-w-[18rem]">
          </div>
          <div className="flex w-full flex-row flex-wrap gap-4 p-6">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
