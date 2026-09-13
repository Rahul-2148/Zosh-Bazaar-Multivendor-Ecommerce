import { useEffect } from "react";

const BecomeSeller = () => {
  const sellerBase = (
    import.meta.env.VITE_SELLER_PORTAL_URL || "http://localhost:5175"
  ).replace(/\/+$/, "");
  const registerUrl = `${sellerBase}/register`;

  useEffect(() => {
    window.location.href = registerUrl;
  }, [registerUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-2">
        <p className="text-sm font-semibold">Redirecting to Zosh Bazaar Merchant Portal...</p>
        <p className="text-xs text-muted-foreground">
          If not redirected automatically, please click{" "}
          <a
            href={registerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            here
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default BecomeSeller;
