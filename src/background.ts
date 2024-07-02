import { from } from "solid-js";

console.log("background script running");

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

const rules = policy.flatMap((group) => group.rules);

function setRules() {
   //    chrome.declarativeNetRequest.updateDynamicRules({
   //       removeRuleIds: [1],
   //       addRules: [
   //          {
   //             id: 1,
   //             priority: 1,
   //             action: {
   //                type: "redirect",
   //                redirect: {
   //                   regexSubstitution: "localhost://8080/\\1.css",
   //                },
   //             },
   //             condition: {
   //                regexFilter:
   //                   "^https://login-v2\\.island\\.io/([\\w\\d]+)\\.[\\w\\d]+\\.css$",
   //                resourceTypes: [
   //                   "main_frame",
   //                   "sub_frame",
   //                   "stylesheet",
   //                   "script",
   //                   "image",
   //                   "xmlhttprequest",
   //                   "other",
   //                ],
   //             },
   //          },
   //       ],
   //    });

   chrome.webRequest.onBeforeRequest.addListener(
      function (details) {
         const url = new URL(details.url);

         if (!url.hostname === "login-v2.island.io") {
            return;
         }
         console.log(path);
         const newPath = url.pathname.replace(
            /([^/]+)\.[^/]+\.css$/,
            "/styles.css"
         );
         console.log(newPath);
         const newUrl = `http://localhost:8080${newPath}`;

         return { redirectUrl: newUrl };
      },
      {
         urls: ["*://login-v2.island.io/styles.*.css"],
         types: [
            "main_frame",
            "sub_frame",
            "stylesheet",
            "script",
            "image",
            "xmlhttprequest",
            "other",
         ],
      },
      ["blocking"]
   );
}

chrome.runtime.onStartup.addListener(() => {
   console.log("onInstalled....");
   setRules();
});
1;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   console.log("listening to message: ", message);
   if (message.action === "updateRules") {
      setRules();
      sendResponse({ status: "Rules updated" });
      setRules();
   }
});
