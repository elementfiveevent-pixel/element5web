import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/common/SEOHead";

const RefundPolicy = () => {
  return (
    <>
      <SEOHead
        title="Refund Policy"
        description="Learn about UniVoid's refund policy. Understand how payments and refunds are handled for events, books, tasks, and other services on our platform."
        url="/refund-policy"
        keywords={['refund policy', 'UniVoid refunds', 'payment policy', 'event refunds']}
      />
      <main className="flex-1 py-10 md:py-14">
        <div className="container-wide max-w-4xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">
              Refund Policy
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
                  This Refund Policy explains how payments and refunds are handled on the UniVoid platform.
                  Please read this policy carefully to understand your rights and our limitations regarding
                  financial transactions.
                </p>
              </section>

              {/* Key Statement */}
              <section className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">Important Notice</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      <strong>UniVoid is a free platform</strong> that does not charge users for accessing study
                      materials, listing books, creating projects, or posting tasks. UniVoid does not process
                      payments for any of these services. All financial transactions between users are conducted
                      independently and outside of the UniVoid platform.
                    </p>
                  </div>
                </div>
              </section>

              {/* Study Materials */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Study Materials</h2>
                <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Free Access:</strong> All study materials on UniVoid
                      are available free of charge. There are no payments involved, and therefore no refunds
                      are applicable for study materials.
                    </p>
                  </div>
                </div>
              </section>

              {/* Book Exchange */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Book Exchange</h2>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    The book exchange feature connects buyers and sellers directly. UniVoid:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Does not sell or purchase books</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Does not process any payments for book transactions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Does not hold money on behalf of buyers or sellers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Is not responsible for refunds, returns, or disputes between parties</span>
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-4 p-3 bg-background rounded-lg border border-border">
                    Any payment arrangements, refunds, or disputes must be resolved directly between the buyer
                    and seller. We recommend using secure payment methods and meeting in safe locations for exchanges.
                  </p>
                </div>
              </section>

              {/* Tasks */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Tasks</h2>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    The task feature allows users to post and accept task requests. UniVoid:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Does not process payments for tasks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Does not guarantee task completion or quality</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Does not mediate payment disputes between task posters and solvers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Is not responsible for refunds related to task transactions</span>
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-4">
                    All payment terms and refund arrangements for tasks must be agreed upon between the parties involved.
                  </p>
                </div>
              </section>

              {/* Projects */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Projects</h2>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    The projects feature facilitates collaboration between students. UniVoid:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Provides a free platform for project collaboration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Does not charge for creating or joining projects</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Does not handle any financial transactions related to projects</span>
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-4">
                    Any financial arrangements between project members are independent of UniVoid.
                  </p>
                </div>
              </section>

              {/* Events */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Events</h2>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
                  <p className="text-muted-foreground text-sm">
                    <strong className="text-foreground">Critical Notice:</strong> UniVoid is NOT an event organizer.
                    All events are organized by independent third parties who choose to list their events on our platform.
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Regarding event payments and refunds:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Event payments are collected directly by event organizers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>UniVoid does not collect, hold, or process event registration fees</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Refund policies are set by individual event organizers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>All refund requests must be directed to the respective event organizer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>UniVoid cannot process, guarantee, or enforce refunds for events</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4 p-4 border border-border rounded-lg">
                  <h3 className="font-medium text-foreground mb-3">What to Do If You Need an Event Refund</h3>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Contact the event organizer directly using the contact information provided on the event page</li>
                    <li>Refer to the organizer's refund policy (if provided)</li>
                    <li>Keep records of your payment and communication</li>
                    <li>If the organizer is unresponsive, you may contact your payment provider for dispute resolution</li>
                  </ol>
                </div>
              </section>

              {/* UniVoid Premium (Future) */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Premium Services (If Applicable)</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Currently, UniVoid does not offer any paid premium services. If we introduce premium features
                  in the future, a separate refund policy specific to those services will be published and made
                  available to users before any payment is required.
                </p>
              </section>

              {/* Dispute Resolution */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Dispute Resolution</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  For any disputes related to transactions that occurred through connections made on UniVoid:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>First, attempt to resolve the issue directly with the other party</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>If unresolved, contact your payment provider for chargebacks or disputes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>For serious issues, seek legal advice or contact consumer protection authorities</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  While UniVoid cannot mediate financial disputes, you may report users who engage in fraudulent
                  behavior using our{" "}
                  <Link to="/contact" className="text-primary hover:underline">report feature</Link>.
                </p>
              </section>

              {/* Policy Updates */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Changes to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  UniVoid reserves the right to update this Refund Policy at any time. Changes will be posted
                  on this page with an updated effective date. Continued use of the platform after changes
                  constitutes acceptance of the modified policy.
                </p>
              </section>

              {/* Contact */}
              <section className="pt-6 border-t border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you have questions about this Refund Policy, please contact us:
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

export default RefundPolicy;
