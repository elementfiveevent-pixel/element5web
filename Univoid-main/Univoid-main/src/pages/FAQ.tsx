import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, User, BookOpen, ShoppingBag, ListTodo, Users, Calendar, Shield } from "lucide-react";
import SEOHead from "@/components/common/SEOHead";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const faqSections: FAQSection[] = [
  {
    title: "General",
    icon: <HelpCircle className="w-5 h-5" />,
    items: [
      {
        question: "What is UniVoid?",
        answer: "UniVoid is a student-focused platform that helps you discover study materials, buy/sell/exchange books, find events, collaborate on projects, and connect with fellow students. It's designed to make student life easier by bringing useful resources together in one place."
      },
      {
        question: "Is UniVoid free to use?",
        answer: "Yes, UniVoid is completely free to use. You can browse materials, view events, list books, and use all core features without any charges. Some features like event registrations may have fees set by event organizers, but UniVoid itself does not charge you."
      },
      {
        question: "Who can use UniVoid?",
        answer: "UniVoid is primarily designed for students in India – school, college, and university students. However, anyone interested in educational resources, academic events, or student collaboration is welcome to join."
      },
      {
        question: "How do I get started?",
        answer: "Simply create an account using your email. After signing up, complete your profile with your college, course, and interests. This helps us personalize your experience and show relevant content."
      },
      {
        question: "Is my data safe on UniVoid?",
        answer: "Yes, we take data security seriously. Your personal information is encrypted and stored securely. We don't share your data with third parties for marketing. Please read our Privacy Policy for detailed information."
      }
    ]
  },
  {
    title: "Account & Profile",
    icon: <User className="w-5 h-5" />,
    items: [
      {
        question: "How do I create an account?",
        answer: "Click on 'Login' or 'Sign Up', enter your email address, and create a password. You'll receive a verification email to confirm your account. Once verified, you can complete your profile."
      },
      {
        question: "What information should I add to my profile?",
        answer: "We recommend adding your full name, college/university, course/branch, year of study, and WhatsApp number (for book exchange contacts). Adding interests helps us recommend relevant events and materials."
      },
      {
        question: "Why do I need to add my WhatsApp number?",
        answer: "Your WhatsApp number is only required if you want to list books for sale/rent/exchange. When someone is interested in your book, they can contact you directly on WhatsApp. Your number is not publicly visible – it's only shared when someone initiates contact."
      },
      {
        question: "How do I edit my profile?",
        answer: "Go to Dashboard → Profile → Edit Profile. You can update your personal details, college information, and interests anytime."
      },
      {
        question: "What is XP and how does it work?",
        answer: "XP (Experience Points) is our way of recognizing active contributors. You earn XP by uploading study materials, listing books, and participating on the platform. Higher XP means you appear higher on the leaderboard."
      },
      {
        question: "Can I delete my account?",
        answer: "Yes, you can request account deletion by contacting us at univoid35@gmail.com. Please note that this will permanently remove all your data, uploaded content, and activity history."
      }
    ]
  },
  {
    title: "Study Materials",
    icon: <BookOpen className="w-5 h-5" />,
    items: [
      {
        question: "What are Study Materials?",
        answer: "Study Materials are educational resources like notes, PDFs, question papers, and study guides uploaded by students and educators. You can browse, download, and use them for your studies."
      },
      {
        question: "How do I upload study materials?",
        answer: "Go to Dashboard → Upload Material. Fill in the title, select the subject/branch, add a description, and upload your file (PDF, DOC, PPT, etc.). Your material will be reviewed before going live."
      },
      {
        question: "Why is my material under review?",
        answer: "All uploaded materials go through a manual review by our Admin team. This helps maintain quality and ensures no harmful or inappropriate content is published. Review typically takes 24-48 hours."
      },
      {
        question: "Are the materials verified for accuracy?",
        answer: "Our review process checks for basic quality and appropriateness, but we do NOT guarantee the accuracy, completeness, or correctness of any study material. Materials may contain errors. Always cross-check with official sources."
      },
      {
        question: "Can I download materials without logging in?",
        answer: "You can browse and preview materials without logging in, but downloading requires a free account. This helps us track usage and give credit to contributors."
      },
      {
        question: "What file types are supported?",
        answer: "We support PDF, DOC, DOCX, PPT, PPTX, and common document formats. PDF is recommended for best compatibility."
      }
    ]
  },
  {
    title: "Near Book / My Books",
    icon: <ShoppingBag className="w-5 h-5" />,
    items: [
      {
        question: "What is the Book Exchange feature?",
        answer: "Book Exchange allows students to list their books for sale, rent, donation, or exchange. Other students can browse listings and contact sellers directly via WhatsApp to negotiate and complete the transaction."
      },
      {
        question: "How do I list a book?",
        answer: "Go to Dashboard → List a Book. Take a photo of your book cover, add the title, author, condition, and price (if selling/renting). Your listing will be reviewed and published within 24-48 hours."
      },
      {
        question: "What listing types are available?",
        answer: "You can list books for: Sale (set your price), Rent (monthly rental price), Donate (free giveaway), or Exchange (swap for another book)."
      },
      {
        question: "How do I contact a seller?",
        answer: "Click on any book listing and press 'Contact on WhatsApp'. You'll be redirected to WhatsApp with a pre-filled message. You need to be logged in to see seller contact details."
      },
      {
        question: "Does UniVoid handle payments or delivery?",
        answer: "No. UniVoid is only a platform to connect buyers and sellers. All payments, negotiations, and delivery/meetup arrangements are handled directly between you and the other party. We recommend meeting in safe, public places."
      },
      {
        question: "What if I have a problem with a transaction?",
        answer: "Since UniVoid doesn't handle transactions, we cannot mediate disputes. We recommend following safety tips – always verify the book before paying, meet in public places, and keep payment proof. You can report suspicious listings to us."
      },
      {
        question: "How do I mark my book as sold?",
        answer: "Go to Dashboard → My Books, find your listing, and click 'Mark as Sold' or 'Mark as Rented'. This removes the listing from active search."
      }
    ]
  },
  {
    title: "Project Partner",
    icon: <Users className="w-5 h-5" />,
    items: [
      {
        question: "What is Project Partner?",
        answer: "Project Partner helps you find teammates for academic projects, hackathons, competitions, or startup ideas. You can create a project and invite others to join, or browse existing projects and request to join."
      },
      {
        question: "How do I create a project?",
        answer: "Go to Projects → Create Project. Add a title, description, skills you're looking for, and maximum team size. Your project will be visible to other students who can then request to join."
      },
      {
        question: "How do I join someone's project?",
        answer: "Browse the Projects page, find one that interests you, and click 'Request to Join'. Add a message explaining your skills and interest. The project owner will review and accept/reject your request."
      },
      {
        question: "Who manages the project team?",
        answer: "The project creator (owner) has full control over the team – they can accept/reject join requests, remove members, and manage the project. Members can collaborate but cannot modify team settings."
      },
      {
        question: "Can I link my project to an event?",
        answer: "Yes, when creating a project you can optionally link it to an event (like a hackathon). This helps others understand the context and find relevant teammates."
      },
      {
        question: "Does UniVoid verify team members?",
        answer: "No. We provide basic profiles, but we do not verify skills, reliability, or identity of users. It's your responsibility to vet potential teammates before collaborating."
      }
    ]
  },
  {
    title: "Events",
    icon: <Calendar className="w-5 h-5" />,
    items: [
      {
        question: "What are Events on UniVoid?",
        answer: "Events are workshops, seminars, hackathons, competitions, fests, and other activities posted by organizers. You can browse upcoming events, register, and get tickets."
      },
      {
        question: "Who can post events?",
        answer: "Only verified Organizers can post events. If you want to host events, you can apply to become an organizer through the 'Become an Organizer' page."
      },
      {
        question: "How do I register for an event?",
        answer: "Click on any event, review the details, and click 'Register'. For free events, registration is instant. For paid events, you'll need to upload payment proof which will be verified by the organizer."
      },
      {
        question: "How do I pay for paid events?",
        answer: "Payment is made directly to the organizer via UPI/QR code shown on the registration page. After paying, upload a screenshot of your payment. The organizer will verify and approve your registration."
      },
      {
        question: "Is UniVoid responsible for events?",
        answer: "No. UniVoid is NOT an event organizer. All events are created and managed by independent organizers. We are not responsible for event quality, cancellations, refunds, or any issues that occur during events."
      },
      {
        question: "What if an event is cancelled?",
        answer: "Contact the event organizer directly regarding cancellations and refunds. UniVoid cannot process refunds or mediate between attendees and organizers."
      },
      {
        question: "How do I check-in at an event?",
        answer: "After your registration is approved, you'll receive a QR code ticket. Show this QR code at the event venue, and the organizer will scan it to check you in."
      }
    ]
  },
  {
    title: "Privacy & Safety",
    icon: <Shield className="w-5 h-5" />,
    items: [
      {
        question: "Is my phone number visible to everyone?",
        answer: "No. Your WhatsApp number is only shared when someone wants to contact you about your book listing, and they must be logged in. It's not publicly displayed on your profile or in search results."
      },
      {
        question: "How is my data protected?",
        answer: "We use industry-standard encryption for data in transit and at rest. Your password is hashed and never stored in plain text. We don't share your personal data with third parties for marketing."
      },
      {
        question: "What should I do if I see inappropriate content?",
        answer: "Use the 'Report' button available on materials, books, events, and other content. Our team reviews all reports and takes action against violations."
      },
      {
        question: "How can I stay safe during in-person meetups?",
        answer: "Always meet in public, well-lit places. Bring a friend if possible. Verify the book/item before making payment. Never share sensitive personal information. Trust your instincts – if something feels wrong, walk away."
      },
      {
        question: "Does UniVoid verify users?",
        answer: "We verify email addresses and can verify phone numbers, but we do not perform identity verification or background checks. Exercise caution when interacting with other users."
      },
      {
        question: "How do I report a scam or fraud?",
        answer: "Email us immediately at univoid35@gmail.com with details of the incident, screenshots, and the user's profile. We'll investigate and take appropriate action, which may include account suspension."
      },
      {
        question: "What happens to my data if I delete my account?",
        answer: "Upon account deletion, your personal data is permanently removed. However, content you've contributed (materials, posts) may be anonymized and retained as community resources, unless you specifically request complete removal."
      }
    ]
  }
];

const FAQ = () => {
  // Generate FAQ structured data for rich snippets
  const faqStructuredData = {
    "@type": "FAQPage",
    "mainEntity": faqSections.flatMap(section =>
      section.items.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    )
  };

  return (
    <>
      <SEOHead
        title="FAQ - Frequently Asked Questions"
        description="Find answers to common questions about UniVoid features including study materials, book exchange, events, projects, tasks, and more."
        url="/faq"
        keywords={['FAQ', 'help', 'questions', 'UniVoid help', 'student platform FAQ', 'how to use UniVoid']}
        structuredData={faqStructuredData}
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">Help Center</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about UniVoid features and how to use the platform.
            </p>
          </div>

          <div className="space-y-6">
            {faqSections.map((section, sectionIndex) => (
              <Card key={sectionIndex} className="border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {section.icon}
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Accordion type="single" collapsible className="w-full">
                    {section.items.map((item, itemIndex) => (
                      <AccordionItem
                        key={itemIndex}
                        value={`${sectionIndex}-${itemIndex}`}
                        className="border-muted"
                      >
                        <AccordionTrigger className="text-left hover:no-underline py-4">
                          <span className="text-sm font-medium pr-4">{item.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Still need help section */}
          <Card className="mt-10 bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Still have questions?
              </h3>
              <p className="text-muted-foreground mb-4">
                Can't find what you're looking for? Reach out to us directly.
              </p>
              <a
                href="mailto:univoid35@gmail.com"
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                Contact Support → univoid35@gmail.com
              </a>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default FAQ;