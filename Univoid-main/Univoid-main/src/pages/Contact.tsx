import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Send, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEOHead from "@/components/common/SEOHead";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().trim().email("Please enter a valid email").max(255, "Email too long"),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(200, "Subject too long"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message too long (max 2000 characters)"),
  honeypot: z.string().max(0, "Bot detected") // Spam protection
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { honeypot: "" }
  });

  const onSubmit = async (data: ContactFormData) => {
    // Rate limiting - prevent spam submissions
    const now = Date.now();
    if (now - lastSubmitTime < 30000) {
      toast.error("Please wait before submitting again");
      return;
    }

    // Honeypot check
    if (data.honeypot) {
      toast.error("Submission blocked");
      return;
    }

    setIsSubmitting(true);
    setLastSubmitTime(now);

    try {
      // Save to database
      const { error: dbError } = await supabase.from("contact_messages").insert({
        name: data.name.trim(),
        email: data.email.trim(),
        message: `[Subject: ${data.subject.trim()}]\n\n${data.message.trim()}`
      });

      if (dbError) throw dbError;

      // Send email notification via edge function
      const { error: emailError } = await supabase.functions.invoke("send-contact-email", {
        body: {
          name: data.name.trim(),
          email: data.email.trim(),
          subject: data.subject.trim(),
          message: data.message.trim()
        }
      });

      if (emailError) {
        console.error("Email notification failed:", emailError);
        // Don't fail the submission if email fails - message is saved
      }

      setIsSubmitted(true);
      reset();
      toast.success("Message sent successfully!");
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Contact Us"
        description="Get in touch with UniVoid. Have questions, feedback, or need support? We'd love to hear from you."
        url="/contact"
        keywords={['contact UniVoid', 'support', 'help', 'feedback', 'student platform contact']}
        structuredData={{
          "@type": "ContactPage",
          "name": "Contact UniVoid",
          "description": "Contact page for UniVoid student platform",
          "url": "https://univoid.tech/contact"
        }}
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-center">
            Contact Us
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Have questions or feedback? We'd love to hear from you.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-border">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a href="mailto:univoid35@gmail.com" className="text-foreground font-medium hover:text-primary">
                    univoid35@gmail.com
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Thank you!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your message has been sent. We'll get back to you soon.
                  </p>
                  <Button onClick={() => setIsSubmitted(false)}>Send another message</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Honeypot field - hidden from users, visible to bots */}
                  <input
                    type="text"
                    {...register("honeypot")}
                    className="absolute -left-[9999px] opacity-0"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      {...register("name")}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      {...register("email")}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="What's this about?"
                      {...register("subject")}
                      className={errors.subject ? "border-destructive" : ""}
                    />
                    {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Your message..."
                      rows={5}
                      {...register("message")}
                      className={errors.message ? "border-destructive" : ""}
                    />
                    {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Contact;