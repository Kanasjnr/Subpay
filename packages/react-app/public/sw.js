if(!self.define){let s,e={};const c=(c,t)=>(c=new URL(c+".js",t).href,e[c]||new Promise((e=>{if("document"in self){const s=document.createElement("script");s.src=c,s.onload=e,document.head.appendChild(s)}else s=c,importScripts(c),e()})).then((()=>{let s=e[c];if(!s)throw new Error(`Module ${c} didn’t register its module`);return s})));self.define=(t,n)=>{const a=s||("document"in self?document.currentScript.src:"")||location.href;if(e[a])return;let i={};const r=s=>c(s,a),u={module:{uri:a},exports:i,require:r};e[a]=Promise.all(t.map((s=>u[s]||r(s)))).then((s=>(n(...s),i)))}}define(["./workbox-3c5ae611"],(function(s){"use strict";importScripts(),self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"/_next/static/SGNmMCwncCBtW80V4Qs1a/_buildManifest.js",revision:"b568e34592bc6a74c496399827419908"},{url:"/_next/static/SGNmMCwncCBtW80V4Qs1a/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/1047.d901e20808aa7457.js",revision:"d901e20808aa7457"},{url:"/_next/static/chunks/1093.10d68a066a6a59a5.js",revision:"10d68a066a6a59a5"},{url:"/_next/static/chunks/1367.a342a050a09c4b2a.js",revision:"a342a050a09c4b2a"},{url:"/_next/static/chunks/1485.f7bb26909a72aa28.js",revision:"f7bb26909a72aa28"},{url:"/_next/static/chunks/150.ef11f474e6c3ee69.js",revision:"ef11f474e6c3ee69"},{url:"/_next/static/chunks/1567.62dba82473a23386.js",revision:"62dba82473a23386"},{url:"/_next/static/chunks/1626.48b144f3cd5ff54e.js",revision:"48b144f3cd5ff54e"},{url:"/_next/static/chunks/1893.bad0911174c76d4b.js",revision:"bad0911174c76d4b"},{url:"/_next/static/chunks/190.f6e58d868da228e7.js",revision:"f6e58d868da228e7"},{url:"/_next/static/chunks/2167.491e9246278b9652.js",revision:"491e9246278b9652"},{url:"/_next/static/chunks/2195.1dfcb22afb4b9190.js",revision:"1dfcb22afb4b9190"},{url:"/_next/static/chunks/2375-27fada3b43806371.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/2560.5915fb0f9e4c6895.js",revision:"5915fb0f9e4c6895"},{url:"/_next/static/chunks/2571.5809e30dfdb5b9ee.js",revision:"5809e30dfdb5b9ee"},{url:"/_next/static/chunks/2729.bc921ea60f10e6db.js",revision:"bc921ea60f10e6db"},{url:"/_next/static/chunks/2894.788df23b4a87421a.js",revision:"788df23b4a87421a"},{url:"/_next/static/chunks/2949.0cf83504dfa0226a.js",revision:"0cf83504dfa0226a"},{url:"/_next/static/chunks/3138-e936e6d09b13b4c7.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/3358-4b825a64381f2157.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/345.a6a07a1df44b412d.js",revision:"a6a07a1df44b412d"},{url:"/_next/static/chunks/3478.0e184848dd6ae66f.js",revision:"0e184848dd6ae66f"},{url:"/_next/static/chunks/3535.c23ca83fa96defbb.js",revision:"c23ca83fa96defbb"},{url:"/_next/static/chunks/3648.8f7c70638e5b9788.js",revision:"8f7c70638e5b9788"},{url:"/_next/static/chunks/3881.2efe52b44f58b59d.js",revision:"2efe52b44f58b59d"},{url:"/_next/static/chunks/4022.5298df24251b486c.js",revision:"5298df24251b486c"},{url:"/_next/static/chunks/4123.12c37dcb1536e457.js",revision:"12c37dcb1536e457"},{url:"/_next/static/chunks/4145.f7c923a2d4a68ea5.js",revision:"f7c923a2d4a68ea5"},{url:"/_next/static/chunks/4199.ad4b2c99956de87e.js",revision:"ad4b2c99956de87e"},{url:"/_next/static/chunks/4210.6c24d162a674b157.js",revision:"6c24d162a674b157"},{url:"/_next/static/chunks/4489.5928ce93b0345b2d.js",revision:"5928ce93b0345b2d"},{url:"/_next/static/chunks/4607-f17cb9769b6cfb9f.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/4788-34dd6e6ab9213edc.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/4963.27dfe4e2d5053fcd.js",revision:"27dfe4e2d5053fcd"},{url:"/_next/static/chunks/4e88bc13-a627897c1021e876.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/5009.ac3de6c22b6055b6.js",revision:"ac3de6c22b6055b6"},{url:"/_next/static/chunks/5074.71e992073011011d.js",revision:"71e992073011011d"},{url:"/_next/static/chunks/5206.9f56f24b6c544c54.js",revision:"9f56f24b6c544c54"},{url:"/_next/static/chunks/5267.e73fa8c2e448493a.js",revision:"e73fa8c2e448493a"},{url:"/_next/static/chunks/5333.bdd62c9d308920b4.js",revision:"bdd62c9d308920b4"},{url:"/_next/static/chunks/5366.3b4358e6c7c9ebc8.js",revision:"3b4358e6c7c9ebc8"},{url:"/_next/static/chunks/5438.d01e3be05033f902.js",revision:"d01e3be05033f902"},{url:"/_next/static/chunks/5499.b3602098900d2181.js",revision:"b3602098900d2181"},{url:"/_next/static/chunks/5687.7a60be3bb660ff84.js",revision:"7a60be3bb660ff84"},{url:"/_next/static/chunks/6070.98660e3e871d9aef.js",revision:"98660e3e871d9aef"},{url:"/_next/static/chunks/6463-793a413b4565154e.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/6524-9f41f7988b8d08d4.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/6660.567125391cce0405.js",revision:"567125391cce0405"},{url:"/_next/static/chunks/6744-f0426c4efb5b1b78.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/6846.abb9dd4ea3161521.js",revision:"abb9dd4ea3161521"},{url:"/_next/static/chunks/696-77e058190b0bdc1c.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/7145-988ff82bb0fc6fe8.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/7173.0ca3cde85c733504.js",revision:"0ca3cde85c733504"},{url:"/_next/static/chunks/723.d196391f6c2de9e8.js",revision:"d196391f6c2de9e8"},{url:"/_next/static/chunks/7264.06788dd3b8c29fdc.js",revision:"06788dd3b8c29fdc"},{url:"/_next/static/chunks/7509.66c98575fe24183a.js",revision:"66c98575fe24183a"},{url:"/_next/static/chunks/7621.555a347d0600a184.js",revision:"555a347d0600a184"},{url:"/_next/static/chunks/7635.02a794a29391132a.js",revision:"02a794a29391132a"},{url:"/_next/static/chunks/7636-35f8a8a23bcf1332.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/7733.4ea1e63dfbcb98b6.js",revision:"4ea1e63dfbcb98b6"},{url:"/_next/static/chunks/7778-5964b41f04a33662.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/8216.de224765be3a0651.js",revision:"de224765be3a0651"},{url:"/_next/static/chunks/8295.c805c8c7df5b0feb.js",revision:"c805c8c7df5b0feb"},{url:"/_next/static/chunks/8353.9b07caa035e67935.js",revision:"9b07caa035e67935"},{url:"/_next/static/chunks/8716-69ad2fc1cc619ce3.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/87c73c54-a75efdc97741f1dd.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/880.5c8fe09acb9a66d5.js",revision:"5c8fe09acb9a66d5"},{url:"/_next/static/chunks/887.abe60091fad084f2.js",revision:"abe60091fad084f2"},{url:"/_next/static/chunks/8953-33413ca991528e34.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/9084-88ce538aae0c36fc.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/9097-0806625539791feb.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/9220.b2ce2215ac5f9700.js",revision:"b2ce2215ac5f9700"},{url:"/_next/static/chunks/9427.9717b6c11983b91b.js",revision:"9717b6c11983b91b"},{url:"/_next/static/chunks/9586.7339cc4e738a8395.js",revision:"7339cc4e738a8395"},{url:"/_next/static/chunks/9613-fbd492bc7e337a9c.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/9664.e9ebdb26d9f87ce6.js",revision:"e9ebdb26d9f87ce6"},{url:"/_next/static/chunks/9953-376eebee1857a94f.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/9975.aba0b4573951df93.js",revision:"aba0b4573951df93"},{url:"/_next/static/chunks/a8342410.5e59e312091c49c8.js",revision:"5e59e312091c49c8"},{url:"/_next/static/chunks/app/_not-found/page-35849393a7ffc06d.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/app/business/disputes/page-30917dc066560823.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/app/business/page-56729e7051479436.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/app/business/plans/page-2cb7f73baf0a9666.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/app/business/settings/page-50a63366131e2596.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/app/business/subscribers/page-b4734a22e7ae3ea6.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/app/layout-df5be11bfedfa971.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/app/page-966ae2cd9bbecaa6.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/app/subscriber/disputes/page-a21a9301850a60d2.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/app/subscriber/page-6d97694a26c16c09.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/app/subscriber/profile/page-4e98bd9e57cf67d0.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/app/subscriber/transactions/page-7bfcac7f802cb4ea.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/app/subscriptions/page-496597930ee1d22b.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/framework-ee5483cf79f00268.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/main-app-416639812852dfb7.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/main-f20b57c89f78fdd7.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/pages/_app-158bf1de1c8a11f9.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/pages/_error-a517711cdb225da4.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/chunks/polyfills-42372ed130431b0a.js",revision:"846118c33b2c0e922d7b3a7676f81f6f"},{url:"/_next/static/chunks/webpack-b9502d539172ad5e.js",revision:"SGNmMCwncCBtW80V4Qs1a"},{url:"/_next/static/css/3c587f5ef7407c71.css",revision:"3c587f5ef7407c71"},{url:"/_next/static/css/f8fd9f491e7389fa.css",revision:"f8fd9f491e7389fa"},{url:"/_next/static/media/26a46d62cd723877-s.woff2",revision:"befd9c0fdfa3d8a645d5f95717ed6420"},{url:"/_next/static/media/55c55f0601d81cf3-s.woff2",revision:"43828e14271c77b87e3ed582dbff9f74"},{url:"/_next/static/media/581909926a08bbc8-s.woff2",revision:"f0b86e7c24f455280b8df606b89af891"},{url:"/_next/static/media/6d93bde91c0c2823-s.woff2",revision:"621a07228c8ccbfd647918f1021b4868"},{url:"/_next/static/media/97e0cb1ae144a2a9-s.woff2",revision:"e360c61c5bd8d90639fd4503c829c2dc"},{url:"/_next/static/media/a34f9d1faa5f3315-s.p.woff2",revision:"d4fe31e6a2aebc06b8d6e558c9141119"},{url:"/_next/static/media/df0a9ae256c0569c-s.woff2",revision:"d54db44de5ccb18886ece2fda72bdfe0"},{url:"/favicon.ico",revision:"8ef3c1204c1780839a44db434c84beb6"},{url:"/logo.svg",revision:"b7d2d1071d11041ec2a2eefd67af3e99"},{url:"/manifest.json",revision:"d1f64a50e3e6ccc293257cfe99c0515b"}],{ignoreURLParametersMatching:[]}),s.cleanupOutdatedCaches(),s.registerRoute("/",new s.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:s,response:e,event:c,state:t})=>e&&"opaqueredirect"===e.type?new Response(e.body,{status:200,statusText:"OK",headers:e.headers}):e}]}),"GET"),s.registerRoute(/^https?.*/,new s.NetworkFirst({cacheName:"offlineCache",plugins:[new s.ExpirationPlugin({maxEntries:200,maxAgeSeconds:86400})]}),"GET")}));
