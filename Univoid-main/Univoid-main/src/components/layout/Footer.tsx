import { Link } from "react-router-dom";
import { Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { href: "/events", label: "Events" },
    { href: "/materials", label: "Materials" },
    { href: "/projects", label: "Projects" },
    { href: "/books", label: "Books" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];

  const legalLinks = [
    { href: "/about-us", label: "About Us" },
    { href: "/faq", label: "FAQ" },
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Use" },
    { href: "/refund-policy", label: "Refund Policy" },
    { href: "/legal-disclaimer", label: "Legal Disclaimer" },
    { href: "/contact", label: "Contact / Support" },
  ];

  return (
    <footer className="border-t border-border bg-card/80 backdrop-blur-sm relative z-10 pb-4 md:pb-0">
      <div className="container-wide py-10">
        {/* Brand and Social */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-primary rounded-xl border border-border flex items-center justify-center transition-all group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] shadow-sketch-sm group-hover:shadow-sketch">
              <span className="text-primary-foreground font-extrabold text-lg font-display">U</span>
            </div>
            <span className="font-extrabold text-xl text-foreground font-display">UniVoid</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <a 
              href="https://www.instagram.com/univoid_community/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-card border border-border shadow-sketch-sm flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-sketch transition-all"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="w-5 h-5 text-foreground" strokeWidth={2} />
            </a>
            <a 
              href="https://www.linkedin.com/company/univoid/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-card border border-border shadow-sketch-sm flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-sketch transition-all"
              aria-label="Follow us on LinkedIn"
            >
              <Linkedin className="w-5 h-5 text-foreground" strokeWidth={2} />
            </a>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-6">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              to={link.href} 
              className="text-sm text-foreground hover:text-primary transition-colors font-semibold"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Legal Links */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8">
          {legalLinks.map((link) => (
            <Link 
              key={link.href}
              to={link.href} 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground text-center font-medium">
            © {currentYear} UniVoid. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
