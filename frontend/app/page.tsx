import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HeroSection } from '@/components/hero/HeroSection'
import { Timeline } from '@/components/sections/Timeline'
import { ICUDashboard } from '@/components/sections/ICUDashboard'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { FeatureGrid } from '@/components/sections/FeatureGrid'
import { ROISection } from '@/components/sections/ROISection'
import { ArchitectureFlow } from '@/components/sections/ArchitectureFlow'
import { FAQSection } from '@/components/sections/FAQSection'

export default function Page() {
  return (
    <main className="w-full">
      <Navbar />
      <HeroSection />
      <Timeline />
      <ICUDashboard />
      <HowItWorks />
      <FeatureGrid />
      <ROISection />
      <ArchitectureFlow />
      <FAQSection />
      <Footer />
    </main>
  )
}
