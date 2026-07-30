/* JMB Virtuals — shared full-text of the VA agreements & policies.
   Used by the signing page (sign.html) and the employee portal "My Documents".
   window.JMBDocs.render(key, {name, id, eff}) → HTML string. */
(function(){
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function P(x){ return '<p>'+x+'</p>'; }
  function H(x){ return '<h3>'+esc(x)+'</h3>'; }
  function UL(items){ return '<ul>'+items.map(function(i){return '<li>'+i+'</li>';}).join('')+'</ul>'; }

  function ica(v){
    var name=esc(v.name||'[VA Full Name]'), id=esc(v.id||''), eff=esc(v.eff||'[Date]');
    return '<h2>Independent Contractor Agreement</h2>'+
      P('<b>Parties:</b> JMB Virtuals, the freelance virtual-assistant collective operated by Jethro Bringas (Founder / Operations Manager) (the “Company”), and <b>'+name+'</b>'+(id?(' (Contractor ID '+id+')'):'')+' (the “Contractor”).')+
      P('<b>Effective Date:</b> '+eff)+
      H('1. Definitions')+
      P('“Client” means any customer of JMB Virtuals to whom the Contractor is assigned or introduced. “Services” means the virtual-assistant and related tasks the Contractor performs for a Client. “Confidential Information” means non-public information of JMB Virtuals or any Client. “Work Product” means all deliverables the Contractor creates in performing the Services.')+
      H('2. Engagement and Services')+
      P('JMB Virtuals engages the Contractor to perform the Services, and the Contractor accepts. The specific tasks, committed hours, Client assignment, and rate are set out in Schedule A and may be updated in writing. The Contractor will perform the Services diligently and professionally and in accordance with the reasonable instructions of the Client and JMB Virtuals. Unless agreed otherwise, the engagement is non-exclusive.')+
      H('3. Independent Contractor Status')+
      P('The Contractor is an <b>independent contractor</b>, not an employee, agent, partner, or joint venturer. Nothing here creates an employer–employee relationship. Accordingly, the Contractor:')+
      UL([
        'is responsible for their own income taxes and any voluntary government contributions (e.g., SSS, PhilHealth, Pag-IBIG);',
        'is not entitled to employee benefits, 13th-month pay, paid leave, overtime premiums, or separation pay from JMB Virtuals;',
        'controls the manner and means of performing the Services, within the Client’s reasonable requirements; and',
        'provides their own equipment, software, and internet, unless a tool or asset is expressly provided.'
      ])+
      H('4. Term')+
      P('This Agreement takes effect on the Effective Date and continues until terminated under Section 15. Each Client assignment continues while that engagement is active.')+
      H('5. Compensation and Invoicing')+
      P('JMB Virtuals pays the Contractor the rate set out in Schedule A. Client fees are collected by JMB Virtuals, which pays the Contractor from those fees, less any agreed management or coordination fee, on the agreed cycle and via the agreed method, subject to accurate time records or an invoice. The Contractor is paid only for Services actually rendered and accepted. JMB Virtuals may withhold or set off amounts for unreturned assets, documented advances, or clear breaches, to the extent permitted by law.')+
      H('6. Taxes')+
      P('The Contractor is solely responsible for reporting and paying all taxes and contributions on amounts paid under this Agreement. JMB Virtuals does not withhold employee taxes, and the Contractor will indemnify JMB Virtuals against any tax, penalty, or claim from the Contractor’s failure to meet these obligations.')+
      H('7. Availability, Time Tracking and Conduct')+
      P('The Contractor will keep agreed availability and committed hours, run any time tracker accurately and log only time actually worked, communicate promptly, and comply with JMB Virtuals’ policies including the AWOL & Proper Disengagement Policy and the Code of Conduct. Going AWOL or abandoning the engagement, or falsifying time or output, is a material breach.')+
      H('8. Confidentiality')+
      P('The Contractor will hold all Confidential Information in strict confidence, use it only to perform the Services, and not disclose it without authorization, as detailed in the Confidentiality & Non-Disclosure Agreement, which forms part of this engagement and survives its termination.')+
      H('9. Data Protection')+
      P('Where the Contractor handles personal data, they will process it only as instructed, apply reasonable security, comply with the Philippine Data Privacy Act of 2012 and any Client requirements, and promptly report any suspected breach.')+
      H('10. Intellectual Property and Work Product')+
      P('All Work Product is owned by the Client (or JMB Virtuals, as applicable) upon creation and payment. The Contractor <b>assigns</b> all rights in the Work Product and waives moral rights to the extent permitted by law, and will sign any documents reasonably needed to confirm this. Pre-existing tools incorporated into the Work Product are licensed to the Client on a perpetual, royalty-free basis to the extent needed to use it.')+
      H('11. Non-Solicitation and Non-Circumvention')+
      P('During the engagement and for the agreed restricted period afterward, the Contractor will not, directly or indirectly, solicit, circumvent, accept, or provide services to any Client outside the JMB Virtuals arrangement, nor solicit any other JMB Virtuals contractor to leave, without JMB Virtuals’ prior written consent, as detailed in the Non-Solicitation & Client-Protection Agreement.')+
      H('12. Equipment and Access')+
      P('Any accounts, credentials, devices, or materials provided by a Client or JMB Virtuals remain their property, must be used only for the Services, and must be returned or revoked promptly on request or at the end of the engagement.')+
      H('13. Representations and Warranties')+
      P('The Contractor represents that they are free to enter this Agreement, that performing the Services does not breach any other obligation, that the Work Product will be original and non-infringing, and that they will comply with applicable laws and Client policies.')+
      H('14. Indemnification and Limitation of Liability')+
      P('The Contractor will indemnify JMB Virtuals and its Clients against losses arising from the Contractor’s breach, negligence, or infringement. To the extent permitted by law, neither party is liable for indirect or consequential losses, and JMB Virtuals’ total liability to the Contractor is limited to the fees payable for the Services giving rise to the claim.')+
      H('15. Termination')+
      P('Either party may terminate this Agreement or any assignment on the agreed written notice. JMB Virtuals may terminate <b>immediately</b> for cause, including going AWOL, breach of confidentiality, dishonesty, falsified time or output, or conduct harmful to a Client. On termination, the Contractor turns over Work Product, returns all assets and access, and JMB Virtuals reconciles fees for Services already completed. Confidentiality, IP, non-solicitation, taxes, indemnity, and governing-law terms survive.')+
      H('16. General')+
      P('This Agreement, with Schedule A and the referenced policies, is the entire agreement on its subject; it may be amended only in writing; the Contractor may not assign it without consent; if any provision is unenforceable, the rest remains in effect; notices may be given by email; it may be signed electronically and in counterparts; it is governed by the laws of the Republic of the Philippines; and nothing in it creates employment.');
  }

  function nda(v){
    var name=esc(v.name||'[VA Full Name]');
    return '<h2>Confidentiality &amp; Non-Disclosure Agreement</h2>'+
      P('This Agreement between JMB Virtuals and <b>'+name+'</b> (the “Contractor”) supports and forms part of the Contractor’s engagement.')+
      H('1. Confidential Information')+
      P('“Confidential Information” means any non-public information the Contractor accesses, receives, or creates in connection with the engagement, in any form, including:')+
      UL([
        'client business information, projects, plans, pricing, customer and contact lists, and communications;',
        'login credentials, passwords, API keys, tokens, and access to systems and tools;',
        'personal data of clients, their customers, prospects, or team members;',
        'JMB Virtuals’ internal processes, rates, playbooks, and templates; and',
        'anything marked confidential or that a reasonable person would understand to be confidential.'
      ])+
      H('2. Purpose and Permitted Use')+
      P('The Contractor may use Confidential Information solely to perform the services for the relevant client and JMB Virtuals, and for no other purpose. Personal, competitive, or other use is prohibited.')+
      H('3. Obligations')+
      P('The Contractor will keep Confidential Information strictly confidential; use it only for the Purpose; not disclose it without prior written authorization; not copy, download, store, or transmit it except as strictly necessary through approved systems; and protect it with at least the security measures in Section 7 and no less than reasonable care.')+
      H('4. Exclusions')+
      P('Confidential Information does not include information that is or becomes public through no fault of the Contractor, was lawfully known before disclosure without confidentiality obligations, is lawfully received from a third party free to disclose it, or is independently developed without use of the Confidential Information.')+
      H('5. Compelled Disclosure')+
      P('If legally required to disclose, the Contractor will, where lawful, give JMB Virtuals prompt notice and reasonable cooperation and disclose only the minimum required.')+
      H('6. Personal Data and Privacy')+
      P('Where the Contractor processes personal data, they act only on documented instructions and for the Purpose, comply with the Philippine Data Privacy Act of 2012 and any client standards (including, where applicable, U.S. requirements), do not transfer or sub-contract personal data without authorization, assist with data-subject requests, and report any suspected personal-data breach without undue delay (and within 24 hours of becoming aware).')+
      H('7. Security Measures')+
      UL([
        'use strong, unique passwords and enable multi-factor authentication where available;',
        'keep devices secured, updated, and protected (screen lock, antivirus, private network);',
        'never share accounts or credentials, and never use another person’s login;',
        'access Confidential Information only through approved systems, avoiding personal storage; and',
        'stay alert to phishing and social-engineering attempts, verifying unusual requests before acting.'
      ])+
      H('8. No Onward Disclosure')+
      P('The Contractor will not disclose Confidential Information to family, friends, or other contractors, nor discuss client matters publicly or on social media, without written authorization.')+
      H('9. Return or Destruction')+
      P('On request or at the end of the engagement, the Contractor will promptly return or securely delete all Confidential Information and materials, remove access, and confirm in writing they have done so, retaining no copies except as required by law.')+
      H('10. Duration and Survival')+
      P('These obligations apply during the engagement and continue for the agreed period afterward — and, for trade secrets, credentials, and personal data, for as long as the information is protected by law.')+
      H('11. Remedies')+
      P('A breach may cause serious, hard-to-quantify harm; JMB Virtuals and its clients may seek injunctive relief, damages, and any other remedy available at law or equity, in addition to ending the engagement for cause.')+
      H('12. General')+
      P('This Agreement supplements the Independent Contractor Agreement, may be amended only in writing, and is governed by the laws of the Republic of the Philippines.');
  }

  function nonsolicit(v){
    var name=esc(v.name||'[VA Full Name]');
    return '<h2>Non-Solicitation &amp; Client-Protection Agreement</h2>'+
      P('This Agreement between JMB Virtuals and <b>'+name+'</b> (the “Contractor”) protects JMB Virtuals’ client and team relationships, in consideration of being engaged and introduced to clients.')+
      H('1. Definitions')+
      P('“Client” means any customer of JMB Virtuals the Contractor was introduced to, assigned to, or performed services for, and any prospect the Contractor learned of through JMB Virtuals. “Restricted Period” means the term of the engagement plus the agreed period (e.g., twelve months) after it ends. “Team Member” means any other contractor or staff member of JMB Virtuals.')+
      H('2. Non-Solicitation of Clients')+
      P('During the Restricted Period, the Contractor will not, directly or indirectly, solicit, canvass, or approach any Client to provide virtual-assistant or similar services outside the JMB Virtuals arrangement, or to reduce or move its business away from JMB Virtuals.')+
      H('3. Non-Acceptance')+
      P('During the Restricted Period, the Contractor will not accept or provide services to any Client outside the JMB Virtuals arrangement, even if the Client initiates contact, without JMB Virtuals’ prior written consent.')+
      H('4. Non-Circumvention')+
      P('The Contractor will not attempt to bypass or circumvent JMB Virtuals to contract with, invoice, or be paid directly by a Client, nor encourage a Client to do so.')+
      H('5. Non-Solicitation of Team')+
      P('During the Restricted Period, the Contractor will not solicit or induce any Team Member to leave JMB Virtuals or to work outside the JMB Virtuals arrangement.')+
      H('6. Consent and Conversion')+
      P('If a Contractor and a Client genuinely wish to continue directly, they may request JMB Virtuals’ written consent in advance, which may be granted on reasonable terms, including a fair introduction or conversion fee agreed beforehand.')+
      H('7. Reasonableness')+
      P('The Contractor agrees these restrictions are reasonable in scope, geography (limited to actual JMB Virtuals Clients), and duration, protect legitimate business interests, and still leave the Contractor free to work for other clients and platforms.')+
      H('8. Remedies')+
      P('A breach may cause significant, hard-to-quantify harm; JMB Virtuals may seek injunctive relief, recovery of lost fees, an accounting of profits, and any other remedy available at law or equity.')+
      H('9. Severability')+
      P('If any restriction is found overly broad, it will be read down and enforced to the maximum extent permitted by law, and the remaining provisions stay in effect.')+
      H('10. Survival and Governing Law')+
      P('This Agreement survives for the Restricted Period, supplements the Independent Contractor Agreement, and is governed by the laws of the Republic of the Philippines.');
  }

  function conduct(v){
    return '<h2>Code of Conduct &amp; Team Handbook</h2>'+
      P('This handbook explains how we work together at JMB Virtuals. It sets professional-conduct expectations only and does not create an employer–employee relationship.')+
      H('1. Who We Are')+
      P('JMB Virtuals is a community of independent freelance virtual assistants coordinated by Founder and Operations Manager Jethro Bringas. You deliver day-to-day work for your assigned client; JMB Virtuals handles coordination, payment, and standards. Our values are reliability, integrity, ownership, client-first service, and growth.')+
      H('2. Your Status')+
      P('You are an independent contractor, not an employee. You control how you deliver your services within the client’s reasonable requirements, are responsible for your own taxes and any voluntary government contributions, provide your own equipment, and are not entitled to employee benefits, 13th-month pay, or separation pay. You may work with other clients if you honor your confidentiality, conflict, and non-solicitation commitments and keep your committed hours.')+
      H('3. Working Hours & Availability')+
      P('Keep the schedule and hours agreed with your client, aligned to their time zone. Take only agreed breaks, be reachable during committed hours, and request time off in advance. Confirm holiday coverage with your client rather than assuming a day off.')+
      H('4. Time Tracking & Productivity')+
      P('Where a tracker is used, run it accurately and log only time actually worked; pause it during breaks. Idle time, inflated hours, or logging work not done is time theft and is a serious breach. Focus on outcomes, meet deadlines, and flag early if a task will run long.')+
      H('5. Communication')+
      P('Respond promptly during committed hours, use the agreed channels, keep a professional and respectful tone, give proactive status updates, and raise blockers early. When in doubt, over-communicate.')+
      H('6. Client Service')+
      P('You represent JMB Virtuals. Follow the client’s procedures and tools, deliver quality on time, and if you disagree with an instruction or cannot meet a deadline, say so professionally and propose an alternative. Escalate concerns to Operations early.')+
      H('7. Attendance & the AWOL Policy')+
      P('Consistent attendance is central to our reputation. Notify your client and JMB Virtuals early for any absence. <b>Going AWOL — being unreachable during committed hours without notice — is not tolerated</b> and is treated as abandonment under the AWOL & Proper Disengagement Policy.')+
      H('8. Confidentiality & Data')+
      P('Protect all confidential information and personal data, use it only for your work, never move client data to personal storage or insecure channels, and report any suspected breach immediately. Full obligations are in your NDA.')+
      H('9. Information Security')+
      UL([
        'use strong, unique passwords and enable multi-factor authentication;',
        'never share your accounts or credentials;',
        'keep your device secure and updated (screen lock, antivirus, private network);',
        'be alert to phishing and verify unusual requests, especially about money or credentials; and',
        'return or revoke all client and JMB accounts and files when an engagement ends.'
      ])+
      H('10. Professional Conduct & Ethics')+
      P('Treat everyone with respect. We have zero tolerance for harassment, bullying, discrimination, dishonesty, or falsified time or output. Avoid conflicts of interest and disclose competing clients or personal relationships that could affect objectivity. Do not accept side payments from clients outside the JMB Virtuals arrangement.')+
      H('11. Performance & Feedback')+
      P('We use check-ins, client feedback, and scorecards to help you succeed. Where performance falls short, we coach and give a fair chance to improve; persistent or serious issues may lead to reassignment or ending the engagement.')+
      H('12. Payment & Equipment')+
      P('You are paid by JMB Virtuals from the client fees, at your agreed rate and cycle, subject to accurate records. Any device or account issued to you remains JMB Virtuals’ or the client’s property and must be returned when your engagement ends.')+
      H('13. Raising Concerns & Wellbeing')+
      P('Raise any concern — payment, an uncomfortable request, a conflict, or a safety issue — with Operations; we handle concerns discreetly and will not penalize good-faith reports. Take your breaks and speak up early if your workload is unsustainable.')+
      H('14. Leaving the Right Way')+
      P('If you decide to leave, give proper notice, submit your resignation through the link JMB Virtuals provides, complete clearance, turn over your work, and return all access and assets. Leaving professionally keeps you in good standing for future engagements and references.');
  }

  function awol(v){
    return '<h2>AWOL &amp; Proper Disengagement Policy</h2>'+
      H('1. Purpose & Nature of Engagement')+
      P('This policy sets expectations on availability and the correct way to end an engagement. Every VA is an independent contractor serving their own client; nothing here creates an employer–employee relationship, and there are no statutory or government-mandated benefits.')+
      H('2. Definitions')+
      P('<b>AWOL</b> means becoming unavailable and unreachable during committed working hours without prior notice, approval, or acceptable explanation. <b>Abandonment</b> means stopping the delivery of agreed services and ceasing communication without properly ending the engagement; being unreachable for three (3) or more consecutive committed workdays without valid reason is treated as abandonment.')+
      H('3. Policy Statement')+
      P('<b>JMB Virtuals does not tolerate going AWOL or abandoning an engagement.</b> Disappearing without notice harms the client who relies on you, damages the community’s reputation, and burdens teammates. A VA who wishes to stop an engagement must give proper notice — never simply go silent.')+
      H('4. The Right Way to Step Away')+
      UL([
        'Give advance notice — ideally at least 15 to 30 days, or as agreed with your client and JMB Virtuals.',
        'Submit your resignation through the personal link JMB Virtuals sends, and confirm you agree to this policy.',
        'Turn over your work and hand over files, tools, and credentials.',
        'Return or revoke all client and JMB accounts and materials.'
      ])+
      H('5. Consequences of Going AWOL')+
      P('JMB Virtuals will make reasonable efforts to reach you and consider valid, documented reasons (such as a genuine emergency). Where a member is unreachable without justification, JMB Virtuals may inform the client and arrange replacement support, end the engagement and remove access, reconcile only fees for work already completed, and decline future engagements and a favorable reference. Because members are independent contractors, ending an engagement this way is a conclusion of the working arrangement, not an employment dismissal.')+
      H('6. Fees')+
      P('As VAs are freelancers, JMB Virtuals does not process statutory “final pay” or government-mandated benefits; only fees genuinely earned for completed work are reconciled, in line with your arrangement with your client and/or JMB Virtuals.');
  }

  function privacy(v){
    return '<h2>Data Privacy &amp; Security Policy</h2>'+
      H('1. Purpose & Scope')+
      P('This policy applies to every contractor and to all personal and client data accessed in any engagement, in any form. It supplements the Confidentiality &amp; NDA and the Independent Contractor Agreement.')+
      H('2. Roles')+
      P('Each client decides why and how personal data is processed; the Contractor processes data only on the client’s instructions and for authorized purposes. Where a client provides stricter privacy or security requirements, those apply in addition to — or in place of — this policy.')+
      H('3. Core Principles')+
      UL(['Access and use data only as needed for the assigned work (lawful, authorized use).','Copy or download the least data necessary (data minimization).','Never use client or personal data for personal purposes, another client, or anything the client has not authorized (purpose limitation).','Treat all personal and client data as strictly confidential.'])+
      H('4. Security Safeguards')+
      UL(['Use a secured, password/biometric-locked device with an up-to-date operating system and antivirus.','Protect every work account with a strong, unique password and enable two-factor authentication where available.','Work only through approved systems; never store client or personal data on personal cloud, email, messaging apps, or removable drives.','Keep screens private, lock devices when away, and avoid unsecured public Wi-Fi for client work.'])+
      H('5. Access & Credentials')+
      P('Client accounts are for authorized work only. Do not share credentials, let anyone else use your access, or retain, export, or reuse client contact lists, customer records, or credentials outside the engagement.')+
      H('6. Data-Breach Reporting')+
      P('Report any suspected or actual loss, theft, unauthorized access, or accidental disclosure of personal or client data to the Operations Manager immediately, and no later than 24 hours after becoming aware. Preserve evidence, stop ongoing exposure where possible, cooperate fully, and never conceal an incident.')+
      H('7. Retention & Deletion')+
      P('Keep data only as long as the task and client require. On request or at the end of the engagement, promptly return or securely delete all personal and client data, remove access, and confirm in writing — keeping no copies except where the client or law requires.')+
      H('8. Legal Awareness')+
      P('Handle personal data responsibly and in line with applicable standards, including the Philippine Data Privacy Act of 2012 (RA 10173) and any client framework (for example, U.S. state privacy laws). When in doubt, ask the Operations Manager before acting.');
  }

  function acceptableuse(v){
    return '<h2>Acceptable Use &amp; Account Access Policy</h2>'+
      H('1. Purpose & Scope')+
      P('This policy governs how contractors use client accounts, assigned phones and devices, workstations, and work platforms. It supplements the Independent Contractor Agreement, the NDA, and the Data Privacy &amp; Security Policy.')+
      H('2. Client Accounts & Systems')+
      UL(['Access client accounts only to perform authorized work, and only for the client they belong to.','No personal messaging, browsing, purchases, or personal benefit through client accounts.','Do not change ownership, recovery details, or security settings without written authorization.'])+
      H('3. Phones, Devices & Workstations')+
      UL(['Treat every assigned phone, device, and workstation as an entrusted business asset — keep it secure, updated, and working.','Keep assigned phones connected and their status accurate; report a disconnected phone, login issue, or hardware problem promptly.','Do not install unauthorized apps, jailbreak or root devices, or use assigned devices in ways that risk client accounts.'])+
      H('4. Passwords, 2FA & Credentials')+
      UL(['Use strong, unique passwords for every work account; enable two-factor authentication where available.','Store credentials only in an approved password manager — never in plain text, notes, or personal-device browsers.','Never share credentials or one-time codes except through approved channels; surrender all access at the end of the engagement.'])+
      H('5. Approved Tools & Platforms')+
      P('Do posting, sourcing, and other client work only through the approved workflow and tools. Follow each platform’s terms of service. Do not introduce unauthorized automation, bots, or third-party services into a client account.')+
      H('6. Prohibited Uses')+
      UL(['Buying followers, engagement, or reviews; spamming; or any deceptive tactic.','Violating a platform’s terms, or any action likely to get a client account restricted or banned.','Using client accounts, devices, or tools for personal gain, side work, or another party’s benefit.','Installing unauthorized software, sharing access, or bypassing monitoring or security controls.'])+
      H('7. Content & Posting Standards')+
      P('Content posted for a client must be accurate, appropriate, on-brand, and consistent with instructions. Complete required notes, captions, and quality checks before marking work done. Never post misleading, offensive, or unauthorized content.')+
      H('8. Monitoring & Accountability')+
      P('To protect clients and maintain quality, work activity — posting and sourcing progress, account status, and completion — is recorded and reviewed for quality assurance. This is a business-quality measure, not personal surveillance. You are accountable for activity under your assigned access.');
  }

  var MAP={ ica:ica, nda:nda, nonsolicit:nonsolicit, conduct:conduct, privacy:privacy, acceptableuse:acceptableuse, awol:awol };
  window.JMBDocs={
    DOCS:[
      {key:'ica', title:'Independent Contractor Agreement'},
      {key:'nda', title:'Confidentiality & Non-Disclosure Agreement'},
      {key:'nonsolicit', title:'Non-Solicitation & Client-Protection Agreement'},
      {key:'conduct', title:'Code of Conduct & Team Handbook'},
      {key:'privacy', title:'Data Privacy & Security Policy'},
      {key:'acceptableuse', title:'Acceptable Use & Account Access Policy'},
      {key:'awol', title:'AWOL & Proper Disengagement Policy'}
    ],
    render:function(key, v){ v=v||{}; var f=MAP[key]; return f?f(v):''; }
  };
})();
