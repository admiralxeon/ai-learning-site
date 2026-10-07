// Runs Python in the browser with Pyodide, for the code exercises.
// On a web server, assets/site.js starts this file as a Web Worker, so that a loop that never stops
// does not stop the page. On file://, it runs on the page (window.PyLocal).
(function(){
  var BASE="https://cdn.jsdelivr.net/pyodide/v0.29.5/full/";
  var isWorker=typeof importScripts==="function"&&typeof document==="undefined";
  var pyPromise=null;

  function load(){
    if(!pyPromise){
      var script=isWorker
        ?new Promise(function(res){importScripts(BASE+"pyodide.js");res();})
        :new Promise(function(res,rej){
            var s=document.createElement("script");s.src=BASE+"pyodide.js";
            s.onload=res;s.onerror=function(){rej(new Error("Python could not be loaded. Check the internet connection."));};
            document.head.appendChild(s);
          });
      pyPromise=script.then(function(){return loadPyodide({indexURL:BASE});});
      pyPromise.catch(function(){pyPromise=null;});
    }
    return pyPromise;
  }

  // msg: {code, tests, packages, runner}. onStart is called just before the code runs.
  function run(msg,onStart){
    return load().then(function(py){
      return (msg.packages&&msg.packages.length?py.loadPackage(msg.packages):Promise.resolve()).then(function(){
        if(onStart)onStart();
        py.globals.set("__user_code",msg.code);
        py.globals.set("__tests",JSON.stringify(msg.tests));
        return JSON.parse(py.runPython(msg.runner));
      });
    });
  }

  if(isWorker){
    self.onmessage=function(e){
      var m=e.data;
      if(m.type==="load"){
        load().then(function(){postMessage({type:"ready"});},function(err){postMessage({type:"fail",error:String(err&&err.message||err)});});
        return;
      }
      run(m,function(){postMessage({type:"started",id:m.id});}).then(
        function(r){postMessage({type:"result",id:m.id,result:r});},
        function(err){postMessage({type:"result",id:m.id,error:String(err&&err.message||err)});});
    };
  }else{
    window.PyLocal={load:load,run:run};
  }
})();
