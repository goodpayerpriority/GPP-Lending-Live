const SUPABASE_URL = "https://fowgcdkwcmjchlinmywg.supabase.co";
const SUPABASE_KEY = "sb_publishable_BfNlckA6XfPk0rt_bv1kKQ_-RBQvl_L";

const SUBMIT_URL =
  `${SUPABASE_URL}/functions/v1/submit-application`;

const TRACK_URL =
  `${SUPABASE_URL}/functions/v1/track-application`;

const sb =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

const $ =
  id => document.getElementById(id);

let allApplications = [];

let signatureCanvas = null;
let signatureContext = null;
let isSigning = false;
let hasSignature = false;


/* =========================================
   PAGE NAVIGATION
========================================= */

function show(id) {

  document
    .querySelectorAll(".page")
    .forEach(page => {
      page.classList.remove("active");
    });

  const page = $(id);

  if (page) {
    page.classList.add("active");
  }

  window.scrollTo(0, 0);


  if (
    id === "apply"
  ) {

    setTimeout(
      resizeSignaturePad,
      100
    );

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
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    `${year}-${month}-${day}`
  );

}


/* =========================================
   FORMAT DISPLAY DATE
========================================= */

function formatDisplayDate(value) {

  if (!value) {
    return "Not available";
  }


  const date =
    new Date(
      `${value}T00:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
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

function money(value) {

  const number =
    Number(value);


  if (
    !Number.isFinite(number)
  ) {
    return "0.00";
  }


  return number.toLocaleString(
    "en-PH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );

}


/* =========================================
   AUTOMATIC LOAN DETAILS
========================================= */

function updateLoanDetails() {

  const amountInput =
    $("amount");

  if (!amountInput) {
    return;
  }


  const amount =
    Number(
      amountInput.value
    );


  const loanTerm =
    term(amount);


  if (!loanTerm) {

    $("loanStartDate").value =
      "";

    $("loanEndDate").value =
      "";

    $("totalAmount").value =
      "";

    $("terms").textContent =
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
    new Date(
      startDate
    );


  endDate.setDate(

    endDate.getDate() +

    durationDays

  );


  $("loanStartDate").value =
    formatDateForInput(
      startDate
    );


  $("loanEndDate").value =
    formatDateForInput(
      endDate
    );


  $("totalAmount").value =
    `₱${money(totalPayment)}`;


  $("terms").innerHTML = `

    <b>Your loan terms:</b>

    ${interestRate}% interest
    for ${durationDays} days.

    Total payment:

    <b>
      ₱${money(totalPayment)}
    </b>

  `;

}


/* =========================================
   STUDENT FIELD
========================================= */

function setupStudentField() {

  const employment =
    $("employment");


  if (!employment) {
    return;
  }


  employment.addEventListener(
    "change",
    function () {

      const isStudent =

        employment.value ===
        "Student";


      $("schoolBox")
        .classList
        .toggle(
          "hidden",
          !isStudent
        );


      $("school").required =
        isStudent;

    }
  );

}


/* =========================================
   SIGNATURE PAD
========================================= */

function setupSignaturePad() {

  signatureCanvas =
    $("signaturePad");


  if (!signatureCanvas) {
    return;
  }


  signatureContext =
    signatureCanvas.getContext(
      "2d"
    );


  resizeSignaturePad();


  signatureCanvas.addEventListener(
    "pointerdown",
    startSignature
  );


  signatureCanvas.addEventListener(
    "pointermove",
    drawSignature
  );


  signatureCanvas.addEventListener(
    "pointerup",
    stopSignature
  );


  signatureCanvas.addEventListener(
    "pointercancel",
    stopSignature
  );


  signatureCanvas.addEventListener(
    "pointerleave",
    stopSignature
  );


  window.addEventListener(
    "resize",
    resizeSignaturePad
  );


  const clearButton =
    $("clearSignature");


  if (clearButton) {

    clearButton.addEventListener(
      "click",
      clearSignature
    );

  }

}


function resizeSignaturePad() {

  if (
    !signatureCanvas ||
    !signatureContext
  ) {
    return;
  }


  const rect =
    signatureCanvas
      .getBoundingClientRect();


  if (
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return;
  }


  const oldImage =

    hasSignature

      ? signatureCanvas
          .toDataURL()

      : null;


  const ratio =
    Math.max(
      window.devicePixelRatio ||
      1,
      1
    );


  signatureCanvas.width =
    Math.round(
      rect.width *
      ratio
    );


  signatureCanvas.height =
    Math.round(
      rect.height *
      ratio
    );


  signatureContext =
    signatureCanvas.getContext(
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
    2.2;

  signatureContext.lineCap =
    "round";

  signatureContext.lineJoin =
    "round";

  signatureContext.strokeStyle =
    "#10213d";


  if (
    oldImage
  ) {

    const image =
      new Image();


    image.onload =
      function () {

        signatureContext.drawImage(

          image,

          0,

          0,

          rect.width,

          rect.height

        );

      };


    image.src =
      oldImage;

  }

}


function getSignaturePosition(
  event
) {

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


function startSignature(
  event
) {

  if (
    !signatureContext
  ) {
    return;
  }


  event.preventDefault();


  isSigning =
    true;


  hasSignature =
    true;


  signatureCanvas
    .setPointerCapture?.(
      event.pointerId
    );


  const point =
    getSignaturePosition(
      event
    );


  signatureContext.beginPath();


  signatureContext.moveTo(

    point.x,

    point.y

  );

}


function drawSignature(
  event
) {

  if (
    !isSigning ||
    !signatureContext
  ) {
    return;
  }


  event.preventDefault();


  const point =
    getSignaturePosition(
      event
    );


  signatureContext.lineTo(

    point.x,

    point.y

  );


  signatureContext.stroke();

}


function stopSignature(
  event
) {

  if (
    !isSigning
  ) {
    return;
  }


  isSigning =
    false;


  signatureContext
    ?.closePath();


  if (
    event?.pointerId !==
    undefined
  ) {

    try {

      signatureCanvas
        ?.releasePointerCapture?.(
          event.pointerId
        );

    } catch {

      /* Ignore */

    }

  }

}


function clearSignature() {

  if (
    !signatureCanvas ||
    !signatureContext
  ) {
    return;
  }


  const rect =
    signatureCanvas
      .getBoundingClientRect();


  signatureContext.clearRect(

    0,

    0,

    rect.width,

    rect.height

  );


  hasSignature =
    false;

}


/* =========================================
   CONVERT SIGNATURE TO FILE
========================================= */

function signatureToFile() {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      if (
        !signatureCanvas ||
        !hasSignature
      ) {

        reject(

          new Error(
            "Please sign inside the signature box."
          )

        );

        return;

      }


      signatureCanvas.toBlob(

        blob => {

          if (!blob) {

            reject(

              new Error(
                "Unable to save signature."
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
   VIDEO CHECK
========================================= */

function setupVideoCheck() {

  const videoInput =
    $("video");


  if (!videoInput) {
    return;
  }


  videoInput.addEventListener(
    "change",
    function () {

      const file =
        videoInput.files[0];


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

          "Verification video must be under 50 MB."

        );


        videoInput.value =
          "";

      }

    }

  );

}


/* =========================================
   SUBMIT APPLICATION
========================================= */

function setupApplicationForm() {

  const form =
    $("form");


  if (!form) {
    return;
  }


  form.addEventListener(

    "submit",

    async function (
      event
    ) {

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


      if (
        !hasSignature
      ) {

        alert(

          "Please sign inside the Borrower Signature box."

        );

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


      button.disabled =
        true;


      button.textContent =
        "Submitting...";


      try {


        const signatureFile =
          await signatureToFile();


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


        /* REFERENCES */


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
          $("school").value ||
          ""
        );


        formData.append(
          "monthly_income",
          $("income").value
        );


        /* LOAN */


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


        const response =
          await fetch(

            SUBMIT_URL,

            {

              method:
                "POST",

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


        if (
          !response.ok
        ) {

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
            Your application is now
            <strong>
              Pending Review
            </strong>.
          </p>

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
            You can use this ID in the
            Track section to check your
            application status.
          </p>

        `;


        form.reset();


        $("schoolBox")
          .classList
          .add(
            "hidden"
          );


        $("school").required =
          false;


        $("loanStartDate").value =
          "";


        $("loanEndDate").value =
          "";


        $("totalAmount").value =
          "";


        $("terms").textContent =

          "Enter ₱100–₱2,000 to calculate terms.";


        clearSignature();


        $("decision")
          .scrollIntoView({

            behavior:
              "smooth"

          });


      } catch (
        error
      ) {


        console.error(

          "Submission error:",

          error

        );


        alert(

          error.message ||

          "Unable to submit the application."

        );


      } finally {


        button.disabled =
          false;


        button.textContent =
          "Submit Application";

      }

    }

  );

}


/* =========================================
   TRACK APPLICATION
========================================= */

async function track() {

  const applicationId =

    $("trackId")
      .value
      .trim();


  const result =
    $("trackResult");


  if (
    !applicationId
  ) {

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


    if (
      !response.ok
    ) {

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

      "Pending Review";


    const isActive =

      application.loan_status ===
      "Active";


    const isPaid =

      application.payment_status ===
      "Paid" ||

      application.loan_status ===
      "Paid";


    let extraLoanDetails =
      "";


    /*
      Loan/payment/delay details are shown
      only when the borrower becomes an
      active or paid client.
    */


    if (
      isActive ||
      isPaid
    ) {


      const dueStatus =
        getDueStatus(
          application
        );


      const remainingBalance =
        calculateRemainingBalance(
          application
        );


      extraLoanDetails = `

        <hr>

        <p>
          <b>Loan Status:</b>
          <br>

          ${statusBadge(
            application.loan_status ||
            "Active"
          )}
        </p>


        <p>
          <b>Payment Status:</b>
          <br>

          ${statusBadge(
            application.payment_status ||
            "Not Paid"
          )}
        </p>


        <p>
          <b>Due Status:</b>
          <br>

          ${statusBadge(
            dueStatus
          )}
        </p>


        <p>
          <b>Due Date:</b>
          <br>

          ${escapeHtml(
            formatDisplayDate(
              application.loan_end_date
            )
          )}
        </p>


        <p>
          <b>Amount Due:</b>
          <br>

          <span class="amount-due">

            ₱${money(
              remainingBalance
            )}

          </span>
        </p>

      `;

    }


    result.innerHTML = `

      <h3>
        Application Status
      </h3>


      <p>
        <b>Application ID:</b>
        <br>

        ${escapeHtml(
          application.application_id
        )}
      </p>


      <p>
        <b>Name:</b>
        <br>

        ${escapeHtml(
          application.full_name
        )}
      </p>


      <p>
        <b>Requested Amount:</b>
        <br>

        ₱${money(
          application.requested_amount
        )}
      </p>


      <p>
        <b>Loan Terms:</b>
        <br>

        ${escapeHtml(
          application.interest_rate
        )}% interest for

        ${escapeHtml(
          application.duration_days
        )} days
      </p>


      <p>
        <b>Total Payment:</b>
        <br>

        ₱${money(

          application.total_payment ||

          application
            .total_amount_to_pay

        )}
      </p>


      <p>
        <b>Application Status:</b>
        <br>

        ${statusBadge(
          applicationStatus
        )}
      </p>


      ${extraLoanDetails}

    `;


  } catch (
    error
  ) {


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


  if (
    error
  ) {

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


  await render();

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
   ADMIN TABS
========================================= */

function showAdminTab(
  panelId
) {

  $("applicationsPanel")
    .classList
    .add(
      "hidden"
    );


  $("clientsPanel")
    .classList
    .add(
      "hidden"
    );


  $(panelId)
    .classList
    .remove(
      "hidden"
    );


  $("applicationsTabButton")
    .classList
    .remove(
      "active-tab"
    );


  $("clientsTabButton")
    .classList
    .remove(
      "active-tab"
    );


  if (
    panelId ===
    "applicationsPanel"
  ) {

    $("applicationsTabButton")
      .classList
      .add(
        "active-tab"
      );

  } else {

    $("clientsTabButton")
      .classList
      .add(
        "active-tab"
      );

  }

}


/* =========================================
   LOAD ADMIN DATA
========================================= */

async function render() {

  $("list").innerHTML = `

    <tr>

      <td colspan="6">

        Loading applications...

      </td>

    </tr>

  `;


  $("clientList").innerHTML = `

    <tr>

      <td colspan="7">

        Loading clients...

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


  if (
    error
  ) {

    console.error(
      error
    );


    $("list").innerHTML = `

      <tr>

        <td colspan="6">

          ${escapeHtml(
            error.message
          )}

        </td>

      </tr>

    `;


    $("clientList").innerHTML = `

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


  allApplications =
    data || [];


  renderApplications();
  renderClients();
  updateDashboardCounters();

}


/* =========================================
   APPLICATIONS TABLE
========================================= */

function renderApplications() {

  const applications =

    allApplications.filter(

      application =>

        application.loan_status !==
        "Active" &&

        application.loan_status !==
        "Paid"

    );


  $("list").innerHTML =

    applications.map(

      application => `

        <tr>


          <td>

            ${escapeHtml(
              application.application_id
            )}

          </td>


          <td>

            <b>

              ${escapeHtml(
                application.full_name
              )}

            </b>

          </td>


          <td>

            ₱${money(
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

              onchange="
                setStatus(
                  '${application.id}',
                  this.value
                )
              "

            >

              ${[

                "Pending Review",

                "Approved",

                "More Documents Required",

                "Declined"

              ].map(

                status => `

                  <option

                    value="${status}"

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

              type="button"

              onclick="
                viewRecord(
                  '${application.id}'
                )
              "

            >

              View

            </button>


            <button

              type="button"

              onclick="
                viewDocs(
                  '${application.id}'
                )
              "

            >

              Files

            </button>


            ${

              application.status ===
              "Approved"

                ? `

                  <button

                    type="button"

                    class="primary"

                    onclick="
                      activateLoan(
                        '${application.id}'
                      )
                    "

                  >

                    Activate Loan

                  </button>

                `

                : ""

            }


          </td>


        </tr>

      `

    ).join("") || `

      <tr>

        <td colspan="6">

          No applications to review.

        </td>

      </tr>

    `;

}


/* =========================================
   CLIENTS TABLE
========================================= */

function renderClients() {

  const clients =

    allApplications.filter(

      application =>

        application.loan_status ===
        "Active" ||

        application.loan_status ===
        "Paid"

    );


  $("clientList").innerHTML =

    clients.map(

      application => {


        const dueStatus =
          getDueStatus(
            application
          );


        const remaining =
          calculateRemainingBalance(
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

              ₱${money(
                application.total_payment
              )}

              <br>

              <small>

                Remaining:

                <span class="remaining-balance">

                  ₱${money(
                    remaining
                  )}

                </span>

              </small>

            </td>


            <td>

              ${escapeHtml(

                formatDisplayDate(

                  application
                    .loan_end_date

                )

              )}

            </td>


            <td>

              ${statusBadge(

                application.loan_status ||

                "Active"

              )}

            </td>


            <td>

              ${statusBadge(

                application.payment_status ||

                "Not Paid"

              )}

            </td>


            <td>

              ${statusBadge(
                dueStatus
              )}

            </td>


            <td>


              <button

                type="button"

                onclick="
                  viewRecord(
                    '${application.id}'
                  )
                "

              >

                View

              </button>


              <button

                type="button"

                onclick="
                  viewDocs(
                    '${application.id}'
                  )
                "

              >

                Files

              </button>


              ${

                application.loan_status !==
                "Paid"

                  ? `

                    <button

                      type="button"

                      class="primary"

                      onclick="
                        openPaymentPanel(
                          '${application.id}'
                        )
                      "

                    >

                      Payment

                    </button>

                  `

                  : ""

              }


            </td>


          </tr>

        `;

      }

    ).join("") || `

      <tr>

        <td colspan="7">

          No active clients yet.

        </td>

      </tr>

    `;

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

        status,

        updated_at:
          new Date()
            .toISOString()

      })

      .eq(
        "id",
        id
      );


  if (
    error
  ) {

    alert(
      error.message
    );

    return;

  }


  await render();

}


/* =========================================
   ACTIVATE LOAN
========================================= */

async function activateLoan(
  id
) {

  const application =

    allApplications.find(

      item =>
        String(item.id) ===
        String(id)

    );


  if (
    !application
  ) {

    alert(
      "Application not found."
    );

    return;

  }


  if (
    application.status !==
    "Approved"
  ) {

    alert(

      "The application must be Approved before activating the loan."

    );

    return;

  }


  const confirmed =
    confirm(

      `Activate the loan for ${application.full_name}?`

    );


  if (
    !confirmed
  ) {
    return;
  }


  /*
    The due-date countdown starts when
    the admin activates the loan.
  */


  const startDate =
    new Date();


  const endDate =
    new Date(
      startDate
    );


  endDate.setDate(

    endDate.getDate() +

    Number(
      application.duration_days ||
      0
    )

  );


  const totalPayment =
    Number(

      application.total_payment ||

      0

    );


  const {
    error
  } =

    await sb

      .from(
        "applications"
      )

      .update({

        loan_status:
          "Active",

        payment_status:
          "Not Paid",

        amount_paid:
          0,

        remaining_balance:
          totalPayment,

        loan_start_date:
          formatDateForInput(
            startDate
          ),

        loan_end_date:
          formatDateForInput(
            endDate
          ),

        activated_at:
          new Date()
            .toISOString(),

        updated_at:
          new Date()
            .toISOString()

      })

      .eq(
        "id",
        id
      );


  if (
    error
  ) {

    alert(
      error.message
    );

    return;

  }


  alert(

    "Loan activated successfully. The borrower is now in Clients."

  );


  await render();


  showAdminTab(
    "clientsPanel"
  );

}


/* =========================================
   DUE STATUS
========================================= */

function getDueStatus(
  application
) {

  if (
    application.payment_status ===
    "Paid" ||

    application.loan_status ===
    "Paid"
  ) {

    return "Paid";

  }


  if (
    application.loan_status !==
    "Active"
  ) {

    return "Not Active";

  }


  if (
    !application.loan_end_date
  ) {

    return "Not Delayed";

  }


  const today =
    startOfLocalDay(
      new Date()
    );


  const dueDate =
    startOfLocalDay(

      new Date(

        `${application.loan_end_date}T00:00:00`

      )

    );


  const difference =

    Math.round(

      (
        dueDate.getTime() -
        today.getTime()
      )

      /

      86400000

    );


  if (
    difference ===
    1
  ) {

    return "Due Tomorrow";

  }


  if (
    difference ===
    0
  ) {

    return "Due Today";

  }


  if (
    difference <
    0
  ) {

    const delayedDays =
      Math.abs(
        difference
      );


    return (

      delayedDays === 1

        ? "Delayed - 1 Day"

        : `Delayed - ${delayedDays} Days`

    );

  }


  return "Not Delayed";

}


/* =========================================
   START OF LOCAL DAY
========================================= */

function startOfLocalDay(
  date
) {

  return new Date(

    date.getFullYear(),

    date.getMonth(),

    date.getDate()

  );

}


/* =========================================
   REMAINING BALANCE
========================================= */

function calculateRemainingBalance(
  application
) {

  if (
    application.payment_status ===
    "Paid"
  ) {
    return 0;
  }


  const total =
    Number(

      application.total_payment ||

      0

    );


  const paid =
    Number(

      application.amount_paid ||

      0

    );


  return Math.max(

    0,

    total - paid

  );

}


/* =========================================
   DASHBOARD COUNTERS
========================================= */

function updateDashboardCounters() {

  let pending =
    0;

  let active =
    0;

  let dueToday =
    0;

  let delayed =
    0;

  let paid =
    0;


  allApplications.forEach(

    application => {


      if (
        application.status ===
        "Pending Review"
      ) {

        pending++;

      }


      if (
        application.loan_status ===
        "Active"
      ) {

        active++;

      }


      if (
        application.loan_status ===
        "Paid" ||

        application.payment_status ===
        "Paid"
      ) {

        paid++;

      }


      const dueStatus =
        getDueStatus(
          application
        );


      if (
        dueStatus ===
        "Due Today"
      ) {

        dueToday++;

      }


      if (
        dueStatus.startsWith(
          "Delayed"
        )
      ) {

        delayed++;

      }

    }

  );


  $("pendingCount").textContent =
    pending;


  $("activeCount").textContent =
    active;


  $("dueTodayCount").textContent =
    dueToday;


  $("delayedCount").textContent =
    delayed;


  $("paidCount").textContent =
    paid;

}


/* =========================================
   VIEW BORROWER RECORD
========================================= */

function viewRecord(
  id
) {

  const application =

    allApplications.find(

      item =>
        String(item.id) ===
        String(id)

    );


  if (
    !application
  ) {

    alert(
      "Borrower record not found."
    );

    return;

  }


  const dueStatus =
    getDueStatus(
      application
    );


  const remaining =
    calculateRemainingBalance(
      application
    );


  $("recordDetailsContent")
    .innerHTML = `


      <div class="record-grid">


        ${recordItem(
          "Application ID",
          application.application_id
        )}


        ${recordItem(
          "Full Name",
          application.full_name
        )}


        ${recordItem(
          "Email",
          application.email
        )}


        ${recordItem(
          "Mobile Number",
          application.mobile_number
        )}


        ${recordItem(
          "Date of Birth",
          formatDisplayDate(
            application.date_of_birth
          )
        )}


        ${recordItem(
          "Full Address",
          application.full_address
        )}


        ${recordItem(
          "Barangay Captain",
          application.brgy_captain
        )}


        ${recordItem(
          "Employment",
          application.employment_type
        )}


        ${recordItem(
          "Monthly Income",
          `₱${money(
            application.monthly_income
          )}`
        )}


        ${recordItem(
          "Relative Facebook 1",
          application.relative_fb_1
        )}


        ${recordItem(
          "Relative Facebook 2",
          application.relative_fb_2
        )}


        ${recordItem(
          "School Facebook",
          application.school_facebook_url ||
          "N/A"
        )}


        ${recordItem(
          "Requested Amount",
          `₱${money(
            application.requested_amount
          )}`
        )}


        ${recordItem(
          "Loan Purpose",
          application.loan_purpose
        )}


        ${recordItem(
          "Interest Rate",
          `${application.interest_rate}%`
        )}


        ${recordItem(
          "Duration",
          `${application.duration_days} days`
        )}


        ${recordItem(
          "Total Payment",
          `₱${money(
            application.total_payment
          )}`
        )}


        ${recordItem(
          "Amount Paid",
          `₱${money(
            application.amount_paid
          )}`
        )}


        ${recordItem(
          "Remaining Balance",
          `₱${money(
            remaining
          )}`
        )}


        ${recordItem(
          "Loan Start Date",
          formatDisplayDate(
            application.loan_start_date
          )
        )}


        ${recordItem(
          "Due Date",
          formatDisplayDate(
            application.loan_end_date
          )
        )}


        ${recordItem(
          "Application Status",
          application.status
        )}


        ${recordItem(
          "Loan Status",
          application.loan_status ||
          "Not Active"
        )}


        ${recordItem(
          "Payment Status",
          application.payment_status ||
          "Not Paid"
        )}


        ${recordItem(
          "Due Status",
          dueStatus
        )}


        ${recordItem(
          "Payment Method",
          application.payment_method ||
          "N/A"
        )}


        ${recordItem(
          "Payment Reference",
          application.payment_reference ||
          "N/A"
        )}


      </div>

    `;


  $("recordDetails")
    .classList
    .remove(
      "hidden"
    );


  $("recordDetails")
    .scrollIntoView({

      behavior:
        "smooth"

    });

}


/* =========================================
   RECORD ITEM
========================================= */

function recordItem(
  label,
  value
) {

  return `

    <div class="record-item">

      <span>

        ${escapeHtml(
          label
        )}

      </span>

      <strong>

        ${escapeHtml(
          value ?? ""
        )}

      </strong>

    </div>

  `;

}


/* =========================================
   CLOSE RECORD
========================================= */

function closeRecordDetails() {

  $("recordDetails")
    .classList
    .add(
      "hidden"
    );

}


/* =========================================
   VIEW PRIVATE DOCUMENTS
========================================= */

async function viewDocs(
  id
) {

  const application =

    allApplications.find(

      item =>
        String(item.id) ===
        String(id)

    );


  if (
    !application
  ) {

    alert(
      "Application not found."
    );

    return;

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
      application
        .verification_video_path
    ],

    [
      "Payment Proof",
      application
        .payment_proof_path
    ]

  ];


  const links =
    [];


  for (
    const [
      label,
      path
    ]
    of paths
  ) {


    if (
      !path
    ) {
      continue;
    }


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


    if (
      !error &&
      data?.signedUrl
    ) {


      links.push(`

        <a

          href="${data.signedUrl}"

          target="_blank"

          rel="noopener"

        >

          ${escapeHtml(
            label
          )}

        </a>

      `);

    }

  }


  $("docLinks").innerHTML = `

    <div class="panel-heading">

      <div>

        <h3>
          Borrower Files
        </h3>

        <p>
          ${escapeHtml(
            application.full_name
          )}
        </p>

      </div>


      <button

        type="button"

        onclick="
          closeDocuments()
        "

      >

        Close

      </button>

    </div>


    <p>
      Private file links expire in
      5 minutes.
    </p>


    <div>

      ${

        links.length

          ? links.join("")

          : "No files available."

      }

    </div>

  `;


  $("docLinks")
    .classList
    .remove(
      "hidden"
    );


  $("docLinks")
    .scrollIntoView({

      behavior:
        "smooth"

    });

}


/* =========================================
   CLOSE DOCUMENTS
========================================= */

function closeDocuments() {

  $("docLinks")
    .classList
    .add(
      "hidden"
    );

}


/* =========================================
   OPEN PAYMENT PANEL
========================================= */

function openPaymentPanel(
  id
) {

  const application =

    allApplications.find(

      item =>
        String(item.id) ===
        String(id)

    );


  if (
    !application
  ) {

    alert(
      "Client not found."
    );

    return;

  }


  $("paymentApplicationId").value =
    application.id;


  $("paymentClientName").textContent =

    `${application.full_name} — Remaining balance: ₱${money(

      calculateRemainingBalance(
        application
      )

    )}`;


  $("paymentAmount").value =
    "";


  $("paymentDate").value =
    formatDateForInput(
      new Date()
    );


  $("paymentMethod").value =
    "";


  $("paymentReference").value =
    "";


  $("paymentProof").value =
    "";


  $("paymentPanel")
    .classList
    .remove(
      "hidden"
    );


  $("paymentPanel")
    .scrollIntoView({

      behavior:
        "smooth"

    });

}


/* =========================================
   CLOSE PAYMENT PANEL
========================================= */

function closePaymentPanel() {

  $("paymentPanel")
    .classList
    .add(
      "hidden"
    );

}


/* =========================================
   SAVE PAYMENT
========================================= */

async function savePayment() {

  const id =
    $("paymentApplicationId")
      .value;


  const application =

    allApplications.find(

      item =>
        String(item.id) ===
        String(id)

    );


  if (
    !application
  ) {

    alert(
      "Client not found."
    );

    return;

  }


  const amount =
    Number(
      $("paymentAmount").value
    );


  const paymentDate =
    $("paymentDate").value;


  const paymentMethod =
    $("paymentMethod").value;


  const reference =
    $("paymentReference")
      .value
      .trim();


  const proof =
    $("paymentProof")
      .files[0];


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    alert(

      "Please enter a valid payment amount."

    );

    return;

  }


  if (
    !paymentDate
  ) {

    alert(

      "Please select the payment date."

    );

    return;

  }


  if (
    !paymentMethod
  ) {

    alert(

      "Please select the payment method."

    );

    return;

  }


  const currentPaid =
    Number(

      application.amount_paid ||

      0

    );


  const totalPayment =
    Number(

      application.total_payment ||

      0

    );


  const newAmountPaid =
    currentPaid +
    amount;


  const remainingBalance =
    Math.max(

      0,

      totalPayment -
      newAmountPaid

    );


  let proofPath =
    null;


  try {


    if (
      proof
    ) {


      const extension =

        proof.name
          .split(".")
          .pop()
          ?.replace(
            /[^a-zA-Z0-9]/g,
            ""
          ) ||

        "jpg";


      proofPath =

        `${application.application_id}/payment-proofs/${Date.now()}.${extension}`;


      const {
        error:
          uploadError
      } =

        await sb.storage

          .from(
            "application-documents"
          )

          .upload(

            proofPath,

            proof,

            {

              contentType:

                proof.type ||

                "application/octet-stream"

            }

          );


      if (
        uploadError
      ) {

        throw uploadError;

      }

    }


    const {
      error:
        paymentInsertError
    } =

      await sb

        .from(
          "loan_payments"
        )

        .insert({

          application_id:
            application.application_id,

          amount,

          payment_method:
            paymentMethod,

          reference_number:
            reference ||
            null,

          proof_path:
            proofPath,

          payment_date:

            `${paymentDate}T00:00:00`

        });


    if (
      paymentInsertError
    ) {

      throw paymentInsertError;

    }


    const isFullyPaid =

      remainingBalance <=
      0;


    const {
      error:
        updateError
    } =

      await sb

        .from(
          "applications"
        )

        .update({

          amount_paid:
            Math.min(
              newAmountPaid,
              totalPayment
            ),

          remaining_balance:
            remainingBalance,

          payment_status:

            isFullyPaid

              ? "Paid"

              : "Partially Paid",

          loan_status:

            isFullyPaid

              ? "Paid"

              : "Active",

          payment_date:

            `${paymentDate}T00:00:00`,

          payment_method:
            paymentMethod,

          payment_reference:
            reference ||
            null,

          payment_proof_path:

            proofPath ||

            application
              .payment_proof_path ||

            null,

          paid_at:

            isFullyPaid

              ? new Date()
                  .toISOString()

              : null,

          updated_at:

            new Date()
              .toISOString()

        })

        .eq(
          "id",
          application.id
        );


    if (
      updateError
    ) {

      throw updateError;

    }


    alert(

      isFullyPaid

        ? "Payment saved. The loan is now fully paid."

        : `Payment saved. Remaining balance: ₱${money(
            remainingBalance
          )}`

    );


    closePaymentPanel();


    await render();


    showAdminTab(
      "clientsPanel"
    );


  } catch (
    error
  ) {


    console.error(

      "Payment error:",

      error

    );


    alert(

      error.message ||

      "Unable to save payment."

    );

  }

}


/* =========================================
   STATUS BADGE
========================================= */

function statusBadge(
  status
) {

  const value =

    String(

      status ||

      ""

    );


  const lower =
    value.toLowerCase();


  let className =
    "status-approved";


  if (
    lower.includes(
      "pending"
    )
  ) {

    className =
      "status-pending";


  } else if (
    lower.includes(
      "delayed"
    ) &&
    !lower.includes(
      "not delayed"
    )
  ) {

    className =
      "status-delayed";


  } else if (
    lower.includes(
      "due"
    )
  ) {

    className =
      "status-due";


  } else if (
    lower ===
    "paid"
  ) {

    className =
      "status-paid";


  } else if (
    lower.includes(
      "not delayed"
    )
  ) {

    className =
      "status-not-delayed";


  } else if (
    lower.includes(
      "active"
    ) &&
    !lower.includes(
      "not active"
    )
  ) {

    className =
      "status-active";


  } else if (
    lower.includes(
      "declined"
    )
  ) {

    className =
      "status-declined";


  } else if (
    lower.includes(
      "document"
    )
  ) {

    className =
      "status-documents";

  }


  return `

    <span
      class="status-badge ${className}"
    >

      ${escapeHtml(
        value
      )}

    </span>

  `;

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(
  value
) {

  return String(

    value ??

    ""

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
   EXISTING ADMIN SESSION
========================================= */

async function checkAdminSession() {

  const {
    data
  } =

    await sb.auth
      .getSession();


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


    await render();

  }

}


/* =========================================
   INITIALIZE WEBSITE
========================================= */

document.addEventListener(

  "DOMContentLoaded",

  function () {


    setupStudentField();


    setupSignaturePad();


    setupVideoCheck();


    setupApplicationForm();


    const amount =
      $("amount");


    if (
      amount
    ) {


      amount.addEventListener(

        "input",

        updateLoanDetails

      );


      amount.addEventListener(

        "change",

        updateLoanDetails

      );

    }


    updateLoanDetails();


    checkAdminSession();

  }

);
