const GREDIR_COOKIE = "gredir";
const COOKIE_EXPERIMENT_SIDE = "expe5ps";

export default {
  async fetch(request, env) {
        
    const url = new URL(request.url);
    const { search, pathname, hostname, protocol } = new URL(url);
    const isHome = pathname == "/";
    const cookie = request.headers.get("cookie");
    const gredirCookie = getCookie(cookie, GREDIR_COOKIE);
    
    let side = getCookie(cookie, COOKIE_EXPERIMENT_SIDE);
    let goToExperiment = false;
    let newToExperiment = false;
    let res = {};

    newToExperiment = newToExperimentF(side, gredirCookie);

    if(!newToExperiment){
      if (gredirCookie == "Y") {
        return fetchGama(request);
      } else if(gredirCookie == "N") {
        return fetchMagento(request,env);
      }
    }
    
    if(isHome){ //is home
      goToExperiment = true;
    } else if(isProductF){//is product
      goToExperiment = false;
    }
    //TODO, identify when is category

    //go to experiment
    if(goToExperiment && newToExperiment){
      let res = {}

      side = Math.random() * 100 <= env.split ? "gama" : "m2";
      res = side == 'm2' ? await fetchMagento(request,env) : await fetchGama(request) ;
            
      res = new Response(res.body, res);      
      var now = new Date();
      now.setTime(now.getTime() + 1e3 * 3600 * 24 * 30);        
      res.headers.append("Set-Cookie", `5ps-change-file=${url}; expires=${now.toUTCString()}; path=/;`);

      if (side == "m2") {
        res.headers.append("Set-Cookie", `${GREDIR_COOKIE}=N; expires=${now.toUTCString()}; path=/;`);
        res.headers.append("Set-Cookie", `${COOKIE_EXPERIMENT_SIDE}=m2; expires=${now.toUTCString()}; path=/;`);
      } else {
        res.headers.append("Set-Cookie", `${GREDIR_COOKIE}=Y; expires=${now.toUTCString()}; path=/;`);
        res.headers.append("Set-Cookie", `${COOKIE_EXPERIMENT_SIDE}=gama; expires=${now.toUTCString()}; path=/;`);
      }  
      return res;      
    }//end of go to experiment
  }
}

async function fetchGama(request){
  let headers = new Headers(request.headers);
  headers.append(GREDIR_COOKIE, 'Y');
  if(!needsRewrite(request.url))
    return await fetch(request, { headers });
  else
    return await env.rewriteWorker.fetch(request, { headers });
}

async function fetchMagento(request,env){
  return await fetch(request, env);
}

function newToExperimentF(side, gredirCookie){  
  if(side=='m2' || side =='gama')
    return false;

  if(gredirCookie == 'Y' || gredirCookie =='N')
    return false;

  return true;
}

function isProductF(search){
  const urlParams = new URLSearchParams(search);
  if (urlParams.has("color"))
    return true;

  return false;
}

function needsRewrite(url){
  let hasHtml =url.includes(".html");    
  return (hasHtml) ? true : false;
}

function getCookie(cookieString, key) {
  if (cookieString) {
    const allCookies = cookieString.split("; ");
    const targetCookie = allCookies.find((cookie) => cookie.includes(key));
    if (targetCookie) {
      const [_, value] = targetCookie.split("=");
      return value;
    }
  }
  return "";
}