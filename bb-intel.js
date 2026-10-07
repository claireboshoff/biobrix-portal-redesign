/* ============================================================
   BioBrix Intelligence — the question engine, shared by the Intelligence page and the
   Ask bar on Home. Client-side over BB.data (and the Sage snapshot), so it works offline.
   Loaded after bb-shell.js. Exposes BB.intel.
   ============================================================ */
(function(){
  "use strict";
  var d = BB.data;
  /* ---------- intelligence engine (client-side, works offline) ---------- */
  // Farm health score 0-100 from soil + leaf + monitoring signals
  function farmHealth(farmerId){
    var soils = d.where('soil', function(s){return s.farmer===farmerId && s.status==='Interpreted';});
    var leaves = d.where('leaf', function(l){return l.farmer===farmerId && l.status==='Interpreted';});
    var watches = d.where('watch', function(w){return w.farmer===farmerId;});
    var score=62, drivers=[];
    soils.forEach(function(s){
      if(s.ph!=null){ if(s.ph<5.5){score-=9;drivers.push('acidic soil (pH '+s.ph+')');} else if(s.ph>=6&&s.ph<=7){score+=6;} }
      if(s.microbial==='Low'){score-=10;drivers.push('low soil biology');}
      else if(s.microbial==='Moderate'){score+=4;} else if(s.microbial==='Good'){score+=10;}
    });
    leaves.forEach(function(l){ if(l.flag&&/low|deficien/i.test(l.flag)){score-=5;drivers.push('leaf deficiency');} else {score+=4;} });
    watches.forEach(function(w){
      if(w.vigour==='Excellent')score+=8; else if(w.vigour==='Good')score+=4; else if(w.vigour==='Fair'){score-=6;drivers.push('fair vigour');} else if(w.vigour==='Poor'){score-=12;drivers.push('poor vigour');}
      if(w.pest&&!/none/i.test(w.pest))drivers.push('pest watch: '+w.pest.split('–')[0].trim());
    });
    score=Math.max(20,Math.min(98,Math.round(score)));
    return { score:score, drivers:drivers.slice(0,3), samples:soils.length+leaves.length, visits:watches.length };
  }

  // Reorder forecast — days of cover from stock vs recent draw + supplier lead
  function reorderForecast(){
    var out=[];
    d.all('inventory').forEach(function(i){
      var p=d.product(i.prod), sup=d.supplier(p.supplier);
      // demo draw estimate: reorder level ≈ ~30 days usage
      var dailyDraw = Math.max(1, Math.round(i.reorder/30));
      var daysCover = Math.round(i.qty/dailyDraw);
      var lead = sup.lead||10;
      var urgent = daysCover <= lead + 7;
      if(i.qty < i.reorder*1.4) out.push({ p:p, sup:sup, depot:d.depot(i.depot), qty:i.qty, daysCover:daysCover, lead:lead, urgent:urgent });
    });
    return out.sort(function(a,b){return a.daysCover-b.daysCover;});
  }

  // What needs attention now
  function alerts(){
    var a=[];
    // The accounting system is the one source here that is real — lead with it.
    var sg = d.sage && d.sage();
    if(sg && sg.live){
      var op=function(i){ return i.outstanding!=null?i.outstanding:(i.status==='Paid'?0:(i.amount||0)); };
      var t0=new Date(new Date().toISOString().slice(0,10));
      var byId={}; (sg.customers||[]).forEach(function(c){ byId[c.id]=c; });
      var aged=(sg.invoices||[]).filter(function(i){ return op(i)>0.5 && i.dueDate && Math.round((t0-new Date(i.dueDate))/86400000)>=90; })
        .sort(function(x,y){ return op(y)-op(x); }).slice(0,4);
      aged.forEach(function(i){
        var c=byId[i.customer]||{name:'an account'};
        a.push({sev:'high', txt:c.name+' — '+BB.money(op(i))+' more than 90 days overdue', to:'finance.html?show=overdue'});
      });
      (sg.customers||[]).filter(function(c){ return c.creditLimit>0 && c.balance>c.creditLimit; })
        .sort(function(x,y){ return (y.balance-y.creditLimit)-(x.balance-x.creditLimit); }).slice(0,3).forEach(function(c){
          a.push({sev:'med', txt:c.name+' is '+BB.money(c.balance-c.creditLimit)+' over its credit limit — check before a rep drives out', to:'farms.html?show=overlimit'});
        });
      var held=(sg.customers||[]).filter(function(c){ return c.onHold; });
      if(held.length) a.push({sev:'med', txt:held.length+' account'+(held.length===1?' is':'s are')+' on hold in your accounting system', to:'farms.html?show=accounts'});
    }
    d.all('inventory').filter(function(i){return i.qty<i.reorder;}).forEach(function(i){
      a.push({sev:i.qty<=0?'high':'med', txt:d.product(i.prod).name+' at '+d.depot(i.depot).name+' below reorder ('+i.qty+'/'+i.reorder+')', to:'stock.html'});
    });
    d.all('soil').filter(function(s){return s.status==='New'||s.status==='Awaiting lab';}).forEach(function(s){
      a.push({sev:'med', txt:'Soil sample for '+d.farmer(s.farmer).farm+' awaiting interpretation', to:'bioanalyze-soil.html'});
    });
    d.all('orders').filter(function(o){return o.status==='Awaiting stock';}).forEach(function(o){
      a.push({sev:'high', txt:o.ref+' ('+d.farmer(o.farmer).farm+') awaiting stock — farmer waiting', to:'orders.html'});
    });
    d.all('watch').filter(function(w){return w.vigour==='Fair'||w.vigour==='Poor';}).forEach(function(w){
      a.push({sev:w.vigour==='Poor'?'high':'med', txt:d.farmer(w.farmer).farm+' — '+w.vigour.toLowerCase()+' vigour on '+(d.by('blocks',w.block)||{name:'block'}).name, to:'biowatch.html'});
    });
    d.all('farmers').filter(function(f){return f.status==='Prospect';}).forEach(function(f){
      a.push({sev:'low', txt:'Prospect '+f.farm+' ('+f.town+') not yet converted — '+d.rep(f.rep).name, to:'territory.html'});
    });
    // finance — overdue accounts (hold deliveries) and farmers already over their credit limit
    d.all('farmers').filter(function(f){return d.isOverdue(f.id);}).forEach(function(f){
      a.push({sev:'high', txt:f.farm+' — account overdue, hold deliveries ('+BB.money(d.accountBalance(f.id))+')', to:'orders.html'});
    });
    d.all('farmers').filter(function(f){return f.status==='Active' && d.overLimit(f.id, 0);}).forEach(function(f){
      a.push({sev:'med', txt:f.farm+' — over credit limit', to:'orders.html'});
    });
    var order={high:0,med:1,low:2};
    return a.sort(function(x,y){return order[x.sev]-order[y.sev];});
  }

  /* ---------- Ask BioBrix — natural-language query over the data ---------- */
  function answer(q){
    q=(q||'').toLowerCase().trim();
    if(!q) return null;
    var months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    var full=['january','february','march','april','may','june','july','august','september','october','november','december'];
    // forecast for a month
    var mi=-1; full.forEach(function(m,i){if(q.indexOf(m)>=0)mi=i;}); if(mi<0) months.forEach(function(m,i){if(new RegExp('\\b'+m+'\\b').test(q))mi=i;});
    if((/forecast|pipeline|sell|sales|expect/.test(q)) && mi>=0){
      var os=d.all('orders').filter(function(o){return o.deliverMonth===mi;});
      var val=os.reduce(function(s,o){return s+d.orderValue(o);},0);
      return { title:'Forecast — '+BB.monthName(mi), lines:[
        os.length+' orders scheduled for delivery in '+BB.monthName(mi),
        'Total value '+BB.money(val),
        os.map(function(o){return '• '+d.farmer(o.farmer).farm+' — '+BB.money(d.orderValue(o))+' ('+o.status+')';}).join('\n')||'No orders yet for this month.'
      ], to:'forecast.html' };
    }
    // stock running out / reorder
    if(/run out|reorder|stock|low|order.*supplier|when.*order/.test(q)){
      var rf=reorderForecast().slice(0,6);
      return { title:'Stock to reorder soon', lines:[
        rf.length+' lines need attention',
        rf.map(function(r){return '• '+r.p.name+' at '+r.depot.name+' — ~'+r.daysCover+' days cover, '+r.sup.lead+'-day lead ('+r.sup.name+')'+(r.urgent?' — order now':'');}).join('\n')
      ], to:'suppliers.html' };
    }
    // farms needing attention / soil correction
    if(/attention|correct|problem|risk|struggl|needs|worst|health/.test(q)){
      var ranked=d.all('farmers').map(function(f){return {f:f,h:farmHealth(f.id)};}).sort(function(a,b){return a.h.score-b.h.score;}).slice(0,5);
      return { title:'Farms needing attention (lowest health)', lines:[
        ranked.map(function(x){return '• '+x.f.farm+' — health '+x.h.score+'/100'+(x.h.drivers.length?' ('+x.h.drivers.join(', ')+')':'');}).join('\n')
      ], to:'farms.html' };
    }
    // a rep's pipeline
    var rep=d.all('reps').find(function(r){return q.indexOf(r.name.toLowerCase().split(' ')[0])>=0;});
    if(rep && /pipeline|sales|forecast|selling|doing/.test(q)){
      var ro=d.all('orders').filter(function(o){return o.rep===rep.id;});
      return { title:rep.name+' — pipeline', lines:[
        ro.length+' orders · '+BB.money(ro.reduce(function(s,o){return s+d.orderValue(o);},0)),
        d.where('farmers',function(f){return f.rep===rep.id;}).length+' farmers in '+rep.region
      ], to:'forecast.html' };
    }
    // where to grow / territory
    if(/grow|territory|potential|expand|opportunit|where/.test(q)){
      var t=d.all('territory').slice().sort(function(a,b){return (b.potential*(100-b.penetration))-(a.potential*(100-a.penetration));}).slice(0,4);
      return { title:'Biggest growth opportunities', lines:[
        t.map(function(x){return '• '+x.town+' ('+x.region+') — '+BB.money(x.potential)+' potential, '+x.penetration+'% penetrated → '+d.rep(x.rep).name;}).join('\n')
      ], to:'territory.html' };
    }
    // crop query
    var crop=['macadamia','avocado','citrus','sugarcane','maize','soya','apple','lucerne','banana'].find(function(c){return q.indexOf(c)>=0;});
    if(crop){
      var fs=d.all('farmers').filter(function(f){return (f.crops||[]).join(' ').toLowerCase().indexOf(crop)>=0;});
      return { title:crop.charAt(0).toUpperCase()+crop.slice(1)+' farmers', lines:[
        fs.length+' farmers · '+fs.reduce(function(s,f){return s+f.ha;},0)+' ha',
        fs.map(function(f){return '• '+f.farm+' ('+f.town+') — '+f.ha+' ha, '+d.rep(f.rep).name;}).join('\n')
      ], to:'farms.html' };
    }
    // fallback summary
    var pipe=d.all('orders').filter(function(o){return o.status==='Forecast'||o.status==='Pending';}).reduce(function(s,o){return s+d.orderValue(o);},0);
    return { title:'BioBrix at a glance', lines:[
      d.all('farmers').length+' farmers · '+d.all('orders').length+' orders · '+BB.money(pipe)+' open pipeline',
      d.all('inventory').filter(function(i){return i.qty<i.reorder;}).length+' stock lines low · '+d.all('soil').filter(function(s){return s.status!=='Interpreted';}).length+' samples to interpret',
      'Try: "forecast for October", "what stock will run out", "which farms need attention", "where should we grow", "citrus farms"'
    ], to:'operations.html' };
  }

  // Questions worth offering as one-tap prompts.
  var SUGGEST = ['Which farms need attention','What stock will run out','Forecast for '+BB.monthName((new Date().getMonth()+1)%12),'Where should we grow'];
  window.BB.intel = { farmHealth:farmHealth, reorderForecast:reorderForecast, alerts:alerts, answer:answer, suggest:SUGGEST };
})();
