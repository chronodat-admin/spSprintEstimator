#!/usr/bin/env python3
"""Generate the Sprint Align knowledge base for chronodat-web.

Writes manifest.json, index.html, and one HTML page per topic into
C:/chronodatWeb/chronodat-web/wiki/sprint-align/, reusing the shared KB
stylesheet (amh-kb.css) and script (rch-kb.js) so it matches other product
KBs on the site.
"""
from __future__ import annotations

import json
from pathlib import Path

OUT = Path(r"C:\chronodatWeb\chronodat-web\wiki\sprint-align")
PRODUCT = "Sprint Align"
VERSION = "1.1.3.30"
BASE = "/wiki/sprint-align"
ICON = "/img/sprint-align/icon-96.png"
IMG = "/img/sprint-align/wiki"

FOOTER = """    <footer id="footer" class="footer style-1 dark">
    <a href="/"><img src="/img/assets/chronodat-logo-white.svg" alt="Chronodat" class="mr-auto img-responsive footer-logo"></a>
    <ul>
        <li><a href="https://www.linkedin.com/company/chronodat" target="_blank" rel="noopener noreferrer" class="color"><i class="ion-social-linkedin"></i></a></li>
        <li><a href="https://www.youtube.com/channel/UC3JfV39G6AvLrmAXzAfFKRA" target="_blank" rel="noopener noreferrer" class="color"><i class="ion-social-youtube"></i></a></li>
        <li><a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" class="color"><i class="ion-social-facebook"></i></a></li>
    </ul>
    <a href="#"><strong>&copy; Chronodat, LLC 2026</strong></a>
    <p>Made with passion for great people and companies.</p>
    <p><a href="/Privacy" target="_blank" rel="noopener noreferrer" class="color">Privacy &amp; Cookies</a> | <a href="/terms-conditions" target="_blank" rel="noopener noreferrer" class="color">Terms &amp; Conditions</a> | <a href="#" class="color">FAQs</a></p>
    <span><a class="scroll-top"><i class="ion-chevron-up"></i></a></span>
    <span id="siteseal"><script async type="text/javascript" src="https://seal.godaddy.com/getSeal?sealID=4zn3kuwGF16teko1JLktRNyTvqvt4P7m4zPhiEWDUJipbxIXdHNIaTQssMNi"></script></span>
    </footer>"""

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{title}</title>
    <meta name="description" content="{desc}">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="canonical" href="https://www.chronodat.com{canonical}" />
    <link href="/Images/favicon.ico" rel="shortcut icon" />
    <link href="/css/init.css" rel="stylesheet" type="text/css">
    <link href="/css/ion-icons.min.css" rel="stylesheet" type="text/css">
    <link href="/css/etline-icons.min.css" rel="stylesheet" type="text/css">
    <link href="/css/theme.css" rel="stylesheet" type="text/css">
    <link href="/css/custom.css" rel="stylesheet" type="text/css">
    <link href="/css/colors/yellow.css" rel="stylesheet" type="text/css">
    <link href="/css/amh-kb.css" rel="stylesheet" type="text/css">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:400,700%7CRaleway:400,100,200,300%7CHind:400,300" rel="stylesheet" type="text/css">
    <script src="/js/jquery.js"></script>
    <script>$(function() {{ $("#header").load("/header.html"); }});</script>
</head>"""

# ---------------------------------------------------------------------------
# Topic content
# ---------------------------------------------------------------------------

TOPICS = [
    {
        "slug": "about-this-guide",
        "nav": "About This Guide",
        "title": "About This Guide",
        "group": "Getting Started",
        "summary": "What Sprint Align is, who this guide is for, and how it is organized.",
        "toc": [],
        "body": """
<p>{p} is a SharePoint Framework (SPFx) application that brings planning poker and
agile estimation directly into SharePoint Online and Microsoft Teams. Scrum teams,
product owners, and delivery leads use it to run facilitator-led estimation
sessions &mdash; planning poker, confidence checks, fist-of-five, dot voting, and quick
surveys &mdash; without exporting backlog data to a separate tool.</p>
<p>Everything runs inside your Microsoft 365 tenant. Sessions, votes, decks, and
settings are stored in SharePoint lists on the host site, so your estimation data
never leaves your control and there is no external estimation backend to manage.</p>
<h3><strong>Who this guide is for</strong></h3>
<ul>
<li><strong>Team members</strong> who join sessions and vote.</li>
<li><strong>Facilitators</strong> (scrum masters, product owners) who run rounds and reveal results.</li>
<li><strong>Site owners &amp; administrators</strong> who deploy, provision, brand, and govern the app.</li>
</ul>
<h3><strong>How it is organized</strong></h3>
<ul>
<li><strong>Getting Started</strong> &mdash; requirements, deployment, first-time setup, and a tour of the interface.</li>
<li><strong>User Guide</strong> &mdash; joining, creating sessions, voting, revealing results, decks, and history.</li>
<li><strong>Administration</strong> &mdash; settings, licensing, end-to-end workflows, and troubleshooting.</li>
</ul>
""",
    },
    {
        "slug": "getting-started",
        "nav": "1. Getting Started",
        "title": "1. Getting Started",
        "group": "Getting Started",
        "summary": "Requirements, deploying the package to the tenant App Catalog, adding the app to a page, and completing first-time setup.",
        "toc": [
            ("1-requirements", "1.1 Requirements"),
            ("2-deploy", "1.2 Deploy the App (Tenant Administrator)"),
            ("3-add-app", "1.3 Add Sprint Align to a Page (Site Owner)"),
            ("4-first-time-setup", "1.4 First-Time Setup"),
            ("additional-licensing", "Subscription, Trial, and Licensing"),
        ],
        "figure": ("04-setup.png", "The setup wizard provisions the SharePoint lists Sprint Align needs on your site."),
        "body": """
<h3 id="1-requirements"><strong>1.1 Requirements</strong></h3>
<ul>
<li>Microsoft 365 with SharePoint Online (on-premises SharePoint Server is not supported).</li>
<li>A modern browser: Microsoft Edge, Google Chrome, Mozilla Firefox, or Safari.</li>
<li>A SharePoint Administrator or Global Administrator to upload the package to the tenant App Catalog.</li>
<li>Site owner permission on the target site to add the app and publish pages.</li>
<li>Recommended: a dedicated site or a Single App Page for immersive estimation sessions.</li>
</ul>
<h3 id="2-deploy"><strong>1.2 Deploy the App (Tenant Administrator)</strong></h3>
<ul>
<li>Obtain the production package (<code>sprint-align.sppkg</code>) from Chronodat or your release pipeline.</li>
<li>Open the <strong>SharePoint Admin Center &rarr; More features &rarr; Apps &rarr; App Catalog</strong> and upload the <code>.sppkg</code> file.</li>
<li>When prompted, choose to <strong>deploy</strong> the package and make it available to all sites.</li>
<li>Approve the requested Microsoft Graph permissions if you plan to use optional profile photos or presence.</li>
</ul>
<h3 id="3-add-app"><strong>1.3 Add Sprint Align to a Page (Site Owner)</strong></h3>
<ul>
<li>On your target site, create a <strong>Single App Page</strong> (recommended) or edit a modern SharePoint page.</li>
<li>Add the <strong>Sprint Align</strong> web part to the page.</li>
<li>Publish the page. Team members open the app from that SharePoint URL, or from a Microsoft Teams tab that points to it.</li>
</ul>
<h3 id="4-first-time-setup"><strong>1.4 First-Time Setup</strong></h3>
<p>The first time the app runs, if the required SharePoint lists have not been
provisioned, a <strong>Complete Setup</strong> prompt appears. A site owner runs the setup
wizard once to create the lists Sprint Align uses for sessions, votes, decks, and
settings.</p>
<ul>
<li>Publish the page before running setup &mdash; the wizard does not run while a page is in edit mode.</li>
<li>Click <strong>Complete Setup</strong> and wait until provisioning finishes.</li>
<li>Open <strong>Settings</strong> to set the app name, branding, and who can create sessions.</li>
</ul>
<section class="kb-supplemental">
<h2>Additional App Functionality</h2>
<h3 id="additional-licensing"><strong>Subscription, Trial, and Licensing</strong></h3>
<p>{p} includes a 14-day free trial per site collection. Site owners manage the
subscription from <strong>Settings &rarr; Subscription</strong>. Licensing is per site collection
&mdash; not per user seat &mdash; so everyone on the site can participate.</p>
</section>
""",
    },
    {
        "slug": "application-tour",
        "nav": "2. Application Tour",
        "title": "2. Application Tour",
        "group": "Getting Started",
        "summary": "A quick tour of the home screen, navigation, light/dark mode, and where key actions live.",
        "toc": [
            ("home", "2.1 The Home Screen"),
            ("nav", "2.2 Navigation & Chrome"),
            ("modes", "2.3 Light and Dark Mode"),
        ],
        "figure": ("01-home.png", "The Sprint Align home screen: join a session, create a room, or launch the demo."),
        "body": """
<h3 id="home"><strong>2.1 The Home Screen</strong></h3>
<p>The home screen is the launch pad for estimation. From here you can:</p>
<ul>
<li><strong>Join a session</strong> by entering a six-character code from your facilitator.</li>
<li><strong>Create a room</strong> to start a new estimation session and invite your team.</li>
<li><strong>Launch the demo</strong> to explore planning poker with a mock team and sample backlog &mdash; nothing is saved to SharePoint.</li>
</ul>
<h3 id="nav"><strong>2.2 Navigation &amp; Chrome</strong></h3>
<p>The header shows the app name and quick access to <strong>History</strong> and
<strong>Settings</strong>. In full-page layout, Sprint Align can hide the standard SharePoint
chrome for a focused, workshop-style experience.</p>
<h3 id="modes"><strong>2.3 Light and Dark Mode</strong></h3>
<p>A light/dark toggle sits in the header so each participant can pick the theme
that is easiest on their eyes. The app can also follow the SharePoint or Teams
theme automatically.</p>
""",
    },
    {
        "slug": "home-and-joining",
        "nav": "3. Home & Joining a Session",
        "title": "3. Home & Joining a Session",
        "group": "User Guide",
        "summary": "How participants join a session by code or link, and how identity works with Microsoft 365.",
        "toc": [
            ("join-code", "3.1 Join with a Code"),
            ("join-link", "3.2 Join with a Link"),
            ("identity", "3.3 Identity & Sign-in"),
        ],
        "figure": ("01-home.png", "Enter the six-character session code and choose Join session."),
        "body": """
<h3 id="join-code"><strong>3.1 Join with a Code</strong></h3>
<ul>
<li>Ask your facilitator for the six-character <strong>session code</strong> (for example, <code>ABC123</code>).</li>
<li>On the home screen, type the code into <strong>Session code</strong> and choose <strong>Join session</strong>.</li>
<li>You are taken straight into the live session and appear in the team roster.</li>
</ul>
<h3 id="join-link"><strong>3.2 Join with a Link</strong></h3>
<p>Facilitators can also share a direct link. Opening it takes participants into the
session without typing a code &mdash; ideal for pasting into a Teams meeting chat.</p>
<h3 id="identity"><strong>3.3 Identity &amp; Sign-in</strong></h3>
<p>{p} uses your Microsoft 365 identity automatically &mdash; there is no separate
account or password. Your name (and optional profile photo, if enabled) appears to
the facilitator and teammates during the round.</p>
""",
    },
    {
        "slug": "creating-a-session",
        "nav": "4. Creating a Session",
        "title": "4. Creating a Session",
        "group": "User Guide",
        "summary": "Facilitator steps to create a room, choose a deck, add backlog items, and invite the team.",
        "toc": [
            ("create", "4.1 Create a Room"),
            ("deck", "4.2 Choose a Deck & Vote Type"),
            ("items", "4.3 Add Backlog Items"),
            ("invite", "4.4 Invite the Team"),
        ],
        "figure": ("01-home.png", "Create a room, pick a voting style, add items, and invite your team."),
        "body": """
<h3 id="create"><strong>4.1 Create a Room</strong></h3>
<ul>
<li>On the home screen, choose <strong>Create session</strong>.</li>
<li>Give the session a name (for example, <em>Sprint 42 Planning</em>).</li>
</ul>
<h3 id="deck"><strong>4.2 Choose a Deck &amp; Vote Type</strong></h3>
<p>Pick the estimation style that fits the discussion:</p>
<ul>
<li><strong>Planning poker</strong> with a Fibonacci or custom deck for story points.</li>
<li><strong>Confidence (1&ndash;5)</strong> or <strong>fist-of-five</strong> for quick alignment checks.</li>
<li><strong>Roman vote</strong> (thumbs up/down), <strong>dot voting</strong>, or a <strong>quick survey</strong> for prioritization.</li>
</ul>
<h3 id="items"><strong>4.3 Add Backlog Items</strong></h3>
<p>Add the stories or items you want to estimate. You can add them manually, or
&mdash; if enabled by your administrator &mdash; import them from Azure DevOps.</p>
<h3 id="invite"><strong>4.4 Invite the Team</strong></h3>
<p>Share the six-character join code, the direct link, or a QR code. Participants
join from web or mobile, in SharePoint or Microsoft Teams &mdash; no install required.</p>
""",
    },
    {
        "slug": "voting-and-participation",
        "nav": "5. Voting & Participation",
        "title": "5. Voting & Participation",
        "group": "User Guide",
        "summary": "How rounds work: private voting, live participation status, and the facilitator's controls.",
        "toc": [
            ("cast", "5.1 Cast Your Vote"),
            ("privacy", "5.2 Votes Stay Private"),
            ("status", "5.3 Live Participation"),
            ("controls", "5.4 Facilitator Controls"),
        ],
        "figure": ("02-voting.png", "Each participant votes privately; the facilitator tracks live participation."),
        "body": """
<h3 id="cast"><strong>5.1 Cast Your Vote</strong></h3>
<ul>
<li>Select a card from the deck for the current backlog item.</li>
<li>You can change your selection any time before the facilitator reveals the round.</li>
<li>Number keys provide a quick shortcut for common card values.</li>
</ul>
<h3 id="privacy"><strong>5.2 Votes Stay Private</strong></h3>
<p>Your selection is hidden from everyone until the facilitator reveals the round.
This keeps estimates honest and avoids anchoring bias.</p>
<h3 id="status"><strong>5.3 Live Participation</strong></h3>
<p>The team roster shows who has voted with a live &ldquo;voted&rdquo; indicator &mdash; without
showing the values &mdash; so the facilitator knows when everyone is ready.</p>
<h3 id="controls"><strong>5.4 Facilitator Controls</strong></h3>
<ul>
<li><strong>Reveal</strong> the current round when everyone has voted.</li>
<li><strong>Re-vote</strong> to run the item again after discussion.</li>
<li><strong>Skip</strong> or move between items with previous / next navigation.</li>
<li><strong>Spectator mode</strong> lets observers watch without voting.</li>
</ul>
""",
    },
    {
        "slug": "reveal-and-results",
        "nav": "6. Reveal & Results",
        "title": "6. Reveal & Results",
        "group": "User Guide",
        "summary": "Revealing votes, reading the spread and outliers, and saving the agreed final estimate.",
        "toc": [
            ("reveal", "6.1 Reveal the Round"),
            ("read", "6.2 Read the Results"),
            ("agree", "6.3 Agree & Save the Estimate"),
        ],
        "figure": ("03-results.png", "Round results show average, median, range, and outliers to guide the discussion."),
        "body": """
<h3 id="reveal"><strong>6.1 Reveal the Round</strong></h3>
<p>When everyone has voted, the facilitator selects <strong>Reveal</strong> and all cards flip
at once. Everyone sees the full set of estimates together.</p>
<h3 id="read"><strong>6.2 Read the Results</strong></h3>
<ul>
<li><strong>Average</strong>, <strong>median</strong>, and <strong>range</strong> summarize the round at a glance.</li>
<li><strong>Outliers</strong> (the highest and lowest votes) are flagged so the team can discuss the &ldquo;why&rdquo; behind them.</li>
</ul>
<h3 id="agree"><strong>6.3 Agree &amp; Save the Estimate</strong></h3>
<ul>
<li>Discuss outliers, re-vote if needed, then pick a card as the <strong>final estimate</strong>.</li>
<li>Choose <strong>Save and next</strong> to record the agreed value and move to the next item.</li>
<li>Saved estimates are stored with the session and available later in <strong>History</strong>.</li>
</ul>
""",
    },
    {
        "slug": "backlog-and-decks",
        "nav": "7. Decks & Backlog",
        "title": "7. Decks & Backlog",
        "group": "User Guide",
        "summary": "Building custom card decks and importing backlog items into a session.",
        "toc": [
            ("decks", "7.1 Custom Decks"),
            ("editor", "7.2 The Deck Editor"),
            ("backlog", "7.3 Backlog Import"),
        ],
        "figure": ("11-deck-editor.png", "Create and edit site-level decks in the deck editor."),
        "body": """
<h3 id="decks"><strong>7.1 Custom Decks</strong></h3>
<p>Beyond the built-in Fibonacci and T-shirt decks, you can create site-level decks
that match how your team estimates &mdash; custom values, labels, and ordering.</p>
<h3 id="editor"><strong>7.2 The Deck Editor</strong></h3>
<ul>
<li>Open the <strong>Deck Editor</strong> from Settings or the session setup.</li>
<li>Add, rename, reorder, or remove cards.</li>
<li>Save the deck so it is available to facilitators when they create sessions.</li>
</ul>
<h3 id="backlog"><strong>7.3 Backlog Import</strong></h3>
<p>Add items manually, or &mdash; when the feature flag is enabled by your administrator &mdash;
import work items from <strong>Azure DevOps</strong> and optionally write agreed story points
back after the session.</p>
""",
    },
    {
        "slug": "history-and-export",
        "nav": "8. History & Export",
        "title": "8. History & Export",
        "group": "User Guide",
        "summary": "Reviewing past sessions, reading the velocity-by-tag chart, and exporting results to CSV.",
        "toc": [
            ("history", "8.1 Session History"),
            ("velocity", "8.2 Velocity by Sprint Tag"),
            ("export", "8.3 Export to CSV"),
        ],
        "figure": ("12-history.png", "The History page lists past sessions and visualizes velocity by sprint tag."),
        "body": """
<h3 id="history"><strong>8.1 Session History</strong></h3>
<p>The <strong>History</strong> page lists ended sessions with their items and agreed
estimates, so you can revisit decisions and reporting at any time.</p>
<h3 id="velocity"><strong>8.2 Velocity by Sprint Tag</strong></h3>
<p>Tag sessions by sprint to see the <strong>velocity by sprint tag</strong> chart &mdash; a quick
view of how much the team estimated across recent sprints.</p>
<h3 id="export"><strong>8.3 Export to CSV</strong></h3>
<p>Download session results as a <strong>CSV</strong> file for reporting, velocity tracking, or
importing into other tools. All data comes from the SharePoint lists on your site.</p>
""",
    },
    {
        "slug": "settings-administration",
        "nav": "9. Settings & Administration",
        "title": "9. Settings & Administration",
        "group": "Administration",
        "summary": "The unified Settings hub: setup, governance, branding, home page, layout, subscription, and advanced options.",
        "toc": [
            ("setup", "9.1 Setup"),
            ("governance", "9.2 Governance"),
            ("branding", "9.3 Branding"),
            ("home-page", "9.4 Home Page"),
            ("layout", "9.5 Layout"),
            ("advanced", "9.6 Advanced"),
        ],
        "figure": ("06-branding.png", "Branding tab: set brand colors and appearance; changes preview live and apply on save."),
        "body": """
<p>{p} centralizes configuration in a single <strong>Settings</strong> hub, organized into
tabs. Site owners and app administrators use these to provision, brand, and govern
the app for the whole site.</p>
<h3 id="setup"><strong>9.1 Setup</strong></h3>
<p>Provision the required SharePoint lists and confirm the app is ready. If setup is
incomplete, a banner guides you through it.</p>
<h3 id="governance"><strong>9.2 Governance</strong></h3>
<ul>
<li>Control <strong>who can create sessions</strong> on the site.</li>
<li>Set <strong>data retention</strong> for ended sessions.</li>
<li>Manage site-level defaults for a consistent experience.</li>
</ul>
<h3 id="branding"><strong>9.3 Branding</strong></h3>
<ul>
<li>Set <strong>primary</strong>, <strong>primary dark</strong>, and <strong>accent</strong> brand colors.</li>
<li>Choose a color mode (auto to match SharePoint/Teams, or force light/dark).</li>
<li>Changes preview live and apply after you save.</li>
</ul>
<h3 id="home-page"><strong>9.4 Home Page</strong></h3>
<p>Edit the home-page hero text and calls to action so the landing screen speaks to
your team.</p>
<h3 id="layout"><strong>9.5 Layout</strong></h3>
<p>Configure the full-page immersive layout, including scroll behavior and hiding
SharePoint chrome for workshop-style sessions.</p>
<h3 id="advanced"><strong>9.6 Advanced</strong></h3>
<p>Toggle optional integrations (feature flags) such as Microsoft Graph profile
photos, presence indicators, and Azure DevOps backlog import &mdash; all off by default
so core estimation never requires data to leave SharePoint.</p>
""",
    },
    {
        "slug": "subscription-and-licensing",
        "nav": "10. Subscription & Licensing",
        "title": "10. Subscription & Licensing",
        "group": "Administration",
        "summary": "The free trial, per-site-collection licensing, and managing the subscription.",
        "toc": [
            ("trial", "10.1 Free Trial"),
            ("model", "10.2 Licensing Model"),
            ("manage", "10.3 Manage the Subscription"),
        ],
        "figure": ("09-subscription.png", "Manage the trial and subscription from Settings → Subscription."),
        "body": """
<h3 id="trial"><strong>10.1 Free Trial</strong></h3>
<p>{p} includes a <strong>14-day free trial</strong> per site collection so your team can
evaluate the full experience before subscribing.</p>
<h3 id="model"><strong>10.2 Licensing Model</strong></h3>
<p>Licensing is <strong>per site collection</strong>, not per user seat. Once a site is
licensed, everyone on that site can participate in sessions.</p>
<h3 id="manage"><strong>10.3 Manage the Subscription</strong></h3>
<ul>
<li>Open <strong>Settings &rarr; Subscription</strong> to view trial status and days remaining.</li>
<li>Subscribe to keep using {p} after the trial ends.</li>
<li>Contact <a href="mailto:support@chronodat.com">support@chronodat.com</a> for licensing questions.</li>
</ul>
""",
    },
    {
        "slug": "end-to-end-workflows",
        "nav": "11. End-to-End Workflows",
        "title": "11. End-to-End Workflows",
        "group": "Administration",
        "summary": "Step-by-step flows for facilitators and team members, from setup through agreed estimates.",
        "toc": [
            ("facilitator", "11.1 Facilitator: Run a Session"),
            ("member", "11.2 Team Member: Join & Vote"),
            ("admin", "11.3 Administrator: Deploy & Govern"),
        ],
        "figure": ("../infographics/sprint-align-how-it-works.png", "The end-to-end flow: set up, join, vote privately, reveal together, discuss and agree."),
        "body": """
<h3 id="facilitator"><strong>11.1 Facilitator: Run a Session</strong></h3>
<ol>
<li>Create a room and name the session.</li>
<li>Pick a deck / vote type and add backlog items.</li>
<li>Share the six-character code (or link) with the team.</li>
<li>Open each item, wait for votes, then <strong>reveal</strong>.</li>
<li>Discuss outliers, re-vote if needed, pick the final estimate, and <strong>save and next</strong>.</li>
<li>End the session; results are available in <strong>History</strong> and can be exported to CSV.</li>
</ol>
<h3 id="member"><strong>11.2 Team Member: Join &amp; Vote</strong></h3>
<ol>
<li>Enter the six-character code on the home screen (or open the shared link).</li>
<li>Select a card for the current item &mdash; your vote stays private until reveal.</li>
<li>Discuss after the reveal and re-vote if the facilitator reopens the round.</li>
</ol>
<h3 id="admin"><strong>11.3 Administrator: Deploy &amp; Govern</strong></h3>
<ol>
<li>Upload the package to the tenant App Catalog and deploy it.</li>
<li>Add Sprint Align to a page on the target site and publish.</li>
<li>Run first-time setup to provision lists.</li>
<li>Configure branding, governance, and layout in Settings.</li>
<li>Manage the subscription per site collection.</li>
</ol>
""",
    },
    {
        "slug": "help-and-troubleshooting",
        "nav": "12. Help & Troubleshooting",
        "title": "12. Help & Troubleshooting",
        "group": "Administration",
        "summary": "Common issues, quick fixes, and how to reach Chronodat support.",
        "toc": [
            ("common", "12.1 Common Issues"),
            ("support", "12.2 Getting Support"),
        ],
        "body": """
<h3 id="common"><strong>12.1 Common Issues</strong></h3>
<ul>
<li><strong>Setup banner will not run</strong> &mdash; make sure the page is <em>published</em>, not in edit mode, then click Complete Setup.</li>
<li><strong>App not found when adding the web part</strong> &mdash; confirm the package was deployed in the tenant App Catalog and made available to sites.</li>
<li><strong>Can't join with a code</strong> &mdash; check the code is current and the session has not ended; codes are six characters.</li>
<li><strong>Colors or theme look off</strong> &mdash; check <strong>Settings &rarr; Branding</strong> color mode, or use the header light/dark toggle.</li>
<li><strong>Trial expired</strong> &mdash; open <strong>Settings &rarr; Subscription</strong> to subscribe and restore full access.</li>
</ul>
<h3 id="support"><strong>12.2 Getting Support</strong></h3>
<p>Still stuck? Email <a href="mailto:support@chronodat.com">support@chronodat.com</a> or
visit the <a href="/Contact">Contact</a> page. Include your site URL and a short
description of the issue so we can help quickly.</p>
""",
    },
]

GROUPS = [
    ("Getting Started", "icon-genius", "Deploy the app, complete setup, and tour the workspace."),
    ("User Guide", "icon-documents", "Join sessions, vote, reveal results, build decks, and review history."),
    ("Administration", "icon-gears", "Settings, licensing, end-to-end workflows, and troubleshooting."),
]


def fmt(text: str) -> str:
    return text.replace("{p}", PRODUCT)


def order():
    ordered = []
    for gname, _, _ in GROUPS:
        for t in TOPICS:
            if t["group"] == gname:
                ordered.append(t)
    return ordered


def sidebar(active_slug: str) -> str:
    parts = ['            <nav class="kb-nav">']
    for gname, _, _ in GROUPS:
        parts.append('<div class="kb-nav-group">')
        parts.append(f'<div class="kb-nav-group-title">{gname}</div>')
        parts.append("<ul>")
        for t in TOPICS:
            if t["group"] != gname:
                continue
            cls = ' class="active"' if t["slug"] == active_slug else ""
            parts.append(f'<li><a href="{BASE}/{t["slug"]}"{cls}>{t["nav"]}</a></li>')
        parts.append("</ul></div>")
    parts.append("</nav>")
    return "\n".join(parts)


def build_topic(t: dict, prev: dict | None, nxt: dict | None) -> str:
    head = HEAD.format(
        title=f'{t["title"]} | {PRODUCT} Knowledge Base | Chronodat',
        desc=fmt(t["summary"]),
        canonical=f'{BASE}/{t["slug"]}',
    )
    toc = ""
    if t.get("toc"):
        toc_items = "\n".join(f'<li><a href="#{i}">{lbl}</a></li>' for i, lbl in t["toc"])
        toc = f'<div class="kb-article-toc">\n<h2>On this page</h2>\n<ul>\n{toc_items}\n</ul></div>'
    figure = ""
    if t.get("figure"):
        src, cap = t["figure"]
        if src.startswith("../"):
            path = f"/img/sprint-align/{src[3:]}"
        else:
            path = f"{IMG}/{src}"
        figure = (
            f'<figure class="kb-figure kb-figure-shot">\n'
            f'<img src="{path}" alt="{cap}">\n'
            f'<figcaption>{cap}</figcaption>\n</figure>'
        )
    body = fmt(t["body"]).strip()
    # place figure after first heading block if present
    article = body
    if figure:
        article = body + "\n" + figure

    pager_prev = (
        f'<a class="kb-pager-prev" href="{BASE}/{prev["slug"]}"><span>Previous</span><strong>{prev["nav"]}</strong></a>'
        if prev
        else ""
    )
    pager_next = (
        f'<a class="kb-pager-next" href="{BASE}/{nxt["slug"]}"><span>Next</span><strong>{nxt["nav"]}</strong></a>'
        if nxt
        else ""
    )

    return f"""{head}
<body class="amh-kb amh-kb-article" data-fade-in="true">
    <div class="pre-loader"><div></div></div>
    <nav id="header" class="navbar nav-down" data-fullwidth="true" data-menu-style="dark" data-animation="shrink"></nav>

    <div class="kb-shell">
        <aside class="kb-sidebar">
            <div class="kb-sidebar-head">
                <a href="{BASE}">&larr; Knowledge Base</a>
                <h4>{PRODUCT}</h4>
                <div class="kb-sidebar-search">
                    <input type="search" id="kb-nav-search" placeholder="Filter topics" aria-label="Filter knowledge base topics">
                </div>
            </div>
{sidebar(t["slug"])}
        </aside>
        <main class="kb-main">
            <div class="kb-breadcrumb">
                <a href="/sprint-align">Product</a> /
                <a href="{BASE}">Knowledge Base</a> /
                {t["nav"]}
            </div>
            <h1 class="kb-title">{t["title"]}</h1>
            <p class="kb-meta">User &amp; Administration Guide — Version {VERSION}</p>
            <div class="kb-article-summary">
                <span>Guide summary</span>
                <p>{fmt(t["summary"])}</p>
            </div>
            {toc}
            <article class="kb-body">
                {article}
            </article>
            <nav class="kb-article-pager" aria-label="Knowledge base article pagination">
{pager_prev}
{pager_next}
</nav>
        </main>
    </div>

{FOOTER}
    <script src="/js/init.js"></script>
    <script src="/js/scripts.js"></script>
    <script src="/js/rch-kb.js"></script>
</body>
</html>
"""


def build_index() -> str:
    ordered = order()
    # featured cards
    featured = [
        ("New to the app?", "getting-started", "1. Getting Started", "Deploy and complete first-time setup"),
        ("Run a round", "voting-and-participation", "5. Voting &amp; Participation", "Private votes and facilitator controls"),
        ("Reach consensus", "reveal-and-results", "6. Reveal &amp; Results", "Reveal votes and save the estimate"),
        ("Workflows", "end-to-end-workflows", "11. End-to-End Workflows", "Facilitator, member, and admin flows"),
    ]
    featured_html = "\n".join(
        f'<a class="kb-featured-card" href="{BASE}/{slug}"><span>{eyebrow}</span><strong>{title}</strong><em>{sub}</em></a>'
        for eyebrow, slug, title, sub in featured
    )

    adoption_cards = [
        ("01-home.png", "home-and-joining", "Join a session"),
        ("02-voting.png", "voting-and-participation", "Vote in a round"),
        ("03-results.png", "reveal-and-results", "Reveal & results"),
        ("06-branding.png", "settings-administration", "Brand & govern"),
    ]
    adoption_html = "\n".join(
        f'<a class="kb-adoption-card" href="{BASE}/{slug}"><img src="{IMG}/{img}" alt="{label}"><span>{label}</span></a>'
        for img, slug, label in adoption_cards
    )

    cats = []
    for gname, icon, blurb in GROUPS:
        topics = [t for t in TOPICS if t["group"] == gname]
        lis = []
        for t in topics:
            search = f'{gname} {t["nav"]} {fmt(t["summary"])}'.replace('"', "&quot;")
            lis.append(
                f'<li data-kb-search="{search}"><a href="{BASE}/{t["slug"]}">{t["nav"]}</a></li>'
            )
        cats.append(
            f'<div class="kb-category">\n'
            f'<div class="kb-category-head">\n'
            f'<div class="kb-category-icon"><i class="{icon}"></i></div>\n'
            f'<span>{len(topics)} topics</span>\n</div>\n'
            f'<h3>{gname}</h3>\n<p>{blurb}</p><ul>\n' + "\n".join(lis) + "\n</ul></div>"
        )
    cats_html = "\n".join(cats)

    head = HEAD.format(
        title=f"{PRODUCT} Knowledge Base | Chronodat",
        desc=f"{PRODUCT} user and administration guide for SharePoint and Teams — search topics, getting started, and step-by-step reference for planning poker and agile estimation.",
        canonical=BASE,
    )

    return f"""{head}
<body class="amh-kb" data-fade-in="true">
    <div class="pre-loader"><div></div></div>
    <nav id="header" class="navbar nav-down" data-fullwidth="true" data-menu-style="dark" data-animation="shrink"></nav>

    <section class="kb-hero">
        <div class="container">
            <p class="kb-eyebrow">{PRODUCT} Support</p>
            <h1 class="bold">Knowledge Base for {PRODUCT}</h1>
            <p class="kb-lead">Step-by-step guidance for planning poker sessions, voting, results, decks, SharePoint setup, and administration.</p>
            <div class="kb-search-wrap">
                <input type="search" id="kb-search" placeholder="Search join, vote, reveal, decks, settings..." aria-label="Search knowledge base">
                <i class="icon-magnifying-glass"></i>
            </div>
            <div class="kb-search-chips" aria-label="Popular searches">
                <button type="button" data-kb-query="join session">Join session</button>
                <button type="button" data-kb-query="vote">Voting</button>
                <button type="button" data-kb-query="reveal">Reveal</button>
                <button type="button" data-kb-query="settings">Settings</button>
            </div>
            <div class="kb-hero-links">
                <a href="/sprint-align">&larr; Product page</a>
                <a href="/Contact">Contact support</a>
            </div>
        </div>
    </section>

    <section class="kb-hub">
        <div class="container">
            <div class="kb-overview-card">
                <div class="kb-brand">
                    <img src="{ICON}" alt="{PRODUCT}">
                    <div>
                        <h2>{PRODUCT}</h2>
                        <p>User &amp; Administration Guide &mdash; Version {VERSION}</p>
                    </div>
                </div>
                <div class="kb-support-strip">
                    <span><strong>Platform</strong> SharePoint Online</span>
                    <span><strong>Works in</strong> SharePoint + Teams</span>
                    <span><strong>Need help?</strong> <a href="mailto:support@chronodat.com">support@chronodat.com</a></span>
                </div>
            </div>
            <section class="kb-adoption" aria-label="End-user adoption guides">
<div class="kb-adoption-head">
<h2>Start with these quick visual guides</h2>
<p>End-user infographics built from real app screens — pick a task and follow the steps.</p>
</div>
<div class="kb-adoption-grid">
{adoption_html}
</div>
<div class="kb-adoption-journey">
<a href="{BASE}/end-to-end-workflows"><img src="/img/sprint-align/infographics/sprint-align-how-it-works.png" alt="How Sprint Align works — set up, join, vote privately, reveal together, discuss and agree"></a>
</div></section>
            <div class="kb-featured-topics" aria-label="Featured knowledge base topics">
{featured_html}
</div>
            <div class="kb-categories">
{cats_html}
</div>
            <p class="kb-no-results">No topics matched your search. Try different keywords.</p>
        </div>
    </section>

{FOOTER}
    <script src="/js/init.js"></script>
    <script src="/js/scripts.js"></script>
    <script src="/js/rch-kb.js"></script>
</body>
</html>
"""


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    ordered = order()

    # manifest.json
    manifest = [{"title": t["nav"], "slug": t["slug"]} for t in ordered]
    # about-this-guide first (already first in Getting Started group order)
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("  manifest.json")

    # index
    (OUT / "index.html").write_text(build_index(), encoding="utf-8")
    print("  index.html")

    for i, t in enumerate(ordered):
        prev = ordered[i - 1] if i > 0 else None
        nxt = ordered[i + 1] if i < len(ordered) - 1 else None
        (OUT / f'{t["slug"]}.html').write_text(build_topic(t, prev, nxt), encoding="utf-8")
        print(f'  {t["slug"]}.html')

    print(f"Done -> {OUT}")


if __name__ == "__main__":
    main()
