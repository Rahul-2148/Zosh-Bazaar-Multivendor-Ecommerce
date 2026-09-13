const Footer = () => {
  return (
    <footer className="bg-card text-foreground border-t border-border mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <h1 className="text-2xl font-bold mb-4 logo">Zosh Bazaar</h1>
          <p className="text-muted-foreground text-sm">
            A next-gen multivendor marketplace with AI-powered product recommendations and instant support.
          </p>
        </div>

        {/* Company */}
        <div>
          <h2 className="font-semibold mb-4 text-foreground">Company</h2>
          <ul className="space-y-2 text-muted-foreground text-sm">
            <li>
              <a href="#" className="hover:text-primary transition-colors">About Us</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">Careers</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">Blog</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">Contact</a>
            </li>
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h2 className="font-semibold mb-4 text-foreground">Policies</h2>
          <ul className="space-y-2 text-muted-foreground text-sm">
            <li>
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">Return Policy</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">Shipping Info</a>
            </li>
          </ul>
        </div>

        {/* Social + AI Features */}
        <div>
          <h2 className="font-semibold mb-4 text-foreground">Connect</h2>
          <ul className="space-y-2 text-muted-foreground text-sm">
            <li>
              <a href="#" className="hover:text-primary transition-colors">Facebook</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">Instagram</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">LinkedIn</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            </li>
          </ul>
          <h2 className="font-semibold mt-6 mb-2 text-foreground">AI Assistance</h2>
          <p className="text-muted-foreground text-sm">
            Ask our AI assistant for product recommendations or instant support.
          </p>
        </div>
      </div>

      <div className="border-t border-border py-6 text-center text-muted-foreground text-sm">
        © 2026 Zosh Bazaar. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
