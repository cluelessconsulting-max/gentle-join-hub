const QrCardApply = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div
        className="bg-[#F5F0EB] relative shadow-2xl"
        style={{
          width: 420,
          aspectRatio: "3/4",
          padding: "48px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
        }}
      >
        {/* Embossed border effect */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: 14,
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.5)",
          }}
        />

        {/* Brand name */}
        <h1
          style={{
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontSize: 32,
            fontWeight: 400,
            letterSpacing: "0.18em",
            color: "#1a1a1a",
          }}
        >
          OFFLIST
        </h1>

        {/* Real scannable QR code */}
        <img
          src="/qr-code-apply.png"
          alt="QR Code - Apply to Offlist"
          style={{ width: 260, height: 260, imageRendering: "pixelated" }}
        />

        {/* Apply label */}
        <span
          style={{
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontSize: 14,
            letterSpacing: "0.25em",
            color: "#b8976a",
            fontWeight: 400,
          }}
        >
          APPLY
        </span>
      </div>
    </div>
  );
};

export default QrCardApply;
