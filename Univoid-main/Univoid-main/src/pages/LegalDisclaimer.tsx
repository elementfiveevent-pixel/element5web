import { Card, CardContent } from "@/components/ui/card";
import { Scale, Mail, AlertTriangle, ExternalLink, Shield, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/common/SEOHead";

const LegalDisclaimer = () => {
  return (
    <>
      <SEOHead
        title="Legal Disclaimer"
        description="Read the legal disclaimer for UniVoid. Understand our limitations of liability as an intermediary platform and important legal notices."
        url="/legal-disclaimer"
        keywords={['legal disclaimer', 'terms', 'liability', 'UniVoid legal', 'platform disclaimer']}
      />
      <main className="flex-1 py-10 md:py-14">
        <div className="container-wide max-w-4xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">
              Legal Disclaimer
            </h1>
            <p className="text-muted-foreground">
              Version 2.0 | Effective Date: 20 December 2024
            </p>
          </div>

          <Card className="shadow-premium-sm">
            <CardContent className="p-6 md:p-8 space-y-8">
              {/* Introduction */}
              <section>
                <p className="text-muted-foreground leading-relaxed">
                  This Legal Disclaimer outlines the limitations of liability and important legal notices
                  regarding the use of UniVoid. By accessing and using this platform, you acknowledge and
                  accept these terms.
                </p>
              </section>

              {/* Platform Role */}
              <section className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">Intermediary Platform Status</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      <strong>UniVoid operates solely as an intermediary platform</strong> as defined under the
                      Information Technology Act, 2000 and the Information Technology (Intermediary Guidelines
                      and Digital Media Ethics Code) Rules, 2021. All content on this platform—including study
                      materials, books, events, tasks, projects, news, and other posts—is created, uploaded,
                      and managed entirely by users. UniVoid does not create, modify, select, verify, or
                      endorse any user-generated content.
                    </p>
                  </div>
                </div>
              </section>

              {/* No Responsibility */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Limitation of Responsibility</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  As an intermediary platform, UniVoid expressly disclaims responsibility and liability for:
                </p>
                <div className="grid gap-3">
                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground text-sm">User Intent and Actions</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      The intentions, actions, or conduct of users on the platform
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground text-sm">Content Accuracy</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      The accuracy, completeness, reliability, or correctness of any uploaded content
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground text-sm">Copyright and Ownership</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      The copyright status or intellectual property ownership of uploaded materials
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground text-sm">Content Legality</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      The legality of content uploaded by users in any jurisdiction
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground text-sm">Event Outcomes</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Any outcomes, incidents, or experiences at events listed on the platform
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground text-sm">Transaction Disputes</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Disputes, losses, or damages arising from transactions between users
                    </p>
                  </div>
                </div>
              </section>

              {/* No Warranties */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Disclaimer of Warranties</h2>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    THE UNIVOID PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. TO THE FULLEST
                    EXTENT PERMITTED BY APPLICABLE LAW, UNIVOID DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Implied warranties of merchantability and fitness for a particular purpose</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Warranties of title and non-infringement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Warranties regarding the accuracy, reliability, or completeness of content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Warranties of uninterrupted, timely, secure, or error-free service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Warranties that the platform will meet your specific requirements</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Limitation of Liability</h2>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
                  <p className="text-muted-foreground leading-relaxed">
                    TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, UNIVOID AND ITS OPERATORS, AFFILIATES,
                    OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR:
                  </p>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">1.</span>
                    <span>Any indirect, incidental, special, consequential, or punitive damages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">2.</span>
                    <span>Loss of profits, revenue, data, goodwill, or other intangible losses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">3.</span>
                    <span>Damages arising from unauthorized access to or alteration of your data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">4.</span>
                    <span>Damages arising from content or conduct of any third party on the platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">5.</span>
                    <span>Damages arising from reliance on content obtained through the platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">6.</span>
                    <span>Any other matter relating to the platform, regardless of the theory of liability</span>
                  </li>
                </ul>
              </section>

              {/* Use at Own Risk */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Use at Your Own Risk</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Your use of UniVoid is entirely at your own risk. This includes but is not limited to:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Downloading and using study materials for educational purposes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Participating in events listed on the platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Engaging in book exchange transactions with other users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Collaborating on projects or tasks with other users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Interacting with any content or users on the platform</span>
                  </li>
                </ul>
              </section>

              {/* Third-Party Links */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ExternalLink className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Third-Party Links and Services</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  UniVoid may contain links to third-party websites, services, or resources. These links are
                  provided for convenience only. UniVoid:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Does not control or endorse any third-party websites or services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Is not responsible for the content, privacy policies, or practices of third parties</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Is not liable for any damage or loss caused by third-party services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Encourages users to review third-party terms and policies before using their services</span>
                  </li>
                </ul>
              </section>

              {/* No Professional Advice */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Not Professional Advice</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Content available on UniVoid is for general informational and educational purposes only.
                  Nothing on this platform constitutes professional advice—whether legal, financial, medical,
                  academic, or otherwise. Users should consult qualified professionals for specific advice
                  relevant to their circumstances. UniVoid does not guarantee that materials or information
                  will be suitable for any specific academic, professional, or personal purpose.
                </p>
              </section>

              {/* Compliance with Indian Law */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Compliance with Indian Laws</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  UniVoid operates in compliance with the laws of India, including:
                </p>
                <ul className="space-y-2 text-muted-foreground mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>The Information Technology Act, 2000</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>The Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>The Indian Copyright Act, 1957</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>The Indian Penal Code, 1860 (as applicable to digital content)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Other applicable central and state laws and regulations</span>
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Users are responsible for ensuring their use of the platform complies with all applicable
                  laws in their jurisdiction. UniVoid will cooperate with law enforcement and legal authorities
                  as required by law.
                </p>
              </section>

              {/* Content Removal */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Content Reporting and Removal</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  As an intermediary platform, UniVoid maintains a grievance redressal mechanism. If you
                  believe any content on the platform violates your rights or applicable laws, you may:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Report the content using the report feature available on the platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Contact us at <a href="mailto:univoid35@gmail.com" className="text-primary hover:underline">univoid35@gmail.com</a> with details of your complaint</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Provide sufficient information to identify the content and the basis of your complaint</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  We will review valid complaints and take appropriate action in accordance with applicable laws
                  and our policies.
                </p>
              </section>

              {/* Indemnification */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Indemnification</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You agree to indemnify, defend, and hold harmless UniVoid, its operators, affiliates, and their
                  respective officers, directors, employees, agents, licensors, and suppliers from and against all
                  losses, expenses, damages, and costs, including reasonable legal fees, resulting from: (a) any
                  violation of these terms; (b) any activity related to your account; (c) your content or any
                  content you upload; and (d) your violation of any law or third-party rights.
                </p>
              </section>

              {/* Policy Updates */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Right to Update Policies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  UniVoid reserves the right to modify, update, or change this Legal Disclaimer, our Privacy Policy,
                  Terms and Conditions, and any other policies at any time without prior notice. Changes will be
                  effective immediately upon posting on the platform. Your continued use of UniVoid after any
                  changes constitutes your acceptance of the modified policies. We encourage you to review our
                  policies periodically.
                </p>
              </section>

              {/* Severability */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Severability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If any provision of this Legal Disclaimer is found to be invalid, illegal, or unenforceable by
                  a court of competent jurisdiction, such finding shall not affect the validity of the remaining
                  provisions, which shall continue in full force and effect.
                </p>
              </section>

              {/* Entire Agreement */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Entire Agreement</h2>
                <p className="text-muted-foreground leading-relaxed">
                  This Legal Disclaimer, together with our{" "}
                  <Link to="/terms" className="text-primary hover:underline">Terms and Conditions</Link>,{" "}
                  <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>, and{" "}
                  <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>,
                  constitutes the entire agreement between you and UniVoid regarding the use of the platform,
                  superseding any prior agreements or understandings.
                </p>
              </section>

              {/* Contact */}
              <section className="pt-6 border-t border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  For questions, concerns, or legal inquiries regarding this Legal Disclaimer, please contact us:
                </p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  <a href="mailto:univoid35@gmail.com" className="text-primary hover:underline font-medium">
                    univoid35@gmail.com
                  </a>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  You may also reach us through our{" "}
                  <Link to="/contact" className="text-primary hover:underline">Contact Page</Link>.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default LegalDisclaimer;
