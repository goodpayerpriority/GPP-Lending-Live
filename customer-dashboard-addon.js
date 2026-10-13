/* GPP Lending Customer Dashboard Add-on
   This add-on is intentionally separate from index.html, style.css, and app.js.
   It replaces only the contents of #customerProfile after the existing app loads.
*/
(() => {
  "use strict";

  const SUPABASE_URL = "https://fowgcdkwcmjchlinmywg.supabase.co";
  const SUPABASE_KEY = "sb_publishable_BfNlckA6XfPk0rt_bv1kKQ_-RBQvl_L";
  const $ = (id) => document.getElementById(id);
  let client;
  let currentEmail = null;
  let channel = null;
  let refreshTimer = null;
  let busy = false;

  const money = (value) => {
    const n = Number(value);
    return Number.isFinite(n)
      ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(n)
      : "—";
  };

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));

  const dateLabel = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const daysLate = (dueDate) => {
    if (!dueDate) return 0;
    const due = new Date(`${String(dueDate).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(due.getTime())) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((today - due) / 86400000));
  };

  function dashboardMarkup() {
    return `
      <div class="gppcd-dashboard">
        <section class="gppcd-welcome">
          <div class="gppcd-welcome-copy">
            <h1>Welcome!</h1>
            <p>Name: <strong id="gppcdName">—</strong></p>
            <p>Mobile: <strong id="gppcdMobile">—</strong></p>
            <p>Email: <strong id="gppcdEmail">—</strong></p>
            <div class="gppcd-actions">
              <button type="button" class="gppcd-primary" onclick="show('apply')"><span>▤</span> Apply for a Loan</button>
              <button type="button" class="gppcd-outline" onclick="show('track')"><span>⌕</span> Track Application</button>
              <button type="button" class="gppcd-outline" onclick="customerLogout()"><span>⇥</span> Log Out</button>
            </div>
          </div>
          <div class="gppcd-avatar" aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="32" cy="21" r="13"/><path d="M9 57c1-13 10-21 23-21s22 8 23 21z"/></svg></div>
        </section>

        <section class="gppcd-summary">
          <article class="gppcd-stat gppcd-stat-active"><div class="gppcd-icon">▣</div><div><h3>Active Loan</h3><strong id="gppcdActiveAmount">₱0</strong><span id="gppcdActiveLabel" class="gppcd-pill">No active loan</span></div></article>
          <article class="gppcd-stat gppcd-stat-payment"><div class="gppcd-icon">▦</div><div><h3>Payment Status</h3><strong id="gppcdPaymentStatus">Up to date</strong><p id="gppcdPaymentNote">You have no overdue payment.</p></div></article>
          <article class="gppcd-stat gppcd-stat-total"><div class="gppcd-icon">◴</div><div><h3>Total Loans</h3><strong id="gppcdTotal">0</strong><p>Total number of loans availed</p></div></article>
        </section>

        <section class="gppcd-panel">
          <div class="gppcd-panel-head"><div class="gppcd-heading"><span class="gppcd-heading-icon">▤</span><h2>Loan Status</h2></div><button type="button" class="gppcd-primary" onclick="show('apply')">▤ &nbsp; Apply for a Loan</button></div>
          <div id="gppcdStatusBox" class="gppcd-status-box"><span class="gppcd-check">✓</span><div><strong>Loading your loan status…</strong><p>Please wait while we retrieve your records.</p></div></div>
        </section>

        <section class="gppcd-panel">
          <div class="gppcd-heading gppcd-history-heading"><span class="gppcd-heading-icon">◴</span><div><h2>Loan History</h2><p>This shows your past and current loan transactions.</p></div></div>
          <div class="gppcd-table-wrap"><table class="gppcd-table"><thead><tr><th>#</th><th>Date Applied</th><th>Amount</th><th>Due Date</th><th>Payment Date</th><th>Status</th></tr></thead><tbody id="gppcdHistory"><tr><td colspan="6">Loading your loan history…</td></tr></tbody></table></div>
        </section>

        <section class="gppcd-reminders">
          <h3><span class="gppcd-info">i</span> Reminders</h3>
          <ul><li>Your loan history only shows loans associated with your account.</li><li>For any concerns, please contact GPP Lending support.</li><li>Keep your payments on time to maintain a good borrowing record.</li></ul>
          <p id="gppcdUpdated" class="gppcd-updated">Your dashboard updates when your loan record changes.</p>
        </section>
      </div>`;
  }

  

function installMarkup() {
  const profile = $("customerProfile");
  if (!profile || profile.dataset.gppcdInstalled === "yes") return;

  profile.innerHTML = dashboardMarkup();
  profile.dataset.gppcdInstalled = "yes";
  profile.classList.add("gppcd-profile-shell");

  const account = $("account");
  const leftPanel = account?.querySelector(".login-left-panel");
  const rightPanel = account?.querySelector(".login-right-panel");

  const updatePanels = () => {
    const loggedIn = !profile.classList.contains("hidden");

    if (leftPanel) {
      leftPanel.style.display = loggedIn ? "none" : "";
    }

    if (rightPanel) {
  rightPanel.style.display = loggedIn ? "none" : "";
}
  };

  updatePanels();

  const observer = new MutationObserver(updatePanels);
  observer.observe(profile, {
    attributes: true,
    attributeFilter: ["class"]
  });
}


  function isActiveLoan(row) {
    const loan = String(row.loan_status || "").toLowerCase();
    const payment = String(row.payment_status || "").toLowerCase();
    return loan === "active" && payment !== "paid";
  }

  function rowStatus(row) {
    const payment = String(row.payment_status || "").toLowerCase();
    const loan = String(row.loan_status || "").toLowerCase();
    const status = String(row.status || "Pending Review");
    const due = row.official_due_date || row.loan_end_date || row.due_date;
    const late = isActiveLoan(row) ? daysLate(due) : 0;

    if (payment === "paid" || loan === "paid" || /fully paid|paid/i.test(status)) return { label: "Fully Paid", cls: "paid", detail: "" };
    if (late > 0) return { label: "Delayed", cls: "delayed", detail: `${late} day(s) overdue` };
    if (payment === "partial" || Number(row.amount_paid || 0) > 0) return { label: "Partial Payment", cls: "partial", detail: "" };
    if (/declined/i.test(status)) return { label: "Declined", cls: "declined", detail: "" };
    if (/approved/i.test(status) || loan === "active") return { label: "Approved", cls: "approved", detail: "" };
    if (/documents required/i.test(status)) return { label: "More Documents Required", cls: "pending", detail: "" };
    return { label: status, cls: "pending", detail: "" };
  }

  function renderRows(rows) {
    const eligible = rows.filter(row => {
      const status = String(row.status || "").toLowerCase();
      const loan = String(row.loan_status || "").toLowerCase();
      const payment = String(row.payment_status || "").toLowerCase();
      return loan === "active" || loan === "paid" || payment === "paid" || payment === "partial" || status === "approved" || status === "declined" || status.includes("pending") || status.includes("documents required");
    }).sort((a, b) => String(b.created_at || b.application_date || "").localeCompare(String(a.created_at || a.application_date || "")));

    const active = eligible.filter(isActiveLoan);
    const overdue = active.map(r => daysLate(r.official_due_date || r.loan_end_date || r.due_date)).filter(n => n > 0);
    const balance = active.reduce((sum, row) => {
      const remaining = Number(row.remaining_balance);
      if (Number.isFinite(remaining) && row.remaining_balance !== null && row.remaining_balance !== "") return sum + Math.max(0, remaining);
      const total = Number(row.total_payment ?? row.total_amount_to_pay ?? row.total_amount ?? row.requested_amount ?? row.loan_amount ?? 0);
      return sum + Math.max(0, total - Number(row.amount_paid || 0));
    }, 0);

    $("gppcdActiveAmount").textContent = money(balance).replace(/\.00$/, "");
    $("gppcdActiveLabel").textContent = active.length ? `${active.length} active loan${active.length === 1 ? "" : "s"}` : "No active loan";
    $("gppcdPaymentStatus").textContent = overdue.length ? "Payment overdue" : "Up to date";
    $("gppcdPaymentStatus").className = overdue.length ? "gppcd-payment-overdue" : "gppcd-payment-current";
    $("gppcdPaymentNote").textContent = overdue.length ? `${overdue.length} loan(s) overdue. Please check your due date.` : "You have no overdue payment.";
    const availedLoans = rows.filter(row =>
  ["active", "completed", "paid"].includes(
    String(row.loan_status || "").trim().toLowerCase()
  )
).length;

$("gppcdTotal").textContent = String(availedLoans);
    const statusBox = $("gppcdStatusBox");
    if (!active.length) {
      const latest = rows[0];
      if (latest && /pending|documents required/i.test(String(latest.status || ""))) {
        statusBox.className = "gppcd-status-box neutral";
        statusBox.innerHTML = `<span class="gppcd-check">i</span><div><strong>You have no active loan at the moment.</strong><p>Your latest application status is ${esc(latest.status)}.</p></div>`;
      } else {
        statusBox.className = "gppcd-status-box";
        statusBox.innerHTML = `<span class="gppcd-check">✓</span><div><strong>You have no active loan at the moment.</strong><p>You can apply for a new loan anytime.</p></div>`;
      }
    } else if (overdue.length) {
      const latestDue = active.map(r => ({ row: r, days: daysLate(r.official_due_date || r.loan_end_date || r.due_date) })).sort((a,b) => b.days-a.days)[0];
      statusBox.className = "gppcd-status-box overdue";
      statusBox.innerHTML = `<span class="gppcd-check">!</span><div><strong>Your loan payment is delayed.</strong><p>${latestDue.days} day(s) overdue. Due date: ${esc(dateLabel(latestDue.row.official_due_date || latestDue.row.loan_end_date || latestDue.row.due_date))}.</p></div>`;
    } else {
      const nextDue = active.map(r => r.official_due_date || r.loan_end_date || r.due_date).filter(Boolean).sort()[0];
      statusBox.className = "gppcd-status-box";
      statusBox.innerHTML = `<span class="gppcd-check">✓</span><div><strong>Your active loan is up to date.</strong><p>${nextDue ? `Due date: ${esc(dateLabel(nextDue))}.` : "You have no overdue payment."}</p></div>`;
    }

    const tbody = $("gppcdHistory");
    if (!eligible.length) {
      tbody.innerHTML = `<tr><td colspan="6">No loan records were found for this account yet.</td></tr>`;
    } else {
      tbody.innerHTML = eligible.map((row, i) => {
        const st = rowStatus(row);
        const amount = row.requested_amount ?? row.loan_amount ?? row.amount ?? 0;
        const paidAt = row.payment_date || row.paid_at || row.date_paid;
        return `<tr><td>${i + 1}</td><td>${esc(dateLabel(row.created_at || row.application_date))}</td><td>${esc(money(amount))}</td><td>${esc(dateLabel(row.official_due_date || row.loan_end_date || row.due_date))}</td><td>${esc(dateLabel(paidAt))}</td><td><span class="gppcd-badge ${st.cls}">${esc(st.label)}</span>${st.detail ? `<small class="gppcd-late">${esc(st.detail)}</small>` : ""}</td></tr>`;
      }).join("");
    }
    $("gppcdUpdated").textContent = `Last updated: ${new Date().toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}`;
  }

  async function refreshDashboard(email) {
    if (!email || busy || !client) return;
    busy = true;
    try {
      const { data: userResult } = await client.auth.getUser();
      const user = userResult?.user;
      if (!user || user.email?.toLowerCase() !== email.toLowerCase()) return;

      const { data: isAdmin, error: adminError } = await client.rpc("is_admin");
      if (adminError || isAdmin === true) return;

      const { data: profile } = await client.from("customer_profiles")
        .select("full_name,mobile_number").eq("user_id", user.id).maybeSingle();
      $("gppcdName").textContent = profile?.full_name || user.user_metadata?.full_name || "Customer";
      $("gppcdMobile").textContent = profile?.mobile_number || user.user_metadata?.mobile_number || "Not provided";
      $("gppcdEmail").textContent = user.email || "—";

      const { data, error } = await client.from("applications").select("*").ilike("email", email).order("created_at", { ascending: false });
      if (error) {
        console.error("GPP customer dashboard load failed:", error);
        $("gppcdHistory").innerHTML = `<tr><td colspan="6">Unable to load loan history. Please refresh or contact support.</td></tr>`;
        $("gppcdStatusBox").innerHTML = `<span class="gppcd-check">!</span><div><strong>Loan records could not be loaded.</strong><p>Please try again later.</p></div>`;
        return;
      }
      renderRows(data || []);
    } catch (err) {
      console.error("GPP customer dashboard error:", err);
    } finally {
      busy = false;
    }
  }

  function stopUpdates() {
    if (channel && client) client.removeChannel(channel);
    channel = null;
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = null;
    currentEmail = null;
  }

  function startUpdates(email) {
    if (!email || currentEmail === email) {
      if (email) refreshDashboard(email);
      return;
    }
    stopUpdates();
    currentEmail = email;
    channel = client.channel(`gpp-customer-dashboard-${email}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications", filter: `email=eq.${email}` }, () => refreshDashboard(email))
      .subscribe();
    refreshTimer = setInterval(() => {
      if (currentEmail === email && $("customerProfile") && !$("customerProfile").classList.contains("hidden")) refreshDashboard(email);
    }, 20000);
    refreshDashboard(email);
  }

  async function handleAuth(user) {
    installMarkup();
    if (!user || !user.email) {
      stopUpdates();
      return;
    }
    const { data: isAdmin, error } = await client.rpc("is_admin");
    if (error || isAdmin === true) {
      stopUpdates();
      return;
    }
    startUpdates(user.email);
  }

  function init() {
    installMarkup();
    if (!window.supabase?.createClient) {
      console.error("Supabase JS is not available; GPP dashboard add-on was not started.");
      return;
    }
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    client.auth.getSession().then(({ data }) => handleAuth(data?.session?.user || null));
    client.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => handleAuth(session?.user || null), 0);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
