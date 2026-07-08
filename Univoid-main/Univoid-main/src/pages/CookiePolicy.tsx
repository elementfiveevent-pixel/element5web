import { Card, CardContent } from "@/components/ui/card";
import { Cookie, Mail, Settings, BarChart3, Megaphone, Shield, ToggleRight, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/common/SEOHead";

const CookiePolicy = () => {
  return (
    <>
      <SEOHead
        title="Cookie Policy"
        description="Learn about how UniVoid uses cookies and similar tracking technologies. Understand what data is collected and how to manage your cookie preferences."
        url="/cookie-policy"
        keywords={['cookie policy', 'cookies', 'tracking', 'privacy', 'UniVoid cookies']}
      />
      <main className="flex-1 py-10 md:py-14">
        <div className="container-wide max-w-4xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Cookie className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">
              Cookie Policy
            </h1>
            <p className="text-muted-foreground">
              Version 1.0 | Effective Date: 20 December 2024
            </p>
          </div>

          <Card className="shadow-premium-sm">
            <CardContent className="p-6 md:p-8 space-y-8">
              {/* Introduction */}
              <section>
                <p className="text-muted-foreground leading-relaxed">
                  This Cookie Policy explains how UniVoid uses cookies and similar tracking technologies when you
                  visit our platform. We believe in transparency and want you to understand what data is collected,
                  why it's collected, and how you can control it.
                </p>
              </section>

              {/* What Are Cookies */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">What Are Cookies?</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Cookies are small text files that are placed on your device (computer, smartphone, or tablet)
                  when you visit a website. They are widely used to make websites work more efficiently, provide
                  a better user experience, and give website owners useful information about how their sites are used.
                </p>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-medium text-foreground text-sm mb-2">Types of Storage We Use</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Cookies:</strong> Small text files stored by your browser</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Local Storage:</strong> Data stored locally in your browser for preferences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Session Storage:</strong> Temporary data cleared when you close your browser</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Categories of Cookies */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Categories of Cookies We Use</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We categorize our cookies based on their purpose. Below is a detailed breakdown of each category:
                </p>

                {/* Necessary Cookies */}
                <div className="mb-6 p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Necessary Cookies</h3>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Always Active</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    These cookies are essential for the website to function properly. They enable core functionality
                    such as security, authentication, and accessibility. Without these cookies, the website cannot
                    operate correctly. These cookies do not store any personally identifiable information.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 text-foreground font-medium">Cookie</th>
                          <th className="text-left py-2 pr-4 text-foreground font-medium">Purpose</th>
                          <th className="text-left py-2 text-foreground font-medium">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-xs">sb-*-auth-token</td>
                          <td className="py-2 pr-4">User authentication session</td>
                          <td className="py-2">Session</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-xs">cookie-consent</td>
                          <td className="py-2 pr-4">Stores your cookie preferences</td>
                          <td className="py-2">1 year</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-xs">theme</td>
                          <td className="py-2 pr-4">Stores your theme preference (light/dark)</td>
                          <td className="py-2">Persistent</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">onboarding-*</td>
                          <td className="py-2 pr-4">Tracks onboarding completion status</td>
                          <td className="py-2">Persistent</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Preference Cookies */}
                <div className="mb-6 p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Preference Cookies</h3>
                      <span className="text-xs text-muted-foreground">Optional</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    These cookies allow the website to remember choices you make and provide enhanced, more
                    personalized features. They may also be used to remember changes you have made to text size,
                    fonts, and other customizable parts of web pages.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 text-foreground font-medium">Cookie</th>
                          <th className="text-left py-2 pr-4 text-foreground font-medium">Purpose</th>
                          <th className="text-left py-2 text-foreground font-medium">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-xs">notification-prefs</td>
                          <td className="py-2 pr-4">Stores notification preferences</td>
                          <td className="py-2">Persistent</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-xs">filter-preferences</td>
                          <td className="py-2 pr-4">Remembers your filter settings</td>
                          <td className="py-2">30 days</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">recently-viewed</td>
                          <td className="py-2 pr-4">Tracks recently viewed items</td>
                          <td className="py-2">7 days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="mb-6 p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Analytics Cookies</h3>
                      <span className="text-xs text-muted-foreground">Optional - Requires Consent</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    These cookies help us understand how visitors interact with our website by collecting and
                    reporting information anonymously. This helps us improve the website's structure, navigation,
                    and content based on user behavior.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 text-foreground font-medium">Cookie</th>
                          <th className="text-left py-2 pr-4 text-foreground font-medium">Purpose</th>
                          <th className="text-left py-2 text-foreground font-medium">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-xs">_ga</td>
                          <td className="py-2 pr-4">Google Analytics - Distinguishes unique users</td>
                          <td className="py-2">2 years</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-xs">_ga_*</td>
                          <td className="py-2 pr-4">Google Analytics - Persists session state</td>
                          <td className="py-2">2 years</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-xs">_gid</td>
                          <td className="py-2 pr-4">Google Analytics - Distinguishes users</td>
                          <td className="py-2">24 hours</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">_gat</td>
                          <td className="py-2 pr-4">Google Analytics - Throttles request rate</td>
                          <td className="py-2">1 minute</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Data collected: Page views, session duration, bounce rate, geographic location (country/city level),
                    device type, browser type, referral source.
                  </p>
                </div>

                {/* Advertising Cookies */}
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center">
                      <Megaphone className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Advertising Cookies</h3>
                      <span className="text-xs text-muted-foreground">Optional - Requires Consent</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    These cookies are used to deliver advertisements that are more relevant to you and your interests.
                    They are also used to limit the number of times you see an advertisement and help measure the
                    effectiveness of advertising campaigns. We use Google AdSense to display advertisements.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 text-foreground font-medium">Cookie</th>
                          <th className="text-left py-2 pr-4 text-foreground font-medium">Purpose</th>
                          <th className="text-left py-2 text-foreground font-medium">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-xs">__gads</td>
                          <td className="py-2 pr-4">Google AdSense - Ad serving and targeting</td>
                          <td className="py-2">13 months</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-xs">__gpi</td>
                          <td className="py-2 pr-4">Google AdSense - Publisher ad serving</td>
                          <td className="py-2">13 months</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-xs">IDE</td>
                          <td className="py-2 pr-4">DoubleClick - Ad targeting and measurement</td>
                          <td className="py-2">13 months</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-xs">NID</td>
                          <td className="py-2 pr-4">Google - User preferences and ad personalization</td>
                          <td className="py-2">6 months</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">DSID</td>
                          <td className="py-2 pr-4">DoubleClick - Cross-device ad tracking</td>
                          <td className="py-2">2 weeks</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    These cookies may collect: browsing history, ad interactions, interests, demographics (age range, gender).
                  </p>
                </div>
              </section>

              {/* Third-Party Cookies */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Third-Party Cookies</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Some cookies on our website are set by third-party services. These include:
                </p>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-medium text-foreground text-sm mb-2">Google Analytics</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      We use Google Analytics to understand how visitors use our site. Google Analytics collects
                      data such as how often users visit, what pages they visit, and what other sites they visited
                      prior to coming to our site.
                    </p>
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Google Privacy Policy →
                    </a>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-medium text-foreground text-sm mb-2">Google AdSense</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      We display advertisements through Google AdSense. Google uses cookies to serve ads based on
                      your visits to our website and other websites on the internet. This helps support our free
                      platform while showing you relevant content.
                    </p>
                    <a
                      href="https://policies.google.com/technologies/ads"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Google Advertising Policies →
                    </a>
                  </div>
                </div>
              </section>

              {/* Managing Cookies */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ToggleRight className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">How to Manage Your Cookie Preferences</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You have control over how cookies are used on our website:
                </p>

                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-medium text-foreground text-sm mb-2">1. Through Our Cookie Banner</h3>
                    <p className="text-xs text-muted-foreground">
                      When you first visit UniVoid, you'll see a cookie consent banner. You can choose to accept
                      all cookies or only necessary cookies. You can change your preferences at any time by clearing
                      your browser's cookies and revisiting the site.
                    </p>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-medium text-foreground text-sm mb-2">2. Through Your Browser Settings</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Most browsers allow you to control cookies through their settings. Here's how to access
                      cookie settings in popular browsers:
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• <strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                      <li>• <strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                      <li>• <strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                      <li>• <strong>Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies</li>
                    </ul>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-medium text-foreground text-sm mb-2">3. Opt-Out of Personalized Advertising</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      You can opt out of personalized advertising by visiting:
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li>
                        <a
                          href="https://adssettings.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Google Ad Settings
                        </a>
                        {" "}- Control Google's ad personalization
                      </li>
                      <li>
                        <a
                          href="https://optout.aboutads.info"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Digital Advertising Alliance
                        </a>
                        {" "}- Opt out of interest-based advertising
                      </li>
                      <li>
                        <a
                          href="https://optout.networkadvertising.org"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Network Advertising Initiative
                        </a>
                        {" "}- Opt out of targeted advertising
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-medium text-foreground text-sm mb-2">4. Do Not Track Signals</h3>
                    <p className="text-xs text-muted-foreground">
                      Some browsers have a "Do Not Track" feature that signals websites not to track you.
                      Currently, there is no standard for how websites should respond to these signals, and
                      we do not currently respond to DNT signals. However, you can use the cookie management
                      options described above to control tracking.
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Note:</strong> Disabling certain cookies may affect the
                    functionality of our website. Some features may not work properly if you block all cookies.
                  </p>
                </div>
              </section>

              {/* Data Collection */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">What Data Do Cookies Collect?</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Depending on the cookie type and your consent choices, cookies may collect:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>IP address (which may indicate your general location)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Browser type and version</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Operating system and device type</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Pages you visit and time spent on each page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Referring website (how you arrived at our site)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Clicks, scrolls, and interactions with elements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Preference settings (theme, language, etc.)</span>
                  </li>
                </ul>
              </section>

              {/* Legal Basis */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Legal Basis for Using Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our use of cookies is based on:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">Necessary cookies:</span>
                    <span>Legitimate interest - required for the website to function</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">Other cookies:</span>
                    <span>Your explicit consent, which you provide through our cookie banner</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  You can withdraw your consent at any time by clearing your cookies and making a new choice
                  when the cookie banner appears.
                </p>
              </section>

              {/* Policy Updates */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Changes to This Cookie Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for
                  other operational, legal, or regulatory reasons. When we make changes, we will update the
                  "Effective Date" at the top of this page. We encourage you to review this policy periodically
                  to stay informed about how we use cookies.
                </p>
              </section>

              {/* Related Policies */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Related Policies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  For more information about how we handle your data, please review our other policies:
                </p>
                <ul className="space-y-2">
                  <li>
                    <Link to="/privacy-policy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    {" "}- How we collect, use, and protect your personal data
                  </li>
                  <li>
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms and Conditions
                    </Link>
                    {" "}- Rules for using UniVoid
                  </li>
                </ul>
              </section>

              {/* Contact */}
              <section className="pt-6 border-t border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you have questions about our use of cookies or this Cookie Policy, please contact us:
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

export default CookiePolicy;
