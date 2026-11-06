// All public page content. Each page targets its own search phrases so they
// don't compete with each other. Keep claims true: Google punishes fake numbers.
export const SITE = "https://yaarimeet.pages.dev";
const HOST = new URL(SITE).host;
export const NAME = "YaariMeet";
const CONTACT = "contact@yaarimeet.com";

const steps = `
<ol class="steps">
  <li><b>Sign in with Google</b><span>One tap. We only use your name and email — never your contacts.</span></li>
  <li><b>Choose who to meet</b><span>Random is free. Pick Only girls or Only boys if you want a filter.</span></li>
  <li><b>Start talking</b><span>Video or text. Not a match? Press Next and meet someone new in seconds.</span></li>
</ol>`;

export const pages = [
  // ---------------------------------------------------------------- Home
  {
    path: "/",
    title: "YaariMeet: Free Random Video Chat with Strangers in India",
    description:
      "Talk to strangers on YaariMeet – free random video chat and text chat made for India. No download. Meet new people in seconds, with verified profiles and girls/boys filters.",
    alternates: [["en-IN", "/"], ["hi-IN", "/hi/"], ["x-default", "/"]],
    schema: [
      { "@type": "WebSite", name: NAME, url: `${SITE}/`, inLanguage: "en-IN" },
      { "@type": "Organization", name: NAME, url: `${SITE}/`, logo: `${SITE}/icon-512.png`, email: CONTACT },
      {
        "@type": "WebApplication",
        name: NAME,
        url: `${SITE}/`,
        applicationCategory: "CommunicationApplication",
        operatingSystem: "Android, iOS, Windows, macOS",
        browserRequirements: "Requires a modern browser with camera access for video chat",
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      },
    ],
    faq: [
      ["Is YaariMeet free?", "Yes. Random video chat and text chat are free forever. Only the optional Only girls / Only boys filters use credits (20 credits per minute, ₹25 = 100 credits)."],
      ["Do I need to download an app?", "No. YaariMeet works in Chrome, Safari and any modern browser on Android, iPhone and computers. You can add it to your home screen like an app."],
      ["How do I talk to strangers on YaariMeet?", "Sign in with Google, choose Random or a filter, pick video or text, and press Start. You are connected to a random person who is online right now."],
      ["Are the girls and boys real?", "Everyone signs in with a real Google account and picks their gender once. People can verify with a short selfie video to get a ✔ Verified badge, and fake genders get reported and banned."],
      ["Is YaariMeet safe?", "Video goes directly between you and the other person and is never recorded. Every chat has a Report button, and our team bans abusive accounts. YaariMeet is for adults 18+ only."],
    ],
    body: `
<section class="hero">
  <div>
    <span class="kicker">Free · Video &amp; text · Made in India</span>
    <h1>Random video chat with <em>strangers</em> in India.</h1>
    <p class="lead">YaariMeet puts you face to face with someone new in seconds. Video or text, free, straight from your browser.</p>
    <div class="actions">
      <a class="btn primary big" href="/chat/">Start video chat</a>
      <a class="btn big" href="/chat/">Text chat instead</a>
    </div>
    <ul class="fine"><li>Free</li><li>No download</li><li>Sign in with Google</li><li>18+ only</li></ul>
  </div>
  <div class="mock" aria-hidden="true">
    <div class="tile them"><div class="face"></div><span class="tag">Stranger · Pune ✓</span></div>
    <div class="tile you"><div class="face"></div><span class="tag">You</span></div>
    <div class="bubble">Hi! Kahan se ho?</div>
  </div>
</section>

<section>
  <h2>How YaariMeet works</h2>
  ${steps}
</section>

<section>
  <h2>Why people choose YaariMeet</h2>
  <div class="features">
    <div><h3>Random chat is free</h3><p>Talk to strangers from across India at no cost. No hidden fees, no trial that runs out.</p></div>
    <div><h3>Choose girls or boys</h3><p>Want to chat only with girls or only with boys? Turn on a filter for 20 credits a minute.</p></div>
    <div><h3>Verified profiles</h3><p>Members verify with a 3-second selfie video, checked by a person. Verified people are matched first.</p></div>
    <div><h3>Video or text</h3><p>Shy? Start with anonymous text chat. Ready? Switch to face-to-face video.</p></div>
    <div><h3>Report in one tap</h3><p>Abuse or a fake gender goes straight to our team, and offenders are banned.</p></div>
    <div><h3>Light on data</h3><p>Built for Jio, Airtel and Vi. Video adjusts to your network speed.</p></div>
  </div>
</section>

<section>
  <h2>A safer Omegle alternative for India</h2>
  <p>Omegle closed in November 2023, and many alternatives are full of bots and fake profiles. YaariMeet asks everyone to sign in with Google, lets members verify themselves, and gives every chat a Report button — so you meet real people. <a href="/omegle-alternative/">See how YaariMeet compares</a>.</p>
</section>

<section>
  <h2>Simple, honest pricing</h2>
  <p>Random chat is free, always. Filters that match you only with girls or only with boys cost <b>20 credits per minute</b>, and credits cost <b>₹25 for 100</b> — pay with any UPI app. <a href="/pricing/">Full pricing</a>.</p>
</section>`,
  },

  // ---------------------------------------------------------------- Omegle alternative
  {
    path: "/omegle-alternative/",
    crumb: "Omegle alternative",
    title: "Best Omegle Alternative in India (2026) – Free Video Chat | YaariMeet",
    description:
      "Looking for an Omegle alternative after Omegle shut down? YaariMeet is a free random video chat for India with real Google sign-in, verified profiles and fast reporting.",
    faq: [
      ["Why did Omegle shut down?", "Omegle's founder closed the site in November 2023, saying the cost and difficulty of fighting misuse had become too high to continue."],
      ["Is YaariMeet like Omegle?", "Yes — you are matched with a random stranger for a video or text chat and can press Next at any time. Unlike Omegle, everyone signs in, can verify themselves, and can report abuse in one tap."],
      ["Is this Omegle alternative free?", "Random chat is completely free. Gender filters are optional and cost 20 credits per minute."],
    ],
    body: `
<section class="hero small-hero">
  <h1>The Omegle Alternative Built for India</h1>
  <p class="lead">Miss the excitement of meeting a random stranger? YaariMeet brings back one-click random video chat — with real people, verified profiles and moderation that actually works.</p>
  <a class="btn primary big" href="/chat/">Try YaariMeet free</a>
</section>

<section>
  <h2>What happened to Omegle?</h2>
  <p>Omegle was one of the first sites that let you talk to strangers instantly. It shut down in November 2023 after 14 years. Since then, millions of people have been searching for a site that feels the same — quick, random and fun — but without the bots and abuse that hurt Omegle.</p>
</section>

<section>
  <h2>YaariMeet vs Omegle</h2>
  <div class="table-wrap"><table>
    <thead><tr><th></th><th>Omegle (closed)</th><th>YaariMeet</th></tr></thead>
    <tbody>
      <tr><td>Random video chat</td><td>Yes</td><td>Yes, free</td></tr>
      <tr><td>Text-only chat</td><td>Yes</td><td>Yes, free</td></tr>
      <tr><td>Real account sign-in</td><td>No</td><td>Yes, Google</td></tr>
      <tr><td>Verified profiles</td><td>No</td><td>✔ Selfie verification</td></tr>
      <tr><td>Chat only with girls or boys</td><td>No</td><td>Yes, optional filter</td></tr>
      <tr><td>Report and ban</td><td>Limited</td><td>One-tap report, reviewed by our team</td></tr>
      <tr><td>Made for India</td><td>No</td><td>Yes — Hindi, UPI, Indian networks</td></tr>
    </tbody>
  </table></div>
</section>

<section>
  <h2>What makes a good Omegle alternative?</h2>
  <ul class="ticks">
    <li><b>Real people, not bots.</b> Sign-in with Google keeps spam bots out.</li>
    <li><b>Instant matching.</b> No profiles to fill, no swiping — just press Start.</li>
    <li><b>Easy to skip.</b> Press Next or the Esc key to move on instantly.</li>
    <li><b>Safety tools.</b> Reports go to real moderators who ban abusive accounts.</li>
    <li><b>No download.</b> Works in the browser on any phone or laptop.</li>
  </ul>
</section>`,
  },

  // ---------------------------------------------------------------- Talk to strangers
  {
    path: "/talk-to-strangers/",
    crumb: "Talk to strangers",
    title: "Talk to Strangers Online – Free Stranger Chat | YaariMeet",
    description:
      "Talk to strangers online for free. Random stranger chat by video or text, with conversation tips, icebreakers and safety advice. Start chatting on YaariMeet in seconds.",
    faq: [
      ["How can I talk to strangers online for free?", "On YaariMeet, sign in with Google, choose Random, and press Start. You'll be connected to a random stranger right away, for free."],
      ["Can I talk to strangers without video?", "Yes. Choose Text chat before starting and you'll only exchange messages — no camera needed."],
      ["What should I say to a stranger?", "Start simple: say hi, ask where they're from, or ask about what's around them. Some easy icebreakers are listed on this page."],
    ],
    body: `
<section class="hero small-hero">
  <h1>Talk to Strangers Online</h1>
  <p class="lead">Bored? Lonely? Curious? Meet a random person from somewhere new and have a real conversation — by video or by text.</p>
  <a class="btn primary big" href="/chat/">Talk to a stranger now</a>
</section>

<section>
  <h2>Why talk to strangers?</h2>
  <p>Talking to someone you've never met is one of the easiest ways to practise English or Hindi, beat boredom, hear new points of view, or just make a friend outside your usual circle. Because you'll probably never meet again, many people find it easier to open up.</p>
</section>

<section>
  <h2>20 icebreakers that actually work</h2>
  <ol class="cols-2">
    <li>Hi! Where are you chatting from?</li>
    <li>What's the best thing that happened to you today?</li>
    <li>Tea or coffee?</li>
    <li>What are you watching these days?</li>
    <li>Which city would you move to if you could?</li>
    <li>What's your go-to street food?</li>
    <li>Cricket or football?</li>
    <li>What song is stuck in your head?</li>
    <li>What do you do for fun on weekends?</li>
    <li>Mountains or beaches?</li>
    <li>What's something you're learning right now?</li>
    <li>Best movie you've seen this year?</li>
    <li>What's your dream job?</li>
    <li>Early bird or night owl?</li>
    <li>What's a skill you're proud of?</li>
    <li>Which festival do you enjoy most?</li>
    <li>What would you do with a free day?</li>
    <li>Dogs or cats?</li>
    <li>What's the last thing that made you laugh?</li>
    <li>If you could travel anywhere tomorrow, where?</li>
  </ol>
</section>

<section>
  <h2>How to have a great stranger chat</h2>
  <ul class="ticks">
    <li><b>Smile and say hi first.</b> People skip faces that look bored.</li>
    <li><b>Good light helps.</b> Sit facing a window or lamp so they can see you.</li>
    <li><b>Ask open questions.</b> "What do you like about your city?" beats "Where are you from?"</li>
    <li><b>Be respectful.</b> Rude users get reported and banned.</li>
    <li><b>Keep private info private.</b> Never share your address, phone number or passwords. <a href="/safety/">More safety tips</a>.</li>
  </ul>
</section>

<section>
  <h2>How it works</h2>
  ${steps}
</section>`,
  },

  // ---------------------------------------------------------------- India
  {
    path: "/video-chat-with-strangers-india/",
    crumb: "Video chat India",
    title: "Video Chat with Strangers in India – Free & Safe | YaariMeet",
    description:
      "Free video chat with strangers in India. Meet people from Delhi, Mumbai, Kolkata, Bangalore and more. Works on Jio and Airtel, supports Hindi and English, pay with UPI.",
    faq: [
      ["Does YaariMeet work on mobile data?", "Yes. Video quality adjusts automatically, so it works on 4G and 5G from Jio, Airtel, Vi and BSNL. A video chat uses roughly as much data as a video call on WhatsApp."],
      ["Can I chat in Hindi?", "Of course. Talk in Hindi, English, Bengali, Tamil, Marathi or any language you and your partner share."],
      ["How do I pay for credits in India?", "Scan the QR code with any UPI app — Google Pay, PhonePe, Paytm or your bank app — and enter the transaction ID. Credits are added after we confirm the payment."],
    ],
    body: `
<section class="hero small-hero">
  <h1>Video Chat with Strangers in India</h1>
  <p class="lead">Meet new people from every corner of India — face to face, in seconds, for free. Made for Indian phones, Indian networks and Indian languages.</p>
  <a class="btn primary big" href="/chat/">Start Indian video chat</a>
</section>

<section>
  <h2>Made for India</h2>
  <div class="features">
    <div><h3>Indian users</h3><p>Meet people from Delhi, Mumbai, Kolkata, Bengaluru, Hyderabad, Chennai, Pune, Jaipur and small towns too.</p></div>
    <div><h3>Light on data</h3><p>Video adjusts to your connection, so it runs smoothly on 4G and 5G.</p></div>
    <div><h3>Any language</h3><p>Chat in Hindi, English or your mother tongue. Practise spoken English with real people.</p></div>
    <div><h3>Pay with UPI</h3><p>Credits for filters cost ₹25 for 100. Pay with Google Pay, PhonePe or Paytm.</p></div>
  </div>
</section>

<section>
  <h2>Tips for a smooth video chat on your phone</h2>
  <ul class="ticks">
    <li>Allow camera and microphone when your browser asks.</li>
    <li>Use Chrome on Android or Safari on iPhone for the best quality.</li>
    <li>If video freezes, move closer to your Wi-Fi router or switch to text chat.</li>
    <li>Add YaariMeet to your home screen for one-tap access — no Play Store download needed.</li>
  </ul>
</section>

<section>
  <h2>How it works</h2>
  ${steps}
</section>`,
  },

  // ---------------------------------------------------------------- Girls
  {
    path: "/chat-with-girls-online/",
    crumb: "Chat with girls online",
    title: "Chat with Girls Online – Video Chat with Verified Girls | YaariMeet",
    description:
      "Want to video chat with girls online? Turn on the Only girls filter on YaariMeet and get matched with girls first, verified profiles first. Respectful, safe and easy.",
    faq: [
      ["How do I chat only with girls?", "Choose Only girls in the lobby before you start. The filter costs 20 credits per minute (₹25 = 100 credits). Random chat stays free."],
      ["Are the girls real?", "Everyone signs in with Google and chooses their gender once. Girls can verify with a 3-second selfie video, and verified girls are matched first. Fake genders can be reported and get banned."],
      ["What if no girl is online?", "You'll wait in the queue until one is free — you're only charged once you're actually connected."],
      ["Is it safe for girls?", "Yes. Girls can report anyone in one tap, and our team bans users who are rude or abusive. Video is never recorded."],
    ],
    body: `
<section class="hero small-hero">
  <h1>Video Chat with Girls Online</h1>
  <p class="lead">Turn on the <b>Only girls</b> filter and YaariMeet matches you with girls only — verified girls first. Friendly, respectful conversations with real people.</p>
  <a class="btn primary big" href="/chat/">Chat with girls now</a>
</section>

<section>
  <h2>How the Only girls filter works</h2>
  <ol class="steps">
    <li><b>Sign in and add credits</b><span>₹25 gives you 100 credits — that's 5 minutes of filtered chat.</span></li>
    <li><b>Pick "Only girls"</b><span>Choose video or text, then press Start.</span></li>
    <li><b>Get matched with a girl</b><span>Verified girls (✔) are matched first. 20 credits are used per minute only while you're connected.</span></li>
  </ol>
</section>

<section>
  <h2>Real profiles, not bots</h2>
  <p>Many "chat with girls" sites are full of fake profiles and bots. On YaariMeet everyone signs in with a real Google account, gender is locked after signup, and girls can earn a ✔ Verified badge with a short selfie video reviewed by our team. If someone isn't who they say they are, press Report → Wrong gender and we'll check.</p>
</section>

<section>
  <h2>Be respectful</h2>
  <p>Girls on YaariMeet can report anyone in one tap. Rude, sexual or abusive behaviour gets your account banned — and your credits with it. Say hi, smile, and treat people the way you'd like to be treated. <a href="/safety/">Read our community rules</a>.</p>
</section>

<section>
  <h2>Looking to chat with boys instead?</h2>
  <p>Choose <b>Only boys</b> in the lobby — it works the same way. Or keep <b>Random</b> on and meet anyone, for free.</p>
</section>`,
  },

  // ---------------------------------------------------------------- App
  {
    path: "/random-chat-app/",
    crumb: "Random chat app",
    title: "Random Chat App – No Download, Works in Your Browser | YaariMeet",
    description:
      "YaariMeet is a random chat app that runs in your browser – no download from the Play Store or App Store. Add it to your home screen and video chat with strangers anytime.",
    faq: [
      ["Is there a YaariMeet app on the Play Store?", "You don't need one. YaariMeet runs in your browser and can be added to your home screen, where it opens like a normal app."],
      ["How do I add YaariMeet to my home screen?", "On Android Chrome, tap ⋮ then Add to Home screen. On iPhone Safari, tap Share then Add to Home Screen."],
      ["Does it work on a laptop?", "Yes. Any laptop or computer with a webcam and a modern browser works."],
    ],
    body: `
<section class="hero small-hero">
  <h1>The Random Chat App You Don't Need to Download</h1>
  <p class="lead">YaariMeet works straight from your browser — on Android, iPhone, laptop or tablet. No installs, no storage used, no updates.</p>
  <a class="btn primary big" href="/chat/">Open YaariMeet</a>
</section>

<section>
  <h2>Add it to your home screen in 10 seconds</h2>
  <div class="grid">
    <div class="box"><h3>Android (Chrome)</h3><p>Open ${HOST} → tap the ⋮ menu → <b>Add to Home screen</b>.</p></div>
    <div class="box"><h3>iPhone (Safari)</h3><p>Open ${HOST} → tap <b>Share</b> → <b>Add to Home Screen</b>.</p></div>
  </div>
</section>

<section>
  <h2>Everything a random chat app should do</h2>
  <ul class="ticks">
    <li>Random video chat with strangers — free.</li>
    <li>Anonymous text chat if you don't want to use your camera.</li>
    <li>Only girls / Only boys filters when you want them.</li>
    <li>Verified badges, reports and bans to keep things friendly.</li>
    <li>Next button (or Esc on a keyboard) to skip instantly.</li>
  </ul>
</section>

<section>
  <h2>How it works</h2>
  ${steps}
</section>`,
  },

  // ---------------------------------------------------------------- Hindi
  {
    path: "/hi/",
    lang: "hi",
    title: "YaariMeet – अजनबियों से फ्री रैंडम वीडियो चैट (हिंदी)",
    description:
      "YaariMeet पर अजनबियों से फ्री रैंडम वीडियो चैट और टेक्स्ट चैट करें। कोई डाउनलोड नहीं, Google से साइन इन, वेरिफाइड प्रोफाइल और लड़कियों/लड़कों का फ़िल्टर।",
    alternates: [["en-IN", "/"], ["hi-IN", "/hi/"], ["x-default", "/"]],
    faq: [
      ["क्या YaariMeet फ्री है?", "हाँ। रैंडम वीडियो चैट और टेक्स्ट चैट हमेशा फ्री हैं। सिर्फ़ 'केवल लड़कियाँ' या 'केवल लड़के' फ़िल्टर के लिए 20 क्रेडिट प्रति मिनट लगते हैं (₹25 = 100 क्रेडिट)।"],
      ["क्या ऐप डाउनलोड करना ज़रूरी है?", "नहीं। YaariMeet ब्राउज़र में चलता है। आप इसे होम स्क्रीन पर जोड़ सकते हैं।"],
      ["पेमेंट कैसे करें?", "किसी भी UPI ऐप (Google Pay, PhonePe, Paytm) से QR स्कैन करें और ट्रांज़ैक्शन ID डालें। कन्फ़र्म होने पर क्रेडिट जुड़ जाते हैं।"],
      ["क्या यह सुरक्षित है?", "हर चैट में रिपोर्ट बटन है और गलत व्यवहार करने वालों को बैन किया जाता है। वीडियो कभी रिकॉर्ड नहीं होता। केवल 18+ के लिए।"],
    ],
    body: `
<section class="hero small-hero">
  <span class="kicker">फ्री · वीडियो और टेक्स्ट</span>
  <h1>अजनबियों से रैंडम वीडियो चैट</h1>
  <p class="lead">YaariMeet पर पूरे भारत के नए लोगों से कुछ ही सेकंड में आमने-सामने बात करें। फ्री वीडियो चैट और टेक्स्ट चैट — बिना डाउनलोड के।</p>
  <a class="btn primary big" href="/chat/">🎥 वीडियो चैट शुरू करें</a>
  <p class="small muted">फ्री · कोई डाउनलोड नहीं · Google से साइन इन · केवल 18+</p>
</section>

<section>
  <h2>YaariMeet कैसे काम करता है</h2>
  <ol class="steps">
    <li><b>Google से साइन इन करें</b><span>एक टैप में। हम सिर्फ़ आपका नाम और ईमेल लेते हैं।</span></li>
    <li><b>चुनें किससे मिलना है</b><span>रैंडम फ्री है। चाहें तो 'केवल लड़कियाँ' या 'केवल लड़के' चुनें।</span></li>
    <li><b>बात शुरू करें</b><span>वीडियो या टेक्स्ट। पसंद नहीं आया? Next दबाएँ और नए व्यक्ति से मिलें।</span></li>
  </ol>
</section>

<section>
  <h2>YaariMeet क्यों?</h2>
  <div class="features">
    <div><h3>फ्री रैंडम चैट</h3><p>पूरे भारत के अजनबियों से बिना किसी खर्च के बात करें।</p></div>
    <div><h3>वेरिफाइड प्रोफाइल</h3><p>3 सेकंड के सेल्फ़ी वीडियो से वेरिफाई करें। वेरिफाइड लोगों को पहले मैच मिलता है।</p></div>
    <div><h3>जेंडर फ़िल्टर</h3><p>सिर्फ़ लड़कियों या सिर्फ़ लड़कों से बात करें — 20 क्रेडिट प्रति मिनट।</p></div>
    <div><h3>UPI से पेमेंट</h3><p>₹25 में 100 क्रेडिट। Google Pay, PhonePe या Paytm से भुगतान करें।</p></div>
  </div>
</section>`,
  },

  // ---------------------------------------------------------------- Pricing
  {
    path: "/pricing/",
    crumb: "Pricing",
    title: "Pricing – Free Random Chat, ₹25 for 100 Credits | YaariMeet",
    description:
      "YaariMeet pricing: random video chat is free forever. Only girls / Only boys filters cost 20 credits per minute. ₹25 = 100 credits, pay with any UPI app.",
    faq: [
      ["When are credits used?", "Only while you are connected to someone using the Only girls or Only boys filter: 20 credits at the start of each minute. Waiting in the queue is free."],
      ["What happens when my credits run out?", "Your chat ends and you're automatically moved to Random chat, which is free. Add credits anytime to use filters again."],
      ["How long does it take to get credits?", "Usually a few minutes. After you pay and enter your UPI transaction ID, our team confirms the payment and adds your credits."],
      ["Do credits expire?", "No. Unused credits stay in your account."],
    ],
    body: `
<section class="hero small-hero">
  <h1>Simple pricing</h1>
  <p class="lead">Random chat is free, forever. Pay only if you want to choose who you meet.</p>
</section>

<section>
  <div class="grid">
    <div class="box"><h3>Random</h3><p class="price">Free</p><p>Unlimited random video and text chat with anyone.</p></div>
    <div class="box"><h3>Only girls / Only boys</h3><p class="price">20 credits<span>/min</span></p><p>Match only with the gender you choose. Verified people first.</p></div>
  </div>
</section>

<section>
  <h2>Credit packs</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Pay</th><th>Credits</th><th>Filtered chat time</th></tr></thead>
    <tbody>
      <tr><td>₹25</td><td>100</td><td>5 minutes</td></tr>
      <tr><td>₹50</td><td>200</td><td>10 minutes</td></tr>
      <tr><td>₹100</td><td>400</td><td>20 minutes</td></tr>
      <tr><td>₹250</td><td>1,000</td><td>50 minutes</td></tr>
    </tbody>
  </table></div>
  <p>Pay by scanning our UPI QR code with Google Pay, PhonePe, Paytm or any bank app, then enter your transaction ID (UTR). Credits are added once our team confirms the payment — usually within a few minutes.</p>
</section>`,
  },

  // ---------------------------------------------------------------- Safety
  {
    path: "/safety/",
    crumb: "Safety",
    title: "Safety & Community Rules – Stay Safe Chatting with Strangers | YaariMeet",
    description:
      "How to stay safe when you video chat with strangers, and the rules everyone on YaariMeet follows. Report abuse in one tap – our team bans offenders.",
    body: `
<section class="hero small-hero">
  <h1>Safety & community rules</h1>
  <p class="lead">YaariMeet is for friendly conversations between adults. Here's how we keep it that way — and how you can stay safe.</p>
</section>

<section>
  <h2>Our rules</h2>
  <ul class="ticks">
    <li><b>18+ only.</b> If you are under 18, you may not use YaariMeet.</li>
    <li><b>No nudity or sexual content.</b> Not on camera, not in chat.</li>
    <li><b>No harassment, hate or threats.</b> Be kind, even when you press Next.</li>
    <li><b>Be who you say you are.</b> Choosing the wrong gender gets you banned.</li>
    <li><b>No spam, selling or links to other sites.</b></li>
    <li><b>No recording or screenshots</b> of other people without their consent.</li>
  </ul>
  <p>Breaking the rules leads to a permanent ban. Unused credits on banned accounts are not refunded.</p>
</section>

<section>
  <h2>Staying safe</h2>
  <ul class="ticks">
    <li>Never share your full name, address, school, workplace, phone number or social media with strangers.</li>
    <li>Never send money or share OTPs, passwords or bank details — YaariMeet will never ask for them in a chat.</li>
    <li>Remember anyone can see whatever your camera shows. Check your background.</li>
    <li>If anyone makes you uncomfortable, press <b>Next</b> straight away, then <b>Report</b>.</li>
  </ul>
</section>

<section>
  <h2>How reporting works</h2>
  <p>Tap <b>Report</b> during a chat and choose <b>Abusive</b> or <b>Wrong gender</b>. The report goes to our moderation team with the account details, and we ban accounts that break the rules. In an emergency, contact your local police or call <b>112</b>. For cyber crime in India, report at <a href="https://cybercrime.gov.in" rel="nofollow">cybercrime.gov.in</a> or call <b>1930</b>.</p>
</section>`,
  },

  // ---------------------------------------------------------------- About
  {
    path: "/about/",
    crumb: "About",
    title: "About YaariMeet – Random Video Chat Made in India",
    description:
      "YaariMeet is a random video chat site made in India to help people meet new friends safely. Learn who we are and what we stand for.",
    body: `
<section class="hero small-hero">
  <h1>About YaariMeet</h1>
  <p class="lead">"Yaari" means friendship. We built YaariMeet so anyone in India can meet someone new in seconds — safely, simply and for free.</p>
</section>
<section>
  <h2>What we believe</h2>
  <ul class="ticks">
    <li><b>Random chat should be free.</b> It is, and always will be.</li>
    <li><b>Real people matter.</b> Google sign-in and selfie verification keep bots and fakes out.</li>
    <li><b>Safety first.</b> Every chat has a Report button and every report is read by a person.</li>
    <li><b>Privacy by design.</b> Video goes directly between you and the other person. We never record chats.</li>
  </ul>
</section>
<section>
  <h2>Get in touch</h2>
  <p>Questions, feedback or partnership ideas? <a href="/contact/">Contact us</a>.</p>
</section>`,
  },

  // ---------------------------------------------------------------- Contact
  {
    path: "/contact/",
    crumb: "Contact",
    title: "Contact YaariMeet – Support & Payments Help",
    description: "Contact YaariMeet for help with payments, credits, verification, bans or anything else.",
    body: `
<section class="hero small-hero">
  <h1>Contact us</h1>
  <p class="lead">We're happy to help with payments, credits, verification or anything else.</p>
</section>
<section>
  <p>Email: <a href="mailto:${CONTACT}">${CONTACT}</a></p>
  <p>For payment issues, include the email you sign in with, the amount and your UPI transaction ID (UTR). We usually reply within 24 hours.</p>
</section>`,
  },

  // ---------------------------------------------------------------- Privacy
  {
    path: "/privacy/",
    crumb: "Privacy policy",
    title: "Privacy Policy | YaariMeet",
    description: "How YaariMeet collects, uses and protects your personal data.",
    body: `
<section class="legal">
  <h1>Privacy policy</h1>
  <p class="muted">Last updated: ${new Date().toISOString().slice(0, 10)}</p>
  <h2>What we collect</h2>
  <ul>
    <li><b>Account details from Google:</b> your name and email address.</li>
    <li><b>Profile details you give us:</b> display name and gender.</li>
    <li><b>Payment details:</b> the amount and UPI transaction ID (UTR) you submit. We never see your bank or card details.</li>
    <li><b>Verification videos:</b> a 3-second selfie video, only if you choose to verify. It is deleted as soon as our team reviews it.</li>
    <li><b>Safety data:</b> reports you make or receive, and your IP address, used to fight abuse.</li>
  </ul>
  <h2>What we don't collect</h2>
  <p>Video and audio calls travel directly between you and the other person (peer-to-peer, encrypted with WebRTC). We do not record or store your calls. Text messages are passed through our server to the other person and are not stored.</p>
  <h2>How we use your data</h2>
  <p>To run your account, match you with other people, add credits you pay for, verify profiles, enforce our rules, and keep the service secure.</p>
  <h2>Who we share it with</h2>
  <p>We don't sell your data. We use trusted providers to run the service: Google (sign-in), Supabase (database) and Cloudflare (hosting). We may share data with authorities when the law requires it.</p>
  <h2>Your rights</h2>
  <p>You can ask us to access, correct or delete your data by emailing <a href="mailto:${CONTACT}">${CONTACT}</a>. Deleting your account removes your profile and remaining credits.</p>
  <h2>Children</h2>
  <p>YaariMeet is only for people aged 18 and over. We delete accounts that belong to minors.</p>
</section>`,
  },

  // ---------------------------------------------------------------- Terms
  {
    path: "/terms/",
    crumb: "Terms of use",
    title: "Terms of Use | YaariMeet",
    description: "The terms that apply when you use YaariMeet random video and text chat.",
    body: `
<section class="legal">
  <h1>Terms of use</h1>
  <p class="muted">Last updated: ${new Date().toISOString().slice(0, 10)}</p>
  <h2>1. Who can use YaariMeet</h2>
  <p>You must be at least 18 years old. By signing in you confirm this and agree to these terms and our <a href="/safety/">community rules</a>.</p>
  <h2>2. Your behaviour</h2>
  <p>You are responsible for what you say and show. Nudity, sexual content, harassment, hate speech, threats, spam, impersonation and recording others without consent are not allowed. We may suspend or ban any account that breaks these rules, without refund of unused credits.</p>
  <h2>3. Gender and verification</h2>
  <p>You must choose your real gender. Your gender cannot be changed by you after signup. Verification badges show our team reviewed a selfie video; they are not a guarantee of identity.</p>
  <h2>4. Credits and payments</h2>
  <p>Random chat is free. Only girls / Only boys filters cost 20 credits per minute while connected. ₹25 buys 100 credits. Credits are added after we confirm your UPI payment. Credits have no cash value, cannot be transferred and are non-refundable except where the law requires. If a payment can't be confirmed, no credits are added — contact us with your transaction ID.</p>
  <h2>5. No guarantees</h2>
  <p>We match you with whoever is online; we can't guarantee that someone of a particular gender is available at any time. The service is provided "as is", and we are not responsible for the conduct of other users.</p>
  <h2>6. Changes</h2>
  <p>We may update these terms. Continuing to use YaariMeet means you accept the updated terms.</p>
  <h2>7. Contact</h2>
  <p><a href="mailto:${CONTACT}">${CONTACT}</a></p>
</section>`,
  },

  // ---------------------------------------------------------------- 404
  {
    path: "/404",
    file: "404.html",
    noindex: true,
    crumb: "Not found",
    title: "Page not found | YaariMeet",
    description: "This page doesn't exist.",
    body: `
<section class="hero small-hero">
  <h1>Page not found</h1>
  <p class="lead">This page doesn't exist — but plenty of people are waiting to chat.</p>
  <a class="btn primary big" href="/">Go to home</a>
</section>`,
  },
];

