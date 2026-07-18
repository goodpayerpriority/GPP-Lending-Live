const SUPABASE_URL = "https://fowgcdkwcmjchlinmywg.supabase.co";
const SUPABASE_KEY = "sb_publishable_BfNlckA6XfPk0rt_bv1kKQ_-RBQvl_L";

const SUBMIT_URL = `${SUPABASE_URL}/functions/v1/submit-application`;
const TRACK_URL = `${SUPABASE_URL}/functions/v1/track-application`;

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = id => document.getElementById(id);

function show(id) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  $(id).classList.add("active");
  window.scrollTo(0, 0);
}


/* =========================
   LOAN TERMS
========================= */

function term(amount) {
  if (amount >= 100 && amount <= 500) {
    return [20, 3];
  }

  if (amount >= 501 && amount <= 1000) {
    return [25, 5];
  }

  if (amount >= 1001 && amount <= 2000) {
    return [30, 7];
  }

  return null;
}


/* =========================
   DATE FORMAT
========================= */

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/* =========================
   UPDATE LOAN DETAILS
========================= */

function updateLoanDetails() {
  const amount = Number($("amount").value);
  const loanTerm = term(amount);

  if (!loanTerm) {
    $("terms").textContent =
      "Enter a valid amount from ₱100 to ₱2,000.";

    $("loanStartDate").value = "";
    $("loanEndDate").value = "";
    $("totalAmount").value = "";

    return;
  }

  const interestRate = loanTerm[0];
  const durationDays = loanTerm[1];

  const totalPayment =
    amount + amount * (interestRate / 100);

  const startDate = new Date();

  const endDate = new Date(startDate);
  endDate.setDate(
    endDate.getDate() + durationDays
  );

  $("loanStartDate").value =
    formatDate(startDate);

  $("loanEndDate").value =
    formatDate(endDate);

  $("totalAmount").value =
    `₱${totalPayment.toFixed(2)}`;

  $("terms").innerHTML = `
    <b>Your loan terms:</b><br>
    ${interestRate}% interest for ${durationDays} days.<br>
    Loan Start Date: <b>${formatDate(startDate)}</b><br>
    Loan End Date: <b>${formatDate(endDate)}</b><br>
    Total Amount to Pay:
    <b>₱${totalPayment.toFixed(2)}</b>
  `;
}


$("amount").addEventListener(
  "input",
  updateLoanDetails
);


/* =========================
   STUDENT SCHOOL LINK
========================= */

$("employment").addEventListener(
  "change",
  () => {
    const isStudent =
      $("employment").value === "Student";

    $("schoolBox").classList.toggle(
      "hidden",
      !isStudent
    );

    $("school").required =
      isStudent;
  }
);


/* =========================
   VIDEO SIZE CHECK
========================= */

$("video").addEventListener(
  "change",
  () => {
    const file =
      $("video").files[0];

    if (!file) {
      return;
    }

    const maxSize =
      50 * 1024 * 1024;

    if (file.size > maxSize) {
      alert(
        "Verification video must be under 50 MB. Please select a smaller video."
      );

      $("video").value = "";
    }
  }
);


/* =========================
   SUBMIT APPLICATION
========================= */

$("form").onsubmit = async event => {
  event.preventDefault();

  const button =
    event.submitter;

  const video =
    $("video").files[0];

  if (
    video &&
    video.size >
      50 * 1024 * 1024
  ) {
    alert(
      "Verification video must be under 50 MB."
    );

    return;
  }

  const amount =
    Number($("amount").value);

  const loanTerm =
    term(amount);

  if (!loanTerm) {
    alert(
      "Loan amount must be between ₱100 and ₱2,000."
    );

    return;
  }

  button.disabled = true;
  button.textContent =
    "Submitting...";

  const formData =
    new FormData();

  formData.append(
    "full_name",
    $("name").value
  );

  formData.append(
    "email",
    $("email").value
  );

  formData.append(
    "mobile_number",
    $("phone").value
  );

  formData.append(
    "date_of_birth",
    $("dob").value
  );

  formData.append(
    "full_address",
    $("address").value
  );

  formData.append(
    "brgy_captain",
    $("brgyCaptain").value
  );

  formData.append(
    "relative_fb_1",
    $("relativeFb1").value
  );

  formData.append(
    "relative_fb_2",
    $("relativeFb2").value
  );

  formData.append(
    "employment_type",
    $("employment").value
  );

  formData.append(
    "school_facebook_url",
    $("school").value
  );

  formData.append(
    "monthly_income",
    $("income").value
  );

  formData.append(
    "requested_amount",
    $("amount").value
  );

  formData.append(
    "loan_purpose",
    $("purpose").value
  );

  formData.append(
    "id_front",
    $("idFront").files[0]
  );

  formData.append(
    "id_back",
    $("idBack").files[0]
  );

  formData.append(
    "signature",
    $("signature").files[0]
  );

  formData.append(
    "verification_video",
    $("video").files[0]
  );

  try {
    const response =
      await fetch(
        SUBMIT_URL,
        {
          method: "POST",

          headers: {
            apikey:
              SUPABASE_KEY
          },

          body:
            formData
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        "Unable to submit the application."
      );
    }

    $("decision").className =
      "result";

    $("decision").innerHTML = `
      <h3>Application Submitted Successfully</h3>

      <p>
        Your application has been received and is pending review.
      </p>

      <p>
        Save your Application ID:
      </p>

      <p>
        <b>${escapeHtml(data.application_id)}</b>
      </p>

      <p>
        <b>Loan Start Date:</b>
        ${escapeHtml(data.loan.loan_start_date)}
      </p>

      <p>
        <b>Loan End Date:</b>
        ${escapeHtml(data.loan.loan_end_date)}
      </p>

      <p>
        <b>Total Amount to Pay:</b>
        ₱${Number(
          data.loan.total_payment
        ).toFixed(2)}
      </p>
    `;

    event.target.reset();

    $("schoolBox")
      .classList.add("hidden");

    $("loanStartDate").value =
      "";

    $("loanEndDate").value =
      "";

    $("totalAmount").value =
      "";

    $("terms").textContent =
      "Enter ₱100–₱2,000 to calculate terms.";

  } catch (error) {
    console.error(
      "Submission error:",
      error
    );

    alert(
      error.message
    );

  } finally {
    button.disabled = false;

    button.textContent =
      "Submit Application";
  }
};


/* =========================
   TRACK APPLICATION
========================= */

async function track() {
  const applicationId =
    $("trackId").value.trim();

  const result =
    $("trackResult");

  if (!applicationId) {
    result.className =
      "result";

    result.innerHTML = `
      <h3>Please enter your Application ID</h3>

      <p>
        Enter the Application ID you received after submitting your application.
      </p>
    `;

    return;
  }

  result.className =
    "result";

  result.innerHTML = `
    <h3>Checking Application...</h3>
    <p>Please wait.</p>
  `;

  try {
    const response =
      await fetch(
        TRACK_URL,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            apikey:
              SUPABASE_KEY
          },

          body:
            JSON.stringify({
              application_id:
                applicationId
            })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Unable to track application."
      );
    }

    const application =
      data.application;

    result.innerHTML = `
      <h3>Application Status</h3>

      <p>
        <b>Application ID:</b><br>
        ${escapeHtml(
          application.application_id
        )}
      </p>

      <p>
        <b>Name:</b><br>
        ${escapeHtml(
          application.full_name
        )}
      </p>

      <p>
        <b>Requested Amount:</b><br>
        ₱${Number(
          application.requested_amount
        ).toFixed(2)}
      </p>

      <p>
        <b>Loan Terms:</b><br>
        ${application.interest_rate}%
        interest for
        ${application.duration_days}
        days
      </p>

      <p>
        <b>Total Payment:</b><br>
        ₱${Number(
          application.total_payment
        ).toFixed(2)}
      </p>

      <p>
        <b>Status:</b><br>
        <strong>
          ${escapeHtml(
            application.status
          )}
        </strong>
      </p>
    `;

  } catch (error) {
    result.innerHTML = `
      <h3>Unable to Track Application</h3>

      <p>
        ${escapeHtml(
          error.message
        )}
      </p>
    `;
  }
}


/* =========================
   ADMIN LOGIN
========================= */

async function login() {
  const email =
    $("adminEmail")
      .value
      .trim();

  const password =
    $("adminPassword")
      .value;

  $("loginError")
    .textContent = "";

  const { error } =
    await sb.auth
      .signInWithPassword({
        email,
        password
      });

  if (error) {
    $("loginError")
      .textContent =
        error.message;

    return;
  }

  $("login")
    .classList
    .add("hidden");

  $("dashboard")
    .classList
    .remove("hidden");

  render();
}


/* =========================
   ADMIN LOGOUT
========================= */

async function logout() {
  await sb.auth.signOut();

  $("dashboard")
    .classList
    .add("hidden");

  $("login")
    .classList
    .remove("hidden");
}


/* =========================
   LOAD APPLICATIONS
========================= */

async function render() {
  $("list").innerHTML = `
    <tr>
      <td colspan="6">
        Loading applications...
      </td>
    </tr>
  `;

  const {
    data,
    error
  } =
    await sb
      .from(
        "applications"
      )
      .select("*")
      .order(
        "created_at",
        {
          ascending:
            false
        }
      );

  if (error) {
    $("list").innerHTML = `
      <tr>
        <td colspan="6">
          ${escapeHtml(
            error.message
          )}
        </td>
      </tr>
    `;

    return;
  }

  $("list").innerHTML =
    data.map(
      application => `
        <tr>

          <td>
            ${escapeHtml(
              application.application_id
            )}
          </td>

          <td>
            ${escapeHtml(
              application.full_name
            )}
          </td>

          <td>
            ₱${Number(
              application.requested_amount
            ).toFixed(2)}
          </td>

          <td>
            ${application.interest_rate}%
            /
            ${application.duration_days}
            days
          </td>

          <td>

            <select
              onchange="setStatus(
                '${application.id}',
                this.value
              )"
            >

              ${[
                "Pending Review",
                "Approved",
                "More Documents Required",
                "Declined"

              ].map(
                status => `
                  <option
                    ${
                      status ===
                      application.status
                        ? "selected"
                        : ""
                    }
                  >
                    ${status}
                  </option>
                `
              ).join("")}

            </select>

          </td>

          <td>

            <button
              onclick="viewDocs(
                '${application.id}'
              )"
            >
              Documents
            </button>

          </td>

        </tr>
      `
    ).join("") ||

    `
      <tr>
        <td colspan="6">
          No applications yet.
        </td>
      </tr>
    `;
}


/* =========================
   UPDATE STATUS
========================= */

async function setStatus(
  id,
  status
) {
  const { error } =
    await sb
      .from(
        "applications"
      )
      .update({
        status
      })
      .eq(
        "id",
        id
      );

  if (error) {
    alert(
      error.message
    );
  }
}


/* =========================
   VIEW PRIVATE DOCUMENTS
========================= */

async function viewDocs(id) {
  const {
    data: application,
    error
  } =
    await sb
      .from(
        "applications"
      )
      .select(
        "id_front_path,id_back_path,signature_path,verification_video_path"
      )
      .eq(
        "id",
        id
      )
      .single();

  if (error) {
    return alert(
      error.message
    );
  }

  const paths = [
    [
      "ID Front",
      application.id_front_path
    ],

    [
      "ID Back",
      application.id_back_path
    ],

    [
      "Signature",
      application.signature_path
    ],

    [
      "Verification Video",
      application.verification_video_path
    ]
  ];

  const links = [];

  for (
    const [
      label,
      path
    ]
    of paths
  ) {
    const {
      data,
      error
    } =
      await sb.storage
        .from(
          "application-documents"
        )
        .createSignedUrl(
          path,
          300
        );

    if (!error) {
      links.push(
        `
          <a
            href="${data.signedUrl}"
            target="_blank"
            rel="noopener"
          >
            ${label}
          </a>
        `
      );
    }
  }

  $("docLinks").innerHTML = `
    <h3>
      Private Documents
    </h3>

    <p>
      Links expire in 5 minutes.
    </p>

    ${links.join("<br>")}
  `;

  $("docLinks")
    .classList
    .remove("hidden");
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value) {
  return String(
    value ?? ""
  ).replace(
    /[&<>'"]/g,

    character => ({
      "&":
        "&amp;",

      "<":
        "&lt;",

      ">":
        "&gt;",

      "'":
        "&#39;",

      '"':
        "&quot;"

    }[character])
  );
}


/* =========================
   CHECK ADMIN SESSION
========================= */

sb.auth
  .getSession()
  .then(
    ({
      data
    }) => {

      if (
        data.session
      ) {
        $("login")
          .classList
          .add(
            "hidden"
          );

        $("dashboard")
          .classList
          .remove(
            "hidden"
          );

        render();
      }
    }
  );
