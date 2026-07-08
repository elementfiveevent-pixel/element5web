import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/common/SEOHead";

const AboutUs = () => {
  return (
    <>
      <SEOHead
        title="About UniVoid | Unified Student Ecosystem for Learning, Projects & Growth"
        description="UniVoid is a unified student ecosystem for study materials, project collaboration, book reselling, tasks, and campus events—built to turn student effort into real growth."
        url="/about"
        keywords={['about UniVoid', 'student platform', 'study materials', 'project collaboration', 'student ecosystem']}
        structuredData={{
          "@type": "AboutPage",
          "name": "About UniVoid",
          "description": "UniVoid is a unified student ecosystem for study materials, project collaboration, book reselling, tasks, and campus events.",
          "url": "https://univoid.tech/about"
        }}
      />

      <div className="py-10 md:py-14">
        <div className="container-wide max-w-4xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">
              About UniVoid: A Unified Digital Ecosystem for Student Growth
            </h1>
          </div>

          <Card className="shadow-premium-sm">
            <CardContent className="p-6 md:p-8 space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                UniVoid is a student-first digital ecosystem created to solve the fragmented, inefficient, and outdated systems that define modern college life. It is built to support students not only academically, but also in collaboration, skill development, real-world exposure, and personal growth.
              </p>

              <p className="text-muted-foreground leading-relaxed">
                Today's students work hard, learn continuously, and participate in multiple activities—yet most of this effort remains invisible. Notes are shared in temporary WhatsApp groups. Study materials are scattered across drives and spreadsheets. Books are sold on random platforms. Project teams are formed through disconnected channels. Events rely on manual systems. Tasks and opportunities are missed simply due to lack of structure.
              </p>

              <p className="text-muted-foreground leading-relaxed">
                UniVoid exists to bring order to this chaos.
              </p>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">The Student Problem We Are Solving</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  College life is highly fragmented. Students juggle academics, projects, events, freelancing, and personal growth across dozens of disconnected tools. This fragmentation leads to inefficiency, poor collaboration, loss of data, lack of recognition, and zero continuity. Hard work does not compound. Contributions disappear. Talent remains hidden.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Most platforms focus on a single problem—notes, freelancing, events, or social networking—but students do not live single-dimensional lives. UniVoid is built to reflect the real, multi-dimensional student journey.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  By unifying key student activities into one ecosystem, UniVoid ensures that every effort contributes to long-term growth, visibility, and credibility.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">What UniVoid Does</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  UniVoid brings together essential student needs into a single, structured platform:
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Students can share and access study materials such as notes, guides, and academic resources within a trusted student-only environment. This encourages collaborative learning while ensuring quality and relevance.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  The platform enables a dedicated book reselling marketplace where students can buy and sell books within their academic community—making education more affordable and sustainable.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Through the Project Partner feature, students can find teammates for real-world projects, hackathons, startups, and academic initiatives based on skills, interests, and participation—rather than random groupings.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  UniVoid also enables students to complete micro-tasks and gigs, helping them earn income, gain experience, and build confidence before entering the professional world.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Campus events are streamlined through a centralized event system with QR-based check-ins, improving organization, attendance tracking, and overall experience.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Most importantly, UniVoid connects all these activities through a unified reputation and contribution system. Every meaningful action builds experience, visibility, and trust—creating a permanent digital record of effort and growth.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">Our Philosophy: Effort Should Compound</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  UniVoid is built on a simple belief: effort should matter.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Traditional education systems reward outcomes but ignore process. Marks capture results but fail to reflect collaboration, consistency, creativity, or problem-solving. UniVoid shifts the focus from passive consumption to active participation.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The platform values contribution over competition and skills over marks. By encouraging students to participate, collaborate, and build together, UniVoid helps students gain practical exposure long before graduation.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Students using UniVoid are able to develop real-world skills, discover peers with complementary abilities, and build professional confidence early in their journey.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">Why UniVoid Matters</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  There is a growing gap between college education and real-world readiness. Employers seek skills, collaboration, and initiative—yet students have limited platforms to demonstrate these qualities.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  UniVoid bridges this gap by creating a space where effort is visible, contributions are recorded, and growth is measurable. Instead of isolated activities, students build a continuous digital profile that reflects their learning, collaboration, and initiative over time.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  This makes UniVoid not just a platform, but a foundation for future careers, entrepreneurship, and lifelong learning.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">Our Commitment to Students</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  UniVoid is built by students and for students, with a strong focus on simplicity, privacy, and trust. The platform is designed to be intuitive, inclusive, and accessible—without unnecessary complexity.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We are committed to protecting student data, fostering a safe community, and promoting ethical, transparent interactions. UniVoid does not exist to exploit attention or promote unhealthy competition. It exists to empower students.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Our mission is to create a fair and supportive student ecosystem where opportunities are accessible, effort is recognized, and collaboration is encouraged.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">Looking Ahead</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  UniVoid aims to become the default digital ecosystem for students—one that grows with them throughout their academic journey. As the platform evolves, it will continue to expand responsibly while staying true to its core purpose: enabling students to learn better, collaborate smarter, and build stronger futures.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  At its core, UniVoid is about giving students what they have always deserved—a system where every effort counts, every contribution matters, and every student has the tools to build their future.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AboutUs;
