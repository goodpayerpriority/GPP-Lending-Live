const SUPABASE_URL = "https://fowgcdkwcmjchlinmywg.supabase.co";
const SUPABASE_KEY = "sb_publishable_BfNlckA6XfPk0rt_bv1kKQ_-RBQvl_L";

const SUBMIT_URL =
  `${SUPABASE_URL}/functions/v1/submit-application`;

const GENERATE_PDF_URL =
  `${SUPABASE_URL}/functions/v1/generate-application-pdf`;

const TRACK_URL =
  `${SUPABASE_URL}/functions/v1/track-application`;

const sb =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

const $ =
  id => document.getElementById(id);


/* =========================================
   PAGE NAVIGATION
========================================= */

function show(id) {

  document
    .querySelectorAll(".page")
    .forEach(page => {
      page.classList.remove("active");
    });

  const target = $(id);

  if (target) {
    target.classList.add("active");
  }

  window.scrollTo(0, 0);

  if (id === "apply") {
    setTimeout(() => {
      resizeSignatureCanvas();
    }, 100);
  }
}


/* =========================================
   LOAN TERMS
========================================= */

function term(amount) {

  if (
    amount >= 100 &&
    amount <= 500
  ) {
    return [20, 3];
  }

  if (
    amount >= 501 &&
    amount <= 1000
  ) {
    return [25, 5];
  }

  if (
    amount >= 1001 &&
    amount <= 2000
  ) {
    return [30, 7];
  }

  return null;
}


/* =========================================
   FORMAT DATE FOR INPUT
========================================= */

function formatDateForInput(date) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/* =========================================
   FORMAT DATE FOR DISPLAY
========================================= */

function formatDisplayDate(value) {

  if (!value) {
    return "—";
  }

  const cleanValue =
    String(value).trim();

  const dateOnly =
    cleanValue.split("T")[0];

  const parts =
    dateOnly.split("-");

  if (parts.length !== 3) {
    return cleanValue;
  }

  const year =
    Number(parts[0]);

  const month =
    Number(parts[1]);

  const day =
    Number(parts[2]);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return cleanValue;
  }

  return date.toLocaleDateString(
    "en-PH",
    {
      year: "numeric",
      month: "long",
      day: "numeric"
    }
  );
}


/* =========================================
   MONEY FORMAT
========================================= */

function formatMoney(value) {

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "₱0.00";
  }

  return (
    "₱" +
    number.toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )
  );
}


/* =========================================
   AUTOMATIC LOAN DETAILS
========================================= */

function updateLoanDetails() {

  const amountInput =
    $("amount");

  const startDateInput =
    $("loanStartDate");

  const endDateInput =
    $("loanEndDate");

  const totalAmountInput =
    $("totalAmount");

  const termsBox =
    $("terms");

  if (
    !amountInput ||
    !startDateInput ||
    !endDateInput ||
    !totalAmountInput ||
    !termsBox
  ) {
    return;
  }

  const amount =
    Number(
      amountInput.value
    );

  const loanTerm =
    term(amount);

  if (!loanTerm) {

    startDateInput.value = "";
    endDateInput.value = "";
    totalAmountInput.value = "";

    termsBox.textContent =
      "Enter ₱100–₱2,000 to calculate terms.";

    return;
  }

  const interestRate =
    loanTerm[0];

  const durationDays =
    loanTerm[1];

  const totalPayment =
    amount +
    (
      amount *
      interestRate /
      100
    );

  const startDate =
    new Date();

  const endDate =
    new Date(startDate);

  endDate.setDate(
    endDate.getDate() +
    durationDays
  );

  startDateInput.value =
    formatDateForInput(
      startDate
    );

  endDateInput.value =
    formatDateForInput(
      endDate
    );

  totalAmountInput.value =
    formatMoney(
      totalPayment
    );

  termsBox.innerHTML = `

    <b>Your loan terms:</b>

    ${interestRate}% interest
    for ${durationDays} days.

    <br><br>

    <b>Loan Start Date:</b>
    ${escapeHtml(
      formatDisplayDate(
        startDateInput.value
      )
    )}

    <br>

    <b>Loan End Date / Due Date:</b>
    ${escapeHtml(
      formatDisplayDate(
        endDateInput.value
      )
    )}

    <br>

    <b>Total Amount to Pay:</b>
    ${escapeHtml(
      formatMoney(
        totalPayment
      )
    )}

  `;
}


/* =========================================
   AMOUNT EVENT LISTENERS
========================================= */

if ($("amount")) {

  $("amount")
    .addEventListener(
      "input",
      updateLoanDetails
    );

  $("amount")
    .addEventListener(
      "change",
      updateLoanDetails
    );
}


/* =========================================
   STUDENT SCHOOL FIELD
========================================= */

if ($("employment")) {

  $("employment")
    .addEventListener(
      "change",
      function () {

        const isStudent =
          $("employment").value ===
          "Student";

        if ($("schoolBox")) {

          $("schoolBox")
            .classList
            .toggle(
              "hidden",
              !isStudent
            );
        }

        if ($("school")) {
          $("school").required =
            isStudent;
        }
      }
    );
}


/* =========================================
   SIGNATURE PAD
========================================= */

let signatureCanvas = null;
let signatureContext = null;
let signatureDrawing = false;
let signatureHasDrawing = false;


/* =========================================
   INITIALIZE SIGNATURE PAD
========================================= */

function initializeSignaturePad() {

  signatureCanvas =
    $("signatureCanvas");

  if (!signatureCanvas) {
    return;
  }

  signatureContext =
    signatureCanvas.getContext(
      "2d"
    );

  resizeSignatureCanvas();

  signatureCanvas.addEventListener(
    "pointerdown",
    startSignatureDrawing
  );

  signatureCanvas.addEventListener(
    "pointermove",
    drawSignature
  );

  signatureCanvas.addEventListener(
    "pointerup",
    stopSignatureDrawing
  );

  signatureCanvas.addEventListener(
    "pointercancel",
    stopSignatureDrawing
  );

  signatureCanvas.addEventListener(
    "pointerleave",
    stopSignatureDrawing
  );

  window.addEventListener(
    "resize",
    resizeSignatureCanvas
  );
}


/* =========================================
   RESIZE SIGNATURE CANVAS
========================================= */

function resizeSignatureCanvas() {

  const canvas =
    $("signatureCanvas");

  if (!canvas) {
    return;
  }

  const wrapper =
    canvas.parentElement;

  if (!wrapper) {
    return;
  }

  const width =
    wrapper.clientWidth;

  if (
    !width ||
    width <= 0
  ) {
    return;
  }

  /*
    Do not resize after the borrower has
    already signed because resizing a canvas
    clears the drawing.
  */

  if (
    signatureHasDrawing &&
    canvas.width > 0
  ) {
    return;
  }

  const ratio =
    Math.max(
      window.devicePixelRatio || 1,
      1
    );

  const displayHeight =
    180;

  canvas.width =
    Math.floor(
      width * ratio
    );

  canvas.height =
    Math.floor(
      displayHeight * ratio
    );

  canvas.style.width =
    `${width}px`;

  canvas.style.height =
    `${displayHeight}px`;

  signatureContext =
    canvas.getContext(
      "2d"
    );

  signatureContext.setTransform(
    ratio,
    0,
    0,
    ratio,
    0,
    0
  );

  signatureContext.lineWidth =
    2.5;

  signatureContext.lineCap =
    "round";

  signatureContext.lineJoin =
    "round";

  signatureContext.strokeStyle =
    "#111827";
}


/* =========================================
   GET SIGNATURE POINTER POSITION
========================================= */

function getSignaturePosition(event) {

  const rect =
    signatureCanvas
      .getBoundingClientRect();

  return {

    x:
      event.clientX -
      rect.left,

    y:
      event.clientY -
      rect.top

  };
}


/* =========================================
   START SIGNATURE DRAWING
========================================= */

function startSignatureDrawing(event) {

  if (
    !signatureCanvas ||
    !signatureContext
  ) {
    return;
  }

  event.preventDefault();

  signatureDrawing =
    true;

  signatureHasDrawing =
    true;

  const position =
    getSignaturePosition(
      event
    );

  signatureContext
    .beginPath();

  signatureContext
    .moveTo(
      position.x,
      position.y
    );

  if (
    signatureCanvas
      .setPointerCapture
  ) {

    try {

      signatureCanvas
        .setPointerCapture(
          event.pointerId
        );

    } catch {
      // Ignore unsupported pointer capture.
    }
  }

  const placeholder =
    $("signaturePlaceholder");

  if (placeholder) {

    placeholder.style.display =
      "none";
  }

  const error =
    $("signatureError");

  if (error) {

    error.textContent =
      "";
  }
}


/* =========================================
   DRAW SIGNATURE
========================================= */

function drawSignature(event) {

  if (
    !signatureDrawing ||
    !signatureContext
  ) {
    return;
  }

  event.preventDefault();

  const position =
    getSignaturePosition(
      event
    );

  signatureContext
    .lineTo(
      position.x,
      position.y
    );

  signatureContext
    .stroke();
}


/* =========================================
   STOP SIGNATURE DRAWING
========================================= */

function stopSignatureDrawing(event) {

  if (!signatureDrawing) {
    return;
  }

  signatureDrawing =
    false;

  if (signatureContext) {

    signatureContext
      .closePath();
  }

  if (
    signatureCanvas &&
    event &&
    signatureCanvas
      .releasePointerCapture
  ) {

    try {

      if (
        signatureCanvas
          .hasPointerCapture(
            event.pointerId
          )
      ) {

        signatureCanvas
          .releasePointerCapture(
            event.pointerId
          );
      }

    } catch {
      // Ignore unsupported pointer capture.
    }
  }
}


/* =========================================
   CLEAR SIGNATURE
========================================= */

function clearSignature() {

  const canvas =
    $("signatureCanvas");

  if (!canvas) {
    return;
  }

  const context =
    canvas.getContext(
      "2d"
    );

  context.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  signatureHasDrawing =
    false;

  signatureDrawing =
    false;

  const placeholder =
    $("signaturePlaceholder");

  if (placeholder) {

    placeholder.style.display =
      "";
  }

  const error =
    $("signatureError");

  if (error) {

    error.textContent =
      "";
  }
}


/* =========================================
   CONVERT SIGNATURE TO PNG FILE
========================================= */

function getSignatureFile() {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const canvas =
        $("signatureCanvas");

      if (
        !canvas ||
        !signatureHasDrawing
      ) {

        reject(
          new Error(
            "Please draw your signature before submitting."
          )
        );

        return;
      }

      canvas.toBlob(
        blob => {

          if (!blob) {

            reject(
              new Error(
                "Unable to process your signature. Please sign again."
              )
            );

            return;
          }

          const file =
            new File(
              [blob],
              "signature.png",
              {
                type:
                  "image/png"
              }
            );

          resolve(file);
        },
        "image/png"
      );
    }
  );
}


/* =========================================
   VIDEO SIZE CHECK
========================================= */

if ($("video")) {

  $("video")
    .addEventListener(
      "change",
      function () {

        const file =
          $("video")
            .files[0];

        if (!file) {
          return;
        }

        const maxSize =
          50 *
          1024 *
          1024;

        if (
          file.size >
          maxSize
        ) {

          alert(
            "Verification video must be under 50 MB. Please select a smaller video."
          );

          $("video").value =
            "";
        }
      }
    );
}


/* =========================================
   SUBMIT APPLICATION
========================================= */

if ($("form")) {

  $("form")
    .addEventListener(
      "submit",

      async function (event) {

        event.preventDefault();

        const button =
          event.submitter;

        const amount =
          Number(
            $("amount").value
          );

        const loanTerm =
          term(amount);

        if (!loanTerm) {

          alert(
            "Please enter a loan amount from ₱100 to ₱2,000."
          );

          return;
        }


        /* CHECK SIGNATURE */

const isReloan = new URLSearchParams(window.location.search).get("reloan") === "true";

if (!isReloan && !signatureHasDrawing) {

          const signatureError =
            $("signatureError");

          if (signatureError) {

            signatureError.textContent =
              "Please draw your signature before submitting.";
          }

          $("signatureCanvas")
            ?.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });

          return;
        }


        const video =
          $("video").files[0];

        if (
          video &&
          video.size >
          50 *
          1024 *
          1024
        ) {

          alert(
            "Verification video must be under 50 MB."
          );

          return;
        }


        if (button) {

          button.disabled =
            true;

          button.textContent =
            "Submitting...";
        }


        try {

          /*
            Convert the drawn signature into
            a real PNG file before submission.
          */

let signatureFile = null;

if (!isReloan) {
  signatureFile = await getSignatureFile();
}


          const formData =
            new FormData();


          /* PERSONAL INFORMATION */

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


          /* RELATIVES */

          formData.append(
            "relative_fb_1",
            $("relativeFb1").value
          );

          formData.append(
            "relative_fb_2",
            $("relativeFb2").value
          );


          /* EMPLOYMENT */

          formData.append(
            "employment_type",
            $("employment").value
          );

          formData.append(
            "school_facebook_url",
            $("school").value || ""
          );

          formData.append(
            "monthly_income",
            $("income").value
          );


          /* LOAN INFORMATION */

          formData.append(
            "requested_amount",
            $("amount").value
          );

          formData.append(
            "loan_purpose",
            $("purpose").value
          );

          formData.append(
            "loan_start_date",
            $("loanStartDate").value
          );

          formData.append(
            "loan_end_date",
            $("loanEndDate").value
          );

          formData.append(
            "total_amount_to_pay",
            $("totalAmount")
              .value
              .replace(
                /[₱,]/g,
                ""
              )
          );


          /* DOCUMENTS */


if (isReloan && window.reloanExistingDocuments) {
  formData.append(
    "existing_id_front_path",
    window.reloanExistingDocuments.id_front_path
  );

  formData.append(
    "existing_id_back_path",
    window.reloanExistingDocuments.id_back_path
  );

  formData.append(
    "existing_signature_path",
    window.reloanExistingDocuments.signature_path
  );

  formData.append(
    "existing_verification_video_path",
    window.reloanExistingDocuments.verification_video_path
  );
} else {
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
    signatureFile
  );

  formData.append(
    "verification_video",
    $("video").files[0]
  );
}


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


          let data;

          try {

            data =
              await response.json();

          } catch {

            throw new Error(
              "The server returned an invalid response."
            );
          }


          if (!response.ok) {

            throw new Error(
              data.error ||
              data.message ||
              "Unable to submit the application."
            );
          }


          const applicationId =
            data.application_id ||
            "Application submitted";


          $("decision").className =
            "result";


          $("decision").innerHTML = `

            <h3>
              Application Submitted
            </h3>

            <p>
              Save your Application ID:
            </p>

            <p>
              <b>
                ${escapeHtml(
                  applicationId
                )}
              </b>
            </p>

            <p>
              Your application is now
              <b>Pending Review</b>.
            </p>

            <p>
              You can use your Application ID
              in the Track page to check
              future updates.
            </p>

          `;


          event.target.reset();

          clearSignature();


          if ($("schoolBox")) {

            $("schoolBox")
              .classList
              .add(
                "hidden"
              );
          }


          if ($("school")) {

            $("school").required =
              false;
          }


          updateLoanDetails();


          $("decision")
            .scrollIntoView({
              behavior:
                "smooth"
            });


        } catch (error) {

          console.error(
            "Submission error:",
            error
          );

          alert(
            error.message ||
            "Unable to submit the application. Please try again."
          );

        } finally {

          if (button) {

            button.disabled =
              false;

            button.textContent =
              "Submit Application";
          }
        }
      }
    );
}


/* =========================================
   START SIGNATURE PAD
========================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeSignaturePad
  );

} else {

  initializeSignaturePad();
}
/* =========================================
   RE-LOAN AUTO-FILL
========================================= */

document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);

  const isReloan = params.get("reloan") === "true";

if (isReloan) {
  const idFrontInput = $("idFront");
  const idBackInput = $("idBack");
  const videoInput = $("video");
  const form = $("form");

  if (idFrontInput) idFrontInput.required = false;
  if (idBackInput) idBackInput.required = false;
  if (videoInput) videoInput.required = false;

  if (form) {
    form.setAttribute("novalidate", "novalidate");
  }
}
  
  if (params.get("reloan") !== "true") {
    return;
  }

  const savedApplication = localStorage.getItem("reloanApplication");

  if (!savedApplication) {
    return;
  }

  try {
    const application = JSON.parse(savedApplication);

    $("name").value = application.full_name || "";
    $("email").value = application.email || "";
    $("phone").value = application.mobile_number || "";
    $("dob").value = application.date_of_birth || "";
    $("address").value = application.full_address || "";
    $("brgyCaptain").value = application.brgy_captain || "";
    $("employment").value = application.employment_type || "";
    $("income").value = application.monthly_income || "";
    $("relativeFb1").value = application.relative_fb_1 || "";
    $("relativeFb2").value = application.relative_fb_2 || "";
    $("school").value = application.school_facebook_url || "";

    window.reloanExistingDocuments = {
  id_front_path: application.id_front_path || "",
  id_back_path: application.id_back_path || "",
  signature_path: application.signature_path || "",
  verification_video_path: application.verification_video_path || ""
};
    
    show("apply");

    if (typeof updateTerms === "function") {
      updateTerms();
    }
  } catch (error) {
    console.error("Unable to load re-loan data:", error);
  }
});

/* =========================================
   TRACK APPLICATION
========================================= */

async function track() {

  const applicationId =
    $("trackId").value.trim();

  const result =
    $("trackResult");

  if (!applicationId) {

    result.className =
      "result";

    result.innerHTML = `

      <h3>
        Please Enter Your Application ID
      </h3>

      <p>
        Enter the Application ID you received
        after submitting your application.
      </p>

    `;

    return;
  }


  result.className =
    "result";

  result.innerHTML = `

    <h3>
      Checking Application...
    </h3>

    <p>
      Please wait.
    </p>

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
      data.application ||
      data;


    const applicationStatus =
      application.status ||
      application.application_status ||
      "Pending Review";


    const loanStatus =
      application.loan_status ||
      "";


    const paymentStatus =
      application.payment_status ||
      "";


    const dueStatus =
      application.due_status ||
      application.delay_status ||
      "";


    const requestedAmount =
      Number(
        application.requested_amount
      );


    const totalPayment =
      Number(
        application.total_payment ||
        application.total_amount_to_pay
      );


    let statusDetails =
      "";


    if (loanStatus) {

      statusDetails += `

        <p>

          <b>Loan Status:</b><br>

          <strong>
            ${escapeHtml(
              loanStatus
            )}
          </strong>

        </p>

      `;
    }


    if (paymentStatus) {

      statusDetails += `

        <p>

          <b>Payment Status:</b><br>

          <strong>
            ${escapeHtml(
              paymentStatus
            )}
          </strong>

        </p>

      `;
    }


    if (dueStatus) {

      statusDetails += `

        <p>

          <b>Due Status:</b><br>

          <strong>
            ${escapeHtml(
              dueStatus
            )}
          </strong>

        </p>

      `;
    }


    result.innerHTML = `

      <h3>
        Application Status
      </h3>


      <p>

        <b>Application ID:</b><br>

        ${escapeHtml(
          application.application_id ||
          applicationId
        )}

      </p>


      <p>

        <b>Name:</b><br>

        ${escapeHtml(
          application.full_name ||
          "—"
        )}

      </p>


      <p>

        <b>Requested Amount:</b><br>

        ${
          Number.isFinite(
            requestedAmount
          )
            ? formatMoney(
                requestedAmount
              )
            : "—"
        }

      </p>


      <p>

        <b>Loan Terms:</b><br>

        ${escapeHtml(
          application.interest_rate ||
          "0"
        )}% interest for

        ${escapeHtml(
          application.duration_days ||
          "0"
        )} days

      </p>


      <p>

        <b>Loan Start Date:</b><br>

        ${escapeHtml(
          formatDisplayDate(
            application.loan_start_date
          )
        )}

      </p>


      <p>

        <b>Loan End Date / Due Date:</b><br>

        ${escapeHtml(
          formatDisplayDate(
            application.loan_end_date
          )
        )}

      </p>


      <p>

        <b>Total Payment:</b><br>

        ${
          Number.isFinite(
            totalPayment
          )
            ? formatMoney(
                totalPayment
              )
            : "—"
        }

      </p>


      <p>

        <b>Application Status:</b><br>

        <strong>
          ${escapeHtml(
            applicationStatus
          )}
        </strong>

      </p>


      ${statusDetails}

    `;


  } catch (error) {

    console.error(
      "Tracking error:",
      error
    );


    result.innerHTML = `

      <h3>
        Unable to Track Application
      </h3>

      <p>
        ${escapeHtml(
          error.message ||
          "Please try again."
        )}
      </p>

    `;
  }
}


/* =========================================
   ADMIN LOGIN
========================================= */

async function login() {

  const email =
    $("adminEmail")
      .value
      .trim();


  const password =
    $("adminPassword")
      .value;


  $("loginError").textContent =
    "";


  const {
    error
  } =
    await sb.auth
      .signInWithPassword({
        email,
        password
      });


  if (error) {

    $("loginError").textContent =
      error.message;

    return;
  }


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


/* =========================================
   ADMIN LOGOUT
========================================= */

async function logout() {

  await sb.auth
    .signOut();


  $("dashboard")
    .classList
    .add(
      "hidden"
    );


  $("login")
    .classList
    .remove(
      "hidden"
    );
}


/* =========================================
   LOAD ADMIN APPLICATIONS
========================================= */

async function render() {

  $("list").innerHTML = `

    <tr>
      <td colspan="7">
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
        <td colspan="7">
          ${escapeHtml(
            error.message
          )}
        </td>
      </tr>

    `;

    return;
  }


  updateDashboardCounts(
    data || []
  );


  $("list").innerHTML =

    (data || [])
      .map(
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
              ${formatMoney(
                application.requested_amount
              )}
            </td>


            <td>

              ${escapeHtml(
                application.interest_rate
              )}%

              /

              ${escapeHtml(
                application.duration_days
              )}

              days

            </td>


            <td>

              <select

                onchange="setStatus(

                  '${escapeJsString(
                    application.id
                  )}',

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

                      value="${escapeHtml(
                        status
                      )}"

                      ${
                        status ===
                        application.status
                          ? "selected"
                          : ""
                      }

                    >

                      ${escapeHtml(
                        status
                      )}

                    </option>

                  `
                ).join("")}

              </select>

            </td>


            <td>

              <button

                type="button"

                onclick="viewDocs(

                  '${escapeJsString(
                    application.id
                  )}'

                )"

              >

                Borrower Record

              </button>

            </td>


            <td>

              ${
                application.status ===
                "Approved"

                  ? `

                    <button

                      type="button"

                      onclick="activateLoan(

                        '${escapeJsString(
                          application.id
                        )}'

                      )"

                    >

                      Activate Loan

                    </button>

                  `

                  : "—"
              }

            </td>

          </tr>

        `
      )
      .join("") ||

    `

      <tr>

        <td colspan="7">
          No applications yet.
        </td>

      </tr>

    `;
}


/* =========================================
   DASHBOARD COUNTS
========================================= */

function updateDashboardCounts(
  applications
) {

  const today =
    formatDateForInput(
      new Date()
    );


  const pending =
    applications.filter(
      application =>
        application.status ===
        "Pending Review"
    ).length;


  const active =
    applications.filter(
      application =>
        application.loan_status ===
        "Active"
    ).length;


  const dueToday =
    applications.filter(
      application =>
        application.loan_status ===
        "Active" &&
        application.loan_end_date ===
        today
    ).length;


  const delayed =
    applications.filter(
      application =>
        application.due_status ===
          "Delayed" ||
        application.delay_status ===
          "Delayed"
    ).length;


  const paid =
    applications.filter(
      application =>
        application.payment_status ===
        "Paid"
    ).length;


  if ($("pendingCount")) {
    $("pendingCount").textContent =
      pending;
  }

  if ($("activeCount")) {
    $("activeCount").textContent =
      active;
  }

  if ($("dueTodayCount")) {
    $("dueTodayCount").textContent =
      dueToday;
  }

  if ($("delayedCount")) {
    $("delayedCount").textContent =
      delayed;
  }

  if ($("paidCount")) {
    $("paidCount").textContent =
      paid;
  }
}


/* =========================================
   UPDATE APPLICATION STATUS
========================================= */

async function setStatus(
  id,
  status
) {

  const {
    error
  } =
    await sb
      .from(
        "applications"
      )
      .update({
        status:
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

    return;
  }


  await render();
}


/* =========================================
   ADMIN TAB SWITCHER
========================================= */

function showAdminTab(
  panelId
) {

  const applicationsPanel =
    $("applicationsPanel");

  const clientsPanel =
    $("clientsPanel");

  const applicationsButton =
    $("applicationsTabButton");

  const clientsButton =
    $("clientsTabButton");


  if (
    !applicationsPanel ||
    !clientsPanel
  ) {
    return;
  }


  applicationsPanel
    .classList
    .toggle(
      "hidden",
      panelId !==
      "applicationsPanel"
    );


  clientsPanel
    .classList
    .toggle(
      "hidden",
      panelId !==
      "clientsPanel"
    );


  if (applicationsButton) {

    applicationsButton
      .classList
      .toggle(
        "active-admin-tab",
        panelId ===
        "applicationsPanel"
      );
  }


  if (clientsButton) {

    clientsButton
      .classList
      .toggle(
        "active-admin-tab",
        panelId ===
        "clientsPanel"
      );
  }


  if (
    panelId ===
    "clientsPanel"
  ) {

    renderClients();
  }
}


/* =========================================
   ACTIVATE APPROVED LOAN
========================================= */

async function activateLoan(id) {

  const confirmed =
    confirm("Activate this borrower's loan and generate the final PDF?");

  if (!confirmed) return;

  const { data: application, error: fetchError } =
    await sb
      .from("applications")
      .select("*")
      .eq("id", id)
      .single();

  if (fetchError) {
    alert(fetchError.message);
    return;
  }

  const startDate = formatDateForInput(new Date());
  const dueDateObject = new Date();
  dueDateObject.setDate(
    dueDateObject.getDate() +
    Number(application.duration_days || 0)
  );
  const endDate = formatDateForInput(dueDateObject);

  const totalDue =
    Number(application.total_payment || 0);

  const { error: updateError } =
    await sb
      .from("applications")
      .update({
        status: "Approved",
        loan_status: "Active",
        payment_status: "Unpaid",
        loan_start_date: startDate,
        loan_end_date: endDate,
        amount_paid: 0,
        remaining_balance: totalDue,
        due_status: "Not Yet Due"
      })
      .eq("id", id);

  if (updateError) {
    alert(updateError.message);
    return;
  }

  try {
    const response =
      await fetch(
        GENERATE_PDF_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization:
              `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({
            application_id: application.application_id,
            id: application.id
          })
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
        result.message ||
        "The loan was activated, but PDF generation failed."
      );
    }

    alert(
      "Loan activated successfully. The final PDF and Google Drive documents were generated."
    );

  } catch (error) {
    console.error("PDF generation error:", error);

    alert(
      "The loan was activated, but the PDF/Google Drive process failed: " +
      (error.message || "Unknown error")
    );
  }

  await render();
  await renderClients();
}


/* =========================================
   LOAD ACTIVE CLIENTS
========================================= */

async function renderClients() {

  const clientList =
    $("clientList");


  if (!clientList) {
    return;
  }


  clientList.innerHTML = `

    <tr>

      <td colspan="8">
        Loading active clients...
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
      .in(
        "loan_status",
        ["Active", "Paid"]
      )
      .order(
        "loan_end_date",
        {
          ascending:
            true
        }
      );


  if (error) {

    clientList.innerHTML = `

      <tr>

        <td colspan="8">
          ${escapeHtml(
            error.message
          )}
        </td>

      </tr>

    `;

    return;
  }


  clientList.innerHTML =

    (data || [])
      .map(
        application => {

          const dueStatus =
            getCalculatedDueStatus(
              application
            );


          return `

            <tr>

              <td>

                <b>
                  ${escapeHtml(
                    application.full_name
                  )}
                </b>

                <br>

                <small>
                  ${escapeHtml(
                    application.application_id
                  )}
                </small>

              </td>


              <td>

                ${formatMoney(
                  application.requested_amount
                )}

              </td>


              <td>

                ${formatMoney(
                  application.total_payment ||
                  application.total_amount_to_pay
                )}

              </td>


              <td>

                ${escapeHtml(
                  formatDisplayDate(
                    application.loan_start_date
                  )
                )}

              </td>


              <td>

                ${escapeHtml(
                  formatDisplayDate(
                    application.loan_end_date
                  )
                )}

              </td>


              <td>

                ${escapeHtml(
                  application.payment_status ||
                  "Unpaid"
                )}

              </td>


              <td>

                ${escapeHtml(
                  dueStatus
                )}

              </td>


              <td>

                <button
                  type="button"
                  onclick="viewDocs('${escapeJsString(application.id)}')"
                >
                  View Record
                </button>
<button
  type="button"
  onclick="reloan('${escapeJsString(application.id)}')"
>
  Re-loan
</button>
                ${
                  application.payment_status !== "Paid"
                    ? `
                      <button
                        type="button"
                        onclick="markAsPaid('${escapeJsString(application.id)}')"
                      >
                        Mark as Paid
                      </button>
                    `
                    : `
                      <span>Paid</span>
                    `
                }

              </td>

            </tr>

          `;
        }
      )
      .join("") ||

    `

      <tr>

        <td colspan="8">
          No active clients found.
        </td>

      </tr>

    `;
}


/* =========================================
   MARK LOAN AS PAID
========================================= */

async function markAsPaid(id) {

  const { data: application, error: fetchError } =
    await sb
      .from("applications")
      .select("*")
      .eq("id", id)
      .single();

  if (fetchError) {
    alert(fetchError.message);
    return;
  }

  const totalDue =
    Number(application.total_payment || 0);

  const alreadyPaid =
    Number(application.amount_paid || 0);

  const currentBalance =
    Math.max(
      Number(
        application.remaining_balance != null
          ? application.remaining_balance
          : totalDue - alreadyPaid
      ),
      0
    );

  if (currentBalance <= 0) {
    alert("This loan is already fully paid.");
    return;
  }

  const amountText =
    prompt(
      `Remaining balance: ${formatMoney(currentBalance)}\n\nEnter payment amount:`,
      String(currentBalance)
    );

  if (amountText === null) return;

  const paymentAmount =
    Number(
      String(amountText).replace(/[₱,\s]/g, "")
    );

  if (
    !Number.isFinite(paymentAmount) ||
    paymentAmount <= 0
  ) {
    alert("Please enter a valid payment amount.");
    return;
  }

  if (paymentAmount > currentBalance) {
    alert(
      `Payment cannot be greater than the remaining balance of ${formatMoney(currentBalance)}.`
    );
    return;
  }

  const paymentMethod =
    prompt(
      "Payment method (example: GCash, Cash, Bank Transfer):",
      application.payment_method || "GCash"
    );

  if (paymentMethod === null) return;

  const paymentReference =
    prompt(
      "Payment reference number (optional):",
      application.payment_reference || ""
    );

  if (paymentReference === null) return;

  const newAmountPaid =
    alreadyPaid + paymentAmount;

  const newBalance =
    Math.max(totalDue - newAmountPaid, 0);

  const isFullyPaid =
    newBalance <= 0.009;

  const paymentDate =
    formatDateForInput(new Date());

  const finalDueStatus =
    isFullyPaid
      ? getPaymentTimingStatus(
          application.loan_end_date,
          paymentDate
        )
      : getCalculatedDueStatus(application);

  const { error: updateError } =
    await sb
      .from("applications")
      .update({
        payment_status:
          isFullyPaid
            ? "Paid"
            : "Partially Paid",

        loan_status:
          isFullyPaid
            ? "Paid"
            : "Active",

        due_status:
          finalDueStatus,

        payment_date:
          paymentDate,

        paid_at:
          isFullyPaid
            ? new Date().toISOString()
            : application.paid_at,

        amount_paid:
          newAmountPaid,

        payment_method:
          paymentMethod.trim() || null,

        payment_reference:
          paymentReference.trim() || null,

        remaining_balance:
          newBalance
      })
      .eq("id", id);

  if (updateError) {
    alert(updateError.message);
    return;
  }

  alert(
    isFullyPaid
      ? `Full payment recorded. ${finalDueStatus}`
      : `Partial payment recorded. Remaining balance: ${formatMoney(newBalance)}`
  );

  await render();
  await renderClients();
}


function getPaymentTimingStatus(
  dueDateValue,
  paymentDateValue
) {

  if (!dueDateValue || !paymentDateValue) {
    return "Paid";
  }

  const due =
    new Date(`${dueDateValue}T00:00:00`);

  const paid =
    new Date(`${paymentDateValue}T00:00:00`);

  const difference =
    Math.round(
      (due - paid) /
      (1000 * 60 * 60 * 24)
    );

  if (difference > 0) {
    return `Paid Early - ${difference} day${difference === 1 ? "" : "s"}`;
  }

  if (difference === 0) {
    return "Paid On Time";
  }

  const lateDays =
    Math.abs(difference);

  return `Paid Late - ${lateDays} day${lateDays === 1 ? "" : "s"}`;
}


function getCalculatedDueStatus(
  application
) {

  if (
    application.payment_status === "Paid"
  ) {
    return (
      application.due_status ||
      getPaymentTimingStatus(
        application.loan_end_date,
        application.payment_date
      )
    );
  }

  if (!application.loan_end_date) {
    return "—";
  }

  const today =
    formatDateForInput(new Date());

  if (application.loan_end_date < today) {
    const due =
      new Date(
        `${application.loan_end_date}T00:00:00`
      );

    const now =
      new Date(`${today}T00:00:00`);

    const days =
      Math.max(
        1,
        Math.round(
          (now - due) /
          (1000 * 60 * 60 * 24)
        )
      );

    return `Delayed - ${days} day${days === 1 ? "" : "s"}`;
  }

  if (application.loan_end_date === today) {
    return "Due Today";
  }

  const due =
    new Date(
      `${application.loan_end_date}T00:00:00`
    );

  const now =
    new Date(`${today}T00:00:00`);

  const days =
    Math.max(
      0,
      Math.round(
        (due - now) /
        (1000 * 60 * 60 * 24)
      )
    );

  return `Not Delayed - ${days} day${days === 1 ? "" : "s"} remaining`;
}


/* =========================================
   BORROWER RECORD / PRIVATE DOCUMENTS
========================================= */

async function viewDocs(id) {

  const docLinks =
    $("docLinks");


  if (!docLinks) {
    return;
  }


  docLinks.innerHTML = `

    <h3>
      Loading Borrower Record...
    </h3>

    <p>
      Please wait.
    </p>

  `;


  docLinks
    .classList
    .remove(
      "hidden"
    );


  try {

    const {
      data:
        application,

      error
    } =
      await sb
        .from(
          "applications"
        )
        .select("*")
        .eq(
          "id",
          id
        )
        .single();


    if (error) {
      throw error;
    }


    if (!application) {

      throw new Error(
        "Borrower record was not found."
      );
    }


    const documentPaths = [

      {
        label:
          "Valid ID — Front",

        path:
          application.id_front_path
      },

      {
        label:
          "Valid ID — Back",

        path:
          application.id_back_path
      },

      {
        label:
          "Borrower Signature",

        path:
          application.signature_path
      },

      {
        label:
          "Verification Video",

        path:
          application.verification_video_path
      }

    ];


    const documentLinks =
      [];


    for (
      const document
      of documentPaths
    ) {

      if (!document.path) {
        continue;
      }


      const {
        data:
          signedData,

        error:
          signedError
      } =
        await sb.storage
          .from(
            "application-documents"
          )
          .createSignedUrl(
            document.path,
            300
          );


      if (
        !signedError &&
        signedData?.signedUrl
      ) {

        documentLinks.push({
          label:
            document.label,

          url:
            signedData.signedUrl
        });
      }
    }


    const applicationStatus =
      application.status ||
      "Pending Review";


    const loanStatus =
      application.loan_status ||
      "—";


    const paymentStatus =
      application.payment_status ||
      "—";


    const dueStatus =
      application.due_status ||
      application.delay_status ||
      getCalculatedDueStatus(
        application
      );


    const pdfLink =
      application.pdf_drive_link ||
      "";


    const privateDocumentsHtml =

      documentLinks.length

        ? documentLinks
            .map(
              document => `

                <div class="borrower-document-item">

                  <span>
                    ${escapeHtml(
                      document.label
                    )}
                  </span>

                  <a
                    href="${escapeHtml(
                      document.url
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="record-link-button"
                  >
                    Open
                  </a>

                </div>

              `
            )
            .join("")

        : `

            <p>
              No private documents available.
            </p>

          `;


    const pdfHtml =

      pdfLink

        ? `

            <div class="pdf-record-box">

              <div>

                <b>
                  Generated Application PDF
                </b>

                <p class="record-small-text">
                  ${escapeHtml(
                    pdfLink
                  )}
                </p>

              </div>

              <div class="record-action-buttons">

                <a
                  href="${escapeHtml(
                    pdfLink
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="record-link-button"
                >
                  Open PDF
                </a>

                <button
                  type="button"
                  class="record-copy-button"
                  onclick="copyPdfLink(
                    '${escapeJsString(
                      pdfLink
                    )}'
                  )"
                >
                  📋 Copy Link
                </button>

              </div>

            </div>

          `

        : `

            <div class="notice">

              <b>
                Generated Application PDF
              </b>

              <p>
                No PDF link is saved yet.
              </p>

            </div>

          `;


    docLinks.innerHTML = `

      <div class="borrower-record">


        <div class="borrower-record-header">

          <div>

            <h2>
              Borrower Record
            </h2>

            <p>

              Complete application and loan
              information for

              <b>
                ${escapeHtml(
                  application.full_name ||
                  "Borrower"
                )}
              </b>

            </p>

          </div>


          <button
            type="button"
            onclick="closeBorrowerRecord()"
          >
            Close
          </button>

        </div>


        <div class="borrower-record-section">

          <h3>
            Application Information
          </h3>

          <div class="borrower-record-grid">

            ${recordField(
              "Application ID",
              application.application_id
            )}

            ${recordField(
              "Application Status",
              applicationStatus
            )}

            ${recordField(
              "Full Name",
              application.full_name
            )}

            ${recordField(
              "Email Address",
              application.email
            )}

            ${recordField(
              "Mobile Number",
              application.mobile_number
            )}

            ${recordField(
              "Date of Birth",
              formatDisplayDate(
                application.date_of_birth
              )
            )}

            ${recordField(
              "Full Address",
              application.full_address,
              true
            )}

            ${recordField(
              "Barangay Captain",
              application.brgy_captain
            )}

          </div>

        </div>


        <div class="borrower-record-section">

          <h3>
            Employment Information
          </h3>

          <div class="borrower-record-grid">

            ${recordField(
              "Employment",
              application.employment_type
            )}

            ${recordField(
              "Monthly Income",
              formatMoney(
                application.monthly_income
              )
            )}

            ${recordLinkField(
              "School Facebook Page",
              application.school_facebook_url
            )}

          </div>

        </div>


        <div class="borrower-record-section">

          <h3>
            Relative / Character References
          </h3>

          <div class="borrower-record-grid">

            ${recordLinkField(
              "Active Relative 1 Facebook",
              application.relative_fb_1
            )}

            ${recordLinkField(
              "Active Relative 2 Facebook",
              application.relative_fb_2
            )}

          </div>

        </div>


        <div class="borrower-record-section">

          <h3>
            Loan Information
          </h3>

          <div class="borrower-record-grid">

            ${recordField(
              "Requested Amount",
              formatMoney(
                application.requested_amount
              )
            )}

            ${recordField(
              "Loan Purpose",
              application.loan_purpose,
              true
            )}

            ${recordField(
              "Interest Rate",
              `${
                application.interest_rate ||
                0
              }%`
            )}

            ${recordField(
              "Loan Duration",
              `${
                application.duration_days ||
                0
              } days`
            )}

            ${recordField(
              "Loan Start Date",
              formatDisplayDate(
                application.loan_start_date
              )
            )}

            ${recordField(
              "Loan End Date / Due Date",
              formatDisplayDate(
                application.loan_end_date
              )
            )}

            ${recordField(
              "Total Amount to Pay",
              formatMoney(
                application.total_payment ||
                application.total_amount_to_pay
              )
            )}

          </div>

        </div>


        <div class="borrower-record-section">

          <h3>
            Loan & Payment Status
          </h3>

          <div class="borrower-record-grid">

            ${recordField(
              "Loan Status",
              loanStatus
            )}

            ${recordField(
              "Payment Status",
              paymentStatus
            )}

            ${recordField(
              "Due Status",
              dueStatus
            )}

            ${recordField(
              "Payment Date",
              formatDisplayDate(
                application.payment_date
              )
            )}

            ${recordField(
              "Amount Paid",

              application.amount_paid != null

                ? formatMoney(
                    application.amount_paid
                  )

                : "—"
            )}

            ${recordField(
              "Payment Method",
              application.payment_method
            )}

            ${recordField(
              "Reference Number",

              application.payment_reference ||
              application.reference_number
            )}

            ${recordField(
              "Remaining Balance",

              application.remaining_balance != null

                ? formatMoney(
                    application.remaining_balance
                  )

                : "—"
            )}

          </div>

        </div>


        <div class="borrower-record-section">

          <h3>
            Application PDF
          </h3>

          ${pdfHtml}

        </div>


        <div class="borrower-record-section">

          <h3>
            Uploaded Documents
          </h3>

          <p class="record-small-text">
            Private document links expire
            after 5 minutes.
          </p>

          <div class="borrower-documents-list">
            ${privateDocumentsHtml}
          </div>

        </div>


      </div>

    `;


    docLinks
      .scrollIntoView({
        behavior:
          "smooth",

        block:
          "start"
      });


  } catch (error) {

    console.error(
      "Borrower record error:",
      error
    );


    docLinks.innerHTML = `

      <h3>
        Unable to Load Borrower Record
      </h3>

      <p>
        ${escapeHtml(
          error.message ||
          "Please try again."
        )}
      </p>

    `;
  }
}
async function reloan(id) {
  try {
    const { data: application, error } = await sb
  .from("applications")
  .select("*")
  .eq("id", id)
  .single();

    if (error) throw error;

    if (!application) {
      alert("Borrower record not found.");
      return;
    }

    // Save the selected borrower's existing data for the new re-loan
    localStorage.setItem(
      "reloanApplication",
      JSON.stringify(application)
    );

    // Open the application form in re-loan mode
    window.location.href = "index.html?reloan=true";
  } catch (error) {
    console.error("Re-loan error:", error);
    alert("Unable to create re-loan. Please try again.");
  }
}


/* =========================================
   BORROWER RECORD FIELD HELPER
========================================= */

function recordField(
  label,
  value,
  fullWidth = false
) {

  const displayValue =

    value !== null &&
    value !== undefined &&
    String(value).trim() !== ""

      ? String(value)

      : "—";


  return `

    <div
      class="borrower-record-field ${
        fullWidth
          ? "borrower-record-full"
          : ""
      }"
    >

      <span class="borrower-record-label">

        ${escapeHtml(
          label
        )}

      </span>


      <div class="borrower-record-value">

        ${escapeHtml(
          displayValue
        )}

      </div>

    </div>

  `;
}


/* =========================================
   BORROWER RECORD LINK FIELD
========================================= */

function recordLinkField(
  label,
  value
) {

  const link =

    value !== null &&
    value !== undefined

      ? String(value).trim()

      : "";


  if (!link) {

    return recordField(
      label,
      "—"
    );
  }


  const safeLink =
    escapeHtml(
      link
    );


  return `

    <div class="borrower-record-field">

      <span class="borrower-record-label">

        ${escapeHtml(
          label
        )}

      </span>


      <div class="borrower-record-value">

        <a
          href="${safeLink}"
          target="_blank"
          rel="noopener noreferrer"
        >

          ${safeLink}

        </a>

      </div>

    </div>

  `;
}


/* =========================================
   COPY PDF LINK
========================================= */

async function copyPdfLink(
  link
) {

  if (!link) {

    alert(
      "No PDF link is available."
    );

    return;
  }


  try {

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {

      await navigator.clipboard
        .writeText(
          link
        );

    } else {

      const textArea =
        document.createElement(
          "textarea"
        );


      textArea.value =
        link;


      textArea.style.position =
        "fixed";


      textArea.style.left =
        "-999999px";


      textArea.style.top =
        "-999999px";


      document.body
        .appendChild(
          textArea
        );


      textArea.focus();

      textArea.select();


      document.execCommand(
        "copy"
      );


      textArea.remove();
    }


    alert(
      "PDF link copied."
    );


  } catch (error) {

    console.error(
      "Copy link error:",
      error
    );


    alert(
      "Unable to copy the PDF link automatically. Please copy the displayed link manually."
    );
  }
}


/* =========================================
   CLOSE BORROWER RECORD
========================================= */

function closeBorrowerRecord() {

  const docLinks =
    $("docLinks");


  if (!docLinks) {
    return;
  }


  docLinks
    .classList
    .add(
      "hidden"
    );


  docLinks.innerHTML =
    "";
}


/* =========================================
   ESCAPE JAVASCRIPT STRING
========================================= */

function escapeJsString(
  value
) {

  return String(
    value ?? ""
  )

    .replace(
      /\\/g,
      "\\\\"
    )

    .replace(
      /'/g,
      "\\'"
    )

    .replace(
      /\r/g,
      "\\r"
    )

    .replace(
      /\n/g,
      "\\n"
    );
}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(
  value
) {

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


/* =========================================
   CHECK EXISTING ADMIN SESSION
========================================= */

sb.auth

  .getSession()

  .then(

    ({
      data
    }) => {

      if (
        data.session
      ) {

        if (
          $("login")
        ) {

          $("login")
            .classList
            .add(
              "hidden"
            );
        }


        if (
          $("dashboard")
        ) {

          $("dashboard")
            .classList
            .remove(
              "hidden"
            );
        }


        render();
      }
    }
  );


/* =========================================
   INITIAL LOAN CALCULATION
========================================= */

updateLoanDetails();
