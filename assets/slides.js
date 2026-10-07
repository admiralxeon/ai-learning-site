// Slide viewer for the instructor kit. Arrow keys or the buttons move between slides.
// N shows the speaker notes. F starts full screen. The address keeps the slide number (#3).
(function(){
  var slides=[].slice.call(document.querySelectorAll(".slide"));
  if(!slides.length)return;
  var count=document.querySelector(".deck-count"),prev=document.querySelector(".deck-prev"),next=document.querySelector(".deck-next");
  var notesB=document.querySelector(".deck-notes"),fullB=document.querySelector(".deck-full");
  var i=Math.max(0,Math.min(slides.length-1,(parseInt(location.hash.slice(1),10)||1)-1));
  try{if(localStorage.getItem("ai-manual-slide-notes")==="1")document.body.classList.add("show-notes");}catch(e){}
  function show(n){
    i=Math.max(0,Math.min(slides.length-1,n));
    slides.forEach(function(s,k){s.hidden=k!==i;s.setAttribute("aria-label","Slide "+(k+1)+" of "+slides.length);});
    count.textContent=(i+1)+" / "+slides.length;
    prev.disabled=i===0;next.disabled=i===slides.length-1;
    history.replaceState(null,"","#"+(i+1));
  }
  function notes(){
    var on=document.body.classList.toggle("show-notes");
    notesB.setAttribute("aria-pressed",on?"true":"false");
    try{localStorage.setItem("ai-manual-slide-notes",on?"1":"0");}catch(e){}
  }
  function full(){
    if(document.fullscreenElement)document.exitFullscreen();
    else if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen();
  }
  prev.addEventListener("click",function(){show(i-1);});
  next.addEventListener("click",function(){show(i+1);});
  notesB.addEventListener("click",notes);
  fullB.addEventListener("click",full);
  notesB.setAttribute("aria-pressed",document.body.classList.contains("show-notes")?"true":"false");
  document.addEventListener("keydown",function(e){
    if(e.target.closest&&e.target.closest("a,button,input,textarea"))if(e.key===" "||e.key==="Enter")return;
    if(e.key==="ArrowRight"||e.key==="PageDown"||e.key===" "){e.preventDefault();show(i+1);}
    else if(e.key==="ArrowLeft"||e.key==="PageUp"){e.preventDefault();show(i-1);}
    else if(e.key==="Home"){show(0);}else if(e.key==="End"){show(slides.length-1);}
    else if(e.key==="n"||e.key==="N"){notes();}else if(e.key==="f"||e.key==="F"){full();}
  });
  // Swipe on touch screens
  var x0=null;
  document.addEventListener("touchstart",function(e){x0=e.touches[0].clientX;},{passive:true});
  document.addEventListener("touchend",function(e){if(x0==null)return;var dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>50)show(i+(dx<0?1:-1));x0=null;});
  // Print all slides, one on each page
  window.addEventListener("beforeprint",function(){slides.forEach(function(s){s.hidden=false;});});
  window.addEventListener("afterprint",function(){show(i);});
  show(i);
})();
