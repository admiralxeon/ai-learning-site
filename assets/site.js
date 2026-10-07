// UI enhancements for the AI learning manual.
// The pages work without this file. It only adds navigation and study aids.
// Progress is kept in this browser only (localStorage).
(function(){
  var root=document.documentElement;
  var THEME_KEY="ai-manual-theme",TEXT_KEY="ai-manual-text",PROG_KEY="ai-manual-progress",PATH_KEY="ai-manual-path",NAME_KEY="ai-manual-name";

  function get(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function set(k,v){try{localStorage.setItem(k,v);}catch(e){}}

  // Apply saved display settings before the page paints, to prevent a flash.
  var savedTheme=get(THEME_KEY);
  if(savedTheme==="light"||savedTheme==="dark")root.setAttribute("data-theme",savedTheme);
  var savedText=get(TEXT_KEY);
  if(savedText==="l"||savedText==="xl")root.setAttribute("data-text",savedText);


  function loadProgress(){try{return JSON.parse(get(PROG_KEY))||{};}catch(e){return {};}}
  function saveProgress(p){set(PROG_KEY,JSON.stringify(p));}
  var PAGE=location.pathname.split("/").pop()||"index.html";

  var SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var ICON={
    moon:SVG+'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    sun:SVG+'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    up:SVG+'<path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    down:SVG+'<path d="M12 5v14M5 12l7 7 7-7"/></svg>',
    check:SVG+'<path d="M20 6 9 17l-5-5"/></svg>',
    close:SVG+'<path d="M18 6 6 18M6 6l12 12"/></svg>',
    expand:SVG+'<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
    clock:SVG+'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    list:SVG+'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    chevron:SVG+'<path d="m18 15-6-6-6 6"/></svg>',
    speaker:SVG+'<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
    stop:SVG+'<rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
    search:SVG+'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    sliders:SVG+'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>',
    play:SVG+'<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/></svg>',
    text:'<svg viewBox="0 0 24 24" aria-hidden="true"><text x="1" y="18" font-size="15" font-weight="700" fill="currentColor" font-family="Barlow,sans-serif">A</text><text x="12" y="18" font-size="10" font-weight="700" fill="currentColor" font-family="Barlow,sans-serif">A</text></svg>'
  };

  // The modules of the course, in order. A visited page updates these numbers in the saved progress.
  var MODULES=[
    {"href":"python-for-ai.html","num":0,"title":"Python and data tools","sections":12,"read":11,"video":85,"quick":["set-up-your-tools","python-basics","pandas-work-with-tables","summary","knowledge-check"],"quickRead":4,"tracks":["engineer"]},
    {"href":"ai.html","num":1,"title":"Artificial intelligence","sections":12,"read":16,"video":54,"quick":["what-ai-is","the-parts-of-ai","how-a-chat-ai-makes-text","limits-and-risks","summary","knowledge-check"],"quickRead":6,"tracks":["foundations","engineer"]},
    {"href":"mathematics.html","num":2,"title":"Mathematics for machine learning","sections":14,"read":18,"video":62,"quick":["why-ai-needs-mathematics","statistics-describe-data","probability","vectors","calculus-rates-of-change","summary","knowledge-check"],"quickRead":9,"tracks":["foundations","engineer"]},
    {"href":"machine-learning.html","num":3,"title":"Machine learning","sections":14,"read":13,"video":47,"quick":["what-machine-learning-is","the-machine-learning-workflow","how-a-model-makes-its-errors-smaller","overfitting-and-underfitting","summary","knowledge-check"],"quickRead":5,"tracks":["foundations","engineer"]},
    {"href":"deep-learning.html","num":4,"title":"Deep learning","sections":12,"read":14,"video":48,"quick":["what-deep-learning-is","inside-a-neuron","how-a-transformer-uses-attention","summary","knowledge-check"],"quickRead":5,"tracks":["foundations","engineer"]},
    {"href":"generative-ai.html","num":5,"title":"Generative AI","sections":12,"read":18,"video":104,"quick":["what-generative-ai-is","how-a-large-language-model-is-made","how-to-write-a-good-prompt","risks-of-generative-ai","summary","knowledge-check"],"quickRead":9,"tracks":["foundations","engineer"]},
    {"href":"responsible-ai.html","num":6,"title":"Responsible AI","sections":11,"read":11,"video":23,"quick":["what-responsible-ai-is","bias-and-fairness","when-not-to-use-ai","summary","knowledge-check"],"quickRead":5,"tracks":["foundations","engineer"]},
    {"href":"ai-in-practice.html","num":7,"title":"AI in practice","sections":12,"read":15,"video":109,"quick":["from-a-model-to-a-product","prepare-the-data","start-with-a-baseline","monitor-the-model","summary","knowledge-check"],"quickRead":7,"tracks":["engineer"]},
    {"href":"devops.html","num":8,"title":"DevOps for AI","sections":13,"read":17,"video":44,"quick":["what-devops-is","serve-the-model-as-an-api","test-and-release-automatically","observe-the-system-in-production","summary","knowledge-check"],"quickRead":7,"tracks":["engineer"]},
    {"href":"llm-engineering.html","num":9,"title":"LLM engineering","sections":14,"read":18,"video":9,"quick":["the-parts-of-an-llm-application","call-a-model-through-an-api","answer-from-your-documents-with-rag","evaluate-the-application","summary","knowledge-check"],"quickRead":6,"tracks":["engineer"]}
  ];
  // Versions of the files that this script loads later. tools/build.py writes them, so that an update is never mixed with old copies.
  var ASSET_V={"flashcards.js":"f3d6700cfe","playgrounds.js":"f27baddd21","search-index.js":"7ce5e1e967"};
  function av(n){return ASSET_V[n]?"?v="+ASSET_V[n]:"";}
  // The tracks of the course. tools/build.py writes them.
  var TRACKS=[{"id":"foundations","name":"AI Foundations","weeks":6,"modules":["ai.html","mathematics.html","machine-learning.html","deep-learning.html","generative-ai.html","responsible-ai.html"],"projects":[],"capstone":false},{"id":"engineer","name":"AI Engineer","weeks":12,"modules":["python-for-ai.html","ai.html","mathematics.html","machine-learning.html","deep-learning.html","generative-ai.html","responsible-ai.html","ai-in-practice.html","devops.html","llm-engineering.html"],"projects":["project-3-build-a-spam-filter","project-5-a-neural-network-that-reads-digits","project-8-find-drift-and-train-again","project-9-ship-a-model-with-ci-cd"],"capstone":true}];
  var TRACK_KEY="ai-manual-track";
  function myTrack(){var id=get(TRACK_KEY);for(var i=0;i<TRACKS.length;i++)if(TRACKS[i].id===id)return TRACKS[i];return null;}
  function trackMods(t){return t?MODULES.filter(function(M){return t.modules.indexOf(M.href)>=0;}):MODULES;}
  var CAPG_KEY="ai-manual-capstone-grade",CAP_ITEMS=["repo","readme","run","tests","baseline","eval","card","video","secrets"],CAP_CRITS=["problem","data","solution","evaluation","engineering","responsible","communication"];
  function capGrade(){try{return JSON.parse(get(CAPG_KEY))||{};}catch(e){return {};}}
  // Pass: a complete checklist, a level for each criterion, no level 1, and 70% or more of the points.
  function capResult(g){
    var ck=g.check||{},lv=g.levels||{},done=CAP_ITEMS.filter(function(k){return ck[k];}).length,sum=0,n=0,low=false;
    CAP_CRITS.forEach(function(c){var v=+lv[c]||0;if(v){n++;sum+=v;if(v===1)low=true;}});
    var pct=Math.round(sum/(CAP_CRITS.length*4)*100);
    return {done:done,items:CAP_ITEMS.length,rated:n,crits:CAP_CRITS.length,sum:sum,max:CAP_CRITS.length*4,pct:pct,low:low,
      passed:done===CAP_ITEMS.length&&n===CAP_CRITS.length&&!low&&pct>=70};
  }
  function projectsDone(t,store){var d=(store["projects.html"]||{}).done||[];return (t?t.projects:[]).filter(function(id){return d.indexOf(id)>=0;});}
  function fmtMin(m){m=Math.round(m||0);if(m>=60){var h=Math.floor(m/60),r=m%60;return h+" h"+(r?" "+r+" min":"");}return m+" min";}

  function el(tag,cls,html){var n=document.createElement(tag);if(cls)n.className=cls;if(html!=null)n.innerHTML=html;return n;}
  function words(node){var t=(node.textContent||"").trim();return t?t.split(/\s+/).length:0;}

  // ---------- Toasts ----------
  var toastEl=null,toastTimer=null;
  function toast(html,actions,ms){
    if(!toastEl){toastEl=el("div","toast");toastEl.setAttribute("role","status");document.body.appendChild(toastEl);}
    toastEl.innerHTML="";
    toastEl.appendChild(el("div","toast-msg",html));
    var row=el("div","toast-act");
    (actions||[]).forEach(function(a){row.appendChild(a);});
    var x=el("button","toast-x",ICON.close);x.type="button";x.setAttribute("aria-label","Dismiss");
    x.addEventListener("click",hideToast);row.appendChild(x);
    toastEl.appendChild(row);
    requestAnimationFrame(function(){toastEl.classList.add("on");});
    clearTimeout(toastTimer);
    if(ms)toastTimer=setTimeout(hideToast,ms);
  }
  function hideToast(){if(toastEl)toastEl.classList.remove("on");}

  function init(){
    var bar=document.querySelector(".sitebar"),barIn=bar&&bar.querySelector(".in");
    var sheet=document.querySelector(".sheet");
    var main=sheet&&sheet.querySelector("main");
    var isHome=!!document.querySelector(".modlist");

    // ---------- Display menu: theme and text size ----------
    if(barIn){
      var dwrap=el("div","dwrap");
      var dbtn=el("button","iconbtn",ICON.sliders);dbtn.type="button";
      dbtn.setAttribute("aria-label","Display settings");dbtn.title="Display settings";
      dbtn.setAttribute("aria-expanded","false");dbtn.setAttribute("aria-controls","display-menu");
      var panel=el("div","dmenu");panel.id="display-menu";panel.hidden=true;
      var group=function(name,legend,opts,cur,onPick){
        var fs=el("fieldset","dgroup");fs.appendChild(el("legend",null,legend));
        var row=el("div","dseg");
        opts.forEach(function(o){
          var id="d-"+name+"-"+(o[0]||"default");
          var lab=el("label","dopt");lab.setAttribute("for",id);
          var inp=el("input");inp.type="radio";inp.name="d-"+name;inp.id=id;inp.value=o[0];inp.checked=(o[0]===cur);
          inp.addEventListener("change",function(){if(inp.checked)onPick(o[0]);});
          lab.appendChild(inp);lab.appendChild(el("span",null,o[1]));row.appendChild(lab);
        });
        fs.appendChild(row);return fs;
      };
      panel.appendChild(group("theme","Theme",[["","System"],["light","Light"],["dark","Dark"]],root.getAttribute("data-theme")||"",function(v){
        if(v)root.setAttribute("data-theme",v);else root.removeAttribute("data-theme");set(THEME_KEY,v);
      }));
      panel.appendChild(group("text","Text size",[["","Normal"],["l","Large"],["xl","Extra large"]],root.getAttribute("data-text")||"",function(v){
        if(v)root.setAttribute("data-text",v);else root.removeAttribute("data-text");set(TEXT_KEY,v);
      }));
      var openMenu=function(o){panel.hidden=!o;dbtn.setAttribute("aria-expanded",o?"true":"false");dbtn.classList.toggle("is-on",o);};
      dbtn.addEventListener("click",function(e){
        e.stopPropagation();openMenu(panel.hidden);
        if(!panel.hidden){var c=panel.querySelector("input:checked");if(c)c.focus();}
      });
      panel.addEventListener("click",function(e){e.stopPropagation();});
      document.addEventListener("click",function(){if(!panel.hidden)openMenu(false);});
      document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!panel.hidden){openMenu(false);dbtn.focus();}});
      panel.addEventListener("focusout",function(e){if(e.relatedTarget&&!dwrap.contains(e.relatedTarget))openMenu(false);});
      dwrap.appendChild(dbtn);dwrap.appendChild(panel);
      var tbActs=el("div","tb-actions");tbActs.appendChild(dwrap);barIn.appendChild(tbActs);
    }

    // Modules menu: close it with Escape, with a click outside, and when focus leaves it. Show the progress of each module.
    var mods=bar&&bar.querySelector("details.mods");
    if(mods){
      var modsBtn=mods.querySelector("summary");
      document.addEventListener("click",function(e){if(mods.open&&!mods.contains(e.target))mods.open=false;});
      document.addEventListener("keydown",function(e){if(e.key==="Escape"&&mods.open){mods.open=false;modsBtn.focus();}});
      mods.addEventListener("focusout",function(e){if(e.relatedTarget&&!mods.contains(e.relatedTarget))mods.open=false;});
      mods.addEventListener("toggle",function(){if(mods.open){var p=mods.querySelector('.mods-list a[aria-current="page"]')||mods.querySelector(".mods-list a");if(p&&p.scrollIntoView)p.scrollIntoView({block:"nearest"});}});
      var ps=loadProgress();
      [].forEach.call(mods.querySelectorAll(".mods-list a[data-mod]"),function(a){
        var p=ps[a.getAttribute("data-mod")];if(!p||!p.total)return;
        var d=(p.done||[]).length,full=d>=p.total,quiz=(p.done||[]).indexOf("knowledge-check")>=0;
        var pr=el("span","mods-prog"+(full?" done":""));
        pr.textContent=full?"\u2713 Done":(d?d+"/"+p.total:"");
        if(quiz&&!full)pr.textContent+=" \u2605";
        pr.title=(full?"All sections done":d+" of "+p.total+" sections done")+(quiz?". Knowledge check passed.":".");
        if(pr.textContent)a.appendChild(pr);
        if(full)a.classList.add("is-done");
      });
    }

    // Reading progress bar
    var prog=null;
    if(bar){prog=el("div","progress");prog.setAttribute("aria-hidden","true");bar.appendChild(prog);}

    // ---------- Layout ----------
    var layout=null;
    if(sheet){
      layout=el("div","layout");
      sheet.parentNode.insertBefore(layout,sheet);
      layout.appendChild(sheet);
    }

    // ---------- Tables: label cells so phones can show them as cards ----------
    if(main){
      [].forEach.call(main.querySelectorAll("table"),function(t){
        var fig=t.closest("figure");
        if(fig){
          // Data tables in figures keep their columns and scroll sideways. Make the scroll area reachable by keyboard.
          var wrap=t.closest(".tablewrap"),cb=fig.querySelector("figcaption b");
          if(wrap){wrap.setAttribute("tabindex","0");wrap.setAttribute("role","region");wrap.setAttribute("aria-label",(cb?cb.textContent.replace(/\.$/,""):"Table")+", scrollable table");}
          return;
        }
        if(t.classList.contains("modlist"))return;
        var heads=[].map.call(t.querySelectorAll("thead th"),function(th){return th.textContent.trim();});
        if(!heads.length)return;
        t.classList.add("stack");
        [].forEach.call(t.querySelectorAll("tbody tr"),function(tr){
          [].forEach.call(tr.children,function(td,i){if(heads[i])td.setAttribute("data-label",heads[i]);});
        });
      });
    }

    // ---------- Sections ----------
    var sections=main?[].slice.call(main.querySelectorAll(":scope > section")):[];
    var isModule=!isHome&&sections.length>=4;
    var isRef=!!(main&&main.hasAttribute("data-reference"));
    if(isRef)document.body.classList.add("is-ref");
    var meta=[];
    sections.forEach(function(s,i){
      var h=s.querySelector("h2");if(!h)return;
      var title=h.textContent.trim();
      if(!s.id)s.id=title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"section-"+(i+1);
      var n=s.querySelector(".num");
      if(/^Scope$/i.test(title))s.classList.add("is-scope");
      if(/^Summary$/i.test(title))s.classList.add("is-summary");
      if(s.querySelector(".glossary"))s.classList.add("is-glossary");
      var isQuiz=!!s.querySelector(".quiz");
      if(isQuiz)s.classList.add("is-quiz");
      meta.push({id:s.id,s:s,title:title,num:n?n.textContent.replace(/\.\s*$/,"").trim():String(i+1),anchors:[],btn:null,note:null,isQuiz:isQuiz});
    });

    // ---------- Cross-references: "Figure 3" and "Section 4" become links ----------
    var targets={Figure:{},Section:{}};
    if(main){
      [].forEach.call(main.querySelectorAll("figure"),function(f){
        var b=f.querySelector("figcaption b"),m=b&&/Figure\s+(\d+)/.exec(b.textContent);
        if(m){if(!f.id)f.id="fig-"+m[1];targets.Figure[m[1]]=f.id;}
      });
      meta.forEach(function(m){targets.Section[m.num]=m.id;});
      var re=/\b(Figure|Section) (\d+)\b/g,found=[];
      var walker=document.createTreeWalker(main,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
        if(!/\b(Figure|Section) \d/.test(n.nodeValue))return NodeFilter.FILTER_REJECT;
        return n.parentNode.closest("a,figure,svg,h2,h3,.num,button,script,.quiz")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;
      }});
      while(walker.nextNode())found.push(walker.currentNode);
      found.forEach(function(node){
        var text=node.nodeValue,frag=document.createDocumentFragment(),last=0,m,any=false;
        re.lastIndex=0;
        while((m=re.exec(text))){
          var id=targets[m[1]][m[2]];
          if(!id)continue;
          any=true;
          frag.appendChild(document.createTextNode(text.slice(last,m.index)));
          var a=el("a","xref");a.href="#"+id;a.textContent=m[0];
          frag.appendChild(a);last=m.index+m[0].length;
        }
        if(!any)return;
        frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag,node);
      });
      // Briefly highlight the target of an in-page link.
      document.addEventListener("click",function(e){
        var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;
        var t=document.getElementById(a.getAttribute("href").slice(1));if(!t)return;
        t.classList.remove("flash");void t.offsetWidth;t.classList.add("flash");
      });
    }

    // ---------- Module facts in the title area ----------
    var pageRead=null,pageVideo=null;
    var title=sheet&&sheet.querySelector(".title");
    if(isModule&&title){
      var w=0;
      [].forEach.call(main.querySelectorAll("p,li,td,th,dt,dd,h2,h3,figcaption"),function(n){w+=words(n);});
      var mins=Math.max(1,Math.round(w/170));
      var figs=main.querySelectorAll("figure").length,vids=main.querySelectorAll(".video").length;
      var vsecs=0;
      [].forEach.call(main.querySelectorAll(".video[data-seconds]"),function(v){
        var sec=+v.getAttribute("data-seconds")||0;vsecs+=sec;
        var lab=v.querySelector(".meta > span");
        if(lab&&!/approx\./.test(lab.textContent))lab.appendChild(el("span","vdur",fmtMin(sec/60)));
      });
      MODULES.forEach(function(x){if(x.href===PAGE)mins=x.read;});
      pageRead=mins;pageVideo=Math.round(vsecs/60);
      var facts=el("ul","facts");
      facts.setAttribute("aria-label","About this module");
      [[ICON.clock,"About "+mins+" min read"],vids?[ICON.play,vids+(vids===1?" video, ":" videos, ")+fmtMin(pageVideo)]:null,[null,meta.length+" sections"],figs?[null,figs+(figs===1?" figure":" figures")]:null].filter(Boolean).forEach(function(f){
        var li=el("li");if(f[0])li.innerHTML=f[0];li.appendChild(document.createTextNode(f[1]));facts.appendChild(li);
      });
      title.appendChild(facts);
    }

    // ---------- Progress tracking (module pages) ----------
    var store=loadProgress();
    var mine=store[PAGE]||{done:[]};
    if(!Array.isArray(mine.done))mine.done=[];
    function persist(){
      mine.total=meta.length;
      if(pageRead!=null){mine.read=pageRead;mine.video=pageVideo;}
      mine.t=Date.now();
      mine.title=(document.querySelector(".title h1")||{}).textContent||"";
      store=loadProgress();store[PAGE]=mine;saveProgress(store);
    }
    // Older versions saved progress as "s1", "s2", ... Map those to the section numbers.
    function legacy(id){
      var m=/^s(\d+)$/.exec(id||"");if(!m)return id;
      for(var i=0;i<meta.length;i++)if(meta[i].num===m[1])return meta[i].id;
      return null;
    }
    if(meta.length&&(mine.done.some(function(d){return /^s\d+$/.test(d);})||/^s\d+$/.test(mine.last||""))){
      mine.done=mine.done.map(legacy).filter(function(d,i,a){return d&&a.indexOf(d)===i;});
      if(mine.last)mine.last=legacy(mine.last)||undefined;
      persist();
    }
    function isDone(id){return mine.done.indexOf(id)>=0;}

    var tocProg=[],dockBtn=null,dockNum=null,dockTitle=null,dockRing=null;

    function refresh(){
      var n=0;
      meta.forEach(function(m){
        var d=isDone(m.id);if(d)n++;
        m.s.classList.toggle("is-done",d);
        m.anchors.forEach(function(a){a.classList.toggle("done",d);});
        if(m.btn){
          m.btn.setAttribute("aria-pressed",d?"true":"false");
          m.btn.innerHTML=ICON.check+"<span>"+(d?"Done":"Mark as done")+"</span>";
        }
        if(m.note){
          m.note.classList.toggle("passed",d);
          m.note.innerHTML=d?ICON.check+"<span>Knowledge check passed</span>":"<span>Get 70% or more to complete this section.</span>";
        }
      });
      var pct=meta.length?Math.round(n/meta.length*100):0;
      tocProg.forEach(function(p){
        p.label.textContent=n+" of "+meta.length+" sections done";
        p.fill.style.width=pct+"%";
        p.wrap.classList.toggle("complete",n===meta.length);
      });
      if(dockRing)dockRing.style.strokeDashoffset=String(56.5*(1-n/Math.max(1,meta.length)));
      if(prog)prog.style.transform="scaleX("+(meta.length?n/meta.length:0)+")";
      return n;
    }

    function buildList(){
      var ol=el("ol");
      meta.forEach(function(m){
        var a=el("a");a.href="#"+m.id;
        var num=el("span","n");num.textContent=m.num;
        var t=el("span","t");t.textContent=m.title;
        var ck=el("span","ck",ICON.check);
        a.appendChild(num);a.appendChild(t);a.appendChild(ck);
        m.anchors.push(a);
        var li=el("li");li.appendChild(a);ol.appendChild(li);
      });
      return ol;
    }
    function buildProgress(){
      var wrap=el("div","tocprog"),label=el("div","tocprog-l"),track=el("div","tocprog-t"),fill=el("div","tocprog-f");
      track.appendChild(fill);wrap.appendChild(label);wrap.appendChild(track);
      tocProg.push({wrap:wrap,label:label,fill:fill});
      return wrap;
    }

    if(isModule){
      // "Mark as done" and "Next" at the end of each section
      meta.forEach(function(m,i){
        var row=el("div","sec-end");
        if(m.isQuiz){
          m.note=el("div","sec-note");row.appendChild(m.note);
        }else if(!isRef){
          var btn=el("button","donebtn");btn.type="button";
          btn.addEventListener("click",function(){
            var was=refresh();
            if(isDone(m.id))mine.done.splice(mine.done.indexOf(m.id),1);else mine.done.push(m.id);
            persist();
            var now=refresh();
            if(now===meta.length&&was<meta.length)celebrate();
          });
          m.btn=btn;row.appendChild(btn);
        }
        var nx=meta[i+1];
        if(nx){
          var a=el("a","nextsec");a.href="#"+nx.id;
          a.innerHTML="<small>Next</small><span></span>"+ICON.down;
          a.querySelector("span").textContent=nx.num+". "+nx.title;
          row.appendChild(a);
        }
        var body=m.s.querySelector(":scope > div:last-child")||m.s;
        body.appendChild(row);
      });

      // Desktop contents panel
      var toc=el("nav","toc");
      toc.setAttribute("aria-label","On this page");
      toc.appendChild(el("h2",null,"On this page"));
      toc.appendChild(buildProgress());
      toc.appendChild(buildList());
      layout.appendChild(toc);
      layout.classList.add("has-toc");

      // Mobile and tablet: bottom dock that opens the contents drawer
      var drawer=el("dialog","drawer");
      drawer.setAttribute("aria-label","On this page");
      var dh=el("div","drawer-h");
      dh.appendChild(el("h2",null,"On this page"));
      var dx=el("button","iconbtn",ICON.close);dx.type="button";dx.setAttribute("aria-label","Close");
      dx.addEventListener("click",function(){drawer.close();});
      dh.appendChild(dx);
      drawer.appendChild(dh);
      drawer.appendChild(buildProgress());
      var dl=buildList();drawer.appendChild(dl);
      dl.addEventListener("click",function(e){if(e.target.closest("a"))drawer.close();});
      drawer.addEventListener("click",function(e){if(e.target===drawer)drawer.close();});
      document.body.appendChild(drawer);

      dockBtn=el("button","dock");dockBtn.type="button";
      dockBtn.innerHTML='<svg class="ring" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle class="ring-f" cx="12" cy="12" r="9"/></svg><span class="dock-n"></span><span class="dock-t"></span>'+ICON.chevron;
      dockNum=dockBtn.querySelector(".dock-n");dockTitle=dockBtn.querySelector(".dock-t");dockRing=dockBtn.querySelector(".ring-f");
      dockBtn.addEventListener("click",function(){if(drawer.showModal)drawer.showModal();});
      document.body.appendChild(dockBtn);
      document.body.classList.add("has-dock");

      refresh();
    }

    // ---------- Knowledge check ----------
    function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
    function metaFor(id){for(var i=0;i<meta.length;i++)if(meta[i].id===id)return meta[i];return null;}
    [].forEach.call(document.querySelectorAll(".quiz"),function(box,bi){
      var src=box.querySelector('script[type="application/json"]'),data=null;
      try{data=JSON.parse(src.textContent);}catch(e){}
      var qs=(data&&data.questions)||[];
      var reviewN=parseInt(box.getAttribute("data-review"),10)||0;
      // The final review takes a new mix of questions each time: the same number from each module, then shuffled.
      function draw(){
        var tk=myTrack(),pool=(window.REVIEW_POOL||[]).filter(function(q){return !tk||tk.modules.indexOf(q.page)>=0;}),by={};
        pool.forEach(function(q){(by[q.m]=by[q.m]||[]).push(q);});
        var keys=Object.keys(by),per=Math.ceil(reviewN/Math.max(1,keys.length)),pick=[];
        keys.forEach(function(k){pick=pick.concat(shuffle(by[k].slice()).slice(0,per));});
        return shuffle(pick).slice(0,reviewN);
      }
      if(reviewN)qs=draw();
      if(!qs.length)return;
      var pass=parseInt(box.getAttribute("data-pass"),10)||70;
      var sec=box.closest("section"),qm=null;
      meta.forEach(function(m){if(m.s===sec)qm=m;});
      var LET="ABCDEF";
      var ui=el("div","quiz-ui");box.appendChild(ui);

      function render(){
        if(reviewN)qs=draw();
        ui.innerHTML="";
        var answered=0,correct=0;
        var head=el("div","quiz-head");
        var count=el("div","quiz-count");head.appendChild(count);
        var q0=mine.quiz;
        if(q0&&q0.best!=null){head.appendChild(el("div","quiz-best","Your best score: "+q0.best+" of "+q0.total));}
        var bar=el("div","quiz-bar"),barF=el("div","quiz-bar-f");bar.appendChild(barF);head.appendChild(bar);
        ui.appendChild(head);
        function upd(){
          count.textContent=answered+" of "+qs.length+" answered \u00b7 "+correct+" correct";
          barF.style.width=Math.round(answered/qs.length*100)+"%";
        }
        upd();

        var list=el("ol","quiz-list");ui.appendChild(list);
        var result=el("div","quiz-result");result.setAttribute("aria-live","polite");ui.appendChild(result);

        qs.forEach(function(q,qi){
          var li=el("li","qcard");
          var qid="quiz"+bi+"-q"+qi;
          li.id=qid+"-card";li.setAttribute("data-qi",qi);
          var qt=el("p","qtext");qt.id=qid;
          var qn=el("span","qnum","Question "+(qi+1));
          if(q.page)qn.appendChild(el("span","qmod","Module "+q.m));
          if(q.scenario)qn.appendChild(el("span","qscen","Scenario: the mango checker"));
          qt.appendChild(qn);
          qt.appendChild(document.createTextNode(q.q));
          li.appendChild(qt);
          var opts=el("div","qopts");opts.setAttribute("role","group");opts.setAttribute("aria-labelledby",qid);
          var order=q.options.map(function(_,i){return i;});
          if(q.options.length>2)shuffle(order);
          var btns=[];
          order.forEach(function(oi,k){
            var b=el("button","qopt");b.type="button";
            b.innerHTML='<span class="qlet" aria-hidden="true">'+LET[k]+'</span><span class="qtx"></span><span class="qmark" aria-hidden="true"></span>';
            b.querySelector(".qtx").textContent=q.options[oi];
            b.addEventListener("click",function(){choose(oi,b);});
            btns.push({b:b,oi:oi});opts.appendChild(b);
          });
          li.appendChild(opts);
          var fb=el("div","qfb");fb.setAttribute("aria-live","polite");li.appendChild(fb);
          list.appendChild(li);

          function choose(oi,b){
            if(li.classList.contains("answered"))return;
            li.classList.add("answered");answered++;
            var ok=oi===q.answer;if(ok)correct++;
            li.classList.add(ok?"ok":"bad");
            btns.forEach(function(x){
              x.b.setAttribute("aria-disabled","true");
              if(x.oi===q.answer){x.b.classList.add("is-correct");x.b.querySelector(".qmark").innerHTML=ICON.check;}
              else if(x.b===b){x.b.classList.add("is-wrong");x.b.querySelector(".qmark").innerHTML=ICON.close;}
            });
            b.setAttribute("aria-pressed","true");
            var t=el("p","qfb-t");
            var lead=el("b",null,ok?"Correct. ":"Not correct. ");t.appendChild(lead);
            if(!ok)t.appendChild(document.createTextNode("The correct answer is: "+q.options[q.answer]+" "));
            t.appendChild(document.createTextNode(q.explain||""));
            fb.appendChild(t);
            var rm=q.ref&&metaFor(q.ref);
            if(q.page&&q.ref){
              var xa=el("a","qref");xa.href=q.page+"#"+q.ref;
              xa.textContent=(ok?"Read more":"Read again")+": Module "+q.m+", Section "+(q.rn||"")+(q.rt?", "+q.rt:"");
              fb.appendChild(xa);
            }else if(rm){
              var a=el("a","qref");a.href="#"+rm.id;
              a.textContent=(ok?"Read more":"Read again")+": Section "+rm.num+", "+rm.title;
              fb.appendChild(a);
            }
            upd();
            if(answered===qs.length)finish();
          }
        });

        function finish(){
          var pct=Math.round(correct/qs.length*100),passed=pct>=pass;
          var prev=mine.quiz&&mine.quiz.best!=null?mine.quiz.best:-1;
          mine.quiz={best:Math.max(prev,correct),last:correct,total:qs.length};
          var was=refresh(),firstPass=passed&&qm&&!isDone(qm.id);
          if(passed&&qm&&!isDone(qm.id))mine.done.push(qm.id);
          persist();
          var now=refresh();
          result.className="quiz-result on "+(passed?"passed":"failed");
          result.innerHTML="";
          var sc=el("div","qr-score");
          sc.appendChild(el("b",null,correct+" / "+qs.length));
          sc.appendChild(el("span",null,pct+"%"));
          result.appendChild(sc);
          var msg=el("div","qr-msg");
          var passedBefore=!passed&&qm&&isDone(qm.id);
          msg.appendChild(el("b",null,passed?(pct===100?"Excellent. All answers are correct.":reviewN?"Good. You passed the final review.":"Good. You passed the knowledge check."):(passedBefore?"Not this time. Your earlier pass still counts.":"Not yet. You need "+pass+"% to pass.")));
          var allMods=trackMods(myTrack()).every(function(M){var p=loadProgress()[M.href]||{};return (p.done||[]).indexOf("knowledge-check")>=0;});
          msg.appendChild(el("p",null,passed?(reviewN?(allMods?"Your certificate is ready.":"Your certificate is ready when you pass the knowledge check of all modules."):"This section is now marked as done."):(reviewN?"Read the sections in the explanations again. Each new try has a new mix of questions.":"Read the sections in the explanations again. Then try again.")));
          var missed=[].slice.call(list.querySelectorAll(".qcard.bad"));
          if(missed.length){
            var rv=el("div","qr-review");
            rv.appendChild(el("b",null,"Review "+(missed.length===1?"this question":"these "+missed.length+" questions")));
            var rul=el("ul");
            missed.forEach(function(card){
              var qi2=+card.getAttribute("data-qi"),q2=qs[qi2];
              var rli=el("li");
              var ra=el("a",null);ra.href="#"+card.id;ra.textContent="Question "+(qi2+1)+": "+q2.q;rli.appendChild(ra);
              var rm2=q2.ref&&metaFor(q2.ref);
              if(q2.page&&q2.ref){rli.appendChild(document.createTextNode(" "));var rx=el("a","qr-sec");rx.href=q2.page+"#"+q2.ref;rx.textContent="Module "+q2.m+", Section "+(q2.rn||"");rli.appendChild(rx);}
              else if(rm2){rli.appendChild(document.createTextNode(" "));var rs=el("a","qr-sec");rs.href="#"+rm2.id;rs.textContent="Read section "+rm2.num;rli.appendChild(rs);}
              rul.appendChild(rli);
            });
            rv.appendChild(rul);
          }
          var again=el("button","btn-secondary","Try again");again.type="button";
          again.addEventListener("click",function(){render();box.scrollIntoView({behavior:"smooth",block:"start"});});
          msg.appendChild(again);
          result.appendChild(msg);
          if(missed.length)result.appendChild(rv);
          if(now===meta.length&&was<meta.length)celebrate();
          else if(firstPass&&reviewN){
            var ca2=el("a","btn");ca2.href="certificate.html";ca2.textContent="Get your certificate";
            toast("<b>Final review passed</b>You answered "+correct+" of "+qs.length+" questions correctly.",[ca2],9000);
          }
          else if(firstPass){
            var myM=null;MODULES.forEach(function(x){if(x.href===PAGE)myM=x;});
            if(!myM){toast("<b>Topic complete</b>You passed the knowledge check of this topic.",[],7000);return;}
            var ba=el("a","btn");ba.href="index.html";ba.textContent="See your badges";
            toast("<b>Badge earned</b>You passed the knowledge check of Module "+(myM?myM.num:"")+".",[ba],8000);
          }
        }
      }
      render();
    });

    function celebrate(){
      var next=document.querySelector(".pager .next");
      var acts=[];
      if(next&&next.getAttribute("href")!=="index.html"){
        var a=el("a","btn");a.href=next.getAttribute("href");
        a.textContent=((next.querySelector("small")||{}).textContent||"Next")+": "+(next.querySelector("b")||next).textContent.trim();
        acts.push(a);
      }
      toast("<b>Module complete</b>You marked all "+meta.length+" sections as done.",acts,9000);
    }

    // ---------- Resume where you left off ----------
    if(isModule&&!location.hash&&mine.last&&meta.length&&mine.last!==meta[0].id){
      var lm=null;meta.forEach(function(m){if(m.id===mine.last)lm=m;});
      if(lm&&title){
        var rb=el("div","resume");
        rb.setAttribute("role","region");rb.setAttribute("aria-label","Continue where you stopped");
        var rmsg=el("div","resume-msg");
        rmsg.appendChild(el("b",null,"Welcome back"));
        rmsg.appendChild(document.createTextNode("You stopped at section "+lm.num+": "+lm.title+"."));
        var go=el("a","btn");go.href="#"+lm.id;go.textContent="Continue";
        var rx=el("button","resume-x",ICON.close);rx.type="button";rx.setAttribute("aria-label","Dismiss");
        var closeRb=function(){if(rb.parentNode)rb.parentNode.removeChild(rb);};
        go.addEventListener("click",closeRb);rx.addEventListener("click",closeRb);
        rb.appendChild(rmsg);rb.appendChild(go);rb.appendChild(rx);
        title.insertAdjacentElement("afterend",rb);
      }
    }

    // ---------- Home page: progress for each module ----------
    if(isHome){
      var linkTo=function(href,last){return last&&!/^s\d+$/.test(last)?href+"#"+last:href;};
      var TK=myTrack(),TM=trackMods(TK);
      var tot=0,dn=0,qp=0,recent=null,nextM=null;
      TM.forEach(function(M){
        var p=store[M.href]||{},t=p.total||M.sections,d=Math.min((p.done||[]).length,t);
        tot+=t;dn+=d;
        if((p.done||[]).indexOf("knowledge-check")>=0)qp++;
        if(d<t&&!nextM)nextM=M;
        if(p.last&&d<t&&(!recent||(p.t||0)>(recent.p.t||0)))recent={M:M,p:p};
      });
      if(prog)prog.style.transform="scaleX("+(tot?dn/tot:0)+")";
      var pct=tot?Math.round(dn/tot*100):0;
      var dash=el("div","dash");dash.setAttribute("role","region");dash.setAttribute("aria-label","Your progress");
      // Track card
      var tc=el("div","dash-card dash-track"),tct=el("div");
      if(TK){
        tct.appendChild(el("small",null,"Your track"));
        tct.appendChild(el("b",null,TK.name));
        tct.appendChild(el("p",null,TK.weeks+" weeks \u00b7 "+qp+" of "+TM.length+" modules passed"+(TK.projects.length?" \u00b7 "+projectsDone(TK,store).length+" of "+TK.projects.length+" required projects done":"")+(TK.capstone?" \u00b7 capstone "+(capResult(capGrade()).passed?"passed":"not passed yet"):"")));
        tc.appendChild(tct);
        var tl=el("div","dash-track-a");
        var ta=el("a","btn","See your weekly plan");ta.href="course.html#"+TK.id+"-weekly-plan";tl.appendChild(ta);
        var tb=el("a","linkbtn","Change track");tb.href="course.html#choose-your-track";tl.appendChild(tb);
        tc.appendChild(tl);
      }else{
        tct.appendChild(el("small",null,"Start here"));
        tct.appendChild(el("b",null,"Choose your track"));
        tct.appendChild(el("p",null,"AI Foundations: 6 weeks, no programming. AI Engineer: 12 weeks, with code, projects, and MLOps."));
        tc.appendChild(tct);
        var tk2=el("a","btn","See the two tracks");tk2.href="course.html#choose-your-track";tc.appendChild(tk2);
      }
      dash.appendChild(tc);
      var dp=el("div","dash-card dash-prog");
      var rw=el("div","dring-w");
      rw.innerHTML='<svg class="dring" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27"/><circle class="dring-f" cx="32" cy="32" r="27"/></svg>';
      var C=2*Math.PI*27,rf=rw.querySelector(".dring-f");
      rf.style.strokeDasharray=String(C);rf.style.strokeDashoffset=String(C*(1-pct/100));
      rw.appendChild(el("span","dring-t",pct+"%"));
      dp.appendChild(rw);
      var dpt=el("div","dash-txt");
      dpt.appendChild(el("b",null,"Your progress"));
      dpt.appendChild(el("p",null,dn+" of "+tot+" sections done"));
      dpt.appendChild(el("p",null,qp+" of "+TM.length+" knowledge checks passed"));
      var tools=el("div","dash-tools");
      var mkBtn=function(label,fn){var b=el("button","linkbtn",label);b.type="button";b.addEventListener("click",fn);return b;};
      var fileIn=el("input");fileIn.type="file";fileIn.accept="application/json,.json";fileIn.hidden=true;
      tools.appendChild(mkBtn("Export progress",function(){
        var cards=null,cap=null,capg=null;try{cards=JSON.parse(get("ai-manual-cards"));cap=JSON.parse(get("ai-manual-capstone"));capg=JSON.parse(get(CAPG_KEY));}catch(e){}
        var data={app:"ai-learning-manual",version:2,exported:new Date().toISOString(),progress:loadProgress(),cards:cards||{},capstone:cap||null,capstoneGrade:capg||null,
          settings:{theme:get(THEME_KEY)||"",text:get(TEXT_KEY)||"",path:get(PATH_KEY)||"",name:get(NAME_KEY)||"",track:get(TRACK_KEY)||""}};
        var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
        var u=URL.createObjectURL(blob),dl=el("a");dl.href=u;dl.download="ai-manual-progress.json";
        document.body.appendChild(dl);dl.click();document.body.removeChild(dl);
        setTimeout(function(){URL.revokeObjectURL(u);},2000);
      }));
      tools.appendChild(mkBtn("Import progress",function(){fileIn.click();}));
      tools.appendChild(mkBtn("Reset progress",function(){
        if(window.confirm("Delete all your progress, quiz scores, flashcards, and your project plan? You cannot undo this.")){
          try{[PROG_KEY,"ai-manual-cards","ai-manual-capstone",CAPG_KEY,NAME_KEY].forEach(function(k){localStorage.removeItem(k);});}catch(e){}
          location.reload();
        }
      }));
      fileIn.addEventListener("change",function(){
        var f=fileIn.files&&fileIn.files[0];if(!f)return;
        var r=new FileReader();
        r.onload=function(){
          var d=null;try{d=JSON.parse(r.result);}catch(e){}
          if(!d||d.app!=="ai-learning-manual"||!d.progress||typeof d.progress!=="object"){window.alert("This file is not a progress file from the AI learning manual.");return;}
          if(!window.confirm("Replace your current progress with the progress in this file?"))return;
          saveProgress(d.progress);
          if(d.cards&&typeof d.cards==="object")set("ai-manual-cards",JSON.stringify(d.cards));
          if(d.capstone&&typeof d.capstone==="object")set("ai-manual-capstone",JSON.stringify(d.capstone));
          if(d.capstoneGrade&&typeof d.capstoneGrade==="object")set(CAPG_KEY,JSON.stringify(d.capstoneGrade));
          if(d.settings){set(THEME_KEY,d.settings.theme||"");set(TEXT_KEY,d.settings.text||"");if(d.settings.path)set(PATH_KEY,d.settings.path);if(d.settings.name)set(NAME_KEY,d.settings.name);if(d.settings.track)set(TRACK_KEY,d.settings.track);}
          location.reload();
        };
        r.readAsText(f);fileIn.value="";
      });
      tools.appendChild(fileIn);
      dp.appendChild(dpt);
      dp.appendChild(tools);
      var dx2=el("div","dash-card dash-next"),go2=el("a","btn");
      if(recent){
        dx2.appendChild(el("small",null,"Continue where you stopped"));
        dx2.appendChild(el("b",null,"Module "+recent.M.num+": "+recent.M.title));
        if(recent.p.lastTitle)dx2.appendChild(el("span",null,"Section "+recent.p.lastNum+": "+recent.p.lastTitle));
        go2.href=linkTo(recent.M.href,recent.p.last);go2.textContent="Continue";
      }else if(nextM){
        var np=store[nextM.href]||{};
        dx2.appendChild(el("small",null,dn?"Next module":"Start here"));
        dx2.appendChild(el("b",null,"Module "+nextM.num+": "+nextM.title));
        dx2.appendChild(el("span",null,"About "+(np.read||nextM.read)+" min read and "+fmtMin(np.video||nextM.video)+" of video"));
        go2.href=nextM.href;go2.textContent=dn?"Open module":"Start module "+nextM.num;
      }else{
        dx2.appendChild(el("small",null,"Course complete"));
        dx2.appendChild(el("b",null,"You finished all "+TM.length+" modules"+(TK?" of the "+TK.name+" track.":".")));
        dx2.appendChild(el("span",null,"Go back to any module to review it."));
        go2=null;
      }
      if(go2)dx2.appendChild(go2);
      dash.appendChild(dp);dash.appendChild(dx2);

      // Learning path: the full course or the quick path
      var fullMin=0,quickMin=0,vidMin=0;
      TM.forEach(function(M){var p=store[M.href]||{};fullMin+=p.read||M.read;quickMin+=M.quickRead||0;vidMin+=p.video||M.video;});
      var pc=el("div","dash-card dash-path");
      var pfs=el("fieldset","dgroup");pfs.appendChild(el("legend",null,"Learning path"));
      var pseg=el("div","dseg");
      [["full","Full course","About "+fmtMin(fullMin)+" of reading and "+fmtMin(vidMin)+" of video"],
       ["quick","Quick path","About "+fmtMin(quickMin)+" of reading: the most important sections only"]].forEach(function(o){
        var id="path-"+o[0],lab=el("label","dopt dopt-2");lab.setAttribute("for",id);
        var inp=el("input");inp.type="radio";inp.name="path";inp.id=id;inp.checked=(get(PATH_KEY)==="quick")===(o[0]==="quick");
        inp.addEventListener("change",function(){if(inp.checked){set(PATH_KEY,o[0]);pnote.textContent=o[0]==="quick"?"The quick path is on. In each module, the other sections are closed. You can open them at any time.":"The full course is on. All sections are open.";}});
        var sp=el("span");sp.appendChild(el("b",null,o[1]));sp.appendChild(el("small",null,o[2]));
        lab.appendChild(inp);lab.appendChild(sp);pseg.appendChild(lab);
      });
      pfs.appendChild(pseg);pc.appendChild(pfs);
      var pnote=el("p","dash-note",get(PATH_KEY)==="quick"?"The quick path is on. In each module, the other sections are closed. You can open them at any time.":"Select the quick path if you have less time. You can change this at any time.");
      pnote.setAttribute("aria-live","polite");pc.appendChild(pnote);
      dash.appendChild(pc);

      // Badges and the certificate
      var bc=el("div","dash-card dash-badges");
      bc.appendChild(el("b",null,"Badges"));
      var brow=el("ul","badges");brow.setAttribute("aria-label","Module badges");
      TM.forEach(function(M){
        var p=store[M.href]||{},ok=(p.done||[]).indexOf("knowledge-check")>=0;
        var li=el("li","badge"+(ok?" earned":""));
        li.appendChild(el("span","badge-n",String(M.num)));
        li.appendChild(el("span","badge-t",M.title));
        li.appendChild(el("span","sr-only",ok?", earned":", not earned yet"));
        li.title=ok?"Earned: you passed the knowledge check":"Pass the knowledge check of this module to earn the badge";
        brow.appendChild(li);
      });
      var rvP=store["review.html"]||{},rvOk=(rvP.done||[]).indexOf("final-review")>=0;
      var rli=el("li","badge badge-rv"+(rvOk?" earned":""));
      rli.appendChild(el("span","badge-n","\u2605"));rli.appendChild(el("span","badge-t","Final review"));
      rli.appendChild(el("span","sr-only",rvOk?", earned":", not earned yet"));
      rli.title=rvOk?"Earned: you passed the final review":"Pass the final review to earn this badge";
      brow.appendChild(rli);
      bc.appendChild(brow);
      var cp=el("p","badges-cert");
      var pjNeed=TK?TK.projects:[],pjHave=projectsDone(TK,store),capOk=!(TK&&TK.capstone)||capResult(capGrade()).passed,pjOk=pjHave.length===pjNeed.length&&capOk;
      if(qp===TM.length&&rvOk&&pjOk){var ca=el("a","btn","Get your certificate");ca.href="certificate.html";cp.appendChild(ca);}
      else if(qp===TM.length&&rvOk&&!capOk&&pjHave.length===pjNeed.length){var cpa=el("a","btn","Open the capstone");cpa.href="capstone.html";cp.appendChild(document.createTextNode("One step left: pass the capstone. "));cp.appendChild(cpa);}
      else if(qp===TM.length&&rvOk){var pa=el("a","btn","Open the projects");pa.href="projects.html";cp.appendChild(document.createTextNode("Mark the required projects as done ("+pjHave.length+" of "+pjNeed.length+"): "));cp.appendChild(pa);}
      else if(qp===TM.length){var ra=el("a","btn","Take the final review");ra.href="review.html";cp.appendChild(document.createTextNode("All knowledge checks passed. One step to your certificate: "));cp.appendChild(ra);}
      else cp.textContent="Pass the knowledge check of all "+TM.length+" modules"+(TK?" of your track":"")+", the final review"+(pjNeed.length?", and "+pjNeed.length+" projects":"")+" to get your certificate.";
      bc.appendChild(cp);
      dash.appendChild(bc);

      // Projects
      var pj=store["projects.html"]||{},pjDone=(pj.done||[]).filter(function(id){return /^project-/.test(id);}).length;
      var pc2=el("div","dash-card dash-proj");
      var pjt=el("div");
      pjt.appendChild(el("b",null,"Projects"));
      pjt.appendChild(el("p",null,"Nine hands-on projects, from an image classifier to an MLOps pipeline. "+(pjDone?pjDone+" of 9 done.":"Start with a beginner project.")));
      pc2.appendChild(pjt);
      var pja=el("a","btn",pjDone?"Continue the projects":"Open the projects");pja.href="projects.html";pc2.appendChild(pja);
      dash.appendChild(pc2);

      // More: short topics, cheat sheets, careers
      var mc=el("div","dash-card dash-more");
      mc.appendChild(el("b",null,"More to learn"));
      var mul=el("ul","dash-links");
      [["topic-computer-vision.html","Short topics","Computer vision, language tasks, recommendations, and forecasting"],
       ["cheat-sheets.html","Cheat sheets","One printable page for each module, and a formula sheet"],
       ["careers.html","Careers and next steps","Jobs in AI, skills, what to learn next, and your portfolio"]].forEach(function(x){
        var li=el("li"),a=el("a");a.href=x[0];a.appendChild(el("b",null,x[1]));a.appendChild(el("small",null,x[2]));li.appendChild(a);mul.appendChild(li);
      });
      mc.appendChild(mul);
      dash.appendChild(mc);
      if(title)title.insertAdjacentElement("afterend",dash);

      [].forEach.call(document.querySelectorAll(".modlist a[href]"),function(a){
        var href=a.getAttribute("href"),p=store[href];
        var M=null;MODULES.forEach(function(x){if(x.href===href)M=x;});
        if(M){
          var mm=el("div","modmeta");
          mm.textContent=((p&&p.total)||M.sections)+" sections \u00b7 About "+((p&&p.read)||M.read)+" min read \u00b7 "+fmtMin((p&&p.video)||M.video)+" of video";
          a.parentNode.appendChild(mm);
        }
        var box=el("div","modprog");
        var done=p&&p.done?p.done.length:0,total=p&&p.total||0;
        var track=el("div","tocprog-t"),fill=el("div","tocprog-f");
        fill.style.width=(total?Math.round(done/total*100):0)+"%";
        track.appendChild(fill);
        var line=el("div","modprog-l");
        if(!p||(!done&&!p.last)){line.textContent="Not started";box.classList.add("none");}
        else if(total&&done>=total){line.textContent="Completed: all "+total+" sections done";box.classList.add("complete");}
        else{
          line.textContent=done?done+" of "+(total||"?")+" sections done":"Started";
          if(!done)box.classList.add("none");
          if(p.last){var c=el("a",null,"Continue");c.href=linkTo(href,p.last);line.appendChild(document.createTextNode(" · "));line.appendChild(c);}
        }
        box.appendChild(track);box.appendChild(line);
        if(p&&p.quiz&&p.quiz.best!=null){
          var qz=el("div","modprog-q");
          qz.textContent="Knowledge check: best score "+p.quiz.best+" of "+p.quiz.total;
          box.appendChild(qz);
        }
        a.parentNode.appendChild(box);
      });
    }

    // ---------- Enlarge figures ----------
    var figList=main?[].slice.call(main.querySelectorAll("figure")):[];
    if(figList.length){
      var lb=el("dialog","lightbox");
      var lbh=el("div","lb-h"),lbtxt=el("div","lb-txt"),lbcap=el("div","lb-cap");
      var lbhint=el("div","lb-hint","Turn your phone sideways to read the figure.");
      lbtxt.appendChild(lbcap);lbtxt.appendChild(lbhint);
      var lbx=el("button","iconbtn",ICON.close);lbx.type="button";lbx.setAttribute("aria-label","Close");
      lbx.addEventListener("click",function(){lb.close();});
      lbh.appendChild(lbtxt);lbh.appendChild(lbx);
      var lbody=el("div","lb-body");
      lb.appendChild(lbh);lb.appendChild(lbody);
      lb.addEventListener("click",function(e){if(e.target===lb)lb.close();});
      lb.addEventListener("close",function(){lbody.innerHTML="";});
      document.body.appendChild(lb);
      var mqPhone=window.matchMedia?window.matchMedia("(max-width:640px)"):null;
      var mqPortrait=window.matchMedia?window.matchMedia("(max-width:640px) and (orientation:portrait)"):null;
      // In portrait on a phone, turn the figure 90 degrees so that its text is shown at full size.
      var fitFigure=function(){
        var a=lbody.firstChild;if(!a)return;
        var svg=a.querySelector("svg");
        a.classList.remove("rot");a.style.width="";
        lb.classList.toggle("is-rotated",false);
        if(!(mqPortrait&&mqPortrait.matches)||!svg)return;
        var vb=svg.viewBox&&svg.viewBox.baseVal;if(!vb||!vb.width)return;
        var H=lbody.clientHeight-24,W=lbody.clientWidth-24,ratio=vb.height/vb.width;
        a.style.width=Math.max(200,Math.min(H,W/ratio))+"px";
        a.classList.add("rot");lb.classList.add("is-rotated");
      };
      window.addEventListener("resize",function(){if(lb.open)fitFigure();});
      figList.forEach(function(f){
        var art=f.querySelector(".art");if(!art)return;
        var b=el("button","figzoom",ICON.expand+'<span class="figzoom-t">Enlarge figure</span>');b.type="button";
        b.setAttribute("aria-label","Enlarge figure");b.title="Enlarge figure";
        var hasTable=!!art.querySelector("table");
        if(!hasTable)art.addEventListener("click",function(e){if(mqPhone&&mqPhone.matches&&!e.target.closest("a"))b.click();});
        b.addEventListener("click",function(){
          var c=art.cloneNode(true);
          [].forEach.call(c.querySelectorAll("[id]"),function(n){n.removeAttribute("id");});
          c.removeAttribute("aria-labelledby");
          [].forEach.call(c.querySelectorAll("[aria-labelledby]"),function(n){n.removeAttribute("aria-labelledby");});
          lbody.innerHTML="";lbody.appendChild(c);
          var cap=f.querySelector("figcaption");lbcap.innerHTML=cap?cap.innerHTML:"";
          if(lb.showModal)lb.showModal();
          lbx.focus();
          fitFigure();
        });
        art.insertAdjacentElement("afterend",b);
      });
    }

    // ---------- Flashcards (glossary page) and a link to them from each module ----------
    if(document.getElementById("flashcards")){
      var fcs=document.createElement("script");fcs.src="assets/flashcards.js"+av("flashcards.js");document.head.appendChild(fcs);
    }
    var tnSec=isModule&&document.getElementById("technical-names");
    if(tnSec){
      var myNum=null;MODULES.forEach(function(x){if(x.href===PAGE)myNum=x.num;});
      var gl=tnSec.querySelector(".glossary");
      if(gl&&myNum){
        var fl=el("p","fc-link");
        var fa=el("a",null,"Practice these names with flashcards");fa.href="glossary.html?deck="+myNum+"#flashcards";
        fl.appendChild(fa);gl.insertAdjacentElement("afterend",fl);
      }
    }

    // ---------- Playgrounds: load their code only on pages that have them ----------
    if(document.querySelector(".playground[data-pg]")){
      var pgs=document.createElement("script");pgs.src="assets/playgrounds.js"+av("playgrounds.js");document.head.appendChild(pgs);
    }

    // ---------- Videos: load the YouTube player only when the learner selects play ----------
    [].forEach.call(document.querySelectorAll("a.yt[data-yt]"),function(a){
      a.addEventListener("click",function(e){
        if(e.ctrlKey||e.metaKey||e.shiftKey||e.button)return;
        e.preventDefault();
        var f=document.createElement("iframe");
        f.src="https://www.youtube-nocookie.com/embed/"+a.getAttribute("data-yt")+"?autoplay=1&rel=0";
        f.title=a.getAttribute("data-title")||"Video";
        f.setAttribute("allow","accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen");
        f.setAttribute("allowfullscreen","");f.setAttribute("referrerpolicy","strict-origin-when-cross-origin");
        a.parentNode.replaceChild(f,a);f.focus();
      });
    });

    // ---------- Glossary page: filter the list ----------
    var gq=document.getElementById("gl-q");
    if(gq){
      var gitems=[].slice.call(document.querySelectorAll(".gl-item"));
      var gletters=[].slice.call(document.querySelectorAll(".gl-letter"));
      var gcount=document.querySelector(".gl-count"),gempty=document.querySelector(".gl-empty"),gaz=document.querySelector(".gl-az");
      var gapply=function(){
        var q=gq.value.trim().toLowerCase(),n=0;
        gitems.forEach(function(it){var m=!q||it.textContent.toLowerCase().indexOf(q)>=0;it.hidden=!m;if(m)n++;});
        gletters.forEach(function(h){
          var list=h.nextElementSibling,any=list&&list.querySelector(".gl-item:not([hidden])");
          h.hidden=!any;if(list)list.hidden=!any;
        });
        gcount.textContent=q?n+" of "+gitems.length+" technical names":gitems.length+" technical names";
        if(gempty)gempty.hidden=n>0;
        if(gaz)gaz.hidden=!!q;
      };
      gq.addEventListener("input",gapply);
      if(location.hash.indexOf("#term-")===0){var gt=document.getElementById(location.hash.slice(1));if(gt)gt.classList.add("flash");}
    }

    // ---------- Search all modules and the glossary ----------
    if(barIn){
      var sbtn=el("button","iconbtn",ICON.search);sbtn.type="button";
      sbtn.setAttribute("aria-label","Search the manual");sbtn.title="Search (press /)";
      var dw=barIn.querySelector(".dwrap");dw.parentNode.insertBefore(sbtn,dw);
      var sd=el("dialog","searchdlg");sd.setAttribute("aria-label","Search the manual");
      var sh=el("div","sd-h");
      var slab=el("label","sr-only","Search the manual");slab.setAttribute("for","site-q");
      var sin=el("input");sin.type="search";sin.id="site-q";sin.placeholder="Search all modules and the glossary";sin.setAttribute("autocomplete","off");
      var sx=el("button","iconbtn",ICON.close);sx.type="button";sx.setAttribute("aria-label","Close search");
      sh.appendChild(slab);sh.appendChild(el("span","sd-ic",ICON.search));sh.appendChild(sin);sh.appendChild(sx);
      var sstat=el("p","sd-status");sstat.setAttribute("aria-live","polite");
      var sres=el("ul","sd-results");
      sd.appendChild(sh);sd.appendChild(sstat);sd.appendChild(sres);
      document.body.appendChild(sd);

      var loadingIdx=false;
      var ensureIndex=function(cb){
        if(window.SEARCH_INDEX)return cb();
        if(loadingIdx)return;
        loadingIdx=true;sstat.textContent="Loading the search…";
        var sc=document.createElement("script");sc.src="assets/search-index.js"+av("search-index.js");
        sc.onload=function(){loadingIdx=false;cb();};
        sc.onerror=function(){loadingIdx=false;sstat.textContent="The search is not available at this time.";};
        document.head.appendChild(sc);
      };
      var esc=function(t){return t.replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
      var reEsc=function(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");};
      var hl=function(text,terms){
        var parts=text.split(new RegExp("("+terms.map(reEsc).join("|")+")","gi"));
        return parts.map(function(part,i){return i%2?"<mark>"+esc(part)+"</mark>":esc(part);}).join("");
      };
      var runSearch=function(){
        var idx=window.SEARCH_INDEX||[],q=sin.value.trim().toLowerCase();
        sres.innerHTML="";
        if(q.length<2){sstat.textContent=q?"Type at least 2 letters.":"Search the text of all modules and the glossary.";return;}
        var terms=q.split(/\s+/).filter(function(t){return t.length>1;});
        if(!terms.length)terms=[q];
        var hits=[];
        idx.forEach(function(it){
          var t=it.t.toLowerCase(),x=it.x.toLowerCase(),score=0;
          for(var i=0;i<terms.length;i++){
            var inT=t.indexOf(terms[i])>=0,inX=x.indexOf(terms[i])>=0;
            if(!inT&&!inX)return;
            if(inT)score+=it.g?14:10;
            score+=Math.min(x.split(terms[i]).length-1,8);
          }
          if(it.g&&t===q)score+=30;
          hits.push({it:it,s:score});
        });
        hits.sort(function(a,b){return b.s-a.s;});
        var shown=hits.slice(0,30);
        sstat.textContent=hits.length?(hits.length>30?"30 of "+hits.length+" results":hits.length+(hits.length===1?" result":" results")):"No results. Try a different word.";
        shown.forEach(function(h){
          var it=h.it,x=it.x,i=x.toLowerCase().indexOf(terms[0]);
          var st=Math.max(0,i-60),snip=(st>0?"…":"")+x.slice(st,st+180)+(st+180<x.length?"…":"");
          var a=el("a");a.href=it.p===PAGE?"#"+it.id:it.p+"#"+it.id;
          var where=it.g?"Glossary":it.w?it.w+" \u00b7 Section "+it.n:"Module "+it.m+" \u00b7 Section "+it.n;
          a.innerHTML='<span class="sd-where">'+esc(where)+'</span><b>'+hl(it.t,terms)+'</b><span class="sd-snip">'+hl(snip,terms)+'</span>';
          a.addEventListener("click",function(){sd.close();});
          var li=el("li");li.appendChild(a);sres.appendChild(li);
        });
      };
      var sTimer=null;
      sin.addEventListener("input",function(){clearTimeout(sTimer);sTimer=setTimeout(function(){ensureIndex(runSearch);},120);});
      sin.addEventListener("keydown",function(e){if(e.key==="Enter"){var first=sres.querySelector("a");if(first){e.preventDefault();first.click();}}});
      var openSearch=function(){
        if(sd.showModal&&!sd.open)sd.showModal();
        sin.focus();sin.select();
        ensureIndex(runSearch);
      };
      sbtn.addEventListener("click",openSearch);
      sx.addEventListener("click",function(){sd.close();});
      sd.addEventListener("click",function(e){if(e.target===sd)sd.close();});
      document.addEventListener("keydown",function(e){
        var tag=(e.target&&e.target.tagName||"").toLowerCase();
        var typing=tag==="input"||tag==="textarea"||(e.target&&e.target.isContentEditable);
        if((e.key==="/"&&!typing)||((e.ctrlKey||e.metaKey)&&(e.key||"").toLowerCase()==="k")){e.preventDefault();openSearch();}
      });
    }

    // ---------- Copy buttons (prompt exercises) ----------
    [].forEach.call(document.querySelectorAll("[data-copy]"),function(b){
      b.addEventListener("click",function(){
        var t=document.getElementById(b.getAttribute("data-copy"));if(!t)return;
        var txt=t.textContent,label=b.textContent;
        var ok=function(){b.textContent="Copied";setTimeout(function(){b.textContent=label;},1600);};
        var fallback=function(){
          var ta=el("textarea");ta.value=txt;ta.setAttribute("readonly","");ta.style.position="fixed";ta.style.opacity="0";
          document.body.appendChild(ta);ta.select();try{document.execCommand("copy");ok();}catch(e){}document.body.removeChild(ta);
        };
        if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(txt).then(ok,fallback);else fallback();
      });
    });

    // ---------- History timeline: show one period ----------
    var tl=document.getElementById("timeline");
    if(tl){
      var leg=tl.querySelector(".tl-legend"),tItems=[].slice.call(tl.querySelectorAll(".tl-item"));
      var tbar=el("div","tl-filter");tbar.setAttribute("role","group");tbar.setAttribute("aria-label","Show one period");
      var tbtns=[];
      [["all","All periods"]].concat([].map.call(leg.querySelectorAll("li"),function(li){return [li.className.replace("tl-",""),li.textContent];})).forEach(function(o){
        var b=el("button","pg-chip tl-chip tl-"+o[0],o[1]);b.type="button";b.setAttribute("aria-pressed",o[0]==="all"?"true":"false");
        b.addEventListener("click",function(){
          tbtns.forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false");});
          tItems.forEach(function(it){it.hidden=o[0]!=="all"&&it.getAttribute("data-era")!==o[0];});
        });
        tbtns.push(b);tbar.appendChild(b);
      });
      leg.parentNode.replaceChild(tbar,leg);
      if("IntersectionObserver" in window&&!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)){
        var tio=new IntersectionObserver(function(es){es.forEach(function(e2){if(e2.isIntersecting){e2.target.classList.add("in");tio.unobserve(e2.target);}});},{rootMargin:"0px 0px -10% 0px"});
        tItems.forEach(function(it){it.classList.add("tl-anim");tio.observe(it);});
      }
    }

    // ---------- Quick path (module pages) ----------
    var thisM=null;MODULES.forEach(function(x){if(x.href===PAGE)thisM=x;});
    if(isModule&&thisM&&get(PATH_KEY)==="quick"&&thisM.quick&&thisM.quick.length){
      var openSec=function(sec){if(sec&&sec.classList.contains("pq-skip"))sec.classList.add("pq-open");};
      meta.forEach(function(m){
        var inPath=thisM.quick.indexOf(m.id)>=0;
        m.anchors.forEach(function(a){a.classList.toggle("pq-out",!inPath);});
        if(inPath)return;
        m.s.classList.add("pq-skip");
        var pn=el("div","pq-note");
        pn.appendChild(el("span",null,"This section is not in the quick path."));
        var pb=el("button","linkbtn","Open this section");pb.type="button";
        pb.addEventListener("click",function(){m.s.classList.toggle("pq-open");pb.textContent=m.s.classList.contains("pq-open")?"Close this section":"Open this section";});
        pn.appendChild(pb);
        m.s.querySelector("h2").insertAdjacentElement("afterend",pn);
      });
      if(title){
        var qb=el("div","resume pq-banner");qb.setAttribute("role","region");qb.setAttribute("aria-label","Quick path");
        var qm2=el("div","resume-msg");qm2.appendChild(el("b",null,"Quick path: about "+fmtMin(thisM.quickRead)+" of reading"));
        qm2.appendChild(document.createTextNode("The sections that are not in the quick path are closed. You can open each one."));
        var qfull=el("button","btn-secondary","Use the full course");qfull.type="button";
        qfull.addEventListener("click",function(){set(PATH_KEY,"full");location.reload();});
        qb.appendChild(qm2);qb.appendChild(qfull);
        title.insertAdjacentElement("afterend",qb);
      }
      var hashOpen=function(){var t=location.hash&&document.getElementById(location.hash.slice(1));if(t)openSec(t.closest("section"));};
      hashOpen();window.addEventListener("hashchange",hashOpen);
      document.addEventListener("click",function(e){
        var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;
        var t=document.getElementById(a.getAttribute("href").slice(1));if(t)openSec(t.closest("section"));
      },true);
    }

    // ---------- Listen: read a section aloud with the voice of the browser ----------
    if(isModule&&"speechSynthesis" in window&&"SpeechSynthesisUtterance" in window){
      var speaking=null;
      var stopSpeak=function(){
        window.speechSynthesis.cancel();
        if(speaking){speaking.innerHTML=ICON.speaker+"<span>Listen</span>";speaking.setAttribute("aria-pressed","false");speaking.classList.remove("is-on");}
        speaking=null;
      };
      var pickVoice=function(){
        var v=window.speechSynthesis.getVoices()||[];
        return v.filter(function(x){return /^en[-_]IN/i.test(x.lang);})[0]||v.filter(function(x){return /^en[-_](GB|US)/i.test(x.lang);})[0]||v.filter(function(x){return /^en/i.test(x.lang);})[0]||null;
      };
      meta.forEach(function(m){
        var row=m.s.querySelector(".sec-end");if(!row||m.isQuiz)return;
        var b=el("button","listenbtn",ICON.speaker+"<span>Listen</span>");b.type="button";b.setAttribute("aria-pressed","false");
        b.title="Read this section aloud";
        b.addEventListener("click",function(){
          if(speaking===b){stopSpeak();return;}
          stopSpeak();
          var texts=[m.title];
          [].forEach.call(m.s.querySelectorAll("h3,p,li,dt,dd,figcaption"),function(n){
            if(n.closest(".quiz,.playground,.sec-end,.pq-note,.video,.tl-filter,.tryit-prompt,svg,details:not([open]) > p"))return;
            if(n.tagName==="LI"&&n.querySelector("p"))return;
            var t=(n.textContent||"").replace(/\s+/g," ").trim();if(t)texts.push(t);
          });
          var voice=pickVoice();
          speaking=b;b.innerHTML=ICON.stop+"<span>Stop</span>";b.setAttribute("aria-pressed","true");b.classList.add("is-on");
          texts.forEach(function(t,i){
            var u=new SpeechSynthesisUtterance(t);
            if(voice){u.voice=voice;u.lang=voice.lang;}else u.lang="en-IN";
            u.rate=0.95;
            if(i===texts.length-1)u.onend=function(){if(speaking===b)stopSpeak();};
            window.speechSynthesis.speak(u);
          });
        });
        var done=row.querySelector(".donebtn,.sec-note");
        if(done)done.insertAdjacentElement("afterend",b);else row.insertBefore(b,row.firstChild);
      });
      window.addEventListener("pagehide",stopSpeak);
    }

    // ---------- Certificate page ----------
    var capp=document.querySelector(".cert-app");
    if(capp){
      document.body.classList.add("is-cert");
      var CT=myTrack()||TRACKS[0],CM=trackMods(CT);
      if(!myTrack()){var cn=el("p","cert-note");cn.innerHTML='You did not choose a track. This page shows the <b>'+CT.name+'</b> track. <a href="course.html#choose-your-track">Choose your track</a>.';capp.appendChild(cn);}
      var passedM=CM.filter(function(M){var p=store[M.href]||{};return (p.done||[]).indexOf("knowledge-check")>=0;});
      var rv=store["review.html"]||{},rvPassed=(rv.done||[]).indexOf("final-review")>=0;
      var cpj=projectsDone(CT,store),capR=capResult(capGrade()),cpjOk=cpj.length===CT.projects.length&&(!CT.capstone||capR.passed);
      if(passedM.length<CM.length||!rvPassed||!cpjOk){
        capp.appendChild(el("p",null,"Track: "+CT.name+". You passed "+passedM.length+" of "+CM.length+" knowledge checks"+(rvPassed?" and the final review":"")+(CT.projects.length?", and you did "+cpj.length+" of "+CT.projects.length+" required projects":"")+". To get your certificate, do these steps:"));
        var cul=el("ul");
        CM.forEach(function(M){if(passedM.indexOf(M)>=0)return;var li=el("li"),a=el("a",null,"Module "+M.num+": "+M.title);a.href=M.href+"#knowledge-check";li.appendChild(a);cul.appendChild(li);});
        if(!rvPassed){var rli2=el("li"),ra2=el("a",null,"The final review: 20 questions from the modules of your track");ra2.href="review.html#final-review";rli2.appendChild(ra2);cul.appendChild(rli2);}
        if(CT.capstone&&!capR.passed){var cli=el("li"),cla=el("a",null,"Pass the capstone (now "+capR.pct+"%, "+capR.done+" of "+capR.items+" checklist items)");cla.href="capstone.html";cli.appendChild(cla);cul.appendChild(cli);}
        CT.projects.forEach(function(id){if(cpj.indexOf(id)>=0)return;var li=el("li"),a=el("a",null,"Mark as done: Project "+(/^project-(\d+)/.exec(id)||[0,"?"])[1]);a.href="projects.html#"+id;li.appendChild(a);cul.appendChild(li);});
        capp.appendChild(cul);
      }else{
        var clab=el("label","pg-label","Your name, as you want it on the certificate");clab.setAttribute("for","cert-name");
        var cin=el("input","pg-text cert-input");cin.id="cert-name";cin.type="text";cin.setAttribute("autocomplete","name");cin.value=get(NAME_KEY)||"";
        var latest=0,scores=[];
        CM.forEach(function(M){var p=store[M.href]||{};latest=Math.max(latest,p.t||0);if(p.quiz&&p.quiz.total)scores.push(p.quiz.best/p.quiz.total);});
        var avg=scores.length?Math.round(scores.reduce(function(a,b){return a+b;},0)/scores.length*100):null;
        var cert=el("div","cert");
        var ci=el("div","cert-in");
        ci.appendChild(el("div","cert-logo","AI"));
        ci.appendChild(el("p","cert-k","Certificate of completion \u00b7 "+CT.name));
        ci.appendChild(el("p","cert-this","This certificate is given to"));
        var cname=el("p","cert-name");ci.appendChild(cname);
        ci.appendChild(el("p","cert-for","for the completion of the "+CT.name+" track of the AI learning manual: "+CM.length+" modules"+(CT.projects.length?", "+CT.projects.length+" projects":"")+(CT.capstone?", and a capstone project":"")+"."));
        var cg=capGrade();if(CT.capstone&&cg.repo){var cr=el("p","cert-cap");cr.textContent="Capstone: "+cg.repo+" \u00b7 self-assessment "+capR.pct+"%";ci.appendChild(cr);}
        var cmods=el("ul","cert-mods");CM.forEach(function(M){cmods.appendChild(el("li",null,M.num+". "+M.title));});ci.appendChild(cmods);
        var cdate=new Date(latest||Date.now());
        var dtxt;try{dtxt=cdate.toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});}catch(e){dtxt=cdate.toDateString();}
        ci.appendChild(el("p","cert-date","Completed on "+dtxt+(avg!=null?" \u00b7 Average best score in the knowledge checks: "+avg+"%":"")+(rv.quiz&&rv.quiz.total?" \u00b7 Final review: "+rv.quiz.best+" of "+rv.quiz.total:"")));
        cert.appendChild(ci);
        var paintName=function(){cname.textContent=cin.value.trim()||"Your name";cname.classList.toggle("is-empty",!cin.value.trim());};
        cin.addEventListener("input",function(){set(NAME_KEY,cin.value.trim());paintName();});
        paintName();
        var cact=el("div","pg-actions");
        var cpr=el("button","pg-btn pg-btn-primary","Print or save as PDF");cpr.type="button";cpr.addEventListener("click",function(){window.print();});
        cact.appendChild(cpr);
        capp.appendChild(el("p",null,"Congratulations. You completed the "+CT.name+" track: all "+CM.length+" knowledge checks, the final review"+(CT.projects.length?", and the required projects":"")+"."));
        capp.appendChild(clab);capp.appendChild(cin);capp.appendChild(cert);capp.appendChild(cact);
      }
    }

    // ---------- Capstone page: checklist and rubric ----------
    var capBox=document.querySelector(".cap-rubric");
    if(capBox){
      var g=capGrade();g.check=g.check||{};g.levels=g.levels||{};
      var saveG=function(){g.result=capResult(g);if(g.result.passed&&!g.passedAt)g.passedAt=Date.now();set(CAPG_KEY,JSON.stringify(g));paintG();};
      var repoIn=document.getElementById("cap-repo"),demoIn=document.getElementById("cap-demo");
      if(repoIn){repoIn.value=g.repo||"";repoIn.addEventListener("input",function(){g.repo=repoIn.value.trim();saveG();});}
      if(demoIn){demoIn.value=g.demo||"";demoIn.addEventListener("input",function(){g.demo=demoIn.value.trim();saveG();});}
      [].forEach.call(document.querySelectorAll("input[data-cap]"),function(c){
        c.checked=!!g.check[c.getAttribute("data-cap")];
        c.addEventListener("change",function(){g.check[c.getAttribute("data-cap")]=c.checked;saveG();});
      });
      [].forEach.call(capBox.querySelectorAll("fieldset[data-crit]"),function(fs){
        var crit=fs.getAttribute("data-crit");
        [].forEach.call(fs.querySelectorAll("input[type=radio]"),function(r){
          r.checked=String(g.levels[crit]||"")===r.value;
          r.addEventListener("change",function(){if(r.checked){g.levels[crit]=+r.value;saveG();}});
        });
      });
      var scoreBox=document.querySelector(".cap-score"),chkStat=document.querySelector(".cap-check-status");
      var paintG=function(){
        var r=capResult(g);
        if(chkStat)chkStat.textContent=r.done+" of "+r.items+" items done.";
        scoreBox.innerHTML="";
        var sc=el("div","qr-score");sc.appendChild(el("b",null,r.sum+" / "+r.max));sc.appendChild(el("span",null,r.pct+"%"));scoreBox.appendChild(sc);
        var why=[];
        if(r.rated<r.crits)why.push("Select a level for each criterion ("+r.rated+" of "+r.crits+" done).");
        if(r.low)why.push("No criterion can be at level 1.");
        if(r.pct<70&&r.rated===r.crits)why.push("You need 70% or more.");
        if(r.done<r.items)why.push("Complete the checklist ("+r.done+" of "+r.items+").");
        var msg=el("div","qr-msg");
        msg.appendChild(el("b",null,r.passed?"Capstone passed. Well done.":"Not passed yet."));
        msg.appendChild(el("p",null,r.passed?"The capstone now counts for the AI Engineer certificate.":why.join(" ")));
        scoreBox.appendChild(msg);
        scoreBox.className="cap-score quiz-result on "+(r.passed?"passed":"failed");
      };
      paintG();
    }

    // ---------- Course page: choose a track ----------
    var picks=document.querySelectorAll(".track-pick");
    if(picks.length){
      var tstat=document.querySelector(".track-status");
      var paintT=function(){
        var t=myTrack();
        [].forEach.call(picks,function(b){
          var on=!!t&&b.getAttribute("data-track")===t.id;
          b.setAttribute("aria-pressed",on?"true":"false");b.textContent=on?"Your track":"Follow this track";
          b.closest(".track-card").classList.toggle("is-chosen",on);
        });
        if(tstat)tstat.textContent=t?"Your track: "+t.name+". The home page, the final review, and the certificate now follow this track.":"You did not choose a track yet.";
      };
      [].forEach.call(picks,function(b){b.addEventListener("click",function(){set(TRACK_KEY,b.getAttribute("data-track"));paintT();});});
      paintT();
    }

    // ---------- Final review: which knowledge checks are passed ----------
    [].forEach.call(document.querySelectorAll("[data-ready]"),function(ul){
      trackMods(myTrack()).forEach(function(M){
        var p=store[M.href]||{},ok=(p.done||[]).indexOf("knowledge-check")>=0;
        var li=el("li",ok?"ok":null),a=el("a",null,(ok?"✓ ":"")+"Module "+M.num);
        a.href=M.href+"#knowledge-check";a.style.color="inherit";a.title=M.title+(ok?": passed":": not passed yet");
        li.appendChild(a);ul.appendChild(li);
      });
    });

    // ---------- Print buttons (cheat sheets) ----------
    [].forEach.call(document.querySelectorAll("button[data-print]"),function(b){
      b.addEventListener("click",function(){
        var id=b.getAttribute("data-print"),target=id==="all"?null:document.getElementById(id);
        if(target){document.body.classList.add("print-one");target.classList.add("print-this");}
        var done=function(){document.body.classList.remove("print-one");if(target)target.classList.remove("print-this");window.removeEventListener("afterprint",done);};
        window.addEventListener("afterprint",done);
        window.print();
        setTimeout(done,1000);
      });
    });

    // ---------- Offline: keep a copy of the site (only on a web server, not on file://) ----------
    if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol)){
      window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){});});
    }

    // ---------- Back to top ----------
    var top=el("button","iconbtn totop",ICON.up);
    top.type="button";top.setAttribute("aria-label","Back to top");top.title="Back to top";
    top.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"});});
    document.body.appendChild(top);

    // ---------- Scroll: progress bar, active section, resume point ----------
    var ticking=false,lastSaved=mine.last,saveTimer=null,lastY=window.scrollY||0;
    function onScroll(){
      ticking=false;
      var y=window.scrollY||root.scrollTop;
      var max=root.scrollHeight-window.innerHeight;
      top.classList.toggle("on",y>600);
      if(bar){
        var dy=y-lastY;
        if(y<120||dy<-6)document.body.classList.remove("hdr-hidden");
        else if(dy>6&&!bar.contains(document.activeElement))document.body.classList.add("hdr-hidden");
        if(Math.abs(dy)>6||y<120)lastY=y;
      }
      if(!isModule)return;
      var line=window.innerHeight*0.3,cur=meta[0];
      for(var i=0;i<meta.length;i++){if(meta[i].s.getBoundingClientRect().top<=line)cur=meta[i];}
      if(max-y<4)cur=meta[meta.length-1];
      meta.forEach(function(m){
        var on=m===cur;
        m.anchors.forEach(function(a){
          a.classList.toggle("active",on);
          if(on)a.setAttribute("aria-current","location");else a.removeAttribute("aria-current");
        });
      });
      if(dockNum){dockNum.textContent=cur.num+"/"+meta.length;dockTitle.textContent=cur.title;}
      if(cur.id!==lastSaved&&y>300){
        lastSaved=cur.id;clearTimeout(saveTimer);
        var lt=cur.title,ln=cur.num;
        saveTimer=setTimeout(function(){mine.last=lastSaved;mine.lastTitle=lt;mine.lastNum=ln;persist();},500);
      }
    }
    window.addEventListener("scroll",function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});
    window.addEventListener("resize",onScroll);
    onScroll();

    // ---------- Definition pop-ups for technical names ----------
    var terms=[].slice.call(document.querySelectorAll(".tn[title]"));
    if(terms.length){
      var tip=el("div","tip");tip.setAttribute("aria-hidden","true");
      document.body.appendChild(tip);
      var defs=el("div");defs.hidden=true;defs.id="tn-defs";
      document.body.appendChild(defs);
      var current=null;
      function show(t){
        current=t;
        tip.innerHTML="";
        var b=el("b");b.textContent=t.textContent;
        tip.appendChild(b);tip.appendChild(document.createTextNode(t.getAttribute("data-tip")));
        t.classList.add("is-open");
        var r=t.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight,gap=10;
        var x=Math.max(12,Math.min(r.left+r.width/2-w/2,window.innerWidth-w-12));
        var yy=r.top-h-gap;
        if(yy<70)yy=r.bottom+gap;
        tip.style.left=x+"px";tip.style.top=yy+"px";
        tip.classList.add("on");
      }
      function hide(){
        if(current)current.classList.remove("is-open");
        current=null;tip.classList.remove("on");
      }
      terms.forEach(function(t,ti){
        t.setAttribute("data-tip",t.getAttribute("title"));
        t.removeAttribute("title");
        t.setAttribute("tabindex","0");
        var d=el("span");d.id="tn-def-"+ti;d.textContent=t.getAttribute("data-tip");
        defs.appendChild(d);
        t.setAttribute("aria-describedby",d.id);
        t.addEventListener("mouseenter",function(){show(t);});
        t.addEventListener("mouseleave",hide);
        t.addEventListener("focus",function(){show(t);});
        t.addEventListener("blur",hide);
        t.addEventListener("click",function(e){e.stopPropagation();if(current===t)hide();else show(t);});
      });
      document.addEventListener("click",hide);
      document.addEventListener("keydown",function(e){if(e.key==="Escape")hide();});
      window.addEventListener("scroll",hide,{passive:true});
    }
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
