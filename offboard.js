/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   JMB Virtuals — OFFBOARDING PROGRAM (portal module, Oct 27 2026)
   Loaded only for a contractor with an open offboarding case (index.html → offb-boot).
   ~2 hours: 10 modules · 6 quizzes (80% to pass, retakes) · 4 forms · exit interview · e-signature.
   Content follows the Independent Contractor Agreement (ICA), Confidentiality & NDA, Non-Solicitation &
   Client-Protection Agreement, Data Privacy & Security Policy, Acceptable Use & Account Access Policy,
   Company Laptop AUP, Availability/AWOL & Proper Disengagement Policy and the Code of Conduct.
   Saves to the Offboarding sheet (exit_program) through offb_prog_save / offb_prog_submit.
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
if (window.OFFB) return;

/* ─────────────────────────────── CONTENT ─────────────────────────────── */
var NEVER_PW = "Never type a password, 2FA code or recovery code anywhere in this program. Describe where an account is and who has it now — hand the credential itself over only through the channel Jeth tells you to use.";

var MODS = [
/* 1 */ { id:"welcome", title:"Welcome, and thank you", est:4,
  read:{ min:75, blocks:[
    {p:"{first}, thank you for {tenure} with JMB Virtuals. Leaving well matters as much as starting well — for you, for your clients, and for the teammates who will carry your work forward. This program walks you through everything that has to happen before your last day, {last_day}."},
    {h:"What this program is"},
    {p:"It is a guided clearance. You will read short modules on what still applies after you leave, answer a few quizzes so the important points are clear, hand over your work, list the accounts and property you held, and tell us honestly how your time with us went. At the end you sign a declaration. HR uses it to clear you, release your final fees and issue your certificate if you ask for one."},
    {kv:[["Modules","10, in order — each one unlocks the next"],["Quizzes","6 short ones · 80% to pass · retakes allowed"],["Forms","Data clean-up check · accounts & property · handover · exit interview"],["Signature","One e-signature at the end, with a PDF copy for you"],["Time","About 2 hours. It saves as you go, on any device you sign in with"]]},
    {h:"This is paid time"},
    {p:"Do the program during your shift. Run your tracker on JMB Internal › Offboarding › Offboarding program — the “Track this as paid time” button at the top sets it up for you. As always, log only the time you actually spend on it."},
    {h:"How the quizzes work"},
    {p:"Each quiz needs 80% to pass. If you miss it, you will see the right answers with a short explanation and can retake it straight away. HR sees your first try and your final score. Nobody is judged on a first try — the point is that you leave knowing exactly what still applies to you."},
    {callout:{tone:"warn", title:"One rule for every form", text:NEVER_PW}},
    {h:"If you get stuck"},
    {p:"Message Jeth in the portal chat, or email virtualsjmb@gmail.com. If a question in a form does not apply to you, write N/A rather than leaving it blank."}
  ]}
},
/* 2 */ { id:"closing", title:"Closing your engagement the right way", est:12,
  read:{ min:160, blocks:[
    {p:"You were engaged as an independent contractor, not as an employee. That shapes how your engagement ends: it is the end of a service arrangement, governed by your Independent Contractor Agreement (ICA) and the policies that form part of it."},
    {h:"Notice and your last day"},
    {p:"Either side may end the engagement on 15 to 30 days' written notice (ICA §15.1). You gave notice on {notice_date}, and your last working day is {last_day}. Until then, everything about your engagement continues as normal: your committed hours, your schedule, your quality standards and your client's expectations."},
    {ul:["Keep your agreed hours and stay reachable during them. Becoming unreachable during committed hours without notice is still AWOL — even in your final week (Disengagement Policy §3–4).",
         "Run the tracker accurately and log only the time you actually work (ICA §7.2). Inaccurate time in the last days is treated exactly as it would be at any other time: as a material breach.",
         "If you need time off before your last day, request it the usual way, in advance."]},
    {h:"Stepping away the right way"},
    {p:"The Availability, Conduct & Proper Disengagement Policy (§5) lists four steps: give advance notice, submit your resignation note, turn over your work, and return access and assets. You have done the first two. This program covers the last two — and adds the written confirmations your Confidentiality Agreement and the Data Privacy Policy ask for."},
    {callout:{tone:"ok", title:"Good standing", text:"Members who step away the right way leave in good standing. They stay welcome for future engagements and professional references (Disengagement Policy §5)."}},
    {h:"Fees, payouts — and what is not owed"},
    {p:"Once your handover is complete, JMB Virtuals pays all fees due for services you rendered up to your last working day, on the regular payout schedule (ICA §15.3; your acknowledgement letter)."},
    {ul:["Only fees for work actually rendered and accepted are paid (ICA §5.3).",
         "As an independent contractor you are not entitled to employee benefits from JMB Virtuals — 13th-month pay, leave conversion, separation pay or similar (ICA §3.2). There is no statutory “final pay” process; your last fees are simply reconciled (Disengagement Policy §7).",
         "JMB Virtuals may set off amounts reasonably attributable to unreturned assets or documented advances, to the extent the law allows (ICA §5.4). Return everything on time and there is nothing to set off.",
         "Taxes and any voluntary contributions stay your own responsibility (ICA §6). Keep your own record of what you were paid."]},
    {h:"After your last day"},
    {ul:["HR completes your clearance and closes your portal account. You will not be able to sign in after that, so download anything personal you need from the portal — your own payslips, for example — before {last_day}.",
         "Your certificate, confirming your role and dates with JMB Virtuals, is issued on request once clearance is complete.",
         "Some obligations do not end on your last day. Confidentiality, data protection, ownership of work product and non-solicitation all continue (ICA §15.3). Modules 3, 4 and 7 cover them."]},
    {h:"Your work product"},
    {p:"Everything you created for a client — posts, designs, captions, reports, spreadsheets, SOPs — belongs to the client (or to JMB Virtuals) from the moment it was created and paid for (ICA §10.1). You may not reuse, publish or repurpose it without written consent (ICA §10.2). Turning it all over is part of your clearance."}
  ]},
  quiz:{ qs:[
    {q:"Your last day is in four days. A friend invites you out on a weekday afternoon that falls inside your committed hours. What is the right move?",
     o:["Go — it is your final week, so the attendance rules no longer apply","Request the time off in advance the usual way, and go only if it is approved","Go, and leave the tracker running so the day still counts","Tell no one; one afternoon will not be noticed"], a:1,
     why:"Your engagement — committed hours and the AWOL rules included — runs in full until your last day. Time off is requested in advance, and the tracker only ever logs time actually worked."},
    {q:"Which of these will JMB Virtuals pay after your last day?",
     o:["13th-month pay for the year","Fees for services you rendered up to your last working day, on the regular payout schedule","Separation pay based on your years with the team","Cash conversion of unused leave"], a:1,
     why:"Independent contractors are paid fees for services rendered (ICA §5.3, §15.3). Employee benefits such as 13th-month or separation pay do not apply (ICA §3.2)."},
    {q:"Who owns the content calendars and design files you made for a client?",
     o:["You — you created them","The client (or JMB Virtuals), from the moment they were created and paid for","Whoever has the latest copy","You and the client jointly"], a:1,
     why:"ICA §10.1: Work Product belongs to the client (or JMB Virtuals) on creation and payment. Reusing it needs written consent (§10.2)."},
    {q:"What may JMB Virtuals set off against your final fees, where the law allows?",
     o:["Nothing, ever","Amounts reasonably attributable to unreturned assets or documented advances","A fee for leaving","The cost of training your replacement"], a:1,
     why:"ICA §5.4 allows a set-off only for amounts reasonably attributable to unreturned assets, documented advances or clear breaches — to the extent the law permits."},
    {q:"In your final week you finish a task 30 minutes before your shift ends. What do you do with the tracker?",
     o:["Leave it running until the end of the shift","Stop it, or switch it to the next task you actually do","Leave it running but label the entry “admin”","It no longer matters after resigning"], a:1,
     why:"The tracker logs only time actually worked (ICA §7.2) — in your last week as much as your first."}
  ]}
},
/* 3 */ { id:"confid", title:"Confidentiality doesn't end on your last day", est:14,
  read:{ min:170, blocks:[
    {p:"Over your time with JMB Virtuals you have seen client strategies, account credentials, customer details, rates, playbooks and internal tools. Your Confidentiality & Non-Disclosure Agreement (NDA) protects all of it — and it keeps protecting it after you leave (ICA §8)."},
    {h:"What counts as confidential"},
    {ul:["Client business information: projects, plans, pricing, customer and contact lists, and communications.",
         "Login credentials, passwords, API keys, tokens, and access to systems and tools.",
         "Personal data of clients, their customers and prospects, and of team members.",
         "JMB Virtuals' internal processes, rates, playbooks, templates and operational information — including how our tools and SOPs work.",
         "Anything marked confidential, or that a reasonable person would understand to be confidential (NDA §1)."]},
    {h:"How long it lasts"},
    {p:"Your obligations continue for three (3) years after your engagement ends — and for trade secrets, credentials and personal data, for as long as the law protects that information (NDA §10). In practice: treat it as permanent."},
    {h:"What you must not do"},
    {ul:["Disclose it to anyone — family, friends, other contractors or future clients — without written authorization (NDA §3, §8).",
         "Use it for yourself or anyone else, including in a new job or for a new client (NDA §2).",
         "Keep copies, downloads or screenshots of it (NDA §3(d), §9).",
         "Discuss client matters publicly or on social media (NDA §8)."]},
    {h:"What is not covered"},
    {p:"Information that is already public through no fault of yours, that you lawfully knew before, that a third party gave you freely, or that you developed independently is not confidential under the NDA (§4). Your skills and experience are yours: everything you learned about social media management, Reddit, content and teamwork goes with you. What stays behind is our clients' and our company's specific information."},
    {callout:{tone:"info", title:"Skills versus secrets", text:"“I know how to plan a monthly content calendar and grow an account” — your skill, yours to use anywhere. “Client A's posting schedule, caption bank, follower data and login” — confidential, it stays with JMB Virtuals."}},
    {h:"If someone asks you for information"},
    {p:"Former colleagues, a new employer, even a client's competitor may ask how we did something or who we work with. A friendly, firm answer works: “Sorry, I can't share that — it's covered by my confidentiality agreement.”"},
    {p:"If you are ever legally required to disclose something — by a court order, for example — tell JMB Virtuals in writing first where the law allows, cooperate so we can seek protection, and disclose only the minimum required (NDA §5)."},
    {h:"Return or destroy — and confirm in writing"},
    {p:"At the end of the engagement you must return or securely delete all confidential information in your possession, remove your access, and confirm in writing that you have done so (NDA §9). Module 4 walks you through the clean-up; your declaration in Module 10 is the written confirmation."},
    {h:"Why it matters"},
    {p:"A breach can cause serious, hard-to-measure harm to our clients and to every VA whose work depends on their trust. The NDA allows JMB Virtuals and clients to seek an injunction and damages (§12). We share this not as a threat — simply so you know its weight and can protect yourself."}
  ]},
  quiz:{ qs:[
    {q:"A new employer asks you to share the content calendar template and caption bank you used for a JMB client, “just as a starting point”. What do you do?",
     o:["Share it — you built it","Share it with the client's name removed","Decline — it is confidential work product; build a fresh one from your own skills","Share only the caption bank"], a:2,
     why:"Client work product and JMB templates are confidential (NDA §1) and belong to the client or JMB (ICA §10). Your skill is yours; their materials are not."},
    {q:"How long do your obligations last for client login credentials and personal data?",
     o:["Until your last day","Six months","Three years after the engagement ends — and for credentials and personal data, as long as the law protects them","Only while you still have access"], a:2,
     why:"NDA §10: three years after the engagement, and for trade secrets, credentials and personal data for as long as the law protects them."},
    {q:"Which of these can you freely use after leaving?",
     o:["A client's follower list","Your general skill in planning and running social media campaigns","JMB's internal SOP documents","A client's ad spend and rates"], a:1,
     why:"General skills and experience are yours. Client lists, rates and internal SOPs are confidential (NDA §1)."},
    {q:"A former teammate messages: “Which clients does JMB have now? I want to pitch them.” The best reply is:",
     o:["Share the list — you're both ex-JMB now","Share only the client names, not their contacts","“Sorry, I can't share that — it's covered by my confidentiality agreement.”","Share it, since the NDA ended on your last day"], a:2,
     why:"Client lists are confidential (NDA §1), the NDA survives your engagement (§10), and it covers other contractors too (§8)."},
    {q:"You receive a legal order to disclose some client information. What does the NDA ask you to do?",
     o:["Disclose everything you have, immediately","Ignore the order","Where lawful, notify JMB Virtuals in writing first, cooperate, and disclose only the minimum required","Post about it so the client knows"], a:2,
     why:"NDA §5 — compelled disclosure: prompt written notice where lawful, reasonable cooperation, minimum disclosure."},
    {q:"Can you post a screenshot of a client's analytics dashboard on your social media to show your results?",
     o:["Yes, if you blur the client's name","Yes — the results are yours to show","No — client data and results are confidential unless the client gives written consent","Yes, after 30 days"], a:2,
     why:"Client data is confidential (NDA §1, §8) and work product can't be published without written consent (ICA §10.2)."}
  ]}
},
/* 4 */ { id:"privacy", title:"Data privacy & your personal clean-up", est:16,
  read:{ min:150, blocks:[
    {p:"Personal data is any information about an identifiable person — names, contact details, messages, account identifiers, customer records. As a VA you handled a lot of it. The Philippine Data Privacy Act of 2012 (RA 10173), your NDA (§6) and the JMB Data Privacy & Security Policy all say the same thing: keep it only as long as the work needs it. After your last day, the work no longer needs it."},
    {h:"The rule for leaving"},
    {p:"Return or securely delete all personal and client data and materials in your possession, remove your access, and confirm in writing that you have done so — keeping no copies, except where the client or the law requires retention (Data Privacy Policy §9; NDA §9)."},
    {callout:{tone:"warn", title:"Clean up your own things — don't delete theirs", text:"This clean-up is about YOUR personal devices and accounts. Do not delete anything inside client or JMB accounts, shared drives or tools. That data belongs to them and must be handed over (Modules 5 and 6)."}},
    {h:"Where work data hides"},
    {p:"Most leftover data isn't in obvious places. Check each of these:"},
    {ul:["Downloads and Desktop folders on every computer you used for work.",
         "Screenshots and screen recordings — on your computer and in your phone's gallery.",
         "Phone storage: the “Recently Deleted” album, and the media folders of WhatsApp, Viber, Telegram and Messenger.",
         "Personal cloud storage: Google Drive, Google Photos, iCloud, Dropbox, OneDrive.",
         "Personal email: sent items, and attachments you forwarded to yourself.",
         "Chats with clients or about client work on personal messaging apps — including files and voice notes.",
         "Your browser: saved passwords, autofill entries, bookmarks to client tools, and signed-in sessions.",
         "Personal password managers or notes apps where you saved work logins.",
         "Printed papers and notebooks with client or customer details."]},
    {h:"How to delete properly"},
    {ul:["Delete the files, then empty the Trash or Recycle Bin.",
         "On phones, also empty “Recently Deleted” and any in-app trash.",
         "In cloud drives, empty the cloud trash — deleted files often stay there for 30 days.",
         "In browsers, remove saved work passwords, sign out of every work account, and clear autofill entries that hold client data.",
         "Shred or cut up printed documents with personal or client data."]},
    {h:"Your duty if something goes wrong — even after you leave"},
    {p:"If you discover that client or personal data was lost, leaked or sent to the wrong person, or that someone accessed an account they shouldn't have, report it to the Operations Manager immediately — and no later than 24 hours after you become aware (Data Privacy Policy §8; NDA §6.3). Never try to hide an incident, and never log back in to “fix” it yourself. This duty covers anything you learn about from your time with us, even after your last day."},
    {p:"After the quiz you will do a short self-audit of each place above. Be honest: “Need help” is a perfectly good answer. Jeth would much rather help you clean up properly than have data left behind."}
  ]},
  quiz:{ qs:[
    {q:"Your phone gallery has 40 screenshots of a client's post analytics. What is the right clean-up?",
     o:["Keep them as proof of your work","Move them to a personal Google Drive folder","Delete them, then empty “Recently Deleted” as well","Send them to the client, then keep a copy"], a:2,
     why:"Client data on personal devices must be securely deleted (Data Privacy Policy §9) — and deleted photos sit in “Recently Deleted” until you empty it."},
    {q:"Which of these should you NOT delete during your clean-up?",
     o:["Client files in your personal Downloads folder","The client's own content library in the shared company drive","Work passwords saved in your personal browser","Old chats with client attachments on your personal phone"], a:1,
     why:"Shared company and client storage belongs to them — it is handed over, never deleted. The clean-up is only for your personal devices and accounts."},
    {q:"Two weeks after your last day you notice a client file is publicly viewable through a link you once created. What do you do?",
     o:["Nothing — you no longer work there","Report it to the Operations Manager within 24 hours","Post a warning in the team group chat","Log in to the client account and fix the link yourself"], a:1,
     why:"Incidents must be reported within 24 hours (Data Privacy Policy §8) — and you must not access client accounts after your engagement ends."},
    {q:"Under the Data Privacy Act and our policy, how long may you keep client personal data after you leave?",
     o:["As long as you like, if it's encrypted","Until the end of the year","Not at all — return or delete it and confirm in writing, unless the client or the law requires retention","One year"], a:2,
     why:"Data Privacy Policy §9 and NDA §9: return or securely delete, confirm in writing, keep no copies."}
  ]},
  form:{ id:"selfaudit", title:"Self-audit: your personal devices and accounts",
    intro:"Check each place and pick what applies. “Cleaned” means you deleted work data and emptied the trash.",
    fields:[
      {id:"audit", type:"audit", req:true, opts:["Cleaned","Nothing there","Need help","Not applicable"], items:[
        ["dl","Downloads & Desktop folders"],["shots","Screenshots & screen recordings (computer + phone)"],["phone","Phone storage, Recently Deleted, chat-app media"],
        ["cloud","Personal cloud (Drive, Photos, iCloud, Dropbox, OneDrive)"],["mail","Personal email (sent items, forwarded attachments)"],["chat","Personal chats about client work (files, voice notes)"],
        ["browser","Browser saved passwords, autofill & sessions"],["pm","Personal password manager / notes apps"],["paper","Printed papers & notebooks"]]},
      {id:"help", type:"textarea", label:"Anything you need help with, or want to flag?", ph:"Optional"}
    ]}
},
/* 5 */ { id:"access", title:"Accounts, access & company property", est:18,
  read:{ min:120, blocks:[
    {p:"Every account, credential, device and file a client or JMB Virtuals gave you remains theirs. It must be returned or revoked at the end of your engagement (ICA §12; Acceptable Use & Account Access Policy §4)."},
    {h:"Three golden rules"},
    {ol:["Hand over, don't take away. Access goes back to JMB Virtuals or the client — never kept “just in case”.",
         "Never share credentials in plain text. Passwords, 2FA codes and recovery codes go to Jeth only through the channel he approves — never in group chats, and never in this program.",
         "Don't change what isn't yours. Do not change the ownership, recovery email or phone, or security settings of any client or JMB account without written authorization (AUP §2)."]},
    {h:"Two-factor authentication — the step people forget"},
    {p:"If a work account sends its 2FA codes to your personal phone number, email or authenticator app, that account becomes unreachable the day you leave. Before your last day, work with Jeth to move 2FA and recovery details to a company-controlled number, email or device — then remove your own."},
    {h:"What to return or sign out of"},
    {ul:["Client accounts: social media, Reddit, ad managers, scheduling tools, inboxes.",
         "JMB tools: Reddit Central, ALTR Studio, Client Hub, shared drives, the team chat.",
         "Brand and marketing accounts you ran for JMB Virtuals itself: pages, design tools such as Canva, website or scheduling tools.",
         "Shared password-manager vaults or folders.",
         "Company devices: laptop, phones, SIM cards, chargers and accessories.",
         "Physical items: IDs, keys, notebooks."]},
    {h:"Company laptops and phones"},
    {p:"A company laptop, its accessories and all the data on it are company property and must be returned in good condition at the end of your engagement (Company Laptop AUP §1). Normal wear and tear is fine; damage or loss from negligence or misuse may be charged (§5). Don't wipe or reset a company device yourself unless Jeth asks you to — just sign out of your personal accounts and hand it over."},
    {h:"Reddit accounts"},
    {p:"Reddit accounts in Reddit Central are reassigned to an active teammate before your last day. Don't log out of, abandon or change anything on them — tell us which ones are yours, and Jeth will move them."},
    {h:"After your last day"},
    {p:"Accessing any client or JMB account after your engagement ends — even “just to check something” — is not allowed. If you remember something you forgot to hand over, message Jeth instead."},
    {callout:{tone:"warn", title:"About the form after the quiz", text:NEVER_PW}}
  ]},
  quiz:{ qs:[
    {q:"A teammate asks you to post the password of a client's Instagram in the group chat so she can take over. What do you do?",
     o:["Post it in the group chat — it's faster","Send it to her privately on Messenger","Hand it over only through the channel Jeth approves — never in a chat","Write it in the handover form"], a:2,
     why:"Credentials are never shared in plain text or through unapproved channels (AUP §4; NDA §7)."},
    {q:"A client account sends its 2FA codes to your personal phone. When should that change?",
     o:["After your last day, when someone needs a code","Before your last day — move 2FA and recovery to a company-controlled number or device with Jeth","Never; you can forward codes later","Only if the client asks"], a:1,
     why:"Once you leave, nobody can reach codes on your phone — and you must not stay involved in client access. Move it before your last day."},
    {q:"You are returning a company laptop. What should you do with it?",
     o:["Factory-reset it to protect your privacy","Sign out of your personal accounts and return it in good condition — don't wipe it unless asked","Keep it until your final fees arrive","Remove the monitoring software first"], a:1,
     why:"The laptop and its data are company property (Laptop AUP §1). Removing monitoring or holding the device back are not allowed (§2, ICA §12)."},
    {q:"A week after leaving, you remember an open task in a client's scheduling tool. What do you do?",
     o:["Log in quickly and finish it","Message Jeth so whoever took over can handle it","Ask the client to give you access again","Ignore it"], a:1,
     why:"Access ends with your engagement (ICA §12). Pass it on to Jeth."}
  ]},
  form:{ id:"inventory", title:"Accounts, access & property you held",
    intro:"List every account, tool, device and storage place you used for work, and what you did with it. A few common ones are filled in — edit or remove them.",
    fields:[
      {id:"items", type:"rows", label:"Inventory", req:true, min:3, add:"Add another item",
        cols:[ {id:"item", label:"Account / tool / device", type:"text", req:true, ph:"e.g. Client A Instagram"},
               {id:"kind", label:"Type", type:"select", opts:["Client account","JMB tool","JMB brand account","Device","File storage","Other"]},
               {id:"owner", label:"Belongs to", type:"text", ph:"Client name or JMB"},
               {id:"status", label:"What you did", type:"select", req:true, opts:["Handed over (credential via approved channel)","Signed out — my access removed","Device returned","2FA & recovery moved to company","Still to do before my last day","Not sure — need help"]},
               {id:"note", label:"Notes", type:"text", ph:"Who has it now, anything to know"} ],
        seed:[ {item:"Reddit Central", kind:"JMB tool", owner:"JMB"}, {item:"Client Hub / ALTR Studio (if used)", kind:"JMB tool", owner:"JMB"},
               {item:"Team chat & shared drives", kind:"JMB tool", owner:"JMB"}, {item:"Company laptop / phone / SIM (if any)", kind:"Device", owner:"JMB"} ]},
      {id:"twofa", type:"select", label:"Did any work account use your personal phone number, email or authenticator for 2FA or recovery?", req:true,
        opts:["No","Yes — already moved to company","Yes — still to move (Jeth to help)"]},
      {id:"reddit", type:"text", label:"About how many Reddit accounts are under your name in Reddit Central?", req:true, ph:"e.g. 12, or 0"},
      {id:"device", type:"select", label:"Do you have a company laptop, phone or SIM?", req:true, opts:["No","Yes — I will return it by my last day","Yes — already returned"]},
      {id:"extra", type:"textarea", label:"Anything else to return or flag?", ph:"Optional"}
    ]}
},
/* 6 */ { id:"handover", title:"Handover & knowledge transfer", est:22,
  read:{ min:60, blocks:[
    {p:"The best thing you can leave your team is a handover so clear that nobody needs to message you after {last_day}. Your contract asks you to turn over all work product (ICA §15.3) and the Disengagement Policy asks you to endorse ongoing tasks and share their status (§5). This form is where you do it."},
    {h:"What a good handover covers"},
    {ul:["Where each workstream stands today.","Open tasks — with deadlines, and who is waiting on them.","Recurring work: what happens daily, weekly and monthly.","Key contacts, and how they like to communicate.","Where files and assets live (folders, boards, links) — never passwords.","Quirks, known issues and tips you learned the hard way."]},
    {example:{title:"A strong entry looks like this", lines:["Workstream: Client A — Instagram + Reddit","Status today: 12 posts scheduled to Nov 3; Reddit accounts in Phase 2 warm-up.","Open: November content calendar, 60% drafted (Client A › Calendars), due to the client Oct 31.","Recurring: Mon/Wed/Fri story check; Friday performance report (template in Reports).","Contacts: Sarah, client marketing lead — prefers email, replies the same day.","Tips: captions over 150 characters underperform; the client approves all hashtags first."]}},
    {p:"Write it for someone who has never seen the account. Short bullet points are perfect. Add one workstream card per client, project or area you owned — including JMB's own marketing and brand work if that was yours."}
  ]},
  form:{ id:"handover", title:"Your handover",
    fields:[
      {id:"role", type:"textarea", label:"In your own words: what did your role cover day to day?", req:true, rows:4},
      {id:"streams", type:"cards", label:"Workstreams", req:true, min:1, add:"Add another workstream", name:"Workstream",
        cols:[ {id:"name", label:"Workstream / client / project", type:"text", req:true, ph:"e.g. Client A — Instagram"},
               {id:"status", label:"Status today", type:"textarea", req:true},
               {id:"open", label:"Open tasks & deadlines", type:"textarea", req:true, ph:"Write “None” if nothing is open"},
               {id:"recurring", label:"Recurring work (daily / weekly / monthly)", type:"textarea"},
               {id:"contacts", label:"Key contacts", type:"text"},
               {id:"files", label:"Where files live", type:"text", ph:"Folder, board or link — no passwords"},
               {id:"tips", label:"Tips & known issues", type:"textarea"} ]},
      {id:"docs", type:"textarea", label:"Documents, SOPs, templates or trackers you created or maintain — and where they are"},
      {id:"decisions", type:"textarea", label:"Anything waiting on a decision from management"},
      {id:"handto", type:"text", label:"Who are you handing over to?", req:true, ph:"Name, or “Jeth to assign”"},
      {id:"walk", type:"select", label:"Walkthrough with the person taking over", req:true, opts:["Done","Scheduled before my last day","Not yet — need Jeth to arrange","Not needed"]},
      {id:"advice", type:"textarea", label:"Advice for whoever takes over your role"}
    ]}
},
/* 7 */ { id:"clients", title:"Clients, teammates & your non-solicitation promise", est:11,
  read:{ min:110, blocks:[
    {p:"JMB Virtuals invests heavily in finding clients and building relationships, then introduces you to them. Your Non-Solicitation & Client-Protection Agreement — referenced in ICA §11 — protects those relationships and the team for twelve (12) months after your engagement ends."},
    {h:"The four promises"},
    {kv:[["Non-solicitation","You won't approach any JMB client — or any prospect you learned of through us — to provide VA or similar services outside JMB Virtuals, or to move business away from us (§2)."],
         ["Non-acceptance","You won't accept or provide those services to a JMB client outside JMB Virtuals — even if the client contacts you first (§3)."],
         ["Non-circumvention","You won't bypass JMB Virtuals to contract with, invoice, or be paid directly by a client, or encourage a client to do so (§4)."],
         ["The team","You won't solicit or induce a JMB teammate to leave or to work outside the JMB arrangement (§5)."]]},
    {h:"What you are free to do"},
    {p:"These restrictions are limited to actual JMB clients and teammates (§7). You are free to work for any other client, on any platform, in any role — social media management included. We hope you do great work."},
    {h:"If a client reaches out to you"},
    {p:"It happens — clients like people they have worked with. The right reply is warm and simple, and it protects you:"},
    {template:"Hi [Name], thank you so much — it's been a pleasure working with you! I've finished my engagement with JMB Virtuals, so I'm not able to work with you directly. Jeth at JMB Virtuals (virtualsjmb@gmail.com) will make sure you're well looked after. Wishing you all the best!"},
    {p:"Then let Jeth know the client contacted you. That's all."},
    {h:"If you and a client genuinely want to keep working together"},
    {p:"There is a proper route: ask JMB Virtuals for written consent in advance. It may be granted on reasonable terms, which can include a fair introduction or conversion fee agreed beforehand (§6). What is never okay is doing it quietly."},
    {h:"If a teammate asks about your next job"},
    {p:"Stay friendly and stay in touch. Just don't recruit teammates away from JMB Virtuals, or encourage them to work for a JMB client directly, during the 12 months."},
    {callout:{tone:"info", title:"For your protection", text:"A breach can lead to an injunction, recovery of lost fees and an accounting of profits (§8). Again — not a threat, just the facts so you can protect yourself."}}
  ]},
  quiz:{ qs:[
    {q:"Three months after you leave, a JMB client emails you directly offering part-time work. What do you do?",
     o:["Accept — they contacted you first","Accept, but invoice under a friend's name","Politely decline, point them to JMB Virtuals, and let Jeth know","Accept after asking the client to end their JMB contract"], a:2,
     why:"Non-acceptance (§3) applies even when the client makes the first move. Redirect to JMB Virtuals."},
    {q:"How long does the non-solicitation restriction last after your engagement ends?",
     o:["It ends on your last day","Three months","Twelve months","Five years"], a:2,
     why:"The Restricted Period is the engagement plus twelve (12) months after it ends."},
    {q:"Which of these is allowed during those 12 months?",
     o:["Working for a new client you found yourself on a freelance platform","Taking over a JMB client's account directly at a lower rate","Invoicing a JMB client directly for “small favours”","Inviting a JMB teammate to work a JMB client's account with you directly"], a:0,
     why:"The restrictions cover JMB clients and teammates only (§7). New clients you find yourself are completely fine."},
    {q:"A JMB teammate asks whether your new job has openings. Which response fits your agreement?",
     o:["Recruit her actively and promise a higher rate","Stay friendly, but don't solicit or induce her to leave JMB Virtuals","Tell her to quit JMB first and you'll refer her","Share JMB's client list so she can pitch them"], a:1,
     why:"Team non-solicitation (§5): no soliciting or inducing a teammate to leave. Friendship is fine."},
    {q:"You and a JMB client genuinely want to keep working together directly. What is the proper route?",
     o:["Just start — nobody will know","Ask JMB Virtuals for written consent in advance; terms such as a conversion fee may apply","Wait 30 days, then start","Have the client cancel JMB first"], a:1,
     why:"Consent and conversion (§6): written consent in advance, on reasonable terms."},
    {q:"Which of these is circumvention?",
     o:["Working for a non-JMB client","Telling a JMB client to pay you directly instead of through JMB Virtuals","Listing “Social Media Manager” on your resume","Staying in touch with former teammates"], a:1,
     why:"Non-circumvention (§4): no bypassing JMB Virtuals to invoice or be paid directly by a client."}
  ]}
},
/* 8 */ { id:"leaving", title:"Leaving well: reputation, references & staying in touch", est:8,
  read:{ min:75, blocks:[
    {h:"Talking about JMB Virtuals in public"},
    {ul:["Don't discuss client matters or share confidential information on social media, in groups or with friends (NDA §8; Data Privacy Policy §7).",
         "If you have concerns about how something was handled, raise them privately — with Jeth, or in the exit interview in the next module. Concerns are taken seriously and handled discreetly (Code of Conduct §18).",
         "Be fair and factual. Public posts naming people or making claims you can't back up can hurt others — and you."]},
    {h:"Your resume, LinkedIn and portfolio"},
    {ul:["You may list your role, JMB Virtuals as your engagement, your dates, and your general skills and achievements.",
         "Describe results in general terms (“grew an account's engagement by about 40% in three months”) rather than naming clients or sharing their data.",
         "Showing client work — posts, designs, analytics — in a portfolio needs the client's written consent (ICA §10.2; NDA §1).",
         "Describe your role accurately: you were an independent contractor engaged through JMB Virtuals, not an employee of a client (ICA §16.6; Code of Conduct §13.4)."]},
    {h:"Certificate and references"},
    {p:"Once your clearance is complete you can request a certificate confirming your role and dates with JMB Virtuals. For references, check with Jeth before giving his name — he is happy to speak to your strengths."},
    {h:"The door stays open"},
    {p:"VAs who leave in good standing are welcome back for future engagements (Disengagement Policy §5). Keep your personal email and phone number up to date with us, so we can reach you about your final payout, a certificate request or future opportunities."}
  ]},
  quiz:{ qs:[
    {q:"How can you describe your results on LinkedIn?",
     o:["Post the client's analytics screenshots","Name the client and their revenue numbers","Describe them in general terms, without naming clients or sharing their data","You can't mention JMB Virtuals at all"], a:2,
     why:"General achievements are fine; client names and data are confidential (NDA §1, §8)."},
    {q:"You are unhappy about how something was handled. What is the right channel?",
     o:["A public post naming the people involved","Raise it privately with Jeth, or in your exit interview","Message clients about it","Post anonymously in a VA Facebook group"], a:1,
     why:"Code of Conduct §18: raise concerns with Operations — they are handled discreetly and taken seriously."},
    {q:"When can you get a certificate of your role and dates?",
     o:["Before you hand anything over","On request, once your clearance is complete","Only after 12 months","Never — contractors can't get one"], a:1,
     why:"The certificate is issued on request after clearance."},
    {q:"You want to show a client's posts you designed in your portfolio. What do you need?",
     o:["Nothing — you made them","The client's written consent","Just remove the logo","Wait until the posts are a year old"], a:1,
     why:"ICA §10.2: no reuse or publishing of client work product without written consent."}
  ]}
},
/* 9 */ { id:"exit", title:"Exit interview", est:10,
  form:{ id:"exit", title:"Exit interview",
    intro:"Your honest feedback shapes how we treat the next VA. Your answers go to the founder only, are never shared with teammates, and do not affect your final fees, your certificate or your references.",
    fields:[
      {id:"overall", type:"scale", label:"Overall, how was your experience with JMB Virtuals?", req:true, max:5, lo:"Poor", hi:"Excellent"},
      {id:"grid", type:"grid", label:"Rate each of these", req:true, max:5, lo:"Poor", hi:"Excellent", items:[
        ["clarity","Clarity of what was expected of you"],["support","Support from management"],["tools","Tools and systems (portal, Reddit Central, Client Hub…)"],
        ["comms","Communication and updates"],["workload","Fairness of workload"],["pay","Fairness of pay"],["growth","Learning and growth"],["culture","Team culture"]]},
      {id:"reasons", type:"checks", label:"What led to your decision to leave? Pick all that apply.", req:true,
        opts:["Pay","A change to my role or rate","Workload","Schedule","Management or leadership","Growth and career path","Tools and processes","A better opportunity","Personal or family reasons","Health","Other"]},
      {id:"change", type:"select", label:"If there was a recent change to your role, schedule or rate — was it explained clearly and fairly?", req:true,
        opts:["Very clearly and fairly","Somewhat","Not really","Not at all","Not applicable"]},
      {id:"change_note", type:"textarea", label:"Anything you'd like to add about that change?", ph:"Optional"},
      {id:"well", type:"textarea", label:"What did we do well that we should keep doing?", req:true},
      {id:"improve", type:"textarea", label:"What should we change or improve?", req:true},
      {id:"stay", type:"textarea", label:"What, if anything, would have made you stay?"},
      {id:"lead", type:"textarea", label:"Any feedback for the founder directly?"},
      {id:"nps", type:"scale", label:"How likely are you to recommend JMB Virtuals to a friend as a place to work?", req:true, min:0, max:10, lo:"Not at all", hi:"Very likely"},
      {id:"again", type:"select", label:"Would you consider working with JMB Virtuals again?", req:true, opts:["Yes","Maybe","No"]},
      {id:"other", type:"textarea", label:"Anything else you'd like to say?", ph:"Optional"}
    ]}
},
/* 10 */ { id:"sign", title:"Declarations & signature", est:5, sign:true }
];

var DECL = [
  ["handover","I have handed over my work and documented it in Module 6, completely and accurately to the best of my knowledge."],
  ["property","I have returned, or will return by my last working day, all company and client property listed in Module 5 — and I will return anything else I find later."],
  ["data","I have returned or securely deleted all confidential and personal data from my own devices and accounts, as described in Module 4, and I keep no copies. This is my written confirmation under NDA §9 and Data Privacy Policy §9."],
  ["access","I have not kept, forwarded or shared any credentials, and I will not access any client or JMB Virtuals account after my last working day."],
  ["confid","I understand that my confidentiality obligations continue for three (3) years after my engagement ends, and for trade secrets, credentials and personal data for as long as the law protects them."],
  ["nonsol","I understand that my non-solicitation, non-acceptance and non-circumvention obligations continue for twelve (12) months after my engagement ends."],
  ["fees","I understand that fees for services rendered up to my last working day are paid on the regular payout schedule under my Independent Contractor Agreement."],
  ["true","The information I gave in this program is true and complete."]
];

/* ─────────────────────────────── ENGINE ─────────────────────────────── */
var PASS = 0.8;
var S = { api:"", me:{}, kase:null, P:null, cur:0, part:"", mount:null, dirty:false, saveT:null, saving:false, retryT:null,
          readT0:0, readSeen:false, qz:null, sig:{pts:0, ctx:null}, booted:false, lastSec:0, view:false };

function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function firstName(n){ n=String(n||"").trim(); if(n.indexOf(",")>=0) n=(n.split(",")[1]||n); return (n.trim().split(/\s+/)[0])||"there"; }
function pDate(iso){ var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso||"")); return m?new Date(+m[1], +m[2]-1, +m[3]):null; }
function fmtDate(iso, wk){ var d=pDate(iso); if(!d) return iso?String(iso):"your last day"; try{ return d.toLocaleDateString("en-US", wk?{weekday:"long",month:"long",day:"numeric"}:{month:"long",day:"numeric",year:"numeric"}); }catch(e){ return String(iso); } }
var WORDS=["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"];
function tenure(start){
  var d=pDate(start); if(!d) return "your time";
  var n=new Date(), mo=(n.getFullYear()-d.getFullYear())*12+(n.getMonth()-d.getMonth()); if(n.getDate()<d.getDate()) mo--;
  if(mo<1) return "your time"; var y=Math.floor(mo/12), r=mo%12;
  if(y>=1) return (r?"more than ":"")+(WORDS[y]||y)+" year"+(y>1?"s":"");
  return (WORDS[mo]||mo)+" month"+(mo>1?"s":"");
}
function tok(s){
  var k=S.kase||{};
  return esc(s).replace(/\{first\}/g, esc(firstName(S.me.full_name)))
    .replace(/\{last_day\}/g, esc(fmtDate(k.last_day||k.effective_date, true)))
    .replace(/\{notice_date\}/g, esc(fmtDate(k.notice_date, false)))
    .replace(/\{tenure\}/g, esc(tenure(S.me.start_date)));
}
function toast(m, t){ try{ if(typeof showToast==="function") return showToast(m, t); }catch(e){} try{ console.log(m); }catch(_){} }
function $(id){ return document.getElementById(id); }

/* ── state helpers ── */
function M(id){ var P=S.P; P.mods=P.mods||{}; return P.mods[id]||(P.mods[id]={}); }
function partsOf(m){ var a=[]; if(m.sign) return ["sign"]; if(m.read) a.push("read"); if(m.quiz) a.push("quiz"); if(m.form) a.push("form"); return a; }
function partDone(m, p){ var s=M(m.id); if(p==="read") return !!s.read_at; if(p==="quiz") return !!(s.quiz&&s.quiz.passed_at); if(p==="form") return !!s.form_at; if(p==="sign") return !!S.P.submitted_at; return false; }
function modDone(m){ return partsOf(m).every(function(p){ return partDone(m,p); }); }
function firstOpen(){ for(var i=0;i<MODS.length;i++){ if(!modDone(MODS[i])) return i; } return MODS.length; }
function locked(i){ return i>firstOpen(); }
function prog(){ var d=0, left=0; MODS.forEach(function(m){ if(modDone(m)) d++; else left+=m.est; }); return { done:d, total:MODS.length, pct:Math.round(d*100/MODS.length), left:left }; }
function submitted(){ return !!(S.P&&S.P.submitted_at); }

/* ── saving ── */
function lsKey(){ return "offb_"+((S.kase&&S.kase.id)||"x"); }
function backup(){ try{ localStorage.setItem(lsKey(), JSON.stringify(S.P)); }catch(e){} }
function setSave(txt, bad){ var el=$("ob-save"); if(el){ el.textContent=txt; el.className="ob-save"+(bad?" bad":""); } }
function markDirty(fast){
  if(submitted()) return;
  S.P.rev=(S.P.rev||0)+1; S.dirty=true; backup(); setSave("Saving…");
  clearTimeout(S.saveT); S.saveT=setTimeout(saveNow, fast?150:1500);
}
function post(body, keep){
  return fetch(S.api, { method:"POST", body:JSON.stringify(body), keepalive:!!keep }).then(function(r){ return r.json(); });
}
function saveNow(keep){
  if(!S.dirty || submitted()) return;
  if(S.saving && !keep){ clearTimeout(S.saveT); S.saveT=setTimeout(saveNow, 1200); return; }
  S.saving=true; var rev=S.P.rev;
  post({ action:"offb_prog_save", employee_id:S.me.employee_id, case_id:S.kase.id, program:S.P }, keep).then(function(d){
    S.saving=false;
    if(d && d.ok){ if(S.P.rev===rev) S.dirty=false; S.P.updated_at=d.updated_at||S.P.updated_at; if(d.started_at) S.P.started_at=d.started_at;
      var t=new Date(); setSave("Saved "+t.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})); return; }
    if(d && d.error==="ALREADY_SUBMITTED"){ S.dirty=false; setSave("Already submitted"); return; }
    if(d && (d.error==="SIGNED_OUT"||d.error==="SESSION_MISMATCH")){ try{ if(typeof jmbSessEnsure==="function") jmbSessEnsure(); }catch(_e){} }
    retry(d&&d.error);
  }).catch(function(){ S.saving=false; retry("network"); });
}
function retry(why){ setSave("Not saved yet — retrying", true); clearTimeout(S.retryT); S.retryT=setTimeout(function(){ if(S.dirty) saveNow(); }, 8000); }

/* ── time on task (visible tab only) ── */
function tick(){
  if(!S.mount || !document.body.contains(S.mount)) return;
  var vis=(document.visibilityState||"visible")==="visible", onTab=!!(S.mount.offsetParent);
  if(vis && onTab && !submitted()){
    var m=MODS[S.cur]; if(m){ var s=M(m.id); s.secs=(s.secs||0)+1; S.P.secs=(S.P.secs||0)+1; if(S.part==="read" && !s.read_at) s.read_secs=(s.read_secs||0)+1; }
    if((S.P.secs%45)===0) markDirty();
  }
  if(S.part==="read") readHint();
}

/* ── shell ── */
var ICON_CHECK='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';
var ICON_LOCK='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
function metaOf(m){ var p=partsOf(m), bits=[]; if(p.indexOf("quiz")>=0) bits.push("quiz"); if(p.indexOf("form")>=0) bits.push(m.id==="exit"?"survey":"form"); if(m.sign) bits.push("sign"); return m.est+" min"+(bits.length?" · "+bits.join(" + "):" · read"); }
function shell(){
  S.mount.innerHTML=
    '<div class="ob">'+
      '<div class="ob-hero">'+
        '<div class="ob-hero-top"><div><div class="ob-kick">Offboarding program</div><h2 class="ob-h2">Leaving well, '+esc(firstName(S.me.full_name))+'</h2>'+
        '<div class="ob-sub" id="ob-sub"></div></div>'+
        '<div class="ob-ring" id="ob-ring"></div></div>'+
        '<div class="ob-bar"><i id="ob-bar"></i></div>'+
        '<div class="ob-hero-foot"><button class="ob-btn ob-ghost" id="ob-track" type="button">'+
          '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg>Track this as paid time</button>'+
          '<span class="ob-save" id="ob-save">Saved</span></div>'+
      '</div>'+
      '<div class="ob-grid"><nav class="ob-nav" id="ob-nav"></nav><section class="ob-main" id="ob-main"></section></div>'+
    '</div>';
  $("ob-track").onclick=trackPaid;
  $("ob-nav").onclick=function(e){ var b=e.target.closest("[data-i]"); if(!b) return; var i=+b.getAttribute("data-i"); if(locked(i)){ toast("Finish the modules before this one first."); return; } go(i); };
  var main=$("ob-main");
  main.addEventListener("input", onField); main.addEventListener("change", onField); main.addEventListener("click", onClick);
}
function hero(){
  var g=prog(), k=S.kase||{};
  var sub=submitted() ? ('Submitted '+esc(String(S.P.submitted_at).slice(0,16))+' · thank you')
    : ('Complete by <b>'+esc(fmtDate(k.last_day||k.effective_date, true))+'</b> · '+(g.left?('about '+fmtMin(g.left)+' left'):'ready to sign')+' · saves as you go');
  $("ob-sub").innerHTML=sub;
  var r=26, c=2*Math.PI*r, off=c*(1-g.pct/100);
  $("ob-ring").innerHTML='<svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="'+r+'" fill="none" stroke="rgba(148,163,184,.25)" stroke-width="6"/>'+
    '<circle cx="32" cy="32" r="'+r+'" fill="none" stroke="url(#obg)" stroke-width="6" stroke-linecap="round" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" transform="rotate(-90 32 32)"/>'+
    '<defs><linearGradient id="obg" x1="0" x2="1"><stop offset="0" stop-color="#ff8a3d"/><stop offset="1" stop-color="#f1560f"/></linearGradient></defs></svg>'+
    '<div class="ob-ring-t"><b>'+g.done+'</b><span>/'+g.total+'</span></div>';
  $("ob-bar").style.width=g.pct+"%";
  $("ob-track").style.display=submitted()?"none":"";
}
function fmtMin(m){ if(m<60) return m+" min"; var h=Math.floor(m/60), r=m%60; return h+" h"+(r?(" "+r+" min"):""); }
function nav(){
  var fo=firstOpen();
  $("ob-nav").innerHTML=MODS.map(function(m,i){
    var d=modDone(m), lk=i>fo, cur=i===S.cur;
    return '<button type="button" class="ob-ni'+(d?" done":"")+(lk?" lock":"")+(cur?" cur":"")+'" data-i="'+i+'">'+
      '<span class="ob-nn">'+(d?ICON_CHECK:(lk?ICON_LOCK:(i+1)))+'</span>'+
      '<span class="ob-nt"><b>'+esc(m.title)+'</b><small>'+esc(metaOf(m))+'</small></span></button>';
  }).join("");
}
function go(i, part){
  S.cur=Math.max(0, Math.min(MODS.length-1, i)); var m=MODS[S.cur], ps=partsOf(m);
  if(part && ps.indexOf(part)>=0 && (partDone(m,part) || ps.slice(0, ps.indexOf(part)).every(function(p){ return partDone(m,p); }))) S.part=part;
  else { S.part=ps[0]; for(var k=0;k<ps.length;k++){ if(!partDone(m,ps[k])){ S.part=ps[k]; break; } } }
  S.P.cur=m.id; S.qz=null; nav(); hero(); main();
  try{ var mn=$("ob-main"); if(mn && mn.getBoundingClientRect().top<0) mn.scrollIntoView({behavior:"smooth", block:"start"}); }catch(e){}
}

/* ── main area ── */
function main(){
  var m=MODS[S.cur], ps=partsOf(m), el=$("ob-main");
  var steps=ps.length>1 ? '<div class="ob-steps">'+ps.map(function(p,k){
      var lbl={read:"Read",quiz:"Quiz",form:(m.id==="exit"?"Survey":"Form")}[p]||p, d=partDone(m,p), can=d||ps.slice(0,k).every(function(q){ return partDone(m,q); });
      return '<button type="button" class="ob-step'+(p===S.part?" on":"")+(d?" done":"")+(can?"":" off")+'" data-act="part" data-p="'+p+'">'+(d?ICON_CHECK:'<span>'+(k+1)+'</span>')+lbl+'</button>'; }).join('<i class="ob-stepline"></i>')+'</div>' : '';
  var head='<div class="ob-mh"><div class="ob-kick">Module '+(S.cur+1)+' of '+MODS.length+' · about '+m.est+' min</div><h3 class="ob-h3">'+esc(m.title)+'</h3>'+steps+'</div>';
  var body="";
  if(S.part==="read") body=readView(m); else if(S.part==="quiz") body=quizView(m); else if(S.part==="form") body=formView(m); else if(S.part==="sign") body=signView();
  el.innerHTML=head+'<div class="ob-part" id="ob-part">'+body+'</div>';
  if(S.part==="read") readArm(m);
  if(S.part==="sign" && !submitted()) padArm();
}

/* READ */
function blocks(list){
  return (list||[]).map(function(b){
    if(b.p) return '<p>'+tok(b.p)+'</p>';
    if(b.h) return '<h4>'+tok(b.h)+'</h4>';
    if(b.ul) return '<ul>'+b.ul.map(function(x){ return '<li>'+tok(x)+'</li>'; }).join("")+'</ul>';
    if(b.ol) return '<ol>'+b.ol.map(function(x){ return '<li>'+tok(x)+'</li>'; }).join("")+'</ol>';
    if(b.kv) return '<div class="ob-kv">'+b.kv.map(function(r){ return '<div><b>'+tok(r[0])+'</b><span>'+tok(r[1])+'</span></div>'; }).join("")+'</div>';
    if(b.callout) return '<div class="ob-call '+(b.callout.tone||"info")+'">'+(b.callout.title?'<b>'+tok(b.callout.title)+'</b>':'')+'<div>'+tok(b.callout.text)+'</div></div>';
    if(b.example) return '<div class="ob-ex"><div class="ob-ex-t">'+tok(b.example.title)+'</div>'+b.example.lines.map(function(x){ return '<div>'+tok(x)+'</div>'; }).join("")+'</div>';
    if(b.template) return '<div class="ob-tpl"><div class="ob-tpl-t">'+tok(b.template)+'</div><button type="button" class="ob-btn ob-ghost ob-sm" data-act="copy" data-txt="'+esc(b.template)+'">Copy message</button></div>';
    return "";
  }).join("");
}
function readView(m){
  var s=M(m.id), done=!!s.read_at;
  return '<article class="ob-read">'+blocks(m.read.blocks)+'</article><div id="ob-endread" class="ob-endread"></div>'+
    '<div class="ob-foot">'+(done?'<span class="ob-ok">'+ICON_CHECK+' Read on '+esc(String(s.read_at).slice(0,10))+'</span>':'<span class="ob-hint" id="ob-readhint"></span>')+
    '<button type="button" class="ob-btn" id="ob-readok" data-act="readok"'+(done?'':' disabled')+'>'+(done?'Continue':'I\'ve read and understood this')+' →</button></div>';
}
function readArm(m){
  S.readT0=Date.now(); S.readSeen=!!M(m.id).read_at;
  var end=$("ob-endread");
  if(end && "IntersectionObserver" in window){ var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ S.readSeen=true; readHint(); io.disconnect(); } }); }); io.observe(end); }
  else S.readSeen=true;
  readHint();
}
function readLeft(m){ var s=M(m.id); return Math.max(0, (m.read.min||0)-(s.read_secs||0)); }
function readHint(){
  var m=MODS[S.cur]; if(!m||S.part!=="read") return; var s=M(m.id), b=$("ob-readok"), h=$("ob-readhint"); if(!b||s.read_at) return;
  var left=readLeft(m), ok=left<=0 && S.readSeen;
  b.disabled=!ok;
  if(h) h.textContent = ok ? "" : (!S.readSeen ? "Read to the end to continue." : ("Take your time — continue unlocks in "+Math.floor(left/60)+":"+String(left%60).padStart(2,"0")+"."));
}

/* QUIZ */
function shuffle(n){ var a=[]; for(var i=0;i<n;i++) a.push(i); for(var j=n-1;j>0;j--){ var k=Math.floor(Math.random()*(j+1)); var t=a[j]; a[j]=a[k]; a[k]=t; } return a; }
function quizNew(m){ S.qz={ mid:m.id, perm:m.quiz.qs.map(function(q){ return shuffle(q.o.length); }), picks:m.quiz.qs.map(function(){ return -1; }), res:null }; }
function quizView(m){
  var s=M(m.id), qs=m.quiz.qs, q=s.quiz||{};
  if(q.passed_at && (!S.qz || S.qz.mid!==m.id || !S.qz.res)){
    var last=(q.tries||[])[q.tries.length-1]||{};
    return '<div class="ob-pass"><div class="ob-pass-n">'+(last.score||0)+'<span>/'+(last.total||qs.length)+'</span></div><div><b>Quiz passed</b><div class="ob-muted">'+
      'First try '+((q.first&&q.first.score)||0)+'/'+((q.first&&q.first.total)||qs.length)+' · '+(q.tries||[]).length+' attempt'+((q.tries||[]).length>1?'s':'')+'</div></div></div>'+
      '<div class="ob-foot"><span></span><button type="button" class="ob-btn" data-act="next">Continue →</button></div>';
  }
  if(!S.qz || S.qz.mid!==m.id) quizNew(m);
  var Z=S.qz, R=Z.res;
  var html=(R?'':'<p class="ob-muted">'+qs.length+' questions · you need '+Math.ceil(qs.length*PASS)+' correct ('+Math.round(PASS*100)+'%) to pass. If you miss, you can review and retake.</p>');
  if(R) html+='<div class="ob-res '+(R.pass?"ok":"no")+'"><b>'+R.score+' / '+R.total+'</b> — '+(R.pass?"Passed. Well done.":"Not quite — "+Math.ceil(R.total*PASS)+" needed. Review the answers below, then retake.")+'</div>';
  html+=qs.map(function(qq,i){
    var pick=Z.picks[i], correct=R?(pick===qq.a):null;
    return '<div class="ob-q'+(R?(correct?" right":" wrong"):"")+'"><div class="ob-qn">Question '+(i+1)+' of '+qs.length+'</div><div class="ob-qt">'+esc(qq.q)+'</div><div class="ob-opts">'+
      Z.perm[i].map(function(oi){
        var cls=""; if(R){ if(oi===qq.a) cls=" ans"; else if(oi===pick) cls=" miss"; }
        return '<label class="ob-opt'+(pick===oi?" on":"")+cls+'"><input type="radio" name="obq'+i+'" data-q="'+i+'" value="'+oi+'"'+(pick===oi?" checked":"")+(R?" disabled":"")+'><span>'+esc(qq.o[oi])+'</span></label>'; }).join("")+'</div>'+
      (R && !correct ? '<div class="ob-why"><b>Why:</b> '+esc(qq.why||"")+'</div>' : (R?'<div class="ob-why ok">'+esc(qq.why||"")+'</div>':''))+'</div>';
  }).join("");
  html+='<div class="ob-foot"><span class="ob-hint" id="ob-qhint"></span>'+
    (R ? (R.pass?'<button type="button" class="ob-btn" data-act="next">Continue →</button>':'<button type="button" class="ob-btn" data-act="retake">Retake quiz</button>')
       : '<button type="button" class="ob-btn" data-act="qsubmit" id="ob-qsub"'+(Z.picks.indexOf(-1)>=0?" disabled":"")+'>Submit answers</button>')+'</div>';
  return html;
}
function quizSubmit(){
  var m=MODS[S.cur], qs=m.quiz.qs, Z=S.qz; if(!Z||Z.picks.indexOf(-1)>=0) return;
  var score=0; qs.forEach(function(q,i){ if(Z.picks[i]===q.a) score++; });
  var total=qs.length, pass=score/total>=PASS-1e-9, s=M(m.id); s.quiz=s.quiz||{tries:[]}; s.quiz.tries=s.quiz.tries||[];
  var stamp=nowStamp(); s.quiz.tries.push({ at:stamp, score:score, total:total, ans:Z.picks.slice() });
  if(!s.quiz.first) s.quiz.first={ score:score, total:total, at:stamp };
  if(!s.quiz.best || score>s.quiz.best) s.quiz.best=score;
  if(pass && !s.quiz.passed_at) s.quiz.passed_at=stamp;
  Z.res={ score:score, total:total, pass:pass };
  markDirty(true); main(); nav(); hero();
  try{ $("ob-main").scrollIntoView({behavior:"smooth", block:"start"}); }catch(e){}
}
function nowStamp(){ var d=new Date(); function p(n){ return String(n).padStart(2,"0"); } return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+" "+p(d.getHours())+":"+p(d.getMinutes()); }

/* FORM */
function fval(m, fid){ var s=M(m.id); s.form=s.form||{}; return s.form[fid]; }
function rowsVal(m, f){ var s=M(m.id); s.form=s.form||{}; if(!Array.isArray(s.form[f.id])){ s.form[f.id]=(f.seed||[]).map(function(r){ return JSON.parse(JSON.stringify(r)); }); if(!s.form[f.id].length) s.form[f.id]=[{}]; } return s.form[f.id]; }
function formView(m){
  var F=m.form, ro=submitted(), s=M(m.id);
  var html=(F.intro?'<p class="ob-muted">'+tok(F.intro)+'</p>':'')+(m.id==="access"?'<div class="ob-call warn"><b>No passwords</b><div>'+esc(NEVER_PW)+'</div></div>':'');
  html+='<div class="ob-form'+(ro?" ro":"")+'">'+F.fields.map(function(f){ return field(m,f,ro); }).join("")+'</div>';
  html+='<div class="ob-err" id="ob-ferr"></div><div class="ob-foot">'+(s.form_at?'<span class="ob-ok">'+ICON_CHECK+' Saved '+esc(String(s.form_at).slice(0,16))+'</span>':'<span class="ob-hint">Saves automatically as you type.</span>')+
    (ro?'<span></span>':'<button type="button" class="ob-btn" data-act="fsave">'+(s.form_at?'Update & continue':'Save & continue')+' →</button>')+'</div>';
  return html;
}
function lbl(f){ return '<label class="ob-l">'+esc(f.label)+(f.req?' <i>*</i>':'')+'</label>'; }
function ctl(col, v, attrs, ro){
  v=v==null?"":v; var dis=ro?" disabled":"";
  if(col.type==="textarea") return '<textarea class="ob-in" rows="'+(col.rows||3)+'" '+attrs+' placeholder="'+esc(col.ph||"")+'"'+dis+'>'+esc(v)+'</textarea>';
  if(col.type==="select") return '<select class="ob-in" '+attrs+dis+'><option value="">Choose…</option>'+col.opts.map(function(o){ return '<option'+(o===v?" selected":"")+'>'+esc(o)+'</option>'; }).join("")+'</select>';
  return '<input class="ob-in" type="text" '+attrs+' value="'+esc(v)+'" placeholder="'+esc(col.ph||"")+'"'+dis+'>';
}
function field(m, f, ro){
  var v=fval(m, f.id), id='data-f="'+f.id+'"';
  var wrap=function(inner){ return '<div class="ob-f" id="obf-'+f.id+'">'+inner+'</div>'; };
  if(f.type==="text"||f.type==="textarea"||f.type==="select") return wrap(lbl(f)+ctl(f, v, id, ro));
  if(f.type==="checks"){ var arr=Array.isArray(v)?v:[];
    return wrap(lbl(f)+'<div class="ob-chips">'+f.opts.map(function(o){ return '<label class="ob-chip'+(arr.indexOf(o)>=0?" on":"")+'"><input type="checkbox" '+id+' value="'+esc(o)+'"'+(arr.indexOf(o)>=0?" checked":"")+(ro?" disabled":"")+'>'+esc(o)+'</label>'; }).join("")+'</div>'); }
  if(f.type==="scale"){ var mn=f.min==null?1:f.min, out='';
    for(var n=mn;n<=f.max;n++) out+='<button type="button" class="ob-sc'+(v===n?" on":"")+'" data-act="scale" data-f="'+f.id+'" data-v="'+n+'"'+(ro?" disabled":"")+'>'+n+'</button>';
    return wrap(lbl(f)+'<div class="ob-scale">'+out+'</div><div class="ob-scale-l" style="max-width:'+((f.max-mn+1)*44-6)+'px"><span>'+esc(f.lo||"")+'</span><span>'+esc(f.hi||"")+'</span></div>'); }
  if(f.type==="grid"){ var g=(v&&typeof v==="object")?v:{};
    return wrap(lbl(f)+'<div class="ob-grid2">'+f.items.map(function(it){ var o=''; for(var n=1;n<=f.max;n++) o+='<button type="button" class="ob-sc sm'+(g[it[0]]===n?" on":"")+'" data-act="grid" data-f="'+f.id+'" data-k="'+it[0]+'" data-v="'+n+'"'+(ro?" disabled":"")+'>'+n+'</button>';
      return '<div class="ob-gr" id="obg-'+it[0]+'"><span>'+esc(it[1])+'</span><div class="ob-scale">'+o+'</div></div>'; }).join("")+'</div><div class="ob-scale-l"><span>1 = '+esc(f.lo)+'</span><span>'+f.max+' = '+esc(f.hi)+'</span></div>'); }
  if(f.type==="audit"){ var a=(v&&typeof v==="object")?v:{};
    return wrap('<div class="ob-audit">'+f.items.map(function(it){
      return '<div class="ob-au" id="oba-'+it[0]+'"><span>'+esc(it[1])+'</span><div class="ob-seg">'+f.opts.map(function(o){ return '<button type="button" class="'+(a[it[0]]===o?"on":"")+(o==="Need help"?" help":"")+'" data-act="audit" data-f="'+f.id+'" data-k="'+it[0]+'" data-v="'+esc(o)+'"'+(ro?" disabled":"")+'>'+esc(o)+'</button>'; }).join("")+'</div></div>'; }).join("")+'</div>'); }
  if(f.type==="rows"){ var rows=rowsVal(m,f);
    return wrap(lbl(f)+'<div class="ob-rows"><div class="ob-rh">'+f.cols.map(function(c){ return '<span>'+esc(c.label)+(c.req?' <i>*</i>':'')+'</span>'; }).join("")+'<span></span></div>'+
      rows.map(function(r,ri){ return '<div class="ob-rw" id="obr-'+f.id+'-'+ri+'">'+f.cols.map(function(c){ return '<div class="ob-rc" data-lbl="'+esc(c.label)+'">'+ctl(c, r[c.id], 'data-f="'+f.id+'" data-r="'+ri+'" data-c="'+c.id+'"', ro)+'</div>'; }).join("")+
        (ro?'<span></span>':'<button type="button" class="ob-x" data-act="rdel" data-f="'+f.id+'" data-r="'+ri+'" title="Remove">✕</button>')+'</div>'; }).join("")+'</div>'+
      (ro?'':'<button type="button" class="ob-btn ob-ghost ob-sm" data-act="radd" data-f="'+f.id+'">+ '+esc(f.add||"Add row")+'</button>')); }
  if(f.type==="cards"){ var rows2=rowsVal(m,f);
    return wrap(lbl(f)+rows2.map(function(r,ri){ return '<div class="ob-card" id="obr-'+f.id+'-'+ri+'"><div class="ob-card-h"><b>'+esc(f.name||"Item")+' '+(ri+1)+'</b>'+(ro||rows2.length<2?'':'<button type="button" class="ob-x" data-act="rdel" data-f="'+f.id+'" data-r="'+ri+'" title="Remove">✕</button>')+'</div>'+
      f.cols.map(function(c){ return '<div class="ob-f in"><label class="ob-l">'+esc(c.label)+(c.req?' <i>*</i>':'')+'</label>'+ctl(c, r[c.id], 'data-f="'+f.id+'" data-r="'+ri+'" data-c="'+c.id+'"', ro)+'</div>'; }).join("")+'</div>'; }).join("")+
      (ro?'':'<button type="button" class="ob-btn ob-ghost ob-sm" data-act="radd" data-f="'+f.id+'">+ '+esc(f.add||"Add")+'</button>')); }
  return "";
}
function onField(e){
  var t=e.target; if(!t || !t.getAttribute) return;
  if(t.getAttribute("data-decl")!=null || t.id==="ob-signame"){ dcChange(); return; }
  if(t.name && /^obq/.test(t.name)){ if(!S.qz||S.qz.res) return; S.qz.picks[+t.getAttribute("data-q")]=+t.value;
    var opts=t.closest(".ob-opts"); if(opts) Array.prototype.forEach.call(opts.children, function(l){ l.classList.toggle("on", l.contains(t)); });
    var b=$("ob-qsub"); if(b) b.disabled=S.qz.picks.indexOf(-1)>=0; return; }
  var fid=t.getAttribute("data-f"); if(!fid || submitted()) return;
  var m=MODS[S.cur], s=M(m.id); s.form=s.form||{};
  if(t.type==="checkbox"){ var arr=Array.isArray(s.form[fid])?s.form[fid]:[]; var v=t.value; if(t.checked){ if(arr.indexOf(v)<0) arr.push(v); } else arr=arr.filter(function(x){ return x!==v; }); s.form[fid]=arr; t.parentNode.classList.toggle("on", t.checked); }
  else if(t.hasAttribute("data-r")){ var f=fdef(m,fid), rows=rowsVal(m,f), ri=+t.getAttribute("data-r"); rows[ri]=rows[ri]||{}; rows[ri][t.getAttribute("data-c")]=String(t.value).slice(0,4000); }
  else s.form[fid]=String(t.value).slice(0,6000);
  t.classList.remove("bad"); var w=t.closest(".ob-f"); if(w) w.classList.remove("bad");
  if(e.type==="input"||e.type==="change") markDirty();
}
function fdef(m, fid){ for(var i=0;i<m.form.fields.length;i++) if(m.form.fields[i].id===fid) return m.form.fields[i]; return null; }
function filled(x){ return x!=null && String(x).trim()!==""; }
function validate(m){
  var s=M(m.id), v=s.form||{}, bad=null;
  m.form.fields.forEach(function(f){
    if(bad||!f.req) return; var x=v[f.id];
    if(f.type==="text"||f.type==="textarea"||f.type==="select"){ if(!filled(x)) bad={el:"obf-"+f.id, msg:"Please answer: "+f.label}; }
    else if(f.type==="checks"){ if(!Array.isArray(x)||!x.length) bad={el:"obf-"+f.id, msg:"Pick at least one: "+f.label}; }
    else if(f.type==="scale"){ if(typeof x!=="number") bad={el:"obf-"+f.id, msg:"Please choose a number: "+f.label}; }
    else if(f.type==="grid"){ var g=x||{}; f.items.some(function(it){ if(typeof g[it[0]]!=="number"){ bad={el:"obg-"+it[0], msg:"Please rate: "+it[1]}; return true; } }); }
    else if(f.type==="audit"){ var a=x||{}; f.items.some(function(it){ if(!a[it[0]]){ bad={el:"oba-"+it[0], msg:"Please choose an answer for: "+it[1]}; return true; } }); }
    else if(f.type==="rows"||f.type==="cards"){ var rows=rowsVal(m,f).filter(function(r){ return f.cols.some(function(c){ return filled(r[c.id]); }); });
      if(rows.length<(f.min||1)){ bad={el:"obf-"+f.id, msg:"Add at least "+(f.min||1)+" "+(f.type==="cards"?"workstream":"items")+"."}; return; }
      var all=rowsVal(m,f); all.some(function(r,ri){ if(!f.cols.some(function(c){ return filled(r[c.id]); })) return false;
        return f.cols.some(function(c){ if(c.req && !filled(r[c.id])){ bad={el:"obr-"+f.id+"-"+ri, msg:(f.name||"Row")+" "+(ri+1)+": please fill in “"+c.label+"”."}; return true; } }); }); }
  });
  return bad;
}
function formSave(){
  var m=MODS[S.cur], bad=validate(m), er=$("ob-ferr");
  if(bad){ if(er){ er.textContent=bad.msg; er.style.display="block"; } var el=$(bad.el); if(el){ el.classList.add("bad"); try{ el.scrollIntoView({behavior:"smooth", block:"center"}); }catch(e){} } return; }
  var s=M(m.id); s.form_at=nowStamp();
  var all=s.form||{}; Object.keys(all).forEach(function(k){ var f=fdef(m,k); if(f&&(f.type==="rows"||f.type==="cards")) all[k]=rowsVal(m,f).filter(function(r){ return f.cols.some(function(c){ return filled(r[c.id]); }); }); });
  markDirty(true); next();
}

/* SIGN */
function signView(){
  var P=S.P;
  if(submitted()){
    var sg=P.sign||{};
    return '<div class="ob-done"><div class="ob-done-ic">'+ICON_CHECK+'</div><h4>Thank you, '+esc(firstName(S.me.full_name))+'.</h4>'+
      '<p>Your offboarding program was submitted on <b>'+esc(String(P.submitted_at).slice(0,16))+'</b>'+(sg.name?(' and signed as <b>'+esc(sg.name)+'</b>'):'')+'.</p>'+
      (sg.pdf_url?'<p><a class="ob-btn" href="'+esc(sg.pdf_url)+'" target="_blank" rel="noopener">Open your copy (PDF)</a></p>':'')+
      '<h4>What happens next</h4><ol><li>HR checks your handover and the items you listed for return.</li><li>On or after your last day, HR completes your clearance and closes your portal account.</li><li>Fees for services rendered up to your last working day are paid on the regular payout schedule.</li><li>Your certificate is issued on request once clearance is complete.</li></ol>'+
      '<p class="ob-muted">You can still re-read any module from the list. It has been a privilege working with you.</p></div>';
  }
  var nm=(P.sign_draft&&P.sign_draft.name)||"", ck=(P.sign_draft&&P.sign_draft.decl)||[];
  return '<p class="ob-muted">Last step. Read each statement and tick it only if it is true. Your signature confirms all of them in writing — including the written confirmation of return and deletion your NDA (§9) and the Data Privacy Policy (§9) ask for. You will get a PDF copy.</p>'+
    '<div class="ob-decl">'+DECL.map(function(d){ return '<label class="ob-dc'+(ck.indexOf(d[0])>=0?" on":"")+'"><input type="checkbox" data-decl="'+d[0]+'"'+(ck.indexOf(d[0])>=0?" checked":"")+'><span>'+esc(d[1])+'</span></label>'; }).join("")+'</div>'+
    '<div class="ob-f"><label class="ob-l">Your full name, as in your contract <i>*</i></label><input class="ob-in" id="ob-signame" type="text" value="'+esc(nm)+'" placeholder="'+esc(S.me.full_name||"")+'"></div>'+
    '<div class="ob-f"><label class="ob-l">Signature <i>*</i></label><div class="ob-pad"><canvas id="ob-pad"></canvas><span class="ob-pad-h" id="ob-padh">Sign here with your mouse or finger</span></div>'+
    '<div class="ob-pad-f"><span>'+esc(nowStamp().slice(0,10))+' · '+esc(S.me.employee_id||"")+'</span><button type="button" class="ob-btn ob-ghost ob-sm" data-act="padclear">Clear</button></div></div>'+
    '<div class="ob-err" id="ob-ferr"></div><div class="ob-foot"><span class="ob-hint">You can only submit once.</span><button type="button" class="ob-btn" data-act="submit" id="ob-submit">Sign &amp; submit</button></div>';
}
function padArm(){
  var cv=$("ob-pad"); if(!cv) return; var r=cv.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
  cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr);
  var ctx=cv.getContext("2d"); ctx.scale(dpr,dpr); ctx.lineWidth=2.4; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.strokeStyle="#111827";
  S.sig={ pts:0, ctx:ctx, cv:cv }; var down=false, lx=0, ly=0;
  function pos(e){ var b=cv.getBoundingClientRect(); return [e.clientX-b.left, e.clientY-b.top]; }
  cv.onpointerdown=function(e){ down=true; try{ cv.setPointerCapture(e.pointerId); }catch(_){} var p=pos(e); lx=p[0]; ly=p[1]; ctx.beginPath(); ctx.arc(lx,ly,1.1,0,7); ctx.fillStyle="#111827"; ctx.fill(); S.sig.pts++; var h=$("ob-padh"); if(h) h.style.display="none"; e.preventDefault(); };
  cv.onpointermove=function(e){ if(!down) return; var p=pos(e); ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(p[0],p[1]); ctx.stroke(); lx=p[0]; ly=p[1]; S.sig.pts++; e.preventDefault(); };
  cv.onpointerup=cv.onpointercancel=function(){ down=false; };
}
function signSubmit(){
  var er=$("ob-ferr"), btn=$("ob-submit"), P=S.P;
  var decl=Array.prototype.slice.call(document.querySelectorAll("[data-decl]")).filter(function(c){ return c.checked; }).map(function(c){ return c.getAttribute("data-decl"); });
  var name=String(($("ob-signame")||{}).value||"").trim();
  function fail(msg){ if(er){ er.textContent=msg; er.style.display="block"; } }
  for(var i=0;i<MODS.length-1;i++){ if(!modDone(MODS[i])) return fail("Please finish Module "+(i+1)+" first."); }
  if(decl.length<DECL.length) return fail("Please read and tick every statement. If one isn't true yet, finish that step first, or message Jeth.");
  if(name.split(/\s+/).length<2) return fail("Please type your full name (first and last).");
  if(!S.sig || S.sig.pts<12) return fail("Please draw your signature in the box.");
  var png=""; try{ png=S.sig.cv.toDataURL("image/png").split(",")[1]||""; }catch(e){}
  if(er) er.style.display="none"; btn.disabled=true; btn.textContent="Submitting…";
  clearTimeout(S.saveT);
  post({ action:"offb_prog_submit", employee_id:S.me.employee_id, case_id:S.kase.id, program:P, sig_name:name, sig_png:png, decl:decl }).then(function(d){
    if(d && d.ok){ S.P=d.program||P; S.dirty=false; try{ localStorage.removeItem(lsKey()); }catch(_){} hero(); nav(); main(); toast("Submitted — thank you, "+firstName(S.me.full_name)+"."); return; }
    btn.disabled=false; btn.textContent="Sign & submit";
    var map={ INCOMPLETE:"Some modules aren't finished yet: "+((d&&d.missing)||[]).join(", "), ALREADY_SUBMITTED:"This was already submitted.", SIGNED_OUT:"Your session expired — refresh the page and sign in again; your answers are saved." };
    fail((d&&map[d.error])||("Couldn't submit ("+((d&&d.error)||"error")+"). Your answers are saved — please try again."));
  }).catch(function(){ btn.disabled=false; btn.textContent="Sign & submit"; fail("Network error — your answers are saved. Please try again."); });
}

/* ── clicks ── */
function next(){ var m=MODS[S.cur], ps=partsOf(m), k=ps.indexOf(S.part);
  if(k>=0 && k<ps.length-1 && partDone(m, ps[k])){ S.part=ps[k+1]; S.qz=null; nav(); hero(); main(); scrollTop(); return; }
  if(modDone(m) && S.cur<MODS.length-1){ go(S.cur+1); scrollTop(); return; }
  nav(); hero(); main(); }
function scrollTop(){ try{ var el=S.mount.querySelector(".ob-grid"); if(el) el.scrollIntoView({behavior:"smooth", block:"start"}); }catch(e){} }
function onClick(e){
  var b=e.target.closest("[data-act]"); if(!b) return;
  var act=b.getAttribute("data-act"), m=MODS[S.cur];
  if(act==="part"){ if(b.classList.contains("off")) return; S.part=b.getAttribute("data-p"); S.qz=null; main(); return; }
  if(act==="readok"){ var s=M(m.id); if(!s.read_at){ if(b.disabled) return; s.read_at=nowStamp(); markDirty(true); } next(); return; }
  if(act==="qsubmit"){ quizSubmit(); return; }
  if(act==="retake"){ quizNew(m); main(); scrollTop(); return; }
  if(act==="next"){ next(); return; }
  if(act==="fsave"){ formSave(); return; }
  if(act==="copy"){ var t=b.getAttribute("data-txt"); try{ navigator.clipboard.writeText(t); toast("Copied."); }catch(_){ toast("Select the text to copy it."); } return; }
  if(submitted()) return;
  var fid=b.getAttribute("data-f"), st=M(m.id); st.form=st.form||{};
  if(act==="scale"){ st.form[fid]=+b.getAttribute("data-v"); Array.prototype.forEach.call(b.parentNode.children, function(x){ x.classList.toggle("on", x===b); }); markDirty(); b.closest(".ob-f").classList.remove("bad"); return; }
  if(act==="grid"){ var g=st.form[fid]&&typeof st.form[fid]==="object"?st.form[fid]:{}; g[b.getAttribute("data-k")]=+b.getAttribute("data-v"); st.form[fid]=g; Array.prototype.forEach.call(b.parentNode.children, function(x){ x.classList.toggle("on", x===b); }); markDirty(); b.closest(".ob-gr").classList.remove("bad"); return; }
  if(act==="audit"){ var a=st.form[fid]&&typeof st.form[fid]==="object"?st.form[fid]:{}; a[b.getAttribute("data-k")]=b.getAttribute("data-v"); st.form[fid]=a; Array.prototype.forEach.call(b.parentNode.children, function(x){ x.classList.toggle("on", x===b); }); markDirty(); b.closest(".ob-au").classList.remove("bad"); return; }
  if(act==="radd"){ var f=fdef(m,fid); rowsVal(m,f).push({}); markDirty(); main(); var rr=rowsVal(m,f).length-1, el=$("obr-"+fid+"-"+rr); if(el){ try{ el.scrollIntoView({behavior:"smooth", block:"center"}); var i0=el.querySelector("input,textarea"); if(i0) i0.focus(); }catch(_){} } return; }
  if(act==="rdel"){ var f2=fdef(m,fid), rows=rowsVal(m,f2), ri=+b.getAttribute("data-r"); rows.splice(ri,1); if(!rows.length) rows.push({}); markDirty(); main(); return; }
  if(act==="padclear"){ if(S.sig&&S.sig.ctx){ S.sig.ctx.clearRect(0,0,S.sig.cv.width,S.sig.cv.height); S.sig.pts=0; var h=$("ob-padh"); if(h) h.style.display=""; } return; }
  if(act==="submit"){ signSubmit(); return; }
}
function dcChange(){ if(submitted()) return; var P=S.P; P.sign_draft=P.sign_draft||{};
  P.sign_draft.decl=Array.prototype.slice.call(document.querySelectorAll("[data-decl]")).filter(function(c){ c.parentNode.classList.toggle("on", c.checked); return c.checked; }).map(function(c){ return c.getAttribute("data-decl"); });
  var n=$("ob-signame"); if(n) P.sign_draft.name=n.value; markDirty(); }

/* ── tracker helper: JMB Internal › Offboarding › Offboarding program ── */
function trackPaid(){
  var running=false; try{ running=(typeof trkRunning!=="undefined") && !!trkRunning; }catch(e){}
  if(running){ var r=trkRunning||{}; if(/offboard/i.test(String(r.category||"")+String(r.task||""))){ toast("Your tracker is already on the offboarding task."); return; }
    toast("Stop or pause your current task first, then press this again to set the offboarding task.", "warn"); return; }
  try{ switchTab("attendance", document.getElementById("tabbtn-attendance")); }catch(e){}
  setTimeout(function(){
    try{ trkRestoreFields({ project:"JMB Internal", category:"Offboarding", task:"Offboarding program", description:"Offboarding program (paid)" }); }catch(e){}
    var ok=false; try{ ok=(document.getElementById("cfy-project")||{}).value==="JMB Internal" && (document.getElementById("cfy-category")||{}).value==="Offboarding"; }catch(_){}
    toast(ok?"Tracker set to JMB Internal › Offboarding › Offboarding program — press Start, then come back to the Offboarding tab.":"Pick JMB Internal › Offboarding › Offboarding program in the tracker, then press Start.");
  }, 500);
}

/* ── boot ── */
function css(){
  if($("ob-css")) return; var st=document.createElement("style"); st.id="ob-css"; st.textContent=CSS; document.head.appendChild(st);
}
var CSS=
".ob{--ob-o:#f97316;--ob-o2:#ea580c;--ob-tx:var(--text-1,#0f172a);--ob-t2:var(--text-2,#475569);--ob-t3:var(--text-3,#64748b);--ob-ln:var(--border,rgba(148,163,184,.28));--ob-bg:var(--bg-card,#fff);--ob-bg2:var(--bg-card2,rgba(148,163,184,.08));color:var(--ob-tx);font-size:14px;line-height:1.6}"+
".ob *{box-sizing:border-box}"+
".ob-hero{border:1px solid var(--ob-ln);background:linear-gradient(135deg,rgba(249,115,22,.10),rgba(244,63,94,.05) 55%,transparent),var(--ob-bg);border-radius:20px;padding:20px 22px 16px;margin-bottom:16px}"+
".ob-hero-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}"+
".ob-kick{font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--ob-o2)}"+
".ob-h2{margin:4px 0 4px;font-size:23px;font-weight:800;letter-spacing:-.02em;color:var(--ob-tx)}"+
".ob-sub{font-size:13px;color:var(--ob-t2)}"+
".ob-ring{position:relative;width:64px;height:64px;flex:none}.ob-ring-t{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--ob-t3)}.ob-ring-t b{font-size:18px;color:var(--ob-tx)}"+
".ob-bar{height:6px;border-radius:6px;background:rgba(148,163,184,.22);margin:14px 0 12px;overflow:hidden}.ob-bar i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#ff8a3d,#f1560f);transition:width .5s}"+
".ob-hero-foot{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.ob-save{margin-left:auto;font-size:12px;color:var(--ob-t3)}.ob-save.bad{color:#dc2626;font-weight:600}"+
".ob-btn{display:inline-flex;align-items:center;gap:7px;border:0;border-radius:11px;padding:10px 16px;font:inherit;font-size:13.5px;font-weight:700;color:#fff;background:linear-gradient(135deg,#ff8a3d,#f1560f);cursor:pointer;text-decoration:none;box-shadow:0 6px 18px rgba(241,86,15,.22);transition:transform .15s,opacity .15s}"+
".ob-btn:hover{transform:translateY(-1px)}.ob-btn:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}"+
".ob-ghost{background:transparent;color:var(--ob-tx);border:1px solid var(--ob-ln);box-shadow:none}.ob-ghost:hover{border-color:var(--ob-o)}.ob-sm{padding:7px 12px;font-size:12.5px}"+
".ob-grid{display:grid;grid-template-columns:270px minmax(0,1fr);gap:16px;align-items:start}"+
".ob-nav{position:sticky;top:12px;display:flex;flex-direction:column;gap:6px}"+
".ob-ni{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:1px solid var(--ob-ln);background:var(--ob-bg);border-radius:13px;padding:9px 11px;cursor:pointer;font:inherit;color:var(--ob-tx);transition:border-color .15s,background .15s}"+
".ob-ni:hover{border-color:rgba(249,115,22,.5)}.ob-ni.cur{border-color:var(--ob-o);background:rgba(249,115,22,.07)}.ob-ni.lock{opacity:.55;cursor:not-allowed}"+
".ob-nn{flex:none;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;background:rgba(148,163,184,.18);color:var(--ob-t2)}"+
".ob-ni.done .ob-nn{background:#16a34a;color:#fff}.ob-ni.cur .ob-nn{background:var(--ob-o);color:#fff}"+
".ob-nt{display:flex;flex-direction:column;min-width:0}.ob-nt b{font-size:13px;font-weight:700;line-height:1.3}.ob-nt small{font-size:11.5px;color:var(--ob-t3)}"+
".ob-main{border:1px solid var(--ob-ln);background:var(--ob-bg);border-radius:20px;padding:22px 24px;min-height:300px;scroll-margin-top:12px}"+
".ob-mh{border-bottom:1px solid var(--ob-ln);padding-bottom:14px;margin-bottom:16px}.ob-h3{margin:4px 0 0;font-size:20px;font-weight:800;letter-spacing:-.01em}"+
".ob-steps{display:flex;align-items:center;gap:6px;margin-top:12px;flex-wrap:wrap}.ob-stepline{width:18px;height:1px;background:var(--ob-ln)}"+
".ob-step{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--ob-ln);border-radius:20px;padding:4px 11px 4px 5px;font:inherit;font-size:12px;font-weight:700;color:var(--ob-t2);background:transparent;cursor:pointer}"+
".ob-step span,.ob-step svg{width:19px;height:19px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10.5px;background:rgba(148,163,184,.2)}"+
".ob-step.done svg{background:#16a34a;color:#fff;padding:3px}.ob-step.on{border-color:var(--ob-o);color:var(--ob-tx)}.ob-step.on span{background:var(--ob-o);color:#fff}.ob-step.off{opacity:.45;cursor:not-allowed}"+
".ob-read{max-width:720px}.ob-read p{margin:0 0 12px;color:var(--ob-tx)}.ob-read h4,.ob-done h4{margin:20px 0 8px;font-size:15.5px;font-weight:800;color:var(--ob-tx)}"+
".ob-read ul,.ob-read ol,.ob-done ol{margin:0 0 12px;padding-left:20px}.ob-read li,.ob-done li{margin:0 0 6px}"+
".ob-kv{display:grid;gap:1px;background:var(--ob-ln);border:1px solid var(--ob-ln);border-radius:12px;overflow:hidden;margin:4px 0 14px}.ob-kv>div{display:grid;grid-template-columns:170px 1fr;gap:12px;background:var(--ob-bg);padding:10px 13px}.ob-kv b{font-size:12.5px}.ob-kv span{color:var(--ob-t2);font-size:13.5px}"+
".ob-call{border-radius:12px;padding:11px 14px;margin:6px 0 14px;font-size:13.5px;border:1px solid}.ob-call b{display:block;margin-bottom:2px}"+
".ob-call.info{background:rgba(99,102,241,.07);border-color:rgba(99,102,241,.25)}.ob-call.warn{background:rgba(245,158,11,.09);border-color:rgba(245,158,11,.35)}.ob-call.ok{background:rgba(22,163,74,.08);border-color:rgba(22,163,74,.3)}"+
".ob-ex{border-left:3px solid var(--ob-o);background:var(--ob-bg2);border-radius:0 12px 12px 0;padding:10px 14px;margin:6px 0 14px;font-size:13.5px}.ob-ex-t{font-weight:800;margin-bottom:4px}.ob-ex div{margin:2px 0}"+
".ob-tpl{border:1px dashed var(--ob-ln);border-radius:12px;padding:12px 14px;margin:6px 0 14px;background:var(--ob-bg2)}.ob-tpl-t{font-style:italic;margin-bottom:8px}"+
".ob-endread{height:1px}.ob-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px;padding-top:14px;border-top:1px solid var(--ob-ln);flex-wrap:wrap}"+
".ob-hint,.ob-muted{font-size:12.5px;color:var(--ob-t3)}.ob-ok{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:#16a34a}"+
".ob-q{border:1px solid var(--ob-ln);border-radius:14px;padding:14px 16px;margin:0 0 12px}.ob-q.right{border-color:rgba(22,163,74,.45)}.ob-q.wrong{border-color:rgba(220,38,38,.45)}"+
".ob-qn{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ob-t3)}.ob-qt{font-weight:700;margin:4px 0 10px}"+
".ob-opts{display:flex;flex-direction:column;gap:7px}.ob-opt{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--ob-ln);border-radius:11px;padding:9px 12px;cursor:pointer;transition:border-color .15s,background .15s}"+
".ob-opt input{margin-top:4px;accent-color:#f97316}.ob-opt.on{border-color:var(--ob-o);background:rgba(249,115,22,.06)}.ob-opt.ans{border-color:#16a34a;background:rgba(22,163,74,.08)}.ob-opt.miss{border-color:#dc2626;background:rgba(220,38,38,.06)}"+
".ob-why{margin-top:9px;font-size:13px;color:#b91c1c;background:rgba(220,38,38,.06);border-radius:10px;padding:8px 11px}.ob-why.ok{color:var(--ob-t2);background:var(--ob-bg2)}"+
".ob-res{border-radius:12px;padding:12px 14px;margin:0 0 14px;font-size:14px}.ob-res.ok{background:rgba(22,163,74,.1);color:#15803d}.ob-res.no{background:rgba(245,158,11,.12);color:#b45309}"+
".ob-pass{display:flex;align-items:center;gap:16px;border:1px solid rgba(22,163,74,.35);background:rgba(22,163,74,.07);border-radius:16px;padding:16px 18px}.ob-pass-n{font-size:34px;font-weight:800;color:#16a34a;line-height:1}.ob-pass-n span{font-size:16px;color:var(--ob-t3)}"+
".ob-form{display:flex;flex-direction:column;gap:14px}.ob-f{display:flex;flex-direction:column;gap:6px;border-radius:12px}.ob-f.bad,.ob-gr.bad,.ob-au.bad,.ob-rw.bad,.ob-card.bad{outline:2px solid rgba(220,38,38,.55);outline-offset:4px}"+
".ob-l{font-size:13px;font-weight:700;color:var(--ob-tx)}.ob-l i{color:#dc2626;font-style:normal}"+
".ob-in{width:100%;border:1px solid var(--ob-ln);border-radius:10px;padding:9px 11px;font:inherit;font-size:13.5px;color:var(--ob-tx);background:var(--ob-bg);outline:none;transition:border-color .15s}.ob-in:focus{border-color:var(--ob-o)}textarea.ob-in{resize:vertical;min-height:70px}"+
".ob-chips{display:flex;flex-wrap:wrap;gap:7px}.ob-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--ob-ln);border-radius:20px;padding:6px 12px;font-size:13px;cursor:pointer}.ob-chip input{accent-color:#f97316}.ob-chip.on{border-color:var(--ob-o);background:rgba(249,115,22,.08)}"+
".ob-scale{display:flex;gap:6px;flex-wrap:wrap}.ob-sc{min-width:38px;height:38px;border:1px solid var(--ob-ln);border-radius:10px;background:var(--ob-bg);font:inherit;font-weight:700;color:var(--ob-tx);cursor:pointer}.ob-sc.sm{min-width:32px;height:32px;font-size:12.5px}.ob-sc.on{background:linear-gradient(135deg,#ff8a3d,#f1560f);color:#fff;border-color:transparent}"+
".ob-scale-l{display:flex;justify-content:space-between;font-size:11.5px;color:var(--ob-t3);max-width:460px}"+
".ob-grid2{display:flex;flex-direction:column;gap:8px}.ob-gr{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--ob-ln);border-radius:11px;padding:8px 11px;border-radius:12px}.ob-gr>span{font-size:13px}"+
".ob-audit{display:flex;flex-direction:column;gap:8px}.ob-au{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--ob-ln);border-radius:12px;padding:9px 11px}.ob-au>span{font-size:13px;font-weight:600}"+
".ob-seg{display:flex;flex-wrap:wrap;gap:4px}.ob-seg button{border:1px solid var(--ob-ln);background:var(--ob-bg);border-radius:8px;padding:5px 9px;font:inherit;font-size:12px;font-weight:600;color:var(--ob-t2);cursor:pointer}.ob-seg button.on{background:#16a34a;border-color:#16a34a;color:#fff}.ob-seg button.help.on{background:#d97706;border-color:#d97706}"+
".ob-f>.ob-btn{align-self:flex-start}.ob-rows{display:flex;flex-direction:column;gap:6px;margin-bottom:6px}.ob-rh,.ob-rw{display:grid;grid-template-columns:1.3fr .9fr .8fr 1.8fr 1.3fr 30px;gap:6px;align-items:center}.ob-rh span{font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--ob-t3)}.ob-rh i{color:#dc2626;font-style:normal}"+
".ob-x{width:30px;height:30px;border:1px solid var(--ob-ln);border-radius:9px;background:transparent;color:var(--ob-t3);cursor:pointer}.ob-x:hover{color:#dc2626;border-color:#dc2626}"+
".ob-card{border:1px solid var(--ob-ln);border-radius:14px;padding:12px 14px;margin-bottom:10px;background:var(--ob-bg2);display:flex;flex-direction:column;gap:10px}.ob-card-h{display:flex;align-items:center;justify-content:space-between}"+
".ob-err{display:none;margin-top:12px;border-radius:10px;padding:9px 12px;background:rgba(220,38,38,.08);color:#b91c1c;font-size:13px;font-weight:600}"+
".ob-form.ro .ob-in{opacity:.85}"+
".ob-decl{display:flex;flex-direction:column;gap:8px;margin:6px 0 16px}.ob-dc{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--ob-ln);border-radius:12px;padding:10px 13px;cursor:pointer;font-size:13.5px}.ob-dc input{margin-top:4px;accent-color:#16a34a;width:16px;height:16px}.ob-dc.on{border-color:rgba(22,163,74,.55);background:rgba(22,163,74,.06)}"+
".ob-pad{position:relative;border:1.5px dashed var(--ob-ln);border-radius:14px;background:#fff;height:170px;max-width:560px;touch-action:none}.ob-pad canvas{width:100%;height:100%;display:block;cursor:crosshair}.ob-pad-h{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px;pointer-events:none}"+
".ob-pad-f{display:flex;align-items:center;justify-content:space-between;max-width:560px;font-size:12px;color:var(--ob-t3)}"+
".ob-done{text-align:left}.ob-done-ic{width:52px;height:52px;border-radius:50%;background:#16a34a;color:#fff;display:flex;align-items:center;justify-content:center}.ob-done-ic svg{width:26px;height:26px}"+
"@media (max-width:900px){.ob-grid{grid-template-columns:1fr}.ob-nav{position:static;flex-direction:row;overflow-x:auto;padding-bottom:4px}.ob-ni{min-width:210px}"+
".ob-rh{display:none}.ob-rw{grid-template-columns:1fr 1fr;border:1px solid var(--ob-ln);border-radius:12px;padding:8px}.ob-rc::before{content:attr(data-lbl);display:block;font-size:10.5px;font-weight:700;text-transform:uppercase;color:var(--ob-t3);margin-bottom:2px}"+
".ob-gr,.ob-au{flex-direction:column;align-items:flex-start}.ob-kv>div{grid-template-columns:1fr}.ob-main{padding:18px 16px}}";

function boot(o){
  S.api=o.api; S.me=o.me||{}; S.kase=o.kase; S.mount=typeof o.mount==="string"?document.querySelector(o.mount):o.mount;
  var srv=o.program&&typeof o.program==="object"?o.program:null, loc=null;
  try{ loc=JSON.parse(localStorage.getItem(lsKey())||"null"); }catch(e){}
  S.P=srv||{ v:1, mods:{} };
  if(loc && !S.P.submitted_at && (loc.rev||0)>(S.P.rev||0)){ S.P=loc; S.dirty=true; }
  S.P.v=1; S.P.mods=S.P.mods||{};
  css(); shell();
  var start=0; if(S.P.cur){ MODS.forEach(function(m,i){ if(m.id===S.P.cur && !locked(i)) start=i; }); } if(!S.P.cur) start=Math.min(firstOpen(), MODS.length-1);
  if(submitted()) start=MODS.length-1;
  go(start);
  if(S.dirty) saveNow();
  if(!S.booted){ S.booted=true; setInterval(tick, 1000);
    window.addEventListener("pagehide", function(){ if(S.dirty) saveNow(true); });
    document.addEventListener("visibilitychange", function(){ if(document.visibilityState==="hidden" && S.dirty) saveNow(true); }); }
  setSave(submitted()?"Submitted":(S.dirty?"Saving…":"Saved"));
}
window.OFFB={ boot:boot, mods:MODS, decl:DECL, _s:S };
})();
