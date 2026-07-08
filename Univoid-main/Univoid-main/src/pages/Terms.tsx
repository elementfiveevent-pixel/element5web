import { Card, CardContent } from "@/components/ui/card";
import { FileText, Mail, AlertTriangle, Users, BookOpen, Calendar, ShoppingBag, Briefcase, Shield, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/common/SEOHead";

const Terms = () => {
  return (
    <>
      <SEOHead
        title="Terms and Conditions"
        description="Read the terms and conditions for using UniVoid. Understand your rights, responsibilities, and platform policies."
        url="/terms"
        keywords={['terms and conditions', 'terms of service', 'UniVoid terms', 'user agreement']}
      />
      <div className="py-10 md:py-14">
        <div className="container-wide max-w-4xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">
              Terms and Conditions
            </h1>
            <p className="text-muted-foreground">
              Updated | Effective Date: 22 December 2024
            </p>
          </div>

          <Card className="shadow-premium-sm">
            <CardContent className="p-6 md:p-8 space-y-8">
              {/* Introduction */}
              <section>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to UniVoid. These Terms and Conditions govern your access to and use of our platform.
                  By creating an account, uploading content, or using any of our services, you agree to be bound
                  by these terms. If you do not agree with any part of these terms, you must not use UniVoid.
                </p>
              </section>

              {/* Platform Role - Critical Disclaimer */}
              <section className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">Important: Platform Role Disclaimer</h2>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      <strong>UniVoid is solely a facilitator platform.</strong> All study materials, books, events,
                      tasks, projects, news articles, and other content on this platform are created, uploaded, and
                      managed entirely by users.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      UniVoid <strong>does not create, own, verify, endorse, or take responsibility</strong> for any
                      user-generated content and shall not be liable for:
                    </p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-1">•</span>
                        <span>User intent or behavior</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-1">•</span>
                        <span>Copyright ownership or infringement</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-1">•</span>
                        <span>Accuracy, completeness, or reliability of content</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-1">•</span>
                        <span>Legality or compliance of uploaded materials</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-1">•</span>
                        <span>Any outcomes, losses, or damages arising from platform use</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Acceptance of Terms */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  By accessing or using UniVoid, you confirm that:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>You are at least <strong>16 years of age</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>You have read and understood these Terms and our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>You agree to comply with all applicable laws and regulations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>You will use the platform responsibly and in good faith</span>
                  </li>
                </ul>
              </section>

              {/* Account Responsibilities */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">2. Account Responsibilities</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  When you create an account on UniVoid, you are responsible for:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Providing accurate and truthful information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Maintaining the confidentiality of your login credentials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>All activities performed under your account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Immediately notifying us of any unauthorized access or security breach</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Not sharing your account or credentials with others</span>
                  </li>
                </ul>
              </section>

              {/* User-Generated Content */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">3. User-Generated Content</h2>
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
                  <p className="text-muted-foreground text-sm">
                    <strong className="text-foreground">Content Responsibility Disclaimer:</strong> UniVoid does <strong>not verify, validate, or guarantee</strong> the accuracy, legality, or quality of any content uploaded by users. All responsibility lies solely with the user who uploads or shares the content.
                  </p>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  By uploading content, you represent and warrant that:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>You own the content or have legal rights to share it</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>The content does not infringe third-party intellectual property rights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>The content is not harmful, offensive, defamatory, or illegal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>The content does not contain malware, viruses, or harmful code</span>
                  </li>
                </ul>
              </section>

              {/* Study Material Verification - NEW SECTION */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">4. Study Material Verification Disclaimer</h2>
                </div>
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg mb-4">
                  <p className="text-muted-foreground text-sm">
                    <strong className="text-foreground">Important Update:</strong> UniVoid follows a <strong>manual review process</strong> for study materials through Admin and Admin Assistance to maintain platform quality.
                  </p>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  However, users acknowledge and agree that:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Verification is <strong>limited to basic checks only</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Verification does <strong>not guarantee correctness, completeness, or accuracy</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>There may be <strong>human or technical errors</strong> in reviewed documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Verified materials may still contain factual errors, outdated information, or formatting mistakes</span>
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4 text-sm">
                  UniVoid <strong>does not guarantee that verified materials are error-free</strong> and shall not be held liable for any academic, professional, or personal consequences arising from their use.
                </p>
              </section>

              {/* Events */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">5. Events Disclaimer</h2>
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
                  <p className="text-muted-foreground text-sm">
                    <strong className="text-foreground">Critical Notice:</strong> UniVoid is <strong>NOT</strong> an event organizer.
                    All events listed on the platform are created and managed by <strong>independent organizers</strong>.
                  </p>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  UniVoid accepts <strong>no responsibility or liability</strong> for:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Event cancellations, postponements, or changes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Event quality, safety, or conduct</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Accidents, injuries, or incidents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Payment disputes between attendees and organizers</span>
                  </li>
                </ul>
              </section>

              {/* Book Exchange */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">6. Book Exchange Disclaimer</h2>
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
                  <p className="text-muted-foreground text-sm">
                    <strong className="text-foreground">Important:</strong> UniVoid <strong>does not sell, purchase, or deliver books</strong>.
                    The Book Exchange feature is a <strong>peer-to-peer listing service</strong> only.
                  </p>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  UniVoid is not responsible for:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Book condition, authenticity, or quality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Pricing negotiations or disputes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Payments, refunds, or transactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Delivery, shipping, or logistics</span>
                  </li>
                </ul>
              </section>

              {/* Tasks and Projects */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">7. Tasks and Projects Disclaimer</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Tasks and Projects allow users to collaborate independently. UniVoid:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Does not guarantee task or project completion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Does not verify user skills or reliability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Does not process or secure payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Is not liable for disputes, losses, or damages between users</span>
                  </li>
                </ul>
              </section>

              {/* Intellectual Property */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">8. Intellectual Property</h2>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>UniVoid platform design, branding, and proprietary features are owned by UniVoid</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>User-generated content remains the property of the respective users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>By uploading content, users grant UniVoid a <strong>non-exclusive license</strong> to display and distribute it on the platform</span>
                  </li>
                </ul>
              </section>

              {/* Updates to Terms */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">9. Updates to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  UniVoid reserves the right to update or modify these Terms at any time.
                  Continued use of the platform after updates constitutes acceptance of the revised terms.
                </p>
              </section>

              {/* Contact */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  For any questions or concerns regarding these Terms, contact us at:{" "}
                  <a href="mailto:univoid35@gmail.com" className="text-primary hover:underline font-medium">
                    univoid35@gmail.com
                  </a>
                </p>
              </section>

              {/* Footer Links */}
              <div className="pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  See also: <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> | <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link> | <Link to="/legal-disclaimer" className="text-primary hover:underline">Legal Disclaimer</Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Terms;
