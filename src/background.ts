interface Rule {
   redirectType: "replace" | "wildcardReplace";
   from: string;
   to: string;
}

type RuleGroup = {
   name: string;
   rules: Array<Rule>;
};

type Policy = Array<RuleGroup>;

const policy: Policy = [
   {
      name: "login-v2",
      rules: [
         {
            redirectType: "wildcardReplace",
            from: "login-v2.island.io/*.*.css",
            to: "http://localhost:8080/$1.css",
         },
      ],
   },
];

function fromWildCardSourceToRegex(source: string) {
   const fromStr = source.replaceAll("*", "([^/]+)");
   return new RegExp(fromStr);
}

const rules = policy
   .flatMap((group) => group.rules)
   .map((rule) => {
      if (rule.redirectType === "wildcardReplace") {
         return {
            ...rule,
            from: fromWildCardSourceToRegex(rule.from),
         };
      }
      return rule;
   });

let listener: (details: chrome.webRequest.WebRequestBodyDetails) => void;

function setRedirects() {
   chrome.webRequest.onBeforeRequest.removeListener(listener);

   listener = (details) => {
      const url = new URL(details.url);
      for (const rule of rules) {
         if (url.href.match(rule.from)) {
            const newUrl = url.href.replace(rule.from, rule.to);
            return { redirectUrl: newUrl };
         }
      }
   };

   chrome.webRequest.onBeforeRequest.addListener(
      listener,
      { urls: ["<all_urls>"] },
      ["blocking"]
   );
}

chrome.runtime.onStartup.addListener(() => {
   console.log("onInstalled....");
   setRedirects();
});
1;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   console.log("listening to message: ", message);
   if (message.action === "updateRules") {
      setRedirects();
      sendResponse({ status: "Rules updated" });
   }
});
