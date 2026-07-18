const SUPABASE_URL = "https://fowgcdkwcmjchlinmywg.supabase.co";
const SUPABASE_KEY = "sb_publishable_BfNlckA6XfPk0rt_bv1kKQ_-RBQvl_L";
const SUBMIT_URL = `${SUPABASE_URL}/functions/v1/submit-application`;
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = id => document.getElementById(id);
function show(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');scrollTo(0,0)}
function term(a){if(a>=100&&a<=500)return[20,3];if(a>=501&&a<=1000)return[25,5];if(a>=1001&&a<=2000)return[30,7];return null}

$('employment').onchange=()=>{const student=$('employment').value==='Student';$('schoolBox').classList.toggle('hidden',!student);$('school').required=student};
$('amount').oninput=()=>{const a=+$('amount').value,t=term(a);$('terms').innerHTML=t?`<b>Your loan terms:</b> ${t[0]}% interest for ${t[1]} days. Total payment: <b>₱${(a*(1+t[0]/100)).toFixed(2)}</b>`:'Enter a valid amount from ₱100 to ₱2,000.'};

$('form').onsubmit=async e=>{
  e.preventDefault();
  const button=e.submitter; button.disabled=true; button.textContent='Submitting...';
  const fd=new FormData();
  fd.append('full_name',$('name').value); fd.append('email',$('email').value); fd.append('mobile_number',$('phone').value);
  fd.append('date_of_birth',$('dob').value); fd.append('employment_type',$('employment').value); fd.append('school_facebook_url',$('school').value);
  fd.append('monthly_income',$('income').value); fd.append('requested_amount',$('amount').value); fd.append('loan_purpose',$('purpose').value);
  fd.append('id_front',$('idFront').files[0]); fd.append('id_back',$('idBack').files[0]); fd.append('signature',$('signature').files[0]); fd.append('verification_video',$('video').files[0]);
  try{
    const res=await fetch(SUBMIT_URL,{method:'POST',headers:{apikey:SUPABASE_KEY},body:fd});
    const data=await res.json(); if(!res.ok) throw new Error(data.error||'Submission failed');
    $('decision').className='result'; $('decision').innerHTML=`<h3>Application Submitted</h3><p>Save your Application ID:</p><p><b>${data.application_id}</b></p><p>${data.loan.interest_rate}% interest • ${data.loan.duration_days} days • Total ₱${Number(data.loan.total_payment).toFixed(2)}</p>`;
    e.target.reset(); $('schoolBox').classList.add('hidden'); $('terms').textContent='Enter ₱100–₱2,000 to calculate terms.';
  }catch(err){alert(err.message)}finally{button.disabled=false;button.textContent='Submit Application'}
};

function track(){ $('trackResult').className='result'; $('trackResult').innerHTML='<h3>Online tracking is being secured.</h3><p>Please contact GPP Lending and provide your Application ID. Your application is stored in the live database.</p>'; }

async function login(){
  const email=$('adminEmail').value.trim(), password=$('adminPassword').value;
  $('loginError').textContent='';
  const {error}=await sb.auth.signInWithPassword({email,password});
  if(error){$('loginError').textContent=error.message;return}
  $('login').classList.add('hidden');$('dashboard').classList.remove('hidden');render();
}
async function logout(){await sb.auth.signOut();$('dashboard').classList.add('hidden');$('login').classList.remove('hidden')}
async function render(){
  $('list').innerHTML='<tr><td colspan="6">Loading applications...</td></tr>';
  const {data,error}=await sb.from('applications').select('*').order('created_at',{ascending:false});
  if(error){$('list').innerHTML=`<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;return}
  $('list').innerHTML=data.map(a=>`<tr><td>${escapeHtml(a.application_id)}</td><td>${escapeHtml(a.full_name)}</td><td>₱${Number(a.requested_amount).toFixed(2)}</td><td>${a.interest_rate}% / ${a.duration_days} days</td><td><select onchange="setStatus('${a.id}',this.value)">${['Pending Review','Approved','More Documents Required','Declined'].map(s=>`<option ${s===a.status?'selected':''}>${s}</option>`).join('')}</select></td><td><button onclick="viewDocs('${a.id}')">Documents</button></td></tr>`).join('')||'<tr><td colspan="6">No applications yet.</td></tr>';
}
async function setStatus(id,status){const {error}=await sb.from('applications').update({status}).eq('id',id);if(error)alert(error.message)}
async function viewDocs(id){
  const {data:a,error}=await sb.from('applications').select('id_front_path,id_back_path,signature_path,verification_video_path').eq('id',id).single(); if(error)return alert(error.message);
  const paths=[['ID Front',a.id_front_path],['ID Back',a.id_back_path],['Signature',a.signature_path],['Verification Video',a.verification_video_path]];
  const links=[]; for(const [label,path] of paths){const {data,error}=await sb.storage.from('application-documents').createSignedUrl(path,300);if(!error)links.push(`<a href="${data.signedUrl}" target="_blank" rel="noopener">${label}</a>`)}
  $('docLinks').innerHTML='<h3>Private documents</h3><p>Links expire in 5 minutes.</p>'+links.join('<br>'); $('docLinks').classList.remove('hidden');
}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

sb.auth.getSession().then(({data})=>{if(data.session){$('login').classList.add('hidden');$('dashboard').classList.remove('hidden');render()}});
