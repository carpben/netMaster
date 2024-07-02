import { from } from "solid-js";

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
   const fromStr = source.replace(/\*/g, /([^\/]+)/);
   return new RegExp(fromStr);
}

function fromWildCardTargetToRegex(targetString: string) {
   let count = 0;
   return targetString.replace(/\*/g, () => {
      count += 1;
      return `$${count}`;
   });
}

const rules = policy
   .flatMap((group) => group.rules)
   .map((rule) => {
      if (rule.redirectType === "wildcardReplace") {
         return {
            ...rule,
            from: fromWildCardSourceToRegex(rule.from),
            to: fromWildCardTargetToRegex(rule.to),
         };
      }
      return rule;
   });

let listener

function setRedirects() {
   chrome.webRequest.onBeforeRequest.removeListener(listener)

   listener = chrome.webRequest.onBeforeRequest.addListener(
      function (details) {
         const url = new URL(details.url);
         for (const rule of rules) {
            if(url.href.match(rule.from)){
               const newUrl = url.href.replace(rule.from, rule.to);
               return { redirectUrl: newUrl }   ;
            }
         }
      }
      {urls: ["<all_urls>"]},
      ["blocking"]
   )
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
