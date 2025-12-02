import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function Footer() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "Subscribed!",
        description: "You've been added to our newsletter.",
      });
      setEmail("");
    }
  };

  const quickLinks = [
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "Site Map", path: "/sitemap" },
    { name: "Terms of Service", path: "/terms" },
    { name: "Privacy Policy", path: "/privacy" },
    { name: "DMCA", path: "/dmca" },
  ];

  const categories = [
    { name: "Action", path: "/category/action" },
    { name: "Drama", path: "/category/drama" },
    { name: "Comedy", path: "/category/comedy" },
    { name: "Thriller", path: "/category/thriller" },
    { name: "Romance", path: "/category/romance" },
  ];

  const support = [
    { name: "Help Center", path: "/help" },
    { name: "FAQs", path: "/faq" },
    { name: "Report Issue", path: "/report" },
    { name: "Request Content", path: "/request" },
  ];

  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link href={link.path}>
                    <span
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      data-testid={`link-footer-${link.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.path}>
                  <Link href={category.path}>
                    <span
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      data-testid={`link-footer-category-${category.name.toLowerCase()}`}
                    >
                      {category.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {support.map((item) => (
                <li key={item.path}>
                  <Link href={item.path}>
                    <span
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      data-testid={`link-footer-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {item.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Newsletter */}
          <div>
            <h3 className="font-semibold mb-4">Stay Connected</h3>

            {/* Social Icons */}
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                asChild
                data-testid="button-social-facebook"
              >
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                asChild
                data-testid="button-social-instagram"
              >
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                asChild
                data-testid="button-social-twitter"
              >
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                asChild
                data-testid="button-social-telegram"
              >
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                >
                  <Send className="h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* Newsletter */}
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Subscribe to our newsletter
              </label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-newsletter-email"
                />
                <Button type="submit" data-testid="button-newsletter-submit">
                  Subscribe
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2024 StreamVault. All rights reserved.</p>
            <p>Your Premium Web Series Destination</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
