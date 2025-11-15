const Footer = () => {
  return (
    <footer className="bg-teal-600 text-white mt-10">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <h1 className="text-2xl font-bold mb-4 footer-logo">Zosh Bazaar</h1>
          <p className="text-teal-100 text-sm">
            A next-gen multivendor marketplace with AI-powered product recommendations and instant support.
          </p>
        </div>

        {/* Company */}
        <div>
          <h2 className="font-semibold mb-4 text-white">Company</h2>
          <ul className="space-y-2 text-teal-100">
            <li>
              <a href="#" className="hover:text-white transition-colors">About Us</a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">Careers</a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">Blog</a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </li>
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h2 className="font-semibold mb-4 text-white">Policies</h2>
          <ul className="space-y-2 text-teal-100">
            <li>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">Return Policy</a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">Shipping Info</a>
            </li>
          </ul>
        </div>

        {/* Social + AI Features */}
        <div>
          <h2 className="font-semibold mb-4 text-white">Connect</h2>
          <ul className="space-y-2 text-teal-100">
            <li>
              <a href="#" className="hover:text-white transition-colors">Facebook</a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
            </li>
          </ul>
          <h2 className="font-semibold mt-6 mb-2 text-white">AI Assistance</h2>
          <p className="text-teal-100 text-sm">
            Ask our AI assistant for product recommendations or instant support.
          </p>
        </div>
      </div>

      <div className="border-t border-teal-500 mt-10 py-6 text-center text-teal-100 text-sm">
        © 2025 Zosh Bazaar. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
