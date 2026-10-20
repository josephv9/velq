#!/usr/bin/env python3
"""Read-only QA: verify Velq Hostinger production matches lead-capture deployment."""
import json, re, time, urllib.request, urllib.error, sys
BASE="https://velqnutrition.com"
PATHS=["/", "/velq-lead-capture.js", "/velq-lead-capture.css", "/analytics.js", "/velq-analytics.js", "/privacy/"]
HEADERS={"User-Agent":"Velq-live-optin-QA/1.0", "Cache-Control":"no-cache", "Pragma":"no-cache"}
def fetch(path):
    errors=[]
    for attempt in range(1,4):
        try:
            url=BASE+path+"?velq_qacheck=20261020" if path not in ("/","/privacy/") else BASE+path
            req=urllib.request.Request(url,headers=HEADERS)
            with urllib.request.urlopen(req,timeout=22) as resp:
                return {"status":resp.status,"body":resp.read(1200000).decode("utf8","replace"),"headers":dict(resp.headers),"url":resp.geturl(),"attempt":attempt}
        except Exception as ex:
            errors.append(type(ex).__name__+": "+str(ex)[:190])
            if attempt<3: time.sleep(attempt)
    return {"status":0,"body":"","headers":{},"errors":errors,"attempt":3}
results={p:fetch(p) for p in PATHS}
checks={
 "homepage_200":results["/"]["status"]==200,
 "homepage_links_popup_js":"/velq-lead-capture.js" in results["/"]["body"],
 "homepage_links_popup_css":"/velq-lead-capture.css" in results["/"]["body"],
 "popup_js_200":results["/velq-lead-capture.js"]["status"]==200,
 "popup_14_second_timer":"14000" in results["/velq-lead-capture.js"]["body"],
 "popup_7_day_dismissal":"7 * 24 * 60 * 60 * 1000" in results["/velq-lead-capture.js"]["body"],
 "popup_utm_event":"velq_early_access_submit" in results["/velq-lead-capture.js"]["body"],
 "popup_source_event":"source: 'popup', trigger: reason" in results["/velq-lead-capture.js"]["body"],
 "popup_uses_existing_waitlist":"/api/waitlist" in results["/velq-lead-capture.js"]["body"],
 "popup_requires_optin":'name="consent" type="checkbox" required' in results["/velq-lead-capture.js"]["body"],
 "klaviyo_known_public_key":"RCNCJb" in results["/velq-lead-capture.js"]["body"],
 "klaviyo_optin_gate":"velq_klaviyo_opted_in_v1" in results["/velq-lead-capture.js"]["body"],
 "klaviyo_not_loaded_anonymously":"read(KLAVIYO_CONSENT_KEY) !== '1'" in results["/velq-lead-capture.js"]["body"],
 "popup_css_200":results["/velq-lead-capture.css"]["status"]==200,
 "popup_narrow_layout_fixed":"On narrow screens anchor" in results["/velq-lead-capture.css"]["body"],
 "analytics_200":results["/analytics.js"]["status"]==200,
 "analytics_popup_attribution":"const isPopup=event.detail?.source==='popup'" in results["/analytics.js"]["body"],
 "analytics_popup_form_id":"form_id:isPopup?'velq-lead-form':'waitlist-form'" in results["/analytics.js"]["body"],
 "analytics_server_confirmed_lead":"waitlist_signup_success" in results["/analytics.js"]["body"] and "generate_lead" in results["/analytics.js"]["body"],
 "ga4_config_200":results["/velq-analytics.js"]["status"]==200,
 "ga4_id_correct":"G-F93RK1P0H5" in results["/velq-analytics.js"]["body"],
 "privacy_200":results["/privacy/"]["status"]==200,
 "privacy_mentions_optional_consent":"Marketing email signup is optional" in results["/privacy/"]["body"],
}
for path,response in results.items():
    print("HTTP",json.dumps({"path":path,"status":response["status"],"bytes":len(response["body"]),"attempt":response["attempt"],"errors":response.get("errors"),"content_type":response.get("headers",{}).get("Content-Type")}))
for name,ok in checks.items(): print("CHECK",json.dumps({"name":name,"result":"PASS" if ok else "FAIL"}))
print("SUMMARY",json.dumps({"passed":sum(checks.values()),"total":len(checks),"failures":[n for n,ok in checks.items() if not ok]}))
if not all(checks.values()): sys.exit(1)
print("PRODUCTION VERIFIED: popup, lead analytics, responsive CSS, consent-gated Klaviyo and privacy code served by Hostinger. This does not confirm GA4 receipt or Klaviyo vendor processing.")