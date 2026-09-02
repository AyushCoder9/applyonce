export default function HomePage() {
  return (
    <div>
      <div className="gov-card" style={{ padding: "16px 20px", marginBottom: 20, borderLeft: "4px solid var(--color-gov-blue)" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 6px" }}>BTA-JEE 2026 — Joint Entrance Examination (Sample), Session 1</h1>
        <p style={{ margin: 0, color: "var(--color-gov-ink-2)" }}>
          F.No. BTA/JEE/2026/01 — Online applications are invited from eligible candidates for admission to undergraduate
          engineering and architecture programmes for the academic year 2026-27.
        </p>
      </div>

      <section className="gov-card" style={{ padding: "16px 20px", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>Important Dates</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f2f4f6", textAlign: "left" }}>
                <th style={{ padding: "6px 10px", border: "1px solid var(--color-gov-border)" }}>Event</th>
                <th style={{ padding: "6px 10px", border: "1px solid var(--color-gov-border)" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Online application begins", "01 Sep 2026"],
                ["Last date for submission of application", "22 Sep 2026"],
                ["Last date for fee payment", "23 Sep 2026"],
                ["Correction window", "25–27 Sep 2026"],
                ["Admit card release", "15 Oct 2026"],
                ["Examination date", "01–08 Nov 2026"],
              ].map(([event, date]) => (
                <tr key={event}>
                  <td style={{ padding: "6px 10px", border: "1px solid var(--color-gov-border)" }}>{event}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid var(--color-gov-border)" }}>{date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div className="gov-card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>New Registration</h2>
          <p style={{ marginTop: 0, color: "var(--color-gov-ink-2)" }}>
            Fill a 6-step, 56-field form by hand: personal details, addresses, parents &amp; income, category &amp;
            eligibility, education records, and exam preferences — with photo/signature/certificate uploads.
          </p>
          <a href="/apply/manual" className="btn btn-secondary">Fill manually &rarr;</a>
        </div>
        <div className="gov-card" style={{ padding: 20, borderColor: "var(--color-gov-blue)" }}>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>Have a Praman account?</h2>
          <p style={{ marginTop: 0, color: "var(--color-gov-ink-2)" }}>
            Skip the form. Praman fills your name, address, marks, category and uploads &mdash; already verified by
            UIDAI, CBSE and your state e-District &mdash; in one click.
          </p>
          <form action="/api/praman/session" method="POST">
            <button type="submit" className="btn btn-primary">Apply with Praman &rarr;</button>
          </form>
        </div>
      </section>

      <section className="gov-card" style={{ padding: "16px 20px", fontSize: 13, color: "var(--color-gov-ink-2)" }}>
        <h2 style={{ fontSize: 14, margin: "0 0 8px", color: "var(--color-gov-navy-dark)" }}>Notice</h2>
        <ul style={{ marginTop: 0, paddingLeft: 18 }}>
          <li>Candidates are advised to keep scanned copies of photograph, signature, Class 10/12 marksheets and category certificate ready before starting the application.</li>
          <li>Mobile number, email and photograph cannot be changed after final submission.</li>
          <li>This is a demonstration portal built for the Praman project. No real examination is being conducted.</li>
        </ul>
      </section>
    </div>
  );
}
