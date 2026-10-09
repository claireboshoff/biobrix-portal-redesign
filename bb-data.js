/* ============================================================
   BioBrix OS — demo data layer (client-side, offline-first)
   Seeds realistic Southern-Africa regenerative-ag data into
   localStorage on first load. All reads/writes are local so the
   whole app works with NO signal (the farmer's-field requirement).
   Writes go through an offline queue that "syncs" when back online.

   LIVE (bb-config AUTH:'live'): the Sage 200 Evolution mirror is fetched
   from the fh-biobrix Worker behind the session token and laid over the
   store — customers, invoices, payments, stock, sync log. The last good
   snapshot is cached on the device so Finance still opens with no signal.
   The page API below stays identical in both modes.
   ============================================================ */
(function () {
  "use strict";
  var KEY = 'bb_os_v5';
  var QKEY = 'bb_os_queue_v5';

  // ---------- SEED ------------------------------------------------
  function seed() {
    var reps = [
      { id:'rep_rudie', name:'Rudie Willemse',  role:'Director · Technical & Strategy', region:'Southern Cape', base:'George',      cell:'074 289 3320', colour:'#3f6b28', markupPct:0 },
      { id:'rep_johan', name:'Johan Coetzee',   role:'Director · Business Development', region:'KwaZulu-Natal', base:'Ballito',     cell:'083 299 8702', colour:'#2f6f9e', markupPct:10 },
      { id:'rep_juba',  name:'Juba de Wet',     role:'Sales Lead · Crop Advisor',   region:'Limpopo',        base:'Tzaneen',     cell:'082 884 0306', colour:'#c77d17', markupPct:8 },
      // Not a BioBrix person — an example agent for demonstrating the product. demo:true keeps
      // them out of every live client seat (see "the sample-data cut-off").
      { id:'rep_pieter',name:'Pieter Nel',      role:'Regional Crop Advisor',      region:'Free State',     base:'Bloemfontein',cell:'082 551 4477', colour:'#7a4fa3', markupPct:6, demo:true }
    ];
    // 13 suppliers (BioBrix recommends across many, not one)
    var suppliers = [
      { id:'sup_1', name:'BioBrix In-House Blends', country:'ZA', lead:5,  note:'Own RenewAg blends, mixed at depot' },
      { id:'sup_2', name:'Agri Technovation',       country:'ZA', lead:7,  note:'Leaf/soil lab + biostimulants' },
      { id:'sup_3', name:'Microbial Solutions US',  country:'US', lead:35, note:'Imported microbial inoculants' },
      { id:'sup_4', name:'Kynoch Fertilizer',       country:'ZA', lead:10, note:'Carriers & granular base' },
      { id:'sup_5', name:'Omnia Nutriology',        country:'ZA', lead:12, note:'Speciality nutrition' },
      { id:'sup_6', name:'Humintech GmbH',          country:'DE', lead:42, note:'Humic / fulvic imports' },
      { id:'sup_7', name:'Andermatt Biocontrol',    country:'ZA', lead:9,  note:'Biological crop protection' },
      { id:'sup_8', name:'Madumbi Sustainable Ag',  country:'ZA', lead:8,  note:'Biologicals & bio-fungicides' },
      { id:'sup_9', name:'Plaaskem',                country:'ZA', lead:6,  note:'Adjuvants & carriers' },
      { id:'sup_10',name:'Zylem',                   country:'ZA', lead:9,  note:'Soil health & silica' },
      { id:'sup_11',name:'Terason',                 country:'ZA', lead:11, note:'Fulvic & foliars' },
      { id:'sup_12',name:'Nutri-Tech Solutions',    country:'AU', lead:48, note:'Imported programme inputs' },
      { id:'sup_13',name:'Bactoworld',              country:'ZA', lead:7,  note:'Beneficial bacteria' }
    ];
    var products = [
      { id:'p_soilprime', code:'RA-SP', name:'RenewAg SoilPrime',       cat:'Biology',   unit:'L',  pack:'20 L', price:340, supplier:'sup_1', lever:'Biology',   sheet:'Consortium of soil bacteria + fungi to re-establish root-zone microbial life. Apply 5 L/ha at planting.' },
      { id:'p_rootboost', code:'RA-RB', name:'RenewAg RootBoost',       cat:'Biology',   unit:'L',  pack:'20 L', price:395, supplier:'sup_3', lever:'Biology',   sheet:'Mycorrhizal + PGPR inoculant. Improves P uptake & root architecture. 2 L/ha.' },
      { id:'p_humimax',   code:'RA-HM', name:'RenewAg HumiMax',         cat:'Physics',   unit:'L',  pack:'20 L', price:280, supplier:'sup_6', lever:'Physics',   sheet:'Humic + fulvic complex. Improves soil structure, CEC and water dynamics. 5 L/ha.' },
      { id:'p_calfix',    code:'RA-CF', name:'RenewAg Cal-Fix',         cat:'Chemistry', unit:'L',  pack:'20 L', price:255, supplier:'sup_5', lever:'Chemistry', sheet:'Bio-available calcium for cell strength & Ca:Mg correction. 4 L/ha.' },
      { id:'p_siligro',   code:'RA-SG', name:'RenewAg SiliGro',         cat:'Physics',   unit:'L',  pack:'20 L', price:310, supplier:'sup_10',lever:'Physics',   sheet:'Silica + potassium for stress tolerance and structure. 3 L/ha.' },
      { id:'p_leafsap',   code:'RA-LS', name:'RenewAg LeafSap Foliar',  cat:'Chemistry', unit:'L',  pack:'10 L', price:420, supplier:'sup_11',lever:'Chemistry', sheet:'Balanced foliar for in-season correction guided by leaf-sap analysis. 2 L/ha foliar.' },
      { id:'p_bactoN',    code:'RA-BN', name:'RenewAg BactoN Fixer',    cat:'Biology',   unit:'L',  pack:'20 L', price:365, supplier:'sup_13',lever:'Biology',   sheet:'Free-living N-fixing bacteria. Cuts synthetic N need. 3 L/ha.' },
      { id:'p_shield',    code:'RA-SH', name:'RenewAg BioShield',       cat:'Biology',   unit:'L',  pack:'10 L', price:485, supplier:'sup_7', lever:'Biology',   sheet:'Trichoderma-based biological protection against soil pathogens. 2 L/ha.' },
      { id:'p_ferment',   code:'RA-FM', name:'RenewAg Ferment Base',    cat:'Biology',   unit:'L',  pack:'200 L',price:2100,supplier:'sup_1', lever:'Biology',   sheet:'On-farm fermentation carrier for compost extracts. Bulk.' },
      { id:'p_carbon',    code:'RA-CB', name:'RenewAg Carbon Kick',     cat:'Physics',   unit:'kg', pack:'25 kg',price:190, supplier:'sup_4', lever:'Physics',   sheet:'Carbon + biochar granule to feed biology and hold moisture. 40 kg/ha.' }
    ];
    var depots = [
      { id:'dep_george',  name:'George Depot',     region:'Southern Cape', status:'Commissioning', manager:'Wentzel Kruger', address:'George Industria, WC' },
      { id:'dep_ballito', name:'Ballito Depot',    region:'KwaZulu-Natal', status:'Operational',    manager:'Sipho Ndlovu',   address:'Ballito, KZN' },
      { id:'dep_tzaneen', name:'Tzaneen Depot',    region:'Limpopo',       status:'Operational',    manager:'Renzie Botha',   address:'7 Stasie Road, Hamawasha, Tzaneen' }
    ];
    // farmers → farms → blocks(fields)
    var farmers = [
      { id:'f_joubert', name:'Gideon Joubert',   farm:'Rietvlei Boerdery',      region:'Limpopo',        town:'Tzaneen',      rep:'rep_juba',  crops:['Macadamia','Avocado'], ha:420, cell:'082 445 1200', status:'Active', creditLimit:800000 },
      { id:'f_venter',  name:'Kobus Venter',     farm:'Sunnyside Citrus',       region:'Limpopo',        town:'Letsitele',    rep:'rep_juba',  crops:['Citrus'],              ha:310, cell:'083 221 8890', status:'Active', creditLimit:500000 },
      { id:'f_botha',   name:'Renier Botha',     farm:'Langkloof Orchards',     region:'Southern Cape',  town:'George',       rep:'rep_rudie', crops:['Apple','Pear'],        ha:180, cell:'072 909 4521', status:'Active', creditLimit:300000 },
      { id:'f_smit',    name:'Hannes Smit',      farm:'Dwarsrivier Farm',       region:'Southern Cape',  town:'Oudtshoorn',   rep:'rep_rudie', crops:['Lucerne','Vegetables'],ha:240, cell:'082 776 3310', status:'Active', creditLimit:400000 },
      { id:'f_zulu',    name:'Thabo Zulu',       farm:'Green Valley Estate',    region:'KwaZulu-Natal',  town:'Ballito',      rep:'rep_johan', crops:['Sugarcane','Banana'],  ha:520, cell:'083 660 7712', status:'Active', creditLimit:300000 },
      { id:'f_pretorius',name:'Wynand Pretorius',farm:'Vrede Plaas',            region:'Free State',     town:'Bloemfontein', rep:'rep_pieter',crops:['Maize','Soya'],        ha:1250,cell:'082 118 5540', status:'Prospect', creditLimit:0 },
      { id:'f_naidoo',  name:'Previn Naidoo',    farm:'Riverside Cane',         region:'KwaZulu-Natal',  town:'Stanger',      rep:'rep_johan', crops:['Sugarcane'],           ha:640, cell:'083 445 9987', status:'Active', creditLimit:250000 },
      { id:'f_meyer',   name:'Dirk Meyer',       farm:'Hoëveld Akkers',         region:'Free State',     town:'Ficksburg',    rep:'rep_pieter',crops:['Maize','Beans'],       ha:980, cell:'082 330 2214', status:'Prospect', creditLimit:0 }
    ];
    var blocks = [
      { id:'b1', farmer:'f_joubert', name:'Block A — Beaumont Mac', crop:'Macadamia', ha:65, planted:2016 },
      { id:'b2', farmer:'f_joubert', name:'Block B — 816 Mac',      crop:'Macadamia', ha:80, planted:2018 },
      { id:'b3', farmer:'f_joubert', name:'Block C — Hass Avo',     crop:'Avocado',   ha:45, planted:2019 },
      { id:'b4', farmer:'f_venter',  name:'Valencia North',         crop:'Citrus',    ha:70, planted:2015 },
      { id:'b5', farmer:'f_venter',  name:'Nova Mandarin',          crop:'Citrus',    ha:38, planted:2020 },
      { id:'b6', farmer:'f_botha',   name:'Golden Delicious 1',     crop:'Apple',     ha:42, planted:2014 },
      { id:'b7', farmer:'f_zulu',    name:'Cane Field 7',           crop:'Sugarcane', ha:120,planted:2021 },
      { id:'b8', farmer:'f_smit',    name:'Lucerne Pivot 2',        crop:'Lucerne',   ha:55, planted:2022 }
    ];
    // BioAnalyze — soil
    var soil = [
      { id:'s1', block:'b1', farmer:'f_joubert', date:'2026-06-14', status:'Interpreted', ph:5.2, om:'2.1%', ca_mg:'3.1:1', microbial:'Low', p:'12 ppm', flag:'Low biology & acidic — lime + inoculant', advisor:'rep_juba' },
      { id:'s2', block:'b2', farmer:'f_joubert', date:'2026-06-14', status:'Interpreted', ph:5.8, om:'3.4%', ca_mg:'4.2:1', microbial:'Moderate', p:'22 ppm', flag:'Improving — maintain programme', advisor:'rep_juba' },
      { id:'s3', block:'b4', farmer:'f_venter',  date:'2026-07-02', status:'Interpreted', ph:6.4, om:'2.8%', ca_mg:'5.0:1', microbial:'Moderate', p:'18 ppm', flag:'Ca:Mg high — correct Mg', advisor:'rep_juba' },
      { id:'s4', block:'b6', farmer:'f_botha',   date:'2026-07-10', status:'Awaiting lab',ph:null,om:null, ca_mg:null, microbial:null, p:null, flag:'Sampled — at lab', advisor:'rep_rudie' },
      { id:'s5', block:'b7', farmer:'f_zulu',    date:'2026-07-18', status:'New',         ph:null,om:null, ca_mg:null, microbial:null, p:null, flag:'Collected on farm — pending upload', advisor:'rep_johan' }
    ];
    // BioAnalyze — leaf-sap
    var leaf = [
      { id:'l1', block:'b1', farmer:'f_joubert', date:'2026-07-20', status:'Interpreted', crop:'Macadamia', flag:'Ca & B low pre-nut fill — foliar', n:'2.1%', k:'0.9%', ca:'0.6%', advisor:'rep_juba' },
      { id:'l2', block:'b4', farmer:'f_venter',  date:'2026-07-15', status:'Interpreted', crop:'Citrus',    flag:'Balanced — hold',  n:'2.6%', k:'1.4%', ca:'3.1%', advisor:'rep_juba' },
      { id:'l3', block:'b3', farmer:'f_joubert', date:'2026-07-22', status:'New',         crop:'Avocado',   flag:'Sap collected — pending', n:null,k:null,ca:null, advisor:'rep_juba' }
    ];
    // BioWatch — seasonal monitoring visits
    var watch = [
      { id:'w1', block:'b1', farmer:'f_joubert', date:'2026-07-24', advisor:'rep_juba', stage:'Nut fill', weather:'Dry, 24°C', soilMoist:'Moderate', pest:'Stink bug – low', vigour:'Good', note:'Canopy strong after SoilPrime. Watch stink bug next 2 wks.', photos:2 },
      { id:'w2', block:'b4', farmer:'f_venter',  date:'2026-07-21', advisor:'rep_juba', stage:'Flowering', weather:'Mild, 21°C', soilMoist:'Good', pest:'None', vigour:'Excellent', note:'Flowering even. Foliar Ca timed for petal fall.', photos:3 },
      { id:'w3', block:'b7', farmer:'f_zulu',    date:'2026-07-19', advisor:'rep_johan', stage:'Tillering', weather:'Humid, 27°C', soilMoist:'Wet', pest:'Eldana – monitor', vigour:'Fair', note:'Waterlogging low block. Recommend HumiMax for structure.', photos:1 },
      { id:'w4', block:'b8', farmer:'f_smit',    date:'2026-07-17', advisor:'rep_rudie', stage:'Regrowth', weather:'Cool, 16°C', soilMoist:'Good', pest:'Aphid – low', vigour:'Good', note:'Cutting 3 recovered well. Biology holding.', photos:2 }
    ];
    // BioConsult — regenerative programmes (recommendations)
    var programs = [
      { id:'pr1', farmer:'f_joubert', block:'b1', crop:'Macadamia', season:'2026/27', status:'Active',   advisor:'rep_juba', goal:'Rebuild biology + correct pH', lines:[
          {prod:'p_soilprime',rate:'5 L/ha',timing:'Planting rain',cost:65*340},
          {prod:'p_humimax',  rate:'5 L/ha',timing:'Aug',          cost:65*280},
          {prod:'p_calfix',   rate:'4 L/ha',timing:'Pre nut-fill', cost:65*255} ] },
      { id:'pr2', farmer:'f_venter',  block:'b4', crop:'Citrus',    season:'2026/27', status:'Active',   advisor:'rep_juba', goal:'Mg correction + fruit quality', lines:[
          {prod:'p_leafsap',  rate:'2 L/ha',timing:'Petal fall',   cost:70*420},
          {prod:'p_rootboost',rate:'2 L/ha',timing:'Spring flush', cost:70*395} ] },
      { id:'pr3', farmer:'f_zulu',    block:'b7', crop:'Sugarcane', season:'2026/27', status:'Draft',    advisor:'rep_johan',goal:'Soil structure on wet block', lines:[
          {prod:'p_humimax',  rate:'5 L/ha',timing:'Ratoon',       cost:120*280},
          {prod:'p_siligro',  rate:'3 L/ha',timing:'Tillering',    cost:120*310} ] }
    ];
    // Territory / country potential (Rudie's Excel → live)
    var territory = [
      { id:'t1', region:'Limpopo',        town:'Tzaneen',      crop:'Macadamia/Avo', farms:34, ha:12800, rep:'rep_juba',   potential:2450000, penetration:42, note:'Core subtropical belt' },
      { id:'t2', region:'Limpopo',        town:'Letsitele',    crop:'Citrus',        farms:28, ha:9400,  rep:'rep_juba',   potential:1980000, penetration:35, note:'Strong citrus cluster' },
      { id:'t3', region:'Southern Cape',  town:'George',       crop:'Pome/Veg',      farms:19, ha:5200,  rep:'rep_rudie',  potential:1120000, penetration:18, note:'New depot — growth focus' },
      { id:'t4', region:'Southern Cape',  town:'Oudtshoorn',   crop:'Lucerne/Veg',   farms:23, ha:6800,  rep:'rep_rudie',  potential:940000,  penetration:12, note:'Under-serviced' },
      { id:'t5', region:'KwaZulu-Natal',  town:'Ballito',      crop:'Cane/Banana',   farms:41, ha:18600, rep:'rep_johan',  potential:3100000, penetration:28, note:'High volume cane' },
      { id:'t6', region:'KwaZulu-Natal',  town:'Stanger',      crop:'Sugarcane',     farms:37, ha:15200, rep:'rep_johan',  potential:2600000, penetration:22, note:'Cane expansion' },
      { id:'t7', region:'Free State',     town:'Bloemfontein', crop:'Maize/Soya',    farms:52, ha:64000, rep:'rep_pieter', potential:4200000, penetration:6,  note:'Big row-crop upside' },
      { id:'t8', region:'Free State',     town:'Ficksburg',    crop:'Maize/Beans',   farms:44, ha:38000, rep:'rep_pieter', potential:2900000, penetration:4,  note:'Early-stage territory' }
    ];
    // Orders (from voice capture etc.)
    var orders = [
      { id:'o1', ref:'BB-1042', farmer:'f_joubert', rep:'rep_juba',  date:'2026-07-25', deliverMonth:6, status:'Confirmed', depot:'dep_tzaneen', source:'Voice', lines:[{prod:'p_soilprime',qty:325},{prod:'p_humimax',qty:325}] },
      { id:'o2', ref:'BB-1043', farmer:'f_venter',  rep:'rep_juba',  date:'2026-07-26', deliverMonth:8, status:'Forecast',  depot:'dep_tzaneen', source:'Voice', lines:[{prod:'p_leafsap',qty:140}] },
      { id:'o3', ref:'BB-1044', farmer:'f_zulu',    rep:'rep_johan', date:'2026-07-24', deliverMonth:9, status:'Awaiting stock', depot:'dep_ballito', source:'Portal', lines:[{prod:'p_humimax',qty:600},{prod:'p_siligro',qty:360}] },
      { id:'o4', ref:'BB-1041', farmer:'f_botha',   rep:'rep_rudie', date:'2026-07-20', deliverMonth:7, status:'Delivered', depot:'dep_george', source:'Portal', lines:[{prod:'p_calfix',qty:168}] },
      { id:'o5', ref:'BB-1045', farmer:'f_smit',    rep:'rep_rudie', date:'2026-07-27', deliverMonth:8, status:'Pending',   depot:'dep_george', source:'Voice', lines:[{prod:'p_carbon',qty:2200}] },
      // delivered & counted by the rep as a sale, but NOT yet invoiced — the reconciliation gap
      { id:'o6', ref:'BB-1046', farmer:'f_venter',  rep:'rep_juba',  date:'2026-07-22', deliverMonth:6, status:'Delivered', depot:'dep_tzaneen', source:'Voice',  lines:[{prod:'p_rootboost',qty:120}] },
      { id:'o7', ref:'BB-1047', farmer:'f_naidoo',  rep:'rep_johan', date:'2026-07-20', deliverMonth:6, status:'Delivered', depot:'dep_ballito', source:'Portal', lines:[{prod:'p_humimax',qty:200}] },
      // quote-to-cash demo: Juba quoted Gideon's pre nut-fill Cal-Fix, waiting on Rudie's approval
      { id:'o8', ref:'BB-1048', farmer:'f_joubert', rep:'rep_juba',  date:'2026-09-14', deliverMonth:9, status:'Pending',   depot:'dep_tzaneen', source:'Voice', lines:[{prod:'p_calfix',qty:260}],
        quote:{ status:'Awaiting approval', markupPct:8, createdBy:'rep_juba', createdAt:'2026-09-14' } }
    ];
    // Follow-ups — the programme timing turned into dated reminders for the advisor,
    // plus the automated farmer nudge (email + WhatsApp, 3 days before, with the weather window).
    var followups = [
      { id:'fu1', farmer:'f_joubert', rep:'rep_juba',  block:'b1', prod:'p_calfix',    due:'2026-09-17', what:'Cal-Fix pre nut-fill application', rate:'4 L/ha', status:'Scheduled', farmerNudge:'2026-09-14' },
      { id:'fu2', farmer:'f_venter',  rep:'rep_juba',  block:'b4', prod:'p_rootboost', due:'2026-09-20', what:'RootBoost on the spring flush',    rate:'2 L/ha', status:'Scheduled', farmerNudge:'2026-09-17' },
      { id:'fu3', farmer:'f_joubert', rep:'rep_juba',  block:'b3', prod:'p_leafsap',   due:'2026-10-02', what:'Leaf-sap re-sample — Hass Avo',    rate:'—',      status:'Scheduled', farmerNudge:'2026-09-29' },
      { id:'fu4', farmer:'f_botha',   rep:'rep_rudie', block:'b6', prod:'p_calfix',    due:'2026-09-22', what:'Cal-Fix second foliar',             rate:'4 L/ha', status:'Scheduled', farmerNudge:'2026-09-19' },
      { id:'fu5', farmer:'f_zulu',    rep:'rep_johan', block:'b7', prod:'p_humimax',   due:'2026-09-25', what:'HumiMax on the ratoon',             rate:'5 L/ha', status:'Scheduled', farmerNudge:'2026-09-22' }
    ];
    // Inventory per depot
    var inventory = [
      { depot:'dep_tzaneen', prod:'p_soilprime', qty:640,  reorder:400 },
      { depot:'dep_tzaneen', prod:'p_humimax',   qty:220,  reorder:400 },
      { depot:'dep_tzaneen', prod:'p_calfix',    qty:900,  reorder:300 },
      { depot:'dep_tzaneen', prod:'p_leafsap',   qty:80,   reorder:120 },
      { depot:'dep_ballito', prod:'p_humimax',   qty:1200, reorder:500 },
      { depot:'dep_ballito', prod:'p_siligro',   qty:150,  reorder:300 },
      { depot:'dep_ballito', prod:'p_bactoN',    qty:540,  reorder:300 },
      { depot:'dep_george',  prod:'p_calfix',    qty:60,   reorder:200 },
      { depot:'dep_george',  prod:'p_carbon',    qty:1800, reorder:800 },
      { depot:'dep_george',  prod:'p_soilprime', qty:120,  reorder:250 }
    ];
    // Blending / mixing jobs
    var blending = [
      { id:'bl1', depot:'dep_tzaneen', recipe:'Mac Starter Blend', batch:'2400 L', status:'Blending',  for:'f_joubert', due:'2026-07-30' },
      { id:'bl2', depot:'dep_ballito', recipe:'Cane Structure Mix',batch:'3600 L', status:'Planned',   for:'f_zulu',    due:'2026-08-04' },
      { id:'bl3', depot:'dep_george',  recipe:'Pome Cal Foliar',   batch:'800 L',  status:'Confirmed', for:'f_botha',   due:'2026-08-01' }
    ];
    var deliveries = [
      { id:'d1', order:'o1', farmer:'f_joubert', depot:'dep_tzaneen', status:'In transit', eta:'2026-07-29', transport:'Depot bakkie' },
      { id:'d2', order:'o4', farmer:'f_botha',   depot:'dep_george',  status:'Delivered',  eta:'2026-07-21', transport:'Courier' },
      { id:'d3', order:'o3', farmer:'f_zulu',    depot:'dep_ballito', status:'Awaiting stock', eta:'2026-08-12', transport:'—' }
    ];
    // Farm files (Drive replacement — one place, tagged to farm)
    var files = [
      { id:'ff1', farmer:'f_joubert', name:'Rietvlei — Soil Report Block A.pdf', kind:'Soil', date:'2026-06-16', size:'1.2 MB' },
      { id:'ff2', farmer:'f_joubert', name:'Rietvlei — 2026/27 Programme.pdf',   kind:'Programme', date:'2026-06-20', size:'480 KB' },
      { id:'ff3', farmer:'f_venter',  name:'Sunnyside — Leaf Sap Jul.pdf',       kind:'Leaf', date:'2026-07-15', size:'640 KB' },
      { id:'ff4', farmer:'f_zulu',    name:'Green Valley — BioWatch photos.zip', kind:'Monitoring', date:'2026-07-19', size:'3.4 MB' },
      { id:'ff5', farmer:'f_botha',   name:'Langkloof — Delivery Note BB-1041.pdf', kind:'Delivery', date:'2026-07-21', size:'210 KB' }
    ];

    // Team feed — how the 4 partners "communicate properly" while distributed
    var feed = [
      { id:'fd1', from:'rep_juba',  date:'2026-07-25', kind:'Order',  farmer:'f_joubert', ref:'BB-1042', text:'Signed Gideon on the full mac programme — 325 L SoilPrime + HumiMax for October. Captured by voice, in the pipeline.' },
      { id:'fd2', from:'rep_johan', date:'2026-07-24', kind:'Stock',  farmer:null, ref:null, text:'Ballito running low on SiliGro — 150 L left vs 300 reorder. Walter can you raise a PO with Zylem?' },
      { id:'fd3', from:'u_ops',   date:'2026-07-24', kind:'Note',   farmer:'f_zulu', ref:'BB-1044', text:'Green Valley cane order is awaiting stock — HumiMax landing 12 Aug, will confirm delivery then.' },
      { id:'fd4', from:'rep_rudie', date:'2026-07-23', kind:'Visit',  farmer:'f_botha', ref:null, text:'At Langkloof today — pome blocks looking good after Cal-Fix. Renier keen to add a second block next season.' }
    ];
    // Purchase orders raised with suppliers (the ops "order from the States" flow)
    var purchaseOrders = [
      { id:'po1', supplier:'sup_3', depot:'dep_ballito', date:'2026-07-20', status:'Ordered',  eta:'2026-08-24', by:'rep_ops', lines:[{prod:'p_rootboost',qty:400}] },
      { id:'po2', supplier:'sup_6', depot:'dep_tzaneen', date:'2026-07-18', status:'In transit',eta:'2026-08-29', by:'rep_ops', lines:[{prod:'p_humimax',qty:600}] }
    ];
    // Farmer invoices (customer-facing billing; syncs from the outsourced finance
    // system in production — seeded here). Due dates always the 25th.
    var invoices = [
      { id:'inv1', ref:'INV-1024', farmer:'f_joubert', order:'o1', date:'2026-05-10', dueDate:'2026-05-25', paidDate:'2026-05-22', description:'RenewAg SoilPrime + HumiMax — autumn application', amount:201500, status:'Paid' },
      { id:'inv2', ref:'INV-1041', farmer:'f_joubert', order:null, date:'2026-07-18', dueDate:'2026-08-25', paidDate:null,        description:'Cal-Fix — pre nut-fill programme', amount:66300, status:'Outstanding' },
      { id:'inv3', ref:'INV-1029', farmer:'f_venter',  order:null, date:'2026-06-20', dueDate:'2026-06-25', paidDate:'2026-06-24', description:'LeafSap foliar — petal fall', amount:58800, status:'Paid' },
      { id:'inv4', ref:'INV-1043', farmer:'f_venter',  order:'o2', date:'2026-07-26', dueDate:'2026-08-25', paidDate:null,        description:'RootBoost — spring flush', amount:55300, status:'Outstanding' },
      { id:'inv5', ref:'INV-1021', farmer:'f_botha',   order:'o4', date:'2026-07-05', dueDate:'2026-07-25', paidDate:'2026-07-19', description:'Cal-Fix delivery — order BB-1041', amount:42840, status:'Paid' },
      { id:'inv6', ref:'INV-1044', farmer:'f_zulu',    order:'o3', date:'2026-06-24', dueDate:'2026-07-25', paidDate:null,        description:'HumiMax + SiliGro — cane structure programme', amount:279600, status:'Overdue' },
      { id:'inv7', ref:'INV-1018', farmer:'f_zulu',    order:null, date:'2026-06-10', dueDate:'2026-06-25', paidDate:'2026-06-23', description:'Season opener — soil biology', amount:64200, status:'Paid' },
      { id:'inv8', ref:'INV-1045', farmer:'f_smit',    order:'o5', date:'2026-07-27', dueDate:'2026-08-25', paidDate:null,        description:'Carbon Kick — soil carbon & moisture', amount:418000, status:'Outstanding' }
    ];
    // Depot tasks — the per-warehouse to-do + hand-over list (mirrors the depot's Telegram group)
    var depotTasks = [
      { id:'dt1', depot:'dep_george',  text:'Blend 800 L Pome Cal Foliar for Langkloof — due Thu', by:'u_ops', due:'2026-09-17', status:'Open' },
      { id:'dt2', depot:'dep_george',  text:'Courier collects BB-1041 delivery note + labels at 10:00', by:'u_ops', due:'2026-09-16', status:'Open' },
      { id:'dt3', depot:'dep_tzaneen', text:'Receive HumiMax 600 L from Zylem (PO-2) — count on arrival', by:'u_ops', due:'2026-09-18', status:'Open' },
      { id:'dt4', depot:'dep_ballito', text:'Load Green Valley cane order once SiliGro lands', by:'u_ops', due:'2026-09-19', status:'Open' }
    ];
    // Outbox — invoices & reminders wake up as DRAFTS first; a person checks and sends (automation is switched on later)
    var outbox = [
      // Example drafts against the example farms. Flagged so a live client's outbox starts empty
      // and only ever holds their own messages.
      { id:'ob1', kind:'Reminder', to:'f_zulu', invoice:'inv6', subject:'Gentle reminder — INV-1044 (R279 600) is overdue', status:'Draft', created:'2026-09-15', channel:'Email + WhatsApp', demo:true },
      { id:'ob2', kind:'Invoice',  to:'f_smit', invoice:'inv8', subject:'Invoice INV-1045 — Carbon Kick (R418 000), due 25 Aug', status:'Sent', created:'2026-07-27', channel:'Email', demo:true }
    ];
    // Jobs to FreedomHub — one job = one conversation (demo, local)
    var jobs = [
      { id:'j1', title:'Vision map on Territory potential', brief:'Show where every territory, farmer, depot and team member is on a map of SA.', by:'u_rudie', created:'2026-09-14', status:'Shipped', band:'shipped', result:'Live on Territory potential — circles sized by potential, farmers, depots and team pins, region jump.', msgs:[
        { from:'u_rudie', at:'2026-09-14 11:20', text:'Can we see who is where on a map, like the vision map?' },
        { from:'fh', at:'2026-09-14 12:05', text:'Working on it — territories, farmers, depots and team on one map.' },
        { from:'fh', at:'2026-09-14 13:40', text:'Shipped. Tap any table row to fly to it. Works offline for the table; the map needs signal.' } ] },
      { id:'j2', title:'Forecast per product, per rep, per area, per month', brief:'We work with many products — need the forecast split by product, rep, area and month.', by:'u_rudie', created:'2026-09-14', status:'In flight', band:'flight', result:null, msgs:[
        { from:'u_rudie', at:'2026-09-14 14:52', text:'Sometimes you need a forecast per product, per rep, per area, per month.' },
        { from:'fh', at:'2026-09-15 08:10', text:'On it — building the pivot into Sales forecast. Will confirm here when it is live.' } ] },
      { id:'j3', title:'Pastel Evolution — which version do you run?', brief:'To build the daily sync we need the exact Sage 200 Evolution version and whether it is on-premise.', by:'fh', created:'2026-09-15', status:'Awaiting you', band:'needs', result:null, msgs:[
        { from:'fh', at:'2026-09-15 08:15', text:'Renzie — which version of Sage 200 Evolution are you on, and is it hosted on a server at the office? That decides how we sync invoices and customers into the portal.' } ] }
    ];
    var syncLog = [ { id:'sl1', system:'Sage 200 Evolution', last:'2026-09-15 06:00', next:'2026-09-15 12:00', pulled:'customers · invoices · payments · stock', status:'Design' } ];
    return { reps:reps, suppliers:suppliers, products:products, depots:depots, farmers:farmers,
      blocks:blocks, soil:soil, leaf:leaf, watch:watch, programs:programs, territory:territory,
      orders:orders, inventory:inventory, blending:blending, deliveries:deliveries, files:files,
      feed:feed, purchaseOrders:purchaseOrders, invoices:invoices, followups:followups, depotTasks:depotTasks, outbox:outbox, jobs:jobs, syncLog:syncLog,
      _seededAt:'2026-07-30' };
  }

  // ---------- STORE ----------------------------------------------
  var store;
  function load(){
    try { store = JSON.parse(localStorage.getItem(KEY)); } catch(e){ store=null; }
    if(!store || !store.reps){ store = seed(); save(); }
    else { migrate(); }
    return store;
  }
  // Non-destructive migration for devices that already hold an older store.
  function migrate(){
    var s0 = seed(), changed=false;
    Object.keys(s0).forEach(function(k){ if(k.charAt(0)!=='_' && !store[k]){ store[k]=s0[k]; changed=true; } });
    (store.reps||[]).forEach(function(r){ var sr=s0.reps.find(function(x){return x.id===r.id;}); if(!sr) return; if(r.markupPct==null){ r.markupPct=sr.markupPct; changed=true; } if(r.role!==sr.role||r.region!==sr.region){ r.role=sr.role; r.region=sr.region; changed=true; } });
    (store.depots||[]).forEach(function(dp){ var sd=s0.depots.find(function(x){return x.id===dp.id;}); if(sd && dp.manager!==sd.manager){ dp.manager=sd.manager; changed=true; } });
    s0.orders.forEach(function(so){ if(!(store.orders||[]).some(function(o){return o.id===so.id;})){ store.orders.push(so); changed=true; } });
    // Carry the demo:true markers onto devices that were seeded before they existed, or those
    // devices keep showing example agents and example drafts to a live client seat.
    Object.keys(s0).forEach(function(k){
      if(k.charAt(0)==='_' || !Array.isArray(s0[k]) || !Array.isArray(store[k])) return;
      s0[k].forEach(function(sr){
        if(sr.demo !== true) return;
        var mine = store[k].find(function(x){ return x.id===sr.id; });
        if(mine && mine.demo !== true){ mine.demo = true; changed = true; }
      });
    });
    if(changed) save();
  }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(store)); }catch(e){} }
  load();

  // offline write queue
  function queue(){ try{ return JSON.parse(localStorage.getItem(QKEY))||[]; }catch(e){ return []; } }
  function setQueue(q){ try{ localStorage.setItem(QKEY, JSON.stringify(q)); }catch(e){} }
  function enqueue(entry){ var q=queue(); q.push(Object.assign({at:Date.now()}, entry)); setQueue(q); }
  function flushQueue(){ setQueue([]); } // demo: "sync" clears the queue

  // helpers
  function uid(p){ return (p||'id')+'_'+Math.random().toString(36).slice(2,8); }
  // ---- SEAT SCOPING -------------------------------------------------
  // An advisor sees ONLY their own farmers/orders/forecast/territory/farm records.
  // A warehouse seat sees ONLY its own depot's stock, blending, deliveries, POs.
  // Directors and operations see the company. Applied centrally in all()/where()
  // so every page is scoped by construction; by() stays unscoped for lookups.
  function scope(){
    var u = window.BB && window.BB.user; if(!u) return null;
    if(u.roleKey==='advisor' && u.rep) return { rep:u.rep };
    if(u.roleKey==='warehouse' && u.depot) return { depot:u.depot };
    if(u.roleKey==='farmer' && u.farmer) return { farmer:u.farmer };
    return null;
  }
  function myFarmerIds(rep){ return (store.farmers||[]).filter(function(f){return f.rep===rep;}).map(function(f){return f.id;}); }
  function visible(t, r, sc){
    if(!sc) return true;
    if(sc.rep){
      var mine;
      switch(t){
        case 'reps':      return r.id===sc.rep;
        case 'farmers': case 'orders': case 'territory': case 'followups': return r.rep===sc.rep;
        case 'soil': case 'leaf': case 'watch': case 'programs':
          if(r.advisor===sc.rep) return true; mine=myFarmerIds(sc.rep); return mine.indexOf(r.farmer)>=0;
        case 'blocks': case 'files': case 'invoices': case 'deliveries':
          mine=myFarmerIds(sc.rep); return mine.indexOf(r.farmer)>=0;
        case 'blending': mine=myFarmerIds(sc.rep); return mine.indexOf(r['for'])>=0;
        case 'feed': if(r.from===sc.rep) return true; if(!r.farmer) return true; mine=myFarmerIds(sc.rep); return mine.indexOf(r.farmer)>=0;
        case 'inventory': case 'purchaseOrders': case 'outbox': case 'syncLog': return false; // company stock/finance is not the advisor's
        case 'depotTasks': return false;
        default: return true;
      }
    }
    if(sc.farmer){
      switch(t){
        case 'farmers': return r.id===sc.farmer;
        case 'reps': var me=(store.farmers||[]).find(function(f){return f.id===sc.farmer;}); return !!me && r.id===me.rep;
        case 'orders': case 'blocks': case 'soil': case 'leaf': case 'watch': case 'programs': case 'files': case 'invoices': case 'deliveries': case 'followups': return r.farmer===sc.farmer;
        case 'blending': return r['for']===sc.farmer;
        case 'feed': case 'territory': case 'inventory': case 'purchaseOrders': case 'suppliers': case 'depots': case 'depotTasks': case 'outbox': case 'syncLog': case 'jobs': return false;
        default: return true;
      }
    }
    if(sc.depot){
      switch(t){
        case 'depots': return r.id===sc.depot;
        case 'inventory': case 'blending': case 'deliveries': case 'purchaseOrders': case 'orders': case 'depotTasks': return r.depot===sc.depot;
        case 'outbox': case 'syncLog': case 'jobs': return false;
        case 'files': case 'invoices': case 'territory': case 'soil': case 'leaf': case 'watch': case 'programs': case 'followups': return false; // company documents stay out of the depot seat
        default: return true;
      }
    }
    return true;
  }
  // ---- the sample-data cut-off ---------------------------------------------------------------
  // Once a client is running on their own figures, their own people must never be shown the
  // portal's example farms, orders or samples — not on a page we forgot, not as a fallback when
  // their own list comes back empty. So it is enforced here, at the store, rather than page by
  // page. FreedomHub seats keep everything, because that is how the product gets demonstrated.
  // Collections that hold genuinely portal-native work (the job list, the sync log, the outbox
  // that people fill themselves) are not seeded business data and stay.
  var SEEDED = ['farmers','farms','blocks','orders','quotes','invoices','inventory',
    'deliveries','blending','soil','leaf','watch','programs','followups','suppliers','purchaseOrders',
    'products','territory','files','labels','depotTasks','feed'];
  function clientLiveSeat(){
    try{
      if(!(window.BB && BB.auth)) return false;
      if(BB.auth.isFreedomHub && BB.auth.isFreedomHub()) return false;
      return !!(BB.auth.tenantLive && BB.auth.tenantLive());
    }catch(e){ return false; }
  }
  function fromTheirSystem(r){ return !!(r && (r.src==='sage' || r.sageId)); }
  function cut(t, list){
    if(!clientLiveSeat()) return list;
    // A record flagged demo:true is an example, whatever collection it sits in.
    list = list.filter(function(r){ return !(r && r.demo === true); });
    if(SEEDED.indexOf(t) < 0) return list;
    return list.filter(fromTheirSystem);
  }
  // Overdue is worked out from the due date, never hand-set: an invoice still owed after its
  // due date is Overdue, and one paid or not yet due is not. Every page reads through here, so the
  // Overdue figure, the age chart, the delivery hold and the farm record all agree. (Rule pending
  // BioBrix sign-off; with Sage live its own ageing could replace it.)
  function ageInvoices(){
    var today=new Date().toISOString().slice(0,10);
    (store.invoices||[]).forEach(function(i){
      if(i.status!=='Outstanding' && i.status!=='Overdue') return;
      if(i.outstanding!=null && i.src==='sage' && i.outstanding<=0.5) return;
      i.status = (i.dueDate && i.dueDate < today) ? 'Overdue' : 'Outstanding';
    });
  }
  function all(t){ if(t==='invoices') ageInvoices(); var sc=scope(); return cut(t, (store[t]||[]).filter(function(r){ return visible(t,r,sc); })); }
  function by(t, id){ if(t==='invoices') ageInvoices(); var r=(store[t]||[]).find(function(x){return x.id===id;})||null;
    if(!r || !clientLiveSeat()) return r;
    if(r.demo === true) return null;
    return (SEEDED.indexOf(t)>=0 && !fromTheirSystem(r)) ? null : r; }
  function where(t, fn){ if(t==='invoices') ageInvoices(); var sc=scope(); return cut(t, (store[t]||[]).filter(function(r){ return visible(t,r,sc) && fn(r); })); }
  // Unscoped means "not filtered by whose seat this is" — it does not mean "including examples".
  function allUnscoped(t){ if(t==='invoices') ageInvoices(); return cut(t, (store[t]||[]).slice()); }
  function add(t, rec){ if(!rec.id) rec.id=uid(t); store[t]=store[t]||[]; store[t].unshift(rec); save(); enqueue({op:'create',table:t,id:rec.id}); return rec; }
  function remove(t, id){ var a=store[t]||[], i=a.findIndex(function(x){ return x.id===id; }); if(i<0) return false; a.splice(i,1); save(); enqueue({op:'delete',table:t,id:id}); return true; }
  // Put a record back exactly as a snapshot had it (keys added since are dropped): the Undo behind a toast.
  function restore(t, snap){ var r=(store[t]||[]).find(function(x){ return x.id===snap.id; });
    if(!r){ (store[t]=store[t]||[]).unshift(JSON.parse(JSON.stringify(snap))); }
    else { Object.keys(r).forEach(function(k){ if(!(k in snap)) delete r[k]; }); Object.assign(r, JSON.parse(JSON.stringify(snap))); }
    save(); enqueue({op:'update',table:t,id:snap.id}); return true; }
  function update(t, id, patch){ var r=by(t,id); if(r){ Object.assign(r,patch); save(); enqueue({op:'update',table:t,id:id}); } return r; }

  // lookups
  function rep(id){ return by('reps',id)||{name:'—',colour:'#888'}; }
  // person() resolves reps AND non-rep staff (ops/warehouse) for the team feed
  var STAFF = { u_ops:{name:'Renzie Botha',role:'Logistics & Orders',colour:'#2f6f9e'}, u_wh:{name:'Wentzel Kruger',role:'Warehouse',colour:'#7a4fa3'},
    u_nadine:{name:'Nadine du Plessis',role:'Financial Management',colour:'#8a5a2b'}, u_wikus:{name:'Wikus Steyn',role:'Accounts',colour:'#8a5a2b'}, u_koos:{name:'Koos Smit',role:'Financial Advisory',colour:'#3f6b28'},
    u_farmer:{name:'Gideon Joubert',role:'Farmer',colour:'#68a53e'}, fh:{name:'FreedomHub team',role:'',colour:'#b89b5e'} };
  function person(id){
    var r=by('reps',id); if(r) return {name:r.name,role:r.role,colour:r.colour};
    var usr=(window.BB && window.BB.users || []).find(function(x){ return x.id===id; });
    if(usr){ var rr=usr.rep?by('reps',usr.rep):null; var st=STAFF[id]; return {name:usr.name, role:usr.role, colour: rr?rr.colour:(st?st.colour:'#3f6b28')}; }
    return STAFF[id]||{name:'BioBrix',role:'',colour:'#3f6b28'};
  }
  function farmer(id){ return by('farmers',id)||{name:'—',farm:'—'}; }
  function product(id){ return by('products',id)||{name:'—',price:0,pack:'',code:''}; }
  function depot(id){ return by('depots',id)||{name:'—'}; }
  function supplier(id){ return by('suppliers',id)||{name:'—'}; }

  // Quantities are counted in packs. A pack's size comes from its label ("20 L", "25 kg"), so
  // a litre total can sit beside the pack count and a spoken "1 000 litres" becomes 50 packs.
  function packSize(id){ var m=String(product(id).pack||'').match(/([\d.,]+)\s*(L|kg)\b/i); return m? { n:parseFloat(m[1].replace(',','.')), u:m[2].toLowerCase()==='kg'?'kg':'L' } : null; }
  function volumeLabel(id, packs){ var z=packSize(id); if(!z||!packs) return ''; var v=z.n*Number(packs); return (Math.round(v*10)/10).toLocaleString('en-ZA')+' '+z.u; }
  function orderValue(o){ return (o.lines||[]).reduce(function(s,l){ return s + (product(l.prod).price||0)*(l.qty||0); },0); }

  // ---- finance helpers (credit limit · overdue hold · invoiced-vs-sale) ----
  // Outstanding account balance = every invoice not yet Paid.
  // With Sage connected the customer's own ledger balance is the truth — it is what finance sees in
  // Sage, so the portal must agree with it to the cent. Only fall back to summing invoices without it.
  function accountBalance(farmerId){
    var f=farmer(farmerId);
    if(f && f.sageBalance!=null) return f.sageBalance;
    return where('invoices',function(i){ return i.farmer===farmerId && i.status!=='Paid'; }).reduce(function(s,i){ return s+(i.outstanding!=null?i.outstanding:i.amount||0); },0);
  }
  function isOverdue(farmerId){ return where('invoices',function(i){ return i.farmer===farmerId && i.status==='Overdue'; }).length>0; }
  function creditLimit(farmerId){ var f=farmer(farmerId); return f&&f.creditLimit!=null?f.creditLimit:0; }
  function availableCredit(farmerId){ return creditLimit(farmerId) - accountBalance(farmerId); }
  // Would this extra order value push them over their limit?
  function overLimit(farmerId, extra){ extra=extra||0; return creditLimit(farmerId)>0 && (accountBalance(farmerId)+extra) > creditLimit(farmerId); }
  // An order counts as INVOICED (actual revenue) once an invoice references it.
  function orderInvoiced(orderId){ return where('invoices',function(i){ return i.order===orderId; }).length>0; }
  // Delivery hold if account overdue OR (order would take them over limit)
  function deliveryHold(order){
    if(!order) return null;
    if(isOverdue(order.farmer)) return {sev:'high', reason:'Account overdue — do not deliver until paid'};
    if(overLimit(order.farmer, orderValue(order))) return {sev:'med', reason:'Over credit limit — needs approval'};
    return null;
  }

  // ---- quote-to-cash helpers ----
  // quote total = list price + the agent's margin % (each rep has a preset, editable per quote)
  function quotePct(o){ return (o && o.quote && o.quote.markupPct!=null) ? Number(o.quote.markupPct)||0 : 0; }
  function quoteTotal(o){ return Math.round(orderValue(o) * (1 + quotePct(o)/100)); }
  function agentMargin(o){ return quoteTotal(o) - orderValue(o); }
  function quoteStatus(o){ return (o && o.quote && o.quote.status) || null; }

  // ---- geo + weather (for the farmer nudge: "good window to apply is Thursday") ----
  var GEO = { tzaneen:[-23.8330,30.1630], letsitele:[-23.8760,30.3930], george:[-33.9630,22.4617], oudtshoorn:[-33.5906,22.2014],
    ballito:[-29.5390,31.2140], stanger:[-29.3370,31.2890], bloemfontein:[-29.0852,26.1596], ficksburg:[-28.8730,27.8770] };
  function geo(town){ return GEO[String(town||'').trim().toLowerCase()]||null; }
  // 7-day forecast from Open-Meteo (free, no key). Resolves null when offline.
  function forecast7(town){
    var c=geo(town); if(!c || typeof fetch!=='function' || !navigator.onLine) return Promise.resolve(null);
    var url='https://api.open-meteo.com/v1/forecast?latitude='+c[0]+'&longitude='+c[1]+'&daily=weathercode,temperature_2m_max,precipitation_probability_max,wind_speed_10m_max&timezone=Africa%2FJohannesburg&forecast_days=7';
    return fetch(url).then(function(r){ return r.ok? r.json():null; }).then(function(j){
      if(!j||!j.daily) return null;
      var days=j.daily.time.map(function(t,i){ return { date:t, code:j.daily.weathercode[i], tmax:j.daily.temperature_2m_max[i], rain:j.daily.precipitation_probability_max[i], wind:j.daily.wind_speed_10m_max[i] }; });
      // best application window: low rain chance, calm wind, not the first day
      var best=days.slice(1).slice().sort(function(a,b){ return (a.rain+a.wind*0.8)-(b.rain+b.wind*0.8); })[0]||null;
      return { days:days, best:best };
    }).catch(function(){ return null; });
  }
  function wxIcon(code){ if(code==null) return '·'; if(code===0) return '☀️'; if(code<=2) return '🌤'; if(code===3) return '☁️'; if(code<=49) return '🌫'; if(code<=67) return '🌧'; if(code<=77) return '🌨'; if(code<=82) return '🌦'; return '⛈'; }

  // ---- crop prep — the right questions before a visit (seeded; production pulls from BioBrix's own data sets) ----
  var CROP_PREP = {
    'Macadamia': { problems:['Stink bug & nut borer pressure', 'Low soil biology on old orchards', 'Ca:B balance pre nut-fill', 'Phytophthora on wet soils'], questions:['How was last season\u2019s kernel recovery and sound-kernel %?', 'When did you last see a soil biology reading?', 'Are you seeing stink-bug damage at nut set?', 'Any waterlogging on the low blocks?'], products:['p_soilprime','p_calfix','p_leafsap'] },
    'Avocado':   { problems:['Root rot (Phytophthora)', 'Alternate bearing', 'Calcium uptake for fruit quality'], questions:['How is the canopy holding through flowering?', 'Which rootstock, and any root-rot history?', 'Are you mulching and feeding the biology?'], products:['p_rootboost','p_calfix','p_humimax'] },
    'Citrus':    { problems:['Ca:Mg imbalance', 'Creasing & rind quality', 'Soil compaction on old rows'], questions:['What was your pack-out and class-1 %?', 'Any creasing or rind breakdown last season?', 'When last did you do a leaf-sap during petal fall?'], products:['p_leafsap','p_rootboost','p_humimax'] },
    'Sugarcane': { problems:['Eldana', 'Waterlogging & poor structure', 'Ratoon decline'], questions:['How many ratoons on the block, and tons/ha trend?', 'Eldana counts this season?', 'Do the low blocks drain after rain?'], products:['p_humimax','p_siligro','p_bactoN'] },
    'Maize':     { problems:['Soil carbon loss', 'Moisture stress', 'Compaction from traffic'], questions:['Yield trend over 3 seasons?', 'Are you strip-tilling or full till?', 'What is your organic-matter reading?'], products:['p_carbon','p_humimax','p_bactoN'] },
    'Lucerne':   { problems:['Biology decline after cuttings', 'Aphid pressure', 'Ca supply for regrowth'], questions:['How many cuttings a season and regrowth speed?', 'Aphid pressure on regrowth?'], products:['p_soilprime','p_calfix'] },
    'Apple':     { problems:['Bitter pit (Ca)', 'Replant disease', 'Colour & storage quality'], questions:['Bitter pit incidence in storage?', 'Which blocks are replant sites?', 'Leaf-sap at fruit set?'], products:['p_calfix','p_leafsap','p_rootboost'] }
  };
  function cropPrep(crop){ var k=Object.keys(CROP_PREP).find(function(c){ return String(crop||'').toLowerCase().indexOf(c.toLowerCase())>=0; }); return k? Object.assign({crop:k}, CROP_PREP[k]) : null; }
  // "Worth the trip?" — the pre-visit financial insight Rudie asked for
  function tripInsight(farmerId){
    var f=farmer(farmerId); var over=isOverdue(farmerId); var bal=accountBalance(farmerId); var lim=creditLimit(farmerId); var avail=lim-bal;
    var open=where('orders',function(o){ return o.farmer===farmerId && (o.status==='Forecast'||o.status==='Pending'); }).reduce(function(s,o){ return s+orderValue(o); },0);
    var verdict, sev;
    if(over){ verdict='Call first — account overdue'; sev='bad'; }
    else if(lim>0 && avail<=0){ verdict='Over limit — needs approval before an order'; sev='warn'; }
    else if(lim>0 && avail < 0.25*lim){ verdict='Tight — R'+Math.round(avail/1000)+'k headroom'; sev='warn'; }
    else if(f.status==='Prospect'){ verdict='Prospect — set a credit limit first'; sev='grey'; }
    else { verdict='Worth the trip'; sev='ok'; }
    return { overdue:over, balance:bal, limit:lim, available:avail, openPipeline:open, verdict:verdict, sev:sev };
  }

  // ---- Sage 200 Evolution mirror (live mode) ---------------------------------
  // Snapshot shape (built by sync/sage_sync.py on the FreedomHub VM, served by the Worker):
  //   customers[{id,code,name,balance,creditLimit,overdue,email,phone,town,rep}]
  //   invoices [{id,ref,customer,date,dueDate,amount,outstanding,status,description,order}]
  //   payments [{id,customer,date,ref,amount,description}]   stock[{id,code,description,onHand,unit,price}]
  //   meta {status,last,lastSast,next,counts,lastError}
  var SKEY='bb_sage_v1';
  var sage=null;
  function sageCached(){ try{ return JSON.parse(localStorage.getItem(SKEY)); }catch(e){ return null; } }
  function norm(s){ return String(s||'').toLowerCase().replace(/\(pty\)|ltd|boerdery|farm|farms|\./g,'').replace(/[^a-z0-9]/g,''); }
  // Lay the snapshot over the store: every Sage customer becomes (or updates) a farmer record,
  // Sage invoices REPLACE the seeded invoices, credit limits + balances come from Sage.
  function applySage(snap){
    // only a snapshot from a SUCCESSFUL sync (meta.last set, customers present) may replace the seeded figures
    if(!snap || !snap.live || !snap.meta || !snap.meta.last) return false;
    // A depot is served product movement only — no ledger reaches it. That snapshot is still real
    // and must be published to the pages, it simply has nothing to lay over the customer records.
    if(snap.productsOnly){ sage = snap; return true; }
    if(!Array.isArray(snap.customers)) return false;
    // An advisor whose accounts have not been allocated yet gets a real, empty list. That is not a
    // failed sync and must not be reported as one — the pages say plainly that nothing is allocated.
    if(!snap.customers.length){ sage = snap; return true; }
    // Classify ONCE, on the snapshot itself, so every page shows the same honest label whether it
    // reads the raw feed (home, the board) or the mapped store (finance). A balance brought
    // forward from a previous system is not an invoice and must never be labelled as one.
    (snap.invoices||[]).forEach(function(i){
      if(i.label) return;
      var du=String(i.description||'').toUpperCase(), ru=String(i.ref||'').toUpperCase();
      i.kind = i.kind || ((ru==='BF'||ru==='B/F'||ru==='OB'||du.indexOf('OPENING BALANCE')>=0) ? 'opening'
                        : ((du.indexOf('JOURNAL')>=0||du.indexOf('INTEREST')>=0) ? 'journal' : 'invoice'));
      i.label = (i.kind==='opening') ? 'Opening balance' : (i.kind==='journal' ? 'Journal' : i.ref);
    });
    // the same due-date rule as the store (see ageInvoices), for pages that read the raw feed
    var td=new Date().toISOString().slice(0,10);
    (snap.invoices||[]).forEach(function(i){ if(i.status==='Paid' || !(i.outstanding>0.5)) return; i.status = (i.dueDate && i.dueDate<td) ? 'Overdue' : 'Outstanding'; });
    sage=snap;
    var farmers=store.farmers||[]; var byId={};
    snap.customers.forEach(function(c){
      var f=farmers.find(function(x){ return x.sageId===c.id; }) || farmers.find(function(x){ return norm(x.name)===norm(c.name) || norm(x.farm)===norm(c.name); });
      if(!f){ f={ id:'sage_'+c.id, name:c.name, farm:c.name, town:c.town||'', status:'Active', rep:c.rep||null, crop:'', ha:0, src:'sage' }; farmers.push(f); }
      f.sageId=c.id; f.sageCode=c.code; if(c.creditLimit!=null) f.creditLimit=c.creditLimit; f.sageBalance=c.balance;
      if(c.email && !f.email) f.email=c.email; if(c.phone && !f.cell) f.cell=c.phone; if(c.rep && !f.rep) f.rep=c.rep;
      byId[c.id]=f.id;
    });
    store.farmers=farmers;
    store.invoices=snap.invoices.map(function(i){
      return { id:'sinv_'+i.id, ref:i.ref, kind:i.kind, label:i.label,
               farmer:byId[i.customer]||null, order:i.order||null, date:i.date, dueDate:i.dueDate, paidDate:i.paidDate||null,
               description:i.description||'', amount:i.amount||0, outstanding:i.outstanding||0, status:i.status||'Outstanding', src:'sage' };
    });
    store.payments=(snap.payments||[]).map(function(p){ return { id:'spay_'+p.id, farmer:byId[p.customer]||null, date:p.date, ref:p.ref, amount:p.amount||0, description:p.description||'', src:'sage' }; });
    store.sageStock=snap.stock||[];
    var m=snap.meta||{};
    store.syncLog=[{ id:'sl1', system:'Sage 200 Evolution', last:m.lastSast||'—', next:m.next||'—', pulled:'customers · invoices · payments · stock', status:m.status||'Live', lastError:m.lastError||null, counts:m.counts||null }];
    save(); return true;
  }
  // Fetch the latest snapshot behind the session; cache it; tell pages. Resolves true when new data landed.
  function refreshSage(){
    if(!(window.BB&&BB.auth&&BB.auth.live)) return Promise.resolve(false);
    if(typeof fetch!=='function' || !navigator.onLine) return Promise.resolve(false);
    // A depot seat has neither finance nor sales, and is served product movement only — it still
    // needs the snapshot, or its one live page would sit empty.
    if(!BB.auth.can('finance') && !BB.auth.can('sales') && !BB.auth.can('dispatch')) return Promise.resolve(false);
    return BB.auth.fetch('/sage').then(function(j){
      if(!j||!j.ok) return false;
      if(!j.live){ var sl=store.syncLog&&store.syncLog[0]; if(sl&&sl.status!=='Design'){ sl.status='Design'; save(); } return false; }
      try{ localStorage.setItem(SKEY, JSON.stringify(j)); }catch(e){}
      var ok=applySage(j);
      if(ok){ try{ window.dispatchEvent(new CustomEvent('bb:sage',{detail:j.meta})); }catch(e){} }
      return ok;   // pages listen for bb:sage and draw again — see index/operations/farms/finance
    }).catch(function(){ return false; });
  }
  // ---- The sample ledger (demo mode only) ---------------------------------------------------
  // Live seats get BioBrix's Sage snapshot from the Worker. The demo has no Worker, so without this
  // every page built on the ledger (Forecast & actual, Product movement, Sales report, the
  // Finance ledger) would sit empty. This is a made-up ledger in exactly the snapshot's shape,
  // built from the sample farms, products and reps: about 15 months of invoices and payments
  // running up to this month, plus the sample invoices the order journeys use. It is rebuilt on
  // every load and never written under the snapshot's own key, so a demo seat is never mistaken
  // for a business on its own figures. It is laid over the store once per version, so invoices
  // made during a demo are not wiped by the next page load.
  var DEMO_LEDGER_V = 1;
  function demoLedger(){
    var seedN = 20261009, rnd = function(){ seedN = (seedN*1103515245 + 12345) % 2147483648; return seedN/2147483648; };
    var iso = function(dt){ return dt.toISOString().slice(0,10); };
    var addDays = function(ds, n){ var t=new Date(ds+'T00:00:00Z'); t.setUTCDate(t.getUTCDate()+n); return iso(t); };
    var monthEnd25 = function(ds){ var t=new Date(ds+'T00:00:00Z'); return iso(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth()+1, 25))); };
    var today = iso(new Date()), now = new Date();
    var farmersS = (store.farmers||[]).filter(function(f){ return f.status!=='Prospect' && !f.src; });
    var prods = (store.products||[]).filter(function(x){ return x.price; });
    var custOf = {}, customers = farmersS.map(function(f, k){
      var id = String(2001+k); custOf[f.id] = id;
      return { id:id, code:'BB'+String(k+1).padStart(3,'0'), name:f.name, town:f.town||'', phone:f.cell||'', email:f.email||'',
               creditLimit:f.creditLimit||0, sageRep:f.rep||null, rep:f.rep||null, balance:0, overdue:0 };
    });
    // spring is the big season for biologicals; winter is quiet
    var SEASON = [0.7,0.6,0.8,0.9,0.5,0.4,0.6,1.2,1.5,1.4,1.1,0.8];
    var invoices = [], payments = [], pm = {}, n = 0;
    var line = function(p, q){ return { prod:p, qty:q, value:q*(p.price||0) }; };
    for(var back=15; back>=0; back--){
      var y = now.getUTCFullYear(), m = now.getUTCMonth()-back; while(m<0){ m+=12; y--; }
      farmersS.forEach(function(f, fi){
        if(rnd() > 0.55*SEASON[m]+0.15) return;
        var day = 1+Math.floor(rnd()*27), date = y+'-'+String(m+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
        if(date > today) return;
        var size = (f.ha||200)/250, lines = [];
        var k = 1+Math.floor(rnd()*3);
        for(var j=0;j<k;j++){ var p = prods[Math.floor(rnd()*prods.length)]; lines.push(line(p, Math.max(5, Math.round((20+rnd()*140)*size*SEASON[m])))); }
        var amount = Math.round(lines.reduce(function(t,l){ return t+l.value; },0));
        var due = monthEnd25(date), age = (Date.parse(today)-Date.parse(date))/86400000;
        // most of the book is paid; the last six weeks or so is still open
        var paid = age > 45 || (age > 30 && rnd() < 0.5);
        var id = 'dl'+(++n), ref = 'INV-'+(900+n);
        invoices.push({ id:id, ref:ref, customer:custOf[f.id], date:date, dueDate:due, paidDate:paid?addDays(date, 14+Math.floor(rnd()*30)):null,
          amount:amount, outstanding:paid?0:amount, status:paid?'Paid':'Outstanding', description:lines.map(function(l){ return l.prod.name.replace(/^RenewAg\s+/,''); }).join(' + ') });
        if(paid) payments.push({ id:'dp'+n, customer:custOf[f.id], date:invoices[invoices.length-1].paidDate, ref:'EFT '+ref, amount:amount, description:'Payment — '+ref });
        var ym = date.slice(0,7);
        lines.forEach(function(l){ var r = pm[l.prod.id] || (pm[l.prod.id] = { code:l.prod.code, name:l.prod.name, pack:l.prod.pack||'', qty:0, value:0, months:{} });
          var mm = r.months[ym] || (r.months[ym] = { qty:0, value:0 }); mm.qty += l.qty; mm.value += l.value; r.qty += l.qty; r.value += l.value; });
      });
    }
    // the sample invoices the order journeys rely on (order links, the overdue hold) stay in the book
    // Their dates move with the calendar so the story holds whenever the demo is opened: Thabo Zulu's
    // account is the one overdue (the delivery hold), the other open ones are inside their terms.
    seed().invoices.forEach(function(i){ if(!custOf[i.farmer]) return;
      i = Object.assign({}, i);
      if(i.status!=='Paid'){ var od = i.status==='Overdue'; i.date = addDays(today, od? -75 : -18); i.dueDate = od? addDays(today, -40) : monthEnd25(i.date); }
      else { var shift = Math.round((Date.parse(today)-Date.parse('2026-08-10'))/86400000); i.date=addDays(i.date, shift); i.dueDate=addDays(i.dueDate, shift); i.paidDate=addDays(i.paidDate, shift); }
      invoices.push({ id:'ds_'+i.id, ref:i.ref, customer:custOf[i.farmer], order:i.order, date:i.date, dueDate:i.dueDate, paidDate:i.paidDate,
        amount:i.amount, outstanding:i.status==='Paid'?0:i.amount, status:i.status==='Paid'?'Paid':'Outstanding', description:i.description });
      if(i.status==='Paid') payments.push({ id:'dps_'+i.id, customer:custOf[i.farmer], date:i.paidDate, ref:'EFT '+i.ref, amount:i.amount, description:'Payment — '+i.ref }); });
    invoices.sort(function(a,b){ return a.date<b.date?1:-1; });
    customers.forEach(function(c){ invoices.forEach(function(i){ if(i.customer!==c.id || !i.outstanding) return; c.balance += i.outstanding; if(i.dueDate < today) c.overdue += i.outstanding; }); });
    var stamp = new Date().toLocaleString('en-ZA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
    return { ok:true, live:true, demo:true, customers:customers, invoices:invoices, payments:payments,
      reps:(store.reps||[]).map(function(r){ return { id:r.id, name:r.name }; }),
      products:Object.keys(pm).map(function(k){ return pm[k]; }).sort(function(a,b){ return b.value-a.value; }),
      stock:(store.products||[]).map(function(x){ var on=(store.inventory||[]).filter(function(i){ return i.prod===x.id; }).reduce(function(t,i){ return t+(i.qty||0); },0);
        return { id:x.id, code:x.code, description:x.name, onHand:on, unit:x.unit||'', price:x.price||0 }; }),
      meta:{ status:'Live', last:new Date().toISOString(), lastSast:stamp+' (sample)', next:'—', counts:{ customers:customers.length, invoices:invoices.length, payments:payments.length } } };
  }
  if(window.BB_CONFIG && window.BB_CONFIG.AUTH==='demo'){
    try{
      var dl = demoLedger();
      if(store._demoLedger !== DEMO_LEDGER_V){ if(applySage(dl)){ (store.outbox||[]).forEach(function(x){ if(x.invoice && /^inv\d+$/.test(x.invoice)) x.invoice='sinv_ds_'+x.invoice; }); store._demoLedger = DEMO_LEDGER_V; save(); } }
      else { (dl.invoices||[]).forEach(function(i){ i.kind='invoice'; i.label=i.ref; }); sage = dl; }
    }catch(e){ console.warn('sample ledger', e); }
  }
  // On load: lay the cached snapshot over the store at once (offline-safe), then look for a newer one.
  if(window.BB_CONFIG && window.BB_CONFIG.AUTH==='live'){ var cached=sageCached(); if(cached) applySage(cached); setTimeout(function(){ refreshSage(); },0); }

  // ---- The plan: forecast, budget, commission, agent allocation ----------------
  // One person types these and everyone sees them, so they live on the server, not the device.
  // Cached locally so the page draws instantly and still works with no signal.
  var PKEY='bb_plan_v1';
  var plan=null;
  function planCached(){ try{ return JSON.parse(localStorage.getItem(PKEY)); }catch(e){ return null; } }
  function getPlan(){ return plan || planCached() || { forecasts:{}, budgets:{}, commission:{default:0,byProduct:{},byAgent:{}}, agents:{} }; }
  // The shared store accepts a write immediately but can serve an older copy to a reader for up to
  // about a minute. So a reload straight after typing could read the older copy — and a forecast
  // someone just entered would appear to vanish. Never let the server's copy remove something we
  // wrote more recently than the server's own timestamp.
  var LKEY='bb_plan_localat_v1';
  function localAt(){ try{ return parseInt(localStorage.getItem(LKEY),10)||0; }catch(e){ return 0; } }
  function markLocal(){ try{ localStorage.setItem(LKEY, String(Date.now())); }catch(e){} }
  function mergeSections(mine, theirs){
    var out={};
    ['forecasts','budgets','agents'].forEach(function(k){ out[k]=Object.assign({}, (theirs||{})[k], (mine||{})[k]); });
    out.commission=Object.assign({}, (theirs||{}).commission, (mine||{}).commission,
      { byProduct:Object.assign({}, ((theirs||{}).commission||{}).byProduct, ((mine||{}).commission||{}).byProduct),
        byAgent:Object.assign({}, ((theirs||{}).commission||{}).byAgent, ((mine||{}).commission||{}).byAgent) });
    out.updatedAt=(theirs||{}).updatedAt; out.updatedBy=(theirs||{}).updatedBy;
    return out;
  }
  function loadPlan(){
    if(!(window.BB&&BB.auth&&BB.auth.live)) return Promise.resolve(getPlan());
    if(typeof fetch!=='function' || !navigator.onLine) return Promise.resolve(getPlan());
    return BB.auth.fetch('/plan').then(function(j){
      if(!j||!j.ok) return getPlan();
      var theirs=j.plan, mine=getPlan();
      var serverAt = theirs && theirs.updatedAt ? new Date(theirs.updatedAt).getTime() : 0;
      // if we wrote after the copy we were just handed, keep ours on top of theirs
      plan = (localAt() > serverAt) ? mergeSections(mine, theirs) : theirs;
      try{ localStorage.setItem(PKEY, JSON.stringify(plan)); }catch(e){}
      try{ window.dispatchEvent(new CustomEvent('bb:plan',{detail:plan})); }catch(e){}
      return plan;
    }).catch(function(){ return getPlan(); });
  }
  // Save a patch — only the sections passed are touched, so two people editing different things
  // do not overwrite each other.
  function savePlan(patch){
    var cur=getPlan();
    ['forecasts','budgets','agents'].forEach(function(k){ if(patch[k]) cur[k]=Object.assign({}, cur[k], patch[k]); });
    if(patch.commission) cur.commission=Object.assign({}, cur.commission, patch.commission,
      { byProduct:Object.assign({}, (cur.commission||{}).byProduct, patch.commission.byProduct||{}),
        byAgent:Object.assign({}, (cur.commission||{}).byAgent, patch.commission.byAgent||{}) });
    plan=cur; try{ localStorage.setItem(PKEY, JSON.stringify(cur)); }catch(e){}
    markLocal();
    if(!(window.BB&&BB.auth&&BB.auth.live)) return Promise.resolve(cur);
    // A forecast that only reached this laptop is worse than one that failed loudly: the person
    // types a year of numbers believing the team can see them. Never report a save we did not get.
    return BB.auth.fetch('/plan',{method:'POST', body:patch}).then(function(j){
      if(j&&j.ok){ plan=j.plan; try{ localStorage.setItem(PKEY, JSON.stringify(plan)); }catch(e){} return getPlan(); }
      throw new Error((j&&j.error)||'the server did not accept it');
    }).catch(function(err){
      queuePlan(patch);
      var msg = (err&&err.message==='unauthenticated') ? 'Your sign-in has expired — sign in again and it will save.'
              : 'Not saved to the server yet — kept on this device and it will retry. '+((err&&err.message)||'');
      try{ if(window.BB&&BB.toast) BB.toast(msg); }catch(e){}
      throw err;   // the page decides what to show; it must not say "saved"
    });
  }
  // Who owns this account: what BioBrix set in the portal first, then whatever Sage carries.
  // Anything that failed to reach the server waits here and is retried on the next load and
  // whenever the browser comes back online.
  var QPKEY='bb_plan_queue_v1';
  function planQueue(){ try{ return JSON.parse(localStorage.getItem(QPKEY))||[]; }catch(e){ return []; } }
  function queuePlan(patch){ try{ var q=planQueue(); q.push({patch:patch, at:Date.now()}); localStorage.setItem(QPKEY, JSON.stringify(q.slice(-50))); }catch(e){} }
  function flushPlanQueue(){
    var q=planQueue(); if(!q.length || !(window.BB&&BB.auth&&BB.auth.live) || !navigator.onLine) return Promise.resolve(0);
    try{ localStorage.removeItem(QPKEY); }catch(e){}
    var done=0;
    return q.reduce(function(chain, item){
      return chain.then(function(){
        return BB.auth.fetch('/plan',{method:'POST', body:item.patch}).then(function(j){
          if(j&&j.ok){ done++; plan=j.plan; try{ localStorage.setItem(PKEY, JSON.stringify(plan)); }catch(e){} }
          else queuePlan(item.patch);
        }).catch(function(){ queuePlan(item.patch); });
      });
    }, Promise.resolve()).then(function(){
      if(done){ try{ window.dispatchEvent(new CustomEvent('bb:plan',{detail:plan})); if(BB.toast) BB.toast(done+' change'+(done===1?'':'s')+' now saved for everyone'); }catch(e){} }
      return done;
    });
  }
  try{ window.addEventListener('online', function(){ flushPlanQueue(); }); }catch(e){}

  function agentFor(customerKey){
    var pl=getPlan(); if(pl.agents && pl.agents[customerKey]) return pl.agents[customerKey];
    var f=by('farmers',customerKey); return (f&&f.rep)||null;
  }
  function fKey(month, product, customer){ return month+'|'+(product||'all')+'|'+(customer||'all'); }
  if(window.BB_CONFIG && window.BB_CONFIG.AUTH==='live'){ var pc=planCached(); if(pc) plan=pc; setTimeout(function(){ flushPlanQueue().then(loadPlan); },0); }

  function resetDemo(){ store=seed(); save(); flushQueue(); try{ localStorage.removeItem(SKEY); }catch(e){} }

  window.BB = window.BB || {};
  window.BB.data = {
    store:function(){return store;}, save:save, all:all, allUnscoped:allUnscoped, scope:scope, by:by, where:where, add:add, update:update, remove:remove, restore:restore, uid:uid,
    rep:rep, person:person, farmer:farmer, product:product, depot:depot, supplier:supplier, orderValue:orderValue,
    packSize:packSize, volumeLabel:volumeLabel,
    accountBalance:accountBalance, isOverdue:isOverdue, creditLimit:creditLimit, availableCredit:availableCredit,
    overLimit:overLimit, orderInvoiced:orderInvoiced, deliveryHold:deliveryHold,
    quotePct:quotePct, quoteTotal:quoteTotal, agentMargin:agentMargin, quoteStatus:quoteStatus, geo:geo, forecast7:forecast7, wxIcon:wxIcon,
    cropPrep:cropPrep, tripInsight:tripInsight,
    queue:queue, enqueue:enqueue, flushQueue:flushQueue, reset:resetDemo,
    sage:function(){ return sage; }, refreshSage:refreshSage, applySage:applySage,
    plan:getPlan, loadPlan:loadPlan, savePlan:savePlan, agentFor:agentFor, fKey:fKey,
    planQueue:planQueue, flushPlanQueue:flushPlanQueue
  };
})();
