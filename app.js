const SUPABASE_URL = "https://fowgcdkwcmjchlinmywg.supabase.co";
const SUPABASE_KEY = "sb_publishable_BfNlckA6XfPk0rt_bv1kKQ_-RBQvl_L";

const SUBMIT_URL = `${SUPABASE_URL}/functions/v1/submit-application`;
const TRACK_URL = `${SUPABASE_URL}/functions/v1/track-application`;

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const $ = id =>
  document.getElementById(id);


/* =========================
   PAGE NAVIGATION
========================= */

function show(id) {

  document
    .querySelectorAll(".page")
    .forEach(page => {
      page.classList.remove("active");
    });

  $(id).classList.add("active");

  window.scrollTo(0, 0);

  if (id === "apply") {

    setTimeout(() => {
      resizeSignaturePad();
    }, 50);

  }
}


/* =========================
   LOAN TERMS
========================= */

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


/* =========================
   FORMAT DATE
========================= */

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


/* =========================
   AUTOMATIC LOAN DETAILS
========================= */

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

  const amount =
    Number(amountInput.value);

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
    formatDateForInput(startDate);

  endDateInput.value =
    formatDateForInput(endDate);

  totalAmountInput.value =
    `₱${totalPayment.toFixed(2)}`;


  termsBox.innerHTML = `
    <b>Your loan terms:</b>
    ${interestRate}% interest for
    ${durationDays} days.
    Total payment:
    <b>₱${totalPayment.toFixed(2)}</b>
  `;
}


$("amount").addEventListener(
  "input",
  updateLoanDetails
);

$("amount").addEventListener(
  "change",
  updateLoanDetails
);


/* =========================
   STUDENT SCHOOL FIELD
========================= */

$("employment").addEventListener(
  "change",
  function () {

    const isStudent =
      $("employment").value ===
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


/* =========================
   VIDEO SIZE CHECK
========================= */

$("video").addEventListener(
  "change",
  function () {

    const file =
      $("video").files[0];

    if (!file) {
      return;
    }

    const maxSize =
      50 * 1024 * 1024;

    if (
      file.size >
      maxSize
    ) {

      alert(
        "Verification video must be under 50 MB. Please select a smaller video."
      );

      $("video").value = "";
    }
  }
);


/* =========================
   DIGITAL SIGNATURE PAD
========================= */

const signatureCanvas =
  $("signaturePad");

const signatureContext =
  signatureCanvas.getContext(
    "2d"
  );

let isSigning =
  false;

let hasSignature =
  false;


/*
  Resize the canvas correctly for
  desktop, mobile and high-resolution
  screens.
*/

function resizeSignaturePad() {

  if (!signatureCanvas) {
    return;
  }

  const rect =
    signatureCanvas
      .getBoundingClientRect();

  if (
    rect.width === 0 ||
    rect.height === 0
  ) {
    return;
  }

  /*
    Save existing signature before
    resizing so it is not accidentally
    erased when the screen changes.
  */

  let existingSignature =
    null;

  if (hasSignature) {

    existingSignature =
      signatureCanvas.toDataURL(
        "image/png"
      );
  }


  const ratio =
    Math.max(
      window.devicePixelRatio || 1,
      1
    );


  signatureCanvas.width =
    Math.round(
      rect.width * ratio
    );

  signatureCanvas.height =
    Math.round(
      rect.height * ratio
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
    "#063d91";


  if (existingSignature) {

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
      existingSignature;
  }
}


/*
  Get mouse or touch position.
*/

function getSignaturePosition(
  event
) {

  const rect =
    signatureCanvas
      .getBoundingClientRect();


  let clientX;
  let clientY;


  if (
    event.touches &&
    event.touches.length
  ) {

    clientX =
      event.touches[0]
        .clientX;

    clientY =
      event.touches[0]
        .clientY;

  } else if (
    event.changedTouches &&
    event.changedTouches.length
  ) {

    clientX =
      event.changedTouches[0]
        .clientX;

    clientY =
      event.changedTouches[0]
        .clientY;

  } else {

    clientX =
      event.clientX;

    clientY =
      event.clientY;
  }


  return {

    x:
      clientX -
      rect.left,

    y:
      clientY -
      rect.top

  };
}


/*
  Start signing.
*/

function startSignature(
  event
) {

  event.preventDefault();

  isSigning =
    true;

  hasSignature =
    true;


  $("signatureError")
    .classList
    .add("hidden");


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
}


/*
  Draw signature.
*/

function drawSignature(
  event
) {

  if (!isSigning) {
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


/*
  Stop signing.
*/

function stopSignature(
  event
) {

  if (!isSigning) {
    return;
  }

  if (event) {
    event.preventDefault();
  }

  isSigning =
    false;

  signatureContext
    .beginPath();
}


/* Mouse events */

signatureCanvas.addEventListener(
  "mousedown",
  startSignature
);

signatureCanvas.addEventListener(
  "mousemove",
  drawSignature
);

signatureCanvas.addEventListener(
  "mouseup",
  stopSignature
);

signatureCanvas.addEventListener(
  "mouseleave",
  stopSignature
);


/* Touch events */

signatureCanvas.addEventListener(
  "touchstart",
  startSignature,
  {
    passive: false
  }
);

signatureCanvas.addEventListener(
  "touchmove",
  drawSignature,
  {
    passive: false
  }
);

signatureCanvas.addEventListener(
  "touchend",
  stopSignature,
  {
    passive: false
  }
);


/* Clear signature */

$("clearSignature")
  .addEventListener(
    "click",
    function () {

      signatureContext
        .clearRect(
          0,
          0,
          signatureCanvas.width,
          signatureCanvas.height
        );

      hasSignature =
        false;

      $("signatureError")
        .classList
        .add("hidden");
    }
  );


/*
  Convert canvas signature
  into a PNG File.
*/

function signatureToFile() {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      signatureCanvas.toBlob(
        blob => {

          if (!blob) {

            reject(
              new Error(
                "Unable to save your signature."
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


/*
  Resize when browser size changes.
*/

window.addEventListener(
  "resize",
  function () {

    if (
      $("apply")
        .classList
        .contains("active")
    ) {

      resizeSignaturePad();
    }
  }
);


/* =========================
   SUBMIT APPLICATION
========================= */

$("form").addEventListener(
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


    /*
      Require digital signature.
    */

    if (!hasSignature) {

      $("signatureError")
        .classList
        .remove("hidden");

      $("signaturePad")
        .scrollIntoView({
          behavior:
            "smooth",

          block:
            "center"
        });

      return;
    }


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


    button.disabled =
      true;

    button.textContent =
      "Submitting...";


    try {

      /*
        Convert the drawn signature
        to a PNG file.
      */

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
            "₱",
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


      /*
        NEW:
        Send the signature drawing
        using the same "signature"
        field your existing backend
        already expects.
      */

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
          <b>
            Loan Start Date:
          </b>
          <br>

          ${escapeHtml(
            $("loanStartDate").value
          )}
        </p>

        <p>
          <b>
            Loan End Date:
          </b>
          <br>

          ${escapeHtml(
            $("loanEndDate").value
          )}
        </p>

        <p>
          <b>
            Total Amount to Pay:
          </b>
          <br>

          ${escapeHtml(
            $("totalAmount").value
          )}
        </p>

      `;


      /*
        Reset form.
      */

      event.target.reset();


      $("schoolBox")
        .classList
        .add("hidden");

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


      /*
        Clear signature after
        successful submission.
      */

      signatureContext
        .clearRect(
          0,
          0,
          signatureCanvas.width,
          signatureCanvas.height
        );

      hasSignature =
        false;


      $("signatureError")
        .classList
        .add("hidden");


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

      button.disabled =
        false;

      button.textContent =
        "Submit Application";

    }

  }
);


/* =========================
   TRACK APPLICATION
========================= */

async function track() {

  const applicationId =
    $("trackId")
      .value
      .trim();


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


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Unable to track application."
      );
    }


    const application =
      data.application ||
      data;


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

        ₱${Number(
          application.requested_amount
        ).toFixed(2)}
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

        ₱${Number(
          application.total_payment ||
          application.total_amount_to_pay
        ).toFixed(2)}
      </p>


      <p>
        <b>
          Status:
        </b>
        <br>

        <strong>
          ${escapeHtml(
            application.status
          )}
        </strong>
      </p>

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
    .textContent =
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
   LOAD ADMIN APPLICATIONS
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
      .from("applications")
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
              onchange="setStatus('${application.id}', this.value)"
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
              onclick="viewDocs('${application.id}')"
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
   UPDATE APPLICATION STATUS
========================= */

async function setStatus(
  id,
  status
) {

  const {
    error
  } =
    await sb
      .from("applications")
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
      .from("applications")
      .select(
        "id_front_path,id_back_path,signature_path,verification_video_path"
      )
      .eq(
        "id",
        id
      )
      .single();


  if (error) {

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
      "Signature",
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

    if (!path) {
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

      links.push(
        `

          <a
            href="${data.signedUrl}"
            target="_blank"
            rel="noopener"
          >

            ${escapeHtml(
              label
            )}

          </a>

        `
      );
    }
  }


  $("docLinks")
    .innerHTML = `

      <h3>
        Private Documents
      </h3>

      <p>
        Links expire in 5 minutes.
      </p>

      ${
        links.length
          ? links.join("<br>")
          : "No documents available."
      }

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
   CHECK EXISTING ADMIN SESSION
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
          .add("hidden");


        $("dashboard")
          .classList
          .remove("hidden");


        render();
      }
    }
  );


/* =========================
   INITIAL SETUP
========================= */

updateLoanDetails();
