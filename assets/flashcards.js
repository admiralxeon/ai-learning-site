// Flashcards for the glossary page. assets/site.js loads this file only on pages with a "#flashcards" element.
// The cards come from the glossary list on the same page. The learner's boxes are kept in localStorage.
(function(){
  var KEY="ai-manual-cards";
  var root=document.getElementById("flashcards");
  if(!root)return;
  var body=root.querySelector(".fc-body");if(!body)return;

  function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||{};}catch(e){return {};}}
  function save(b){try{localStorage.setItem(KEY,JSON.stringify(b));}catch(e){}}
  function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}

  // Read the cards from the glossary list.
  var ALL=[].map.call(document.querySelectorAll(".gl-item"),function(it){
    var dt=it.querySelector("dt"),def=it.querySelector(".gl-def");
    var mods=[].map.call(it.querySelectorAll(".gl-mods a"),function(a){return +(/\d+/.exec(a.textContent)||[0])[0];});
    return {id:dt.id,term:dt.textContent.trim(),def:def?def.textContent.trim():"",mods:mods};
  });
  if(!ALL.length)return;
  var MODS=[];ALL.forEach(function(c){c.mods.forEach(function(m){if(MODS.indexOf(m)<0)MODS.push(m);});});MODS.sort();

  var boxes=load(),deck="all",reverse=false,queue=[],pos=0,firstTry=0,again=0,seen={},flipped=false;
  var params=/[?&]deck=(\d+)/.exec(location.search);if(params&&MODS.indexOf(+params[1])>=0)deck=params[1];

  // ---------------- controls
  var ctr=el("div","fc-controls");
  var fs=el("fieldset","dgroup fc-deck");fs.appendChild(el("legend",null,"Cards from"));
  var seg=el("div","dseg");
  [["all","All modules"]].concat(MODS.map(function(m){return [String(m),"Module "+m];})).forEach(function(o){
    var id="fc-deck-"+o[0],lab=el("label","dopt");lab.setAttribute("for",id);
    var inp=el("input");inp.type="radio";inp.name="fc-deck";inp.id=id;inp.value=o[0];inp.checked=o[0]===deck;
    inp.addEventListener("change",function(){if(inp.checked){deck=o[0];start(false);}});
    lab.appendChild(inp);lab.appendChild(el("span",null,o[1]));seg.appendChild(lab);
  });
  fs.appendChild(seg);ctr.appendChild(fs);
  var revLab=el("label","fc-rev"),rev=el("input");rev.type="checkbox";rev.id="fc-rev";revLab.setAttribute("for","fc-rev");
  revLab.appendChild(rev);revLab.appendChild(el("span",null,"Show the definition first"));
  rev.addEventListener("change",function(){reverse=rev.checked;show();});
  ctr.appendChild(revLab);body.appendChild(ctr);

  // ---------------- card
  var stage=el("div","fc-stage");
  var meta=el("div","fc-meta");
  var bar=el("div","quiz-bar"),barF=el("div","quiz-bar-f");bar.appendChild(barF);
  var card=el("div","fc-card");
  var front=el("p","fc-front"),back=el("p","fc-back");back.setAttribute("aria-live","polite");
  var flip=el("button","pg-btn pg-btn-primary fc-flip","Show the definition");flip.type="button";
  var acts=el("div","fc-acts");
  var bAgain=el("button","pg-btn fc-again","Show again later");bAgain.type="button";
  var bKnew=el("button","pg-btn pg-btn-primary fc-knew","I knew it");bKnew.type="button";
  acts.appendChild(bAgain);acts.appendChild(bKnew);
  card.appendChild(front);card.appendChild(back);card.appendChild(flip);card.appendChild(acts);
  stage.appendChild(meta);stage.appendChild(bar);stage.appendChild(card);
  var keys=el("p","fc-keys","Keys: Space shows the definition. 1 = show again later. 2 = I knew it.");
  stage.appendChild(keys);
  var learned=el("p","fc-learned");stage.appendChild(learned);
  body.appendChild(stage);
  var done=el("div","fc-done");done.hidden=true;body.appendChild(done);

  function deckCards(){return ALL.filter(function(c){return deck==="all"||c.mods.indexOf(+deck)>=0;});}
  function boxOf(c){return (boxes[c.id]&&boxes[c.id].b)||0;}
  function paintLearned(){
    var d=deckCards(),n=d.filter(function(c){return boxOf(c)>=2;}).length;
    learned.textContent="Learned in this set: "+n+" of "+d.length+". A card is learned when you know it in two different sessions.";
  }
  function start(hardOnly){
    var d=deckCards();
    if(hardOnly)d=d.filter(function(c){return boxOf(c)===0;});
    // Cards in lower boxes come first. Inside each box, the order is random.
    queue=shuffle(d.slice()).sort(function(a,b){return boxOf(a)-boxOf(b);});
    pos=0;firstTry=0;again=0;seen={};
    stage.hidden=false;done.hidden=true;
    show();paintLearned();
  }
  function show(){
    if(pos>=queue.length){finish();return;}
    // "pos" is the number of cards that are known in this session. A card that comes back does not count two times.
    var c=queue[pos],total=queue.length;
    flipped=false;
    meta.textContent=pos+" of "+total+" known · "+c.mods.map(function(m){return "Module "+m;}).join(", ");
    barF.style.width=Math.round(pos/Math.max(1,total)*100)+"%";
    front.textContent=reverse?c.def:c.term;front.classList.toggle("is-def",reverse);
    back.textContent="";back.hidden=true;
    flip.hidden=false;flip.textContent=reverse?"Show the name":"Show the definition";
    acts.hidden=true;card.classList.remove("is-flipped");
  }
  function doFlip(){
    if(flipped||pos>=queue.length)return;
    var c=queue[pos];flipped=true;
    back.textContent=reverse?c.term:c.def;back.classList.toggle("is-def",!reverse);back.hidden=false;
    flip.hidden=true;acts.hidden=false;card.classList.add("is-flipped");bKnew.focus();
  }
  function answer(knew){
    if(!flipped)return;
    var c=queue[pos],b=boxes[c.id]||{b:0};
    if(knew){
      if(!seen[c.id])firstTry++;
      // Move the card up only one box in each session.
      if(!seen[c.id])b.b=Math.min(4,(b.b||0)+1);
      seen[c.id]=true;pos++;
    }else{
      again++;b.b=0;seen[c.id]=true;
      var copy=queue.splice(pos,1)[0];queue.splice(Math.min(queue.length,pos+3),0,copy);
    }
    b.t=Date.now();boxes[c.id]=b;save(boxes);
    show();paintLearned();
    if(!flipped)flip.focus();
  }
  function finish(){
    stage.hidden=true;done.hidden=false;done.innerHTML="";
    var n=Object.keys(seen).length;
    done.appendChild(el("b",null,n?"You finished this set of cards.":"There are no difficult cards in this set."));
    if(n)done.appendChild(el("p",null,firstTry+" of "+n+" known at the first try. "+(again?again+(again===1?" card needed":" cards needed")+" more practice.":"No card needed more practice.")));
    var row=el("div","pg-actions");
    var bA=el("button","pg-btn pg-btn-primary","Practice this set again");bA.type="button";bA.addEventListener("click",function(){start(false);});
    row.appendChild(bA);
    var hard=deckCards().filter(function(c){return boxOf(c)===0;}).length;
    if(hard){var bH=el("button","pg-btn","Only the difficult cards ("+hard+")");bH.type="button";bH.addEventListener("click",function(){start(true);});row.appendChild(bH);}
    done.appendChild(row);
    paintLearned();done.appendChild(learned.cloneNode(true));
    bA.focus();
  }
  flip.addEventListener("click",doFlip);
  card.addEventListener("click",function(e){if(!flipped&&e.target===card||e.target===front)doFlip();});
  bAgain.addEventListener("click",function(){answer(false);});
  bKnew.addEventListener("click",function(){answer(true);});
  root.addEventListener("keydown",function(e){
    var tag=(e.target.tagName||"").toLowerCase();
    // Form controls (the set and the "definition first" box) keep their usual keys.
    if(tag==="input"||tag==="label")return;
    if((e.key===" "||e.key==="Enter")&&!flipped&&!stage.hidden&&(e.target===flip||tag!=="button")){e.preventDefault();doFlip();}
    else if(e.key==="1"&&flipped){e.preventDefault();answer(false);}
    else if(e.key==="2"&&flipped){e.preventDefault();answer(true);}
  });
  start(false);
})();
