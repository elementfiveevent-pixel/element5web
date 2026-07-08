import { Card, CardContent } from "@/components/ui/card";
import { Shield, Mail, Database, Lock, Eye, UserCheck, Clock, Globe, MessageCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/common/SEOHead";

const PrivacyPolicy = () => {
  return (
    <>
      <SEOHead
        title="Privacy Policy"
        description="Learn how UniVoid collects, uses, and protects your personal information. Read our privacy policy for details on data security and your rights."
        url="/privacy-policy"
        keywords={['privacy policy', 'data protection', 'UniVoid privacy', 'student data security']}
      />
      <div className="py-10 md:py-14">
        <div className="container-wide max-w-4xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">
              Privacy Policy
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
                  Welcome to UniVoid. Your privacy matters to us. This Privacy Policy explains how we collect,
                  use, store, and protect your personal information when you use our platform. By accessing or
                  using UniVoid, you acknowledge that you have read and understood this policy.
                </p>
              </section>

              {/* Platform Notice */}
              <section className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">Important Platform Notice</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      UniVoid operates solely as a <strong>facilitator platform</strong>. All study materials, books,
                      events, tasks, projects, and other content are uploaded and managed by users. UniVoid does not
                      create, verify, or take responsibility for user-generated content.
                    </p>
                  </div>
                </div>
              </section>

              {/* Who We Are */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Who Operates UniVoid</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  UniVoid is an online student platform operated from India, designed to facilitate educational resource
                  sharing, event discovery, project collaboration, and peer-to-peer book exchange among students.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  For any privacy-related queries, contact us at:{" "}
                  <a href="mailto:univoid35@gmail.com" className="text-primary hover:underline font-medium">
                    univoid35@gmail.com
                  </a>
                </p>
              </section>

              {/* What Data We Collect */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">What Personal Data We Collect</h2>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">1. Account Information</h3>
                    <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                      <li>Full name and email address (required)</li>
                      <li>Mobile number (used for account security and contact features)</li>
                      <li>Profile photograph (optional)</li>
                      <li>Password (stored in encrypted format)</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">2. Educational Information</h3>
                    <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                      <li>College or university name</li>
                      <li>Course, branch, and year of study</li>
                      <li>State and city</li>
                      <li>Academic interests and preferences</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">3. User-Generated Content</h3>
                    <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                      <li>Study materials and documents uploaded by you</li>
                      <li>Book listings and descriptions</li>
                      <li>Event registrations and participation details</li>
                      <li>Project posts and task requests</li>
                      <li>News or blog content shared by users</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">4. Technical & Usage Data</h3>
                    <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                      <li>IP address and approximate location</li>
                      <li>Device type, operating system, and browser</li>
                      <li>Pages visited and features used</li>
                      <li>Search queries and interaction patterns</li>
                      <li>Error logs and performance data</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* When Data is Collected */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">When We Collect Your Data</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We collect data when you:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Create an account or log in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Update your profile information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Upload materials, list books, or create events</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Browse or interact with platform features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Contact support or submit feedback</span>
                  </li>
                </ul>
              </section>

              {/* Why We Collect Data */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Why We Collect Your Data</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use your data only for legitimate platform purposes, including:
                </p>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Platform Operation</h4>
                      <p className="text-xs text-muted-foreground">Account creation and authentication, providing access to platform features</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Personalization</h4>
                      <p className="text-xs text-muted-foreground">Recommending relevant materials, tasks, events, and opportunities based on your profile</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Communication</h4>
                      <p className="text-xs text-muted-foreground">Sending important updates, notifications, and responses to support queries</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-sm font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Security & Safety</h4>
                      <p className="text-xs text-muted-foreground">Preventing fraud, abuse, and unauthorized access; maintaining platform integrity</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-sm font-bold">5</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Analytics & Improvement</h4>
                      <p className="text-xs text-muted-foreground">Understanding usage patterns, improving performance and user experience</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* WhatsApp Redirect - NEW SECTION */}
              <section className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-3">WhatsApp Redirect & Phone Number Usage</h2>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      UniVoid uses mobile numbers <strong>only for contact facilitation</strong> in specific features
                      such as <strong>peer-to-peer book exchange</strong>.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      Please note:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>Your mobile number is used <strong>only to enable WhatsApp redirection</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>UniVoid <strong>does not read, store, monitor, or access WhatsApp messages</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>UniVoid <strong>does not share your number with third parties</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>Phone numbers are <strong>not publicly displayed</strong> on the platform</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>All communication happens <strong>directly between users on WhatsApp</strong></span>
                      </li>
                    </ul>
                    <p className="text-muted-foreground leading-relaxed mt-3 text-sm">
                      UniVoid has <strong>no control over conversations or transactions</strong> that take place on WhatsApp.
                    </p>
                  </div>
                </div>
              </section>

              {/* Data Security */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">How We Protect Your Data</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use industry-standard security practices, including:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Encryption of data in transit and at rest</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Secure authentication systems</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Access control and monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Regular security updates</span>
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4 text-sm">
                  Despite best efforts, no system is 100% secure, and users acknowledge inherent risks of online platforms.
                </p>
              </section>

              {/* Your Rights */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Your Rights</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You have the right to:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Access</strong> your personal data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Correct</strong> inaccurate or incomplete data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Delete</strong> your account and associated data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Request portability</strong> of your data (where applicable)</span>
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  To exercise these rights, contact us at:{" "}
                  <a href="mailto:univoid35@gmail.com" className="text-primary hover:underline font-medium">
                    univoid35@gmail.com
                  </a>
                </p>
              </section>

              {/* Policy Updates */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Policy Updates</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  UniVoid may update this Privacy Policy from time to time. Continued use of the platform after
                  updates indicates acceptance of the revised policy.
                </p>
              </section>

              {/* Contact */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  For privacy-related concerns or questions:{" "}
                  <a href="mailto:univoid35@gmail.com" className="text-primary hover:underline font-medium">
                    univoid35@gmail.com
                  </a>
                </p>
              </section>

              {/* Footer Links */}
              <div className="pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  See also: <Link to="/terms" className="text-primary hover:underline">Terms and Conditions</Link> | <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link> | <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
