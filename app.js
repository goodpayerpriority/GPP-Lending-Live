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

const $ = id =>
  document.getElementById(id);


/* =========================================
   PAGE NAVIGATION
========================================= */

function show(id) {

  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.remove(
        "active"
      );

    });


  const selectedPage =
    $(id);


  if (selectedPage) {

    selectedPage.classList.add(
      "active"
    );

  }


  window.scrollTo(
    0,
    0
  );


  if (
    id === "apply"
  ) {

    setTimeout(
      resizeSignatureCanvas,
      100
    );

  }

}


/* =========================================
   LOAN TERMS
========================================= */

function term(amount) {

  const value =
    Number(amount);


  if (
    value >= 100 &&
    value <= 500
  ) {

    return [
      20,
      3
    ];

  }


  if (
    value >= 501 &&
    value <= 1000
  ) {

    return [
      25,
      5
    ];

  }


  if (
    value >= 1001 &&
    value <= 2000
  ) {

    return [
      30,
      7
    ];

  }


  return null;

}


/* =========================================
   DATE HELPERS
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


function parseDate(value) {

  if (!value) {
    return null;
  }


  const parts =
    String(value)
      .split("-")
      .map(Number);


  if (
    parts.length !== 3 ||
    parts.some(
      part =>
        !Number.isFinite(part)
    )
  ) {

    return null;

  }


  return new Date(
    parts[0],
    parts[1] - 1,
    parts[2]
  );

}


function startOfDay(date) {

  const result =
    new Date(date);


  result.setHours(
    0,
    0,
    0,
    0
  );


  return result;

}


function differenceInDays(
  laterDate,
  earlierDate
) {

  const millisecondsPerDay =
    24 *
    60 *
    60 *
    1000;


  return Math.floor(

    (
      startOfDay(
        laterDate
      ) -

      startOfDay(
        earlierDate
      )

    ) /

    millisecondsPerDay

  );

}


function formatDisplayDate(value) {

  const date =
    parseDate(value);


  if (!date) {

    return (
      value ||
      "Not available"
    );

  }


  return date.toLocaleDateString(
    "en-PH",
    {
      year:
        "numeric",

      month:
        "long",

      day:
        "numeric"
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
    !Number.isFinite(
      number
    )
  ) {

    return "₱0.00";

  }


  return new Intl.NumberFormat(
    "en-PH",
    {
      style:
        "currency",

      currency:
        "PHP"
    }
  ).format(
    number
  );

}


/* =========================================
   AUTOMATIC LOAN PREVIEW
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
    term(
      amount
    );


  if (!loanTerm) {

    startDateInput.value =
      "";


    endDateInput.value =
      "";


    totalAmountInput.value =
      "";


    termsBox.textContent =

      "Enter ₱100–₱2,000 to calculate terms.";


    return;

  }


  const [
    interestRate,
    durationDays
  ] =
    loanTerm;


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

    <b>Your Loan Terms</b>

    <br>

    ${interestRate}% interest
    for ${durationDays} days.

    <br>

    Expected Start Date:
    <b>
      ${escapeHtml(
        formatDisplayDate(
          startDateInput.value
        )
      )}
    </b>

    <br>

    Expected Due Date:
    <b>
      ${escapeHtml(
        formatDisplayDate(
          endDateInput.value
        )
      )}
    </b>

    <br>

    Total Amount to Pay:

    <b>
      ${escapeHtml(
        formatMoney(
          totalPayment
        )
      )}
    </b>

  `;

}


/* =========================================
   LOAN AMOUNT EVENTS
========================================= */

if (
  $("amount")
) {

  $("amount").addEventListener(
    "input",
    updateLoanDetails
  );


  $("amount").addEventListener(
    "change",
    updateLoanDetails
  );

}


/* =========================================
   STUDENT SCHOOL FIELD
========================================= */

if (
  $("employment")
) {

  $("employment").addEventListener(

    "change",

    function () {


      const isStudent =

        $("employment").value ===
        "Student";


      $("schoolBox")
        ?.classList
        .toggle(

          "hidden",

          !isStudent

        );


      if (
        $("school")
      ) {

        $("school").required =
          isStudent;

      }

    }

  );

}


/* =========================================
   SIGNATURE PAD
========================================= */

const signatureCanvas =
  $("signatureCanvas");


let signatureContext =
  null;


let isDrawing =
  false;


let hasSignature =
  false;


if (
  signatureCanvas
) {

  signatureContext =

    signatureCanvas.getContext(
      "2d"
    );

}


function resizeSignatureCanvas() {

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


  let savedImage =
    null;


  if (
    hasSignature &&
    signatureCanvas.width > 0 &&
    signatureCanvas.height > 0
  ) {

    savedImage =

      signatureCanvas
        .toDataURL(
          "image/png"
        );

  }


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
    2.5;


  signatureContext.lineCap =
    "round";


  signatureContext.lineJoin =
    "round";


  signatureContext.strokeStyle =
    "#10213d";


  if (
    savedImage
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
      savedImage;

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


  isDrawing =
    true;


  hasSignature =
    true;


  const point =

    getSignaturePosition(
      event
    );


  signatureContext
    .beginPath();


  signatureContext
    .moveTo(

      point.x,

      point.y

    );

}


function drawSignature(
  event
) {

  if (
    !isDrawing ||
    !signatureContext
  ) {

    return;

  }


  event.preventDefault();


  const point =

    getSignaturePosition(
      event
    );


  signatureContext
    .lineTo(

      point.x,

      point.y

    );


  signatureContext
    .stroke();

}


function stopSignature() {

  if (
    !isDrawing
  ) {

    return;

  }


  isDrawing =
    false;


  if (
    signatureContext
  ) {

    signatureContext
      .closePath();

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


if (
  signatureCanvas
) {

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
    "pointerleave",
    stopSignature
  );


  signatureCanvas.addEventListener(
    "pointercancel",
    stopSignature
  );


  window.addEventListener(
    "resize",
    resizeSignatureCanvas
  );


  setTimeout(
    resizeSignatureCanvas,
    100
  );

}


/* =========================================
   CONVERT SIGNATURE TO FILE
========================================= */

async function signatureToFile() {

  if (
    !signatureCanvas ||
    !hasSignature
  ) {

    return null;

  }


  return new Promise(

    resolve => {


      signatureCanvas.toBlob(

        blob => {


          if (!blob) {

            resolve(
              null
            );

            return;

          }


          const file =

            new File(

              [
                blob
              ],

              "signature.png",

              {
                type:
                  "image/png"
              }

            );


          resolve(
            file
          );

        },

        "image/png"

      );

    }

  );

}


/* =========================================
   VIDEO SIZE CHECK
========================================= */

if (
  $("video")
) {

  $("video").addEventListener(

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

if (
  $("form")
) {

  $("form").addEventListener(

    "submit",

    async function (
      event
    ) {


      event.preventDefault();


      const button =

        event.submitter ||

        event.target
          .querySelector(
            'button[type="submit"]'
          );


      const amount =

        Number(
          $("amount").value
        );


      const loanTerm =

        term(
          amount
        );


      if (
        !loanTerm
      ) {

        alert(

          "Please enter a loan amount from ₱100 to ₱2,000."

        );

        return;

      }


      if (
        !hasSignature
      ) {

        alert(

          "Please sign inside the Borrower Signature box before submitting your application."

        );

        return;

      }


      const signatureFile =

        await signatureToFile();


      if (
        !signatureFile
      ) {

        alert(

          "Unable to save your signature. Please clear the signature box and sign again."

        );

        return;

      }


      const video =

        $("video")
          .files[0];


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


      if (
        button
      ) {

        button.disabled =
          true;


        button.textContent =
          "Submitting...";

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

        String(

          amount +

          (
            amount *
            loanTerm[0] /
            100
          )

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

        video

      );


      try {


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


        const loanData =

          data.loan ||
          {};


        $("decision").className =
          "result";


        $("decision").innerHTML = `

          <h3>
            Application Submitted Successfully
          </h3>

          <p>
            Please save your Application ID.
            You will need it to track your application.
          </p>

          <p>
            <b>
              Application ID
            </b>

            <br>

            <strong>
              ${escapeHtml(
                applicationId
              )}
            </strong>
          </p>

          <p>
            <b>
              Application Status:
            </b>

            <br>

            Pending Review
          </p>

          <p>
            <b>
              Requested Amount:
            </b>

            <br>

            ${escapeHtml(
              formatMoney(
                loanData.amount ||
                amount
              )
            )}
          </p>

          <p>
            <b>
              Expected Loan Start Date:
            </b>

            <br>

            ${escapeHtml(
              formatDisplayDate(
                loanData.loan_start_date ||
                $("loanStartDate").value
              )
            )}
          </p>

          <p>
            <b>
              Expected Loan End Date / Due Date:
            </b>

            <br>

            ${escapeHtml(
              formatDisplayDate(
                loanData.loan_end_date ||
                $("loanEndDate").value
              )
            )}
          </p>

          <p>
            <b>
              Total Amount to Pay:
            </b>

            <br>

            <strong>
              ${escapeHtml(
                formatMoney(
                  loanData.total_payment ||
                  (
                    amount +
                    amount *
                    loanTerm[0] /
                    100
                  )
                )
              )}
            </strong>
          </p>

        `;


        event.target.reset();


        $("schoolBox")
          ?.classList
          .add(
            "hidden"
          );


        if (
          $("school")
        ) {

          $("school").required =
            false;

        }


        clearSignature();


        $("loanStartDate").value =
          "";


        $("loanEndDate").value =
          "";


        $("totalAmount").value =
          "";


        $("terms").textContent =

          "Enter ₱100–₱2,000 to calculate terms.";


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

          "Unable to submit the application. Please try again."

        );


      } finally {


        if (
          button
        ) {

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
        Enter the Application ID you received after submitting your application.
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

      applicationStatus ===
        "Active" ||

      application.loan_status ===
        "Active" ||

      application.is_active ===
        true;


    const isPaid =

      application.payment_status ===
        "Paid" ||

      applicationStatus ===
        "Paid";


    const dueInfo =

      getDueInformation(
        application
      );


    let statusDetails = `

      <p>
        <b>
          Application Status:
        </b>

        <br>

        <strong>
          ${escapeHtml(
            applicationStatus
          )}
        </strong>
      </p>

    `;


    if (
      isActive ||
      isPaid
    ) {

      statusDetails += `

        <p>
          <b>
            Loan Status:
          </b>

          <br>

          <strong>
            ${escapeHtml(
              isPaid
                ? "Paid"
                : "Active"
            )}
          </strong>
        </p>

        <p>
          <b>
            Payment Status:
          </b>

          <br>

          <strong>
            ${escapeHtml(
              isPaid
                ? "Paid"
                : (
                    application.payment_status ||
                    "Not Paid"
                  )
            )}
          </strong>
        </p>

        <p>
          <b>
            Due Status:
          </b>

          <br>

          <strong>
            ${escapeHtml(
              isPaid
                ? "Paid"
                : dueInfo.label
            )}
          </strong>
        </p>

        <p>
          <b>
            Due Date:
          </b>

          <br>

          ${escapeHtml(
            formatDisplayDate(
              getLoanEndDate(
                application
              )
            )
          )}
        </p>

        <p>
          <b>
            Current Amount Due:
          </b>

          <br>

          <strong>
            ${escapeHtml(
              formatMoney(
                isPaid
                  ? 0
                  : dueInfo.amountDue
              )
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
        <b>
          Application ID:
        </b>

        <br>

        ${escapeHtml(
          application.application_id
        )}
      </p>

      <p>
        <b>
          Name:
        </b>

        <br>

        ${escapeHtml(
          application.full_name
        )}
      </p>

      <p>
        <b>
          Requested Amount:
        </b>

        <br>

        ${escapeHtml(
          formatMoney(
            application.requested_amount
          )
        )}
      </p>

      <p>
        <b>
          Loan Terms:
        </b>

        <br>

        ${escapeHtml(
          application.interest_rate
        )}% interest for

        ${escapeHtml(
          application.duration_days
        )} days
      </p>

      <p>
        <b>
          Total Payment:
        </b>

        <br>

        ${escapeHtml(
          formatMoney(
            getBaseTotal(
              application
            )
          )
        )}
      </p>

      ${statusDetails}

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


  openDashboard();

}


/* =========================================
   OPEN ADMIN DASHBOARD
========================================= */

async function openDashboard() {

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

  const applicationsPanel =

    $("applicationsPanel");


  const clientsPanel =

    $("clientsPanel");


  const applicationsButton =

    $("applicationsTabButton");


  const clientsButton =

    $("clientsTabButton");


  applicationsPanel
    ?.classList
    .toggle(

      "hidden",

      panelId !==
      "applicationsPanel"

    );


  clientsPanel
    ?.classList
    .toggle(

      "hidden",

      panelId !==
      "clientsPanel"

    );


  applicationsButton
    ?.classList
    .toggle(

      "active-admin-tab",

      panelId ===
      "applicationsPanel"

    );


  clientsButton
    ?.classList
    .toggle(

      "active-admin-tab",

      panelId ===
      "clientsPanel"

    );


  if (
    panelId ===
    "clientsPanel"
  ) {

    renderClients();

  }

}


/* =========================================
   LOAD ADMIN APPLICATIONS
========================================= */

async function render() {

  if (
    !$("list")
  ) {

    return;

  }


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


  if (
    error
  ) {

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


  const applications =

    data ||
    [];


  updateDashboardCounters(
    applications
  );


  const pendingApplications =

    applications.filter(

      application =>

        !isActiveLoan(
          application
        )

    );


  $("list").innerHTML =

    pendingApplications
      .map(

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

              ${escapeHtml(
                formatMoney(
                  application.requested_amount
                )
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

                ${createStatusOptions(
                  application.status
                )}

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

                Documents

              </button>

            </td>


            <td>

              ${
                application.status ===
                "Approved"

                  ? `

                    <button

                      type="button"

                      class="primary"

                      onclick="activateLoan(

                        '${escapeJsString(
                          application.id
                        )}'

                      )"

                    >

                      Activate Loan

                    </button>

                  `

                  : `

                    <span>
                      Approve first
                    </span>

                  `
              }

            </td>

          </tr>

        `

      )
      .join("") ||

    `

      <tr>

        <td colspan="7">

          No pending applications.

        </td>

      </tr>

    `;


  await renderClients(

    applications

  );

}


/* =========================================
   APPLICATION STATUS OPTIONS
========================================= */

function createStatusOptions(
  currentStatus
) {

  const statuses = [

    "Pending Review",

    "Approved",

    "More Documents Required",

    "Declined"

  ];


  return statuses

    .map(

      status => `

        <option

          value="${escapeHtml(
            status
          )}"

          ${
            status ===
            currentStatus

              ? "selected"

              : ""
          }

        >

          ${escapeHtml(
            status
          )}

        </option>

      `

    )

    .join("");

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


  if (
    error
  ) {

    alert(
      error.message
    );


    await render();


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

  const confirmed =

    confirm(

      "Activate this loan? The borrower will be moved to Active Clients."

    );


  if (
    !confirmed
  ) {

    return;

  }


  const today =
    new Date();


  const {
    data: application,
    error: loadError
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


  if (
    loadError ||
    !application
  ) {

    alert(

      loadError?.message ||

      "Application not found."

    );


    return;

  }


  const duration =

    Number(
      application.duration_days
    ) ||
    0;


  const dueDate =

    new Date(
      today
    );


  dueDate.setDate(

    dueDate.getDate() +

    duration

  );


  const updates = {

    status:
      "Active",

    loan_status:
      "Active",

    payment_status:
      "Not Paid",

    loan_start_date:

      formatDateForInput(
        today
      ),

    loan_end_date:

      formatDateForInput(
        dueDate
      ),

    activated_at:

      new Date()
        .toISOString()

  };


  const {
    error
  } =

    await sb

      .from(
        "applications"
      )

      .update(
        updates
      )

      .eq(
        "id",
        id
      );


  if (
    error
  ) {

    alert(

      "Unable to activate loan: " +
      error.message

    );


    return;

  }


  alert(

    "Loan activated successfully."

  );


  await render();


  showAdminTab(
    "clientsPanel"
  );

}


/* =========================================
   ACTIVE CLIENTS
========================================= */

async function renderClients(
  suppliedApplications = null
) {

  if (
    !$("clientList")
  ) {

    return;

  }


  $("clientList").innerHTML = `

    <tr>

      <td colspan="8">
        Loading active clients...
      </td>

    </tr>

  `;


  let applications =

    suppliedApplications;


  if (
    !applications
  ) {

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

      $("clientList").innerHTML = `

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


    applications =
      data ||
      [];


    updateDashboardCounters(
      applications
    );

  }


  const clients =

    applications.filter(

      application =>

        isActiveLoan(
          application
        )

    );


  $("clientList").innerHTML =

    clients

      .map(

        application => {


          const dueInfo =

            getDueInformation(
              application
            );


          const paid =

            isPaidLoan(
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

                ${escapeHtml(
                  formatMoney(
                    application.requested_amount
                  )
                )}

              </td>


              <td>

                <b>

                  ${escapeHtml(
                    formatMoney(
                      paid
                        ? 0
                        : dueInfo.amountDue
                    )
                  )}

                </b>

                ${
                  dueInfo.penalty > 0 &&
                  !paid

                    ? `

                      <br>

                      <small>

                        Includes

                        ${escapeHtml(
                          formatMoney(
                            dueInfo.penalty
                          )
                        )}

                        late penalty

                      </small>

                    `

                    : ""
                }

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
                    getLoanEndDate(
                      application
                    )
                  )
                )}

              </td>


              <td>

                <span

                  class="status-badge

                    ${
                      paid

                        ? "status-paid"

                        : "status-pending"
                    }
                  "

                >

                  ${escapeHtml(
                    paid
                      ? "Paid"
                      : (
                          application.payment_status ||
                          "Not Paid"
                        )
                  )}

                </span>

              </td>


              <td>

                <span

                  class="status-badge

                    ${
                      paid

                        ? "status-paid"

                        : (
                            dueInfo.delayedDays > 0

                              ? "status-delayed"

                              : "status-active"
                          )
                    }
                  "

                >

                  ${escapeHtml(
                    paid
                      ? "Paid"
                      : dueInfo.label
                  )}

                </span>

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

                  Documents

                </button>


                ${
                  !paid

                    ? `

                      <button

                        type="button"

                        class="primary"

                        onclick="markAsPaid(

                          '${escapeJsString(
                            application.id
                          )}'

                        )"

                      >

                        Mark as Paid

                      </button>

                    `

                    : ""
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

          No active clients yet.

        </td>

      </tr>

    `;

}


/* =========================================
   CHECK ACTIVE LOAN
========================================= */

function isActiveLoan(
  application
) {

  return (

    application.status ===
      "Active" ||

    application.status ===
      "Paid" ||

    application.loan_status ===
      "Active" ||

    application.loan_status ===
      "Paid" ||

    application.payment_status ===
      "Paid" ||

    application.is_active ===
      true

  );

}


/* =========================================
   CHECK PAID LOAN
========================================= */

function isPaidLoan(
  application
) {

  return (

    application.status ===
      "Paid" ||

    application.loan_status ===
      "Paid" ||

    application.payment_status ===
      "Paid"

  );

}


/* =========================================
   GET BASE TOTAL
========================================= */

function getBaseTotal(
  application
) {

  return Number(

    application.total_payment ||

    application.total_amount_to_pay ||

    0

  ) || 0;

}


/* =========================================
   GET LOAN END DATE
========================================= */

function getLoanEndDate(
  application
) {

  return (

    application.due_date ||

    application.loan_end_date ||

    ""

  );

}


/* =========================================
   AUTOMATIC DUE STATUS
========================================= */

function getDueInformation(
  application
) {

  const baseTotal =

    getBaseTotal(
      application
    );


  const dueDate =

    parseDate(

      getLoanEndDate(
        application
      )

    );


  if (
    !dueDate
  ) {

    return {

      label:
        "No Due Date",

      delayedDays:
        0,

      penalty:
        0,

      amountDue:
        baseTotal

    };

  }


  const today =

    startOfDay(
      new Date()
    );


  const due =

    startOfDay(
      dueDate
    );


  const daysDifference =

    differenceInDays(

      due,

      today

    );


  if (
    daysDifference > 1
  ) {

    return {

      label:
        "Not Delayed",

      delayedDays:
        0,

      penalty:
        0,

      amountDue:
        baseTotal

    };

  }


  if (
    daysDifference === 1
  ) {

    return {

      label:
        "Due Tomorrow",

      delayedDays:
        0,

      penalty:
        0,

      amountDue:
        baseTotal

    };

  }


  if (
    daysDifference === 0
  ) {

    return {

      label:
        "Due Today",

      delayedDays:
        0,

      penalty:
        0,

      amountDue:
        baseTotal

    };

  }


  const delayedDays =

    Math.abs(
      daysDifference
    );


  const penalty =

    delayedDays *
    50;


  return {

    label:

      `Delayed – ${delayedDays} ${
        delayedDays === 1
          ? "Day"
          : "Days"
      }`,

    delayedDays,

    penalty,

    amountDue:

      baseTotal +
      penalty

  };

}


/* =========================================
   MARK AS PAID
========================================= */

async function markAsPaid(
  id
) {

  const {
    data: application,
    error: loadError
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


  if (
    loadError ||
    !application
  ) {

    alert(

      loadError?.message ||

      "Client record not found."

    );


    return;

  }


  const dueInfo =

    getDueInformation(
      application
    );


  const paymentAmount =

    prompt(

      "Enter amount paid:",

      dueInfo.amountDue
        .toFixed(
          2
        )

    );


  if (
    paymentAmount ===
    null
  ) {

    return;

  }


  const amountPaid =

    Number(
      paymentAmount
    );


  if (
    !Number.isFinite(
      amountPaid
    ) ||

    amountPaid <= 0
  ) {

    alert(

      "Please enter a valid payment amount."

    );


    return;

  }


  const paymentMethod =

    prompt(

      "Enter payment method (example: GCash, Cash, Bank Transfer):",

      "GCash"

    );


  if (
    paymentMethod ===
    null
  ) {

    return;

  }


  const referenceNumber =

    prompt(

      "Enter payment reference number. Leave blank if none:",

      ""

    );


  if (
    referenceNumber ===
    null
  ) {

    return;

  }


  const confirmed =

    confirm(

      `Mark this loan as fully paid?\n\nAmount Paid: ${formatMoney(
        amountPaid
      )}\nPayment Method: ${paymentMethod}`

    );


  if (
    !confirmed
  ) {

    return;

  }


  const updates = {

    status:
      "Paid",

    loan_status:
      "Paid",

    payment_status:
      "Paid",

    amount_paid:
      amountPaid,

    payment_date:

      formatDateForInput(
        new Date()
      ),

    payment_method:

      paymentMethod.trim(),

    payment_reference:

      referenceNumber.trim(),

    paid_at:

      new Date()
        .toISOString()

  };


  const {
    error
  } =

    await sb

      .from(
        "applications"
      )

      .update(
        updates
      )

      .eq(
        "id",
        id
      );


  if (
    error
  ) {

    alert(

      "Unable to mark payment as paid: " +
      error.message

    );


    return;

  }


  alert(

    "Payment recorded successfully."

  );


  await render();

}


/* =========================================
   DASHBOARD COUNTERS
========================================= */

function updateDashboardCounters(
  applications
) {

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


  for (
    const application
    of applications
  ) {


    if (
      application.status ===
      "Pending Review"
    ) {

      pending++;

    }


    if (
      isPaidLoan(
        application
      )
    ) {

      paid++;

      continue;

    }


    if (
      isActiveLoan(
        application
      )
    ) {

      active++;


      const dueInfo =

        getDueInformation(
          application
        );


      if (
        dueInfo.label ===
        "Due Today"
      ) {

        dueToday++;

      }


      if (
        dueInfo.delayedDays > 0
      ) {

        delayed++;

      }

    }

  }


  if (
    $("pendingCount")
  ) {

    $("pendingCount").textContent =
      pending;

  }


  if (
    $("activeCount")
  ) {

    $("activeCount").textContent =
      active;

  }


  if (
    $("dueTodayCount")
  ) {

    $("dueTodayCount").textContent =
      dueToday;

  }


  if (
    $("delayedCount")
  ) {

    $("delayedCount").textContent =
      delayed;

  }


  if (
    $("paidCount")
  ) {

    $("paidCount").textContent =
      paid;

  }

}


/* =========================================
   VIEW PRIVATE DOCUMENTS
========================================= */

async function viewDocs(
  id
) {

  const {
    data: application,
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


  if (
    error
  ) {

    alert(
      error.message
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
      "Borrower Signature",
      application.signature_path
    ],

    [
      "Verification Video",
      application.verification_video_path
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

          href="${escapeHtml(
            data.signedUrl
          )}"

          target="_blank"

          rel="noopener noreferrer"

        >

          ${escapeHtml(
            label
          )}

        </a>

      `);

    }

  }


  let clientInformation = `

    <h3>
      Borrower Record
    </h3>

    <p>
      <b>
        Application ID:
      </b>

      <br>

      ${escapeHtml(
        application.application_id
      )}
    </p>

    <p>
      <b>
        Name:
      </b>

      <br>

      ${escapeHtml(
        application.full_name
      )}
    </p>

    <p>
      <b>
        Mobile Number:
      </b>

      <br>

      ${escapeHtml(
        application.mobile_number
      )}
    </p>

    <p>
      <b>
        Email:
      </b>

      <br>

      ${escapeHtml(
        application.email
      )}
    </p>

    <p>
      <b>
        Requested Amount:
      </b>

      <br>

      ${escapeHtml(
        formatMoney(
          application.requested_amount
        )
      )}
    </p>

  `;


  if (
    isActiveLoan(
      application
    )
  ) {

    const dueInfo =

      getDueInformation(
        application
      );


    clientInformation += `

      <p>
        <b>
          Loan Start Date:
        </b>

        <br>

        ${escapeHtml(
          formatDisplayDate(
            application.loan_start_date
          )
        )}
      </p>

      <p>
        <b>
          Due Date:
        </b>

        <br>

        ${escapeHtml(
          formatDisplayDate(
            getLoanEndDate(
              application
            )
          )
        )}
      </p>

      <p>
        <b>
          Due Status:
        </b>

        <br>

        ${escapeHtml(
          isPaidLoan(
            application
          )
            ? "Paid"
            : dueInfo.label
        )}
      </p>

      <p>
        <b>
          Current Amount Due:
        </b>

        <br>

        ${escapeHtml(
          formatMoney(
            isPaidLoan(
              application
            )
              ? 0
              : dueInfo.amountDue
          )
        )}
      </p>

    `;

  }


  $("docLinks").innerHTML = `

    ${clientInformation}

    <hr>

    <h3>
      Private Documents
    </h3>

    <p>
      Document links expire in 5 minutes.
    </p>

    ${
      links.length

        ? links.join(
            "<br>"
          )

        : "No documents available."
    }

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

    }[
      character
    ])

  );

}


/* =========================================
   ESCAPE VALUE FOR INLINE JAVASCRIPT
========================================= */

function escapeJsString(
  value
) {

  return String(

    value ??
    ""

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
   CHECK EXISTING ADMIN SESSION
========================================= */

sb.auth
  .getSession()
  .then(

    async ({
      data
    }) => {


      if (
        data.session
      ) {

        await openDashboard();

      }

    }

  );


/* =========================================
   INITIAL SETUP
========================================= */

updateLoanDetails();


setTimeout(

  resizeSignatureCanvas,

  150

);
