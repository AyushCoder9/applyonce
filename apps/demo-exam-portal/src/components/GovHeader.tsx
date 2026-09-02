import Link from "next/link";

export function GovHeader() {
  return (
    <>
      <div className="tricolour-stripe" aria-hidden="true" />
      <header className="gov-header">
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <span aria-hidden="true" style={{ width: 34, height: 34, borderRadius: "50%", background: "#fff", color: "#0b3d69", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontFamily: "Georgia, serif", flexShrink: 0 }}>
              BTA
            </span>
            <span>
              <strong style={{ display: "block", fontSize: 16, color: "#fff", fontFamily: "Georgia, 'Times New Roman', serif" }}>Bharat Test Agency</strong>
              <span style={{ display: "block", fontSize: 11, color: "#c9d7e5" }}>An autonomous testing body (demo) &middot; भारतीय परीक्षा एजेंसी</span>
            </span>
          </Link>
          <nav aria-label="Primary" style={{ display: "flex", gap: 16, fontSize: 13 }}>
            <Link href="/" style={{ color: "#fff" }}>Home</Link>
            <Link href="/apply/manual" style={{ color: "#fff" }}>Apply</Link>
            <Link href="/admin/webhooks" style={{ color: "#fff" }}>Admin</Link>
          </nav>
        </div>
      </header>
    </>
  );
}
