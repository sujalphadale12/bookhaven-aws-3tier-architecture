let books = [], categories = [], activeCategory = "";
const $ = s => document.querySelector(s);
const money = n => `₹${Number(n).toLocaleString("en-IN")}`;

async function api(url, opts={}) {
  const token = localStorage.getItem("bookhaven_token");
  opts.headers = {...(opts.headers||{}), ...(token ? {Authorization:`Bearer ${token}`} : {})};
  const r = await fetch(url, opts);
  const data = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function loadCategories(){
  categories = await api("/api/categories");
  const icons = ["✦","⌘","↗","◎","◇"];
  $("#categoryGrid").innerHTML = categories.map((c,i)=>`
    <div class="category" onclick="selectCategory('${c.slug}')">
      <span class="num">0${i+1}</span><h3>${c.name}</h3><p>Browse collection ${icons[i]||"✦"}</p>
    </div>`).join("");
  $("#chips").innerHTML = `<button class="chip active" onclick="selectCategory('')">All books</button>` +
    categories.map(c=>`<button class="chip" onclick="selectCategory('${c.slug}')">${c.name}</button>`).join("");
}

async function loadBooks(){
  const q = $("#search").value.trim();
  books = await api(`/api/books?q=${encodeURIComponent(q)}&category=${encodeURIComponent(activeCategory)}`);
  renderBooks();
}
function renderBooks(){
  $("#bookGrid").innerHTML = books.map(b=>`
    <article class="book-card">
      <div class="cover"><img src="${b.cover_url}" alt="${escapeHtml(b.title)}" loading="lazy"></div>
      <div class="book-info">
        <div class="category">${escapeHtml(b.category)}</div>
        <h3>${escapeHtml(b.title)}</h3>
        <div class="author">${escapeHtml(b.author)}</div>
        <div class="price-row"><div><span class="price">${money(b.price)}</span> <span class="old">${money(b.old_price)}</span></div>
        <button class="add" onclick="addToCart(${b.id})">+ Cart</button></div>
      </div>
    </article>`).join("") || `<p>No books found.</p>`;
}
function selectCategory(slug){activeCategory=slug;document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));const c=[...document.querySelectorAll(".chip")].find(x=>x.getAttribute("onclick")?.includes(`'${slug}'`));if(c)c.classList.add("active");loadBooks();document.querySelector("#books").scrollIntoView({behavior:"smooth"});}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
async function addToCart(id){
  if(!localStorage.getItem("bookhaven_token")) return authModal("Please sign in to add books to your cart.");
  try { await api("/api/cart",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({bookId:id})}); updateCartCount(); toast("Added to your cart."); }
  catch(e){toast(e.message);}
}
async function updateCartCount(){
  if(!localStorage.getItem("bookhaven_token")){$("#cartCount").textContent="0";return;}
  try{const c=await api("/api/cart");$("#cartCount").textContent=c.reduce((n,x)=>n+x.quantity,0)}catch{}
}
function openModal(html){$("#modalContent").innerHTML=html;$("#modal").classList.remove("hidden");}
function closeModal(){$("#modal").classList.add("hidden")}
function authModal(message=""){
 openModal(`<h2>Welcome back</h2><form class="form" id="loginForm"><input type="email" name="email" placeholder="Email" required><input type="password" name="password" placeholder="Password" required><button>Sign in</button></form><p class="notice">${message} New here? <a href="#" onclick="registerModal();return false">Create an account</a></p>`);
 $("#loginForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{const d=await api("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(f))});localStorage.setItem("bookhaven_token",d.token);localStorage.setItem("bookhaven_user",JSON.stringify(d.user));closeModal();updateCartCount();toast(`Welcome, ${d.user.name.split(" ")[0]}!`);$("#authBtn").textContent="Account"}catch(err){toast(err.message)}}
}
function registerModal(){
 openModal(`<h2>Create account</h2><form class="form" id="regForm"><input name="name" placeholder="Full name" required><input type="email" name="email" placeholder="Email" required><input type="password" name="password" placeholder="Password (6+ chars)" required><button>Create account</button></form><p class="notice">Already have an account? <a href="#" onclick="authModal();return false">Sign in</a></p>`);
 $("#regForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{const d=await api("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(f))});localStorage.setItem("bookhaven_token",d.token);localStorage.setItem("bookhaven_user",JSON.stringify(d.user));closeModal();updateCartCount();toast("Account created.");$("#authBtn").textContent="Account"}catch(err){toast(err.message)}}
}
async function cartModal(){
 if(!localStorage.getItem("bookhaven_token")) return authModal("Sign in to view your cart.");
 try{const items=await api("/api/cart");let total=items.reduce((s,x)=>s+x.price*x.quantity,0);
 openModal(`<h2>Your cart</h2>${items.length?items.map(x=>`<div class="cart-row"><img src="${x.cover_url}"><div><b>${escapeHtml(x.title)}</b><div class="author">${escapeHtml(x.author)} · Qty ${x.quantity}</div></div><strong>${money(x.price*x.quantity)}</strong></div>`).join(""):`<p class="notice">Your cart is empty.</p>`}${items.length?`<div class="cart-total"><span>Total</span><span>${money(total)}</span></div><button class="form" style="margin-top:18px;width:100%" onclick="checkout()">Place order</button>`:""}`);
 }catch(e){toast(e.message)}
}
async function checkout(){try{const d=await api("/api/orders",{method:"POST"});closeModal();updateCartCount();toast(`Order #${d.orderId} placed successfully.`)}catch(e){toast(e.message)}}
function toast(msg){const t=document.createElement("div");t.textContent=msg;t.style="position:fixed;right:22px;bottom:22px;background:#17211b;color:#fff;padding:13px 18px;border-radius:12px;z-index:100;box-shadow:0 12px 30px #0002";document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
$("#closeModal").onclick=closeModal;$("#modal").onclick=e=>{if(e.target.id==="modal")closeModal()};$("#authBtn").onclick=()=>localStorage.getItem("bookhaven_token")?accountModal():authModal();$("#cartBtn").onclick=cartModal;$("#searchFocus").onclick=()=>{$("#search").focus();document.querySelector("#books").scrollIntoView({behavior:"smooth"})};$("#search").oninput=loadBooks;
function accountModal(){const u=JSON.parse(localStorage.getItem("bookhaven_user")||"{}");openModal(`<h2>Hello, ${escapeHtml(u.name||"Reader")}</h2><p class="notice">${escapeHtml(u.email||"")}</p><button class="form" style="margin-top:20px;width:100%" onclick="localStorage.clear();closeModal();updateCartCount();$('#authBtn').textContent='Sign in';toast('Signed out.')">Sign out</button>`)}
(async()=>{try{await loadCategories();await loadBooks();updateCartCount()}catch(e){toast("Could not connect to the API. Check your database and .env.")}})();
