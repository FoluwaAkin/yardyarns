import { Navbar } from '@/components/ui/Navbar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">{children}</main>
    </>
  )
}
