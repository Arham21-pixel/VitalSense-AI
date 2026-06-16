'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ScrollReveal } from '../shared/ScrollReveal'
import { GradientText } from '../shared/GradientText'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FAQItem {
  question: string
  answer: string
}

const FAQAccordion = ({ item, index }: { item: FAQItem; index: number }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`border rounded-xl overflow-hidden transition-all duration-200 ${
        isOpen ? 'border-primary/30 shadow-sm' : 'border-border/50 hover:border-border'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between bg-card hover:bg-muted/40 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-foreground pr-4">{item.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className={`w-5 h-5 transition-colors ${isOpen ? 'text-primary' : 'text-muted-foreground'}`} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-border/50 overflow-hidden"
          >
            <div className="px-6 py-5 bg-muted/20 text-muted-foreground leading-relaxed text-sm">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function FAQSection() {
  const faqs: FAQItem[] = [
    {
      question: 'How does VitalSense integrate with our existing EMR system?',
      answer: 'VitalSense integrates seamlessly via standard HL7/FHIR APIs with major EHR systems including Epic, Cerner, and Meditech. Our implementation team handles the entire setup process to ensure zero disruption to your workflows.',
    },
    {
      question: 'What is the implementation timeline?',
      answer: "Typical implementations take 4–8 weeks from kickoff to go-live, depending on your institution's complexity. This includes system configuration, staff training, and thorough testing to ensure patient safety.",
    },
    {
      question: 'Is VitalSense HIPAA compliant?',
      answer: 'Yes, VitalSense is fully HIPAA compliant with SOC 2 Type II certification. All data is encrypted in transit and at rest using industry-standard encryption protocols. We maintain complete audit logs for compliance verification.',
    },
    {
      question: 'How accurate is the sepsis prediction model?',
      answer: 'Our model achieves 94% sensitivity and 87% specificity in detecting sepsis risk, validated across multiple retrospective and prospective clinical studies. Results may vary based on institutional population characteristics.',
    },
    {
      question: 'Can we use VitalSense with other clinical decision support systems?',
      answer: 'Absolutely. VitalSense is designed to complement existing clinical workflows and decision support tools. Our open API allows integration with other enterprise health systems.',
    },
    {
      question: 'What kind of support does VitalSense provide?',
      answer: 'We provide 24/7 clinical and technical support, including dedicated account management, ongoing staff training, and regular platform updates. Support is included in your institutional license.',
    },
  ]

  return (
    <section id="faq" className="relative py-24 bg-muted/20 overflow-hidden border-t border-border/40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4 text-balance">
            Frequently Asked <GradientText>Questions</GradientText>
          </h2>
          <p className="text-xl text-muted-foreground text-pretty">
            Everything you need to know about VitalSense.
          </p>
        </ScrollReveal>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FAQAccordion key={faq.question} item={faq} index={index} />
          ))}
        </div>

        {/* CTA */}
        <ScrollReveal delay={0.4} className="mt-16 text-center">
          <p className="text-muted-foreground mb-6 text-sm">
            Can&apos;t find the answer you&apos;re looking for?{' '}
            <a href="#contact" className="text-primary font-semibold hover:underline underline-offset-4">
              Contact our team
            </a>
            .
          </p>
          <Button size="lg">
            Schedule a Call with Sales
          </Button>
        </ScrollReveal>
      </div>
    </section>
  )
}
