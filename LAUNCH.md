# Publishing the site, and being found in Bulawayo

Two separate jobs. Getting the site online is an afternoon. Being found by a patient who
types "dentist near me" in Bulawayo is mostly one thing, and it is not the website.

---

## 1. The one that matters most: Google Business Profile

**A Google Business Profile is free, and for local searches it outranks the website.**

When someone in Bulawayo searches "dentist near me", "dental clinic Bulawayo" or "root
canal Bulawayo", Google shows a map with three businesses above the ordinary results. Those
three come from Business Profiles, not from websites. A practice with a profile and no
website appears there; a practice with a website and no profile usually does not appear at
all.

The practice does not have one yet. Set it up before worrying about anything else on this
page.

**To create it:** go to `google.com/business`, sign in with the practice's Google account
(make one if there isn't a practice account, and do not use a personal one), and add the
business.

**Fill it in with exactly these values.** Google cross-checks the name, address and phone
against the website, and a mismatch, even "Str" against "Street", weakens both:

| Field | Value |
|---|---|
| Business name | `Dental Care Centre` |
| Category (primary) | `Dentist` |
| Category (additional) | `Dental clinic`, plus `Orthodontist` and `Dental implants periodontist` if those are offered |
| Address | `Sunninghill Building, Suite Four, Cnr Fife Street & 14th Avenue, Bulawayo, Zimbabwe` |
| Phone | `+263 29 226 3687` |
| Hours | Mon-Fri 08:00-17:00, Sat 08:00-13:00, Sun closed |
| Website | the domain, once it is live |

**Verification.** Google has to confirm the practice is really at that address, usually by
postcard, sometimes by phone or video. In Zimbabwe the postcard can be slow or not arrive;
if it does not come within three weeks, request video verification instead, which is a
short walkthrough of the premises and the signage. The profile does not appear in search
results until it is verified, so start this early.

**Once it is live, three things move the needle, in this order:**

1. **Reviews.** More than anything else. Ask every patient who is happy on the day.
   A profile with twenty reviews beats one with two, and Google reads the words in them:
   a review saying "root canal" helps the practice appear for root canal searches. Never
   buy reviews; Google detects and removes them, and it can suspend the profile.
2. **Photos.** Real photographs of the building, the signage, the reception and the
   surgery. Patients choose a clinic partly on whether it looks clean and real. Add a few
   every month.
3. **Services.** List the same thirteen treatments the website lists, in the profile's own
   Services section.

---

## 2. Getting the site online with Hostinger

**Before uploading, set the domain.** Five things need the real address and were left out
on purpose, because a canonical tag pointing at the wrong host can remove a site from
Google altogether:

```
node assets/brand/set-domain.mjs dentalcarecentre.co.zw
```

That fills in the canonical tags, the social-share URLs, and writes `sitemap.xml` and
`robots.txt`. Run it once, with the final domain, before uploading. If the domain changes
later, run it again with the new one and re-upload; nothing is left pointing at the old
address.

**Choosing the domain.** `.co.zw` gives a small advantage for Zimbabwean searches and reads
as local, but it is registered through a ZISPA registrar rather than through Hostinger, so
it means pointing Hostinger's nameservers at it by hand. A `.com` bought inside Hostinger
is one click and works everywhere. Either is fine. A `.co.zw` with a `.com` redirecting to
it is the belt-and-braces option.

**Uploading.** In hPanel, open **File Manager**, go to `public_html`, and upload the
contents of this folder, so that `index.html` sits directly in `public_html` and not in a
subfolder.

**Upload these:**

```
index.html  about.html  service.html  privacy.html  terms.html
sitemap.xml  robots.txt
assets/            (the whole folder: css, js, img, brand)
```

**Do not upload:**

- `variant-blue/` — a complete second copy of the site in a different colour scheme, left
  over from the template it was built from. Publishing it puts two identical sites in front
  of the same searches, and they compete with each other. `robots.txt` already tells Google
  to ignore it, but the simplest thing is not to upload it at all.
- `.bak/`, `node_modules`, and the `*.md` files, including this one. None of them are part
  of the site.

**After it is live, check:** the site loads over `https://` (Hostinger issues a free SSL
certificate; turn it on in hPanel and force HTTPS), and `yourdomain/robots.txt` and
`yourdomain/sitemap.xml` both load in a browser.

---

## 3. Google Search Console

Free, and the only place that reports what people actually searched to reach the site.

1. `search.google.com/search-console`, add the domain as a property.
2. Verify it by adding the DNS TXT record it gives you, in Hostinger's DNS zone editor.
3. Under **Sitemaps**, submit `sitemap.xml`.
4. Under **URL Inspection**, paste the home page URL and press **Request indexing**. This
   is what gets the site looked at in days rather than weeks.

---

## What is already done in the site itself

- Every page titles itself around Bulawayo and the treatments people search by name.
- Each page carries a `Dentist` record in structured data: address, phone, opening hours,
  area served and all thirteen treatments. This is what a search engine reads when deciding
  whether the practice belongs in a local result.
- The language is declared as `en-ZW`.
- Sora loads through a plain stylesheet link rather than a font loader script, saving three
  blocking round trips before the first letter can be drawn.
- Images below the first screen load lazily.
- The phone menu is four categories rather than seventeen rows, with 48px tap targets.

**Not done, and it needs you:** the structured data has no map coordinates. They cannot be
verified from here, and a pin in the wrong place is worse than no pin. Once the Business
Profile is verified, Google has the real location and this stops mattering.

**Also worth doing when there is time:** the FAQ answers on the Services page are still
generic. Real answers, in the practice's own words, are the kind of page Google favours
and the kind a nervous patient actually reads.
