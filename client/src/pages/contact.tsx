import { Mail, MessageSquare, HelpCircle } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Have questions or feedback? We're here to help!
          </p>

          {/* Contact Options */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6 rounded-lg bg-card border border-border">
              <div className="flex justify-center mb-4">
                <Mail className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Email Us</h3>
              <p className="text-muted-foreground mb-4">
                Send us an email and we'll respond within 24-48 hours.
              </p>
              <a 
                href="mailto:support@streamvault.com" 
                className="text-primary hover:underline"
              >
                support@streamvault.com
              </a>
            </div>

            <div className="text-center p-6 rounded-lg bg-card border border-border">
              <div className="flex justify-center mb-4">
                <MessageSquare className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Feedback</h3>
              <p className="text-muted-foreground mb-4">
                Share your thoughts and help us improve StreamVault.
              </p>
              <a 
                href="mailto:feedback@streamvault.com" 
                className="text-primary hover:underline"
              >
                feedback@streamvault.com
              </a>
            </div>

            <div className="text-center p-6 rounded-lg bg-card border border-border">
              <div className="flex justify-center mb-4">
                <HelpCircle className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Support</h3>
              <p className="text-muted-foreground mb-4">
                Need help? Our support team is ready to assist you.
              </p>
              <a 
                href="mailto:help@streamvault.com" 
                className="text-primary hover:underline"
              >
                help@streamvault.com
              </a>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="p-6 rounded-lg bg-card border border-border">
                <h3 className="text-xl font-semibold mb-2">Is StreamVault really free?</h3>
                <p className="text-muted-foreground">
                  Yes! StreamVault is completely free to use. We're supported by advertisements to keep the service free for everyone.
                </p>
              </div>

              <div className="p-6 rounded-lg bg-card border border-border">
                <h3 className="text-xl font-semibold mb-2">Do I need to create an account?</h3>
                <p className="text-muted-foreground">
                  No account is required! Your watch progress and watchlist are saved locally in your browser.
                </p>
              </div>

              <div className="p-6 rounded-lg bg-card border border-border">
                <h3 className="text-xl font-semibold mb-2">Can I request a show or movie?</h3>
                <p className="text-muted-foreground">
                  Absolutely! Send us an email with your request and we'll do our best to add it to our library.
                </p>
              </div>

              <div className="p-6 rounded-lg bg-card border border-border">
                <h3 className="text-xl font-semibold mb-2">Why isn't a video playing?</h3>
                <p className="text-muted-foreground">
                  Try refreshing the page or clearing your browser cache. If the problem persists, please contact our support team.
                </p>
              </div>

              <div className="p-6 rounded-lg bg-card border border-border">
                <h3 className="text-xl font-semibold mb-2">How often is new content added?</h3>
                <p className="text-muted-foreground">
                  We regularly update our library with new episodes and shows. Check back often for the latest content!
                </p>
              </div>
            </div>
          </div>

          {/* Business Inquiries */}
          <div className="p-8 rounded-lg bg-card border border-border">
            <h2 className="text-2xl font-bold mb-4">Business Inquiries</h2>
            <p className="text-muted-foreground mb-4">
              For partnerships, advertising, or other business opportunities, please contact:
            </p>
            <a 
              href="mailto:business@streamvault.com" 
              className="text-primary hover:underline text-lg font-semibold"
            >
              business@streamvault.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
