# CCNA (200-301 v1.1) content review

Reviewed in October 2026 against the v1.1 outline. Every item was read; arithmetic (subnetting, VLSM, wildcards, EUI-64, solicited-node, OSPF cost, STP cost, routing-table lookups) was redone in Python and all keys were right.

## Counts
| Type | Read | Changed |
|---|---|---|
| Flashcards | 233 | 18 |
| Questions | 201 (121 mc, 30 ms, 50 tf) | 2 |
| Mad libs | 10 | 1 |
| Sequences | 8 | 0 |
| Compare pairs | 16 | 0 |
| Case studies | 4 (15 questions) | 1 question |
| Lessons | 14 | 1 (one sentence) |
| Cheat sheet | 14 sections | 0 |
| IOS CLI challenges | 45 | 9 |

Items changed in total: 32. Flagged for a human check: 5 groups (below). No item was removed, no id or category was changed.

## Changed
- f12 | said "the exam outline still uses the older DNA Center name"; the v1.1 outline only says "Controllers" (1.1.e) and dropped the DNA Center comparison (old 6.4), so the claim was wrong or at best unverifiable | now "Older study material still calls it Cisco DNA Center." (https://lostintransit.se/2024/04/23/ccna-200-301-updated-to-version-1-1/ for the v1.0 to v1.1 changes; https://learningcontent.cisco.com/documents/200-301-CCNA-v1.0.pdf for the old wording)
- lesson ccna-models-devices-cabling | same claim "(the exam still says DNA Center)" | "(formerly Cisco DNA Center)"
- f31 | "The wildcard for ... is" left the term readable in the blanked prompt | "For the mask 255.255.255.192 it is 0.0.0.63."
- f43 | near-duplicate of f1114 (WEP/TKIP/AES-CCMP/SAE/PMF listed in both) | rescoped to the ciphers only: front "Wi-Fi encryption ciphers", RC4 (WEP, TKIP) versus AES-CCMP (WPA2, kept by WPA3)
- f85 | bracket "(console, SSH, Telnet, HTTPS)" made the blanks SSH and HTTPS while the term asked for is the topic | front "Device management access methods", no blanks
- f86 | near-duplicate of f1101 (TACACS+ vs RADIUS) | rescoped to central logins for managing switches, APs and WLCs; front "TACACS+ and RADIUS for management access"; protocol comparison stays on f1101
- f87 | overlapped f1115 and repeated the WPA3 sentence of f1114 | now the three WLAN choices (open, Personal, Enterprise); WPA3 sentence dropped
- f93 | front "Switch port security basics" suggested the port-security feature (f1110) but the card is about hardening unused and edge ports | front "Access-edge port hardening"
- f1006 | defined the gateway of last resort as "the default route" (that is f1007's term) | "The fallback next hop ... learned from a default route and shown in show ip route as 'Gateway of last resort is ...'"
- f1025 | "which must be area 0": single-area OSPF works in any area, area 0 is the convention | "should be area 0"
- f1032 | blanked prompt had five identical blanks ("elects a _____ ... if the _____ fails ... only to the _____ and _____") | reworded to one blank each: "... a BDR to take over if it fails. ... send their updates only to those two"
- f1039 | repeated word "passive-interface interface" and the hyphenated command left the term readable | definition describes the setting; the command syntax moved to the example
- f1041 | bracket "(OSPF)" blanked the word OSPF in the prompt ("An _____ router-mode command ... other _____ routers") | front "OSPF default-information originate"
- f1051 | "Preemption lets ..." left the term readable | "A setting that lets a router with a higher priority ..."
- f1069 | bracket of six record names produced five blanks (the answer asked for is "DNS record types") | front "DNS record types"
- f1072 | "Stratum 0 ... stratum 1 ... Stratum 16" repeated the term | "Level 0 ... level 1 ... A level of 16 means unsynchronized."
- f1102 | "wired port security" is easily confused with the port-security feature | "wired switch-port access control"
- f1108 | near-duplicate of f31 (identical definition of a wildcard mask) | rescoped to ACL entries: host and any shortcuts and common ranges (/24, /26, /27)
- f1114 | bracket "(WEP, WPA, WPA2, WPA3)" produced four identical blanks | front "Wireless security protocols"
- q1044 | same idea and key as q17 (/27 mask gives wildcard 0.0.0.31) | now 192.168.10.64/26, key 0.0.0.63, distractors 0.0.0.31 / 0.0.0.127 / 0.0.0.64, explanation rewritten
- q1055 | same scenario and key as q45 (TACACS+ for per-command control) | now asks which AAA function limits a junior engineer to show commands: authorization (options and explanation rewritten)
- ml-ccna-101 | "Four routers share one Ethernet segment" but only two are described | "Two routers"
- cs-ccna-clinic-edge-q2 | correct option far longer and more detailed than the rest | "DHCP snooping, with the uplink to the real server trusted"
- cli-ios-1 | altCommands accepted plain "show vlan", which is not the brief output asked for | removed
- cli-ios-6 | "allowed vlan 20,10" (same list, other order) was marked wrong | added as an alternate
- cli-ios-109, cli-ios-110 | "sh ip ospf neighbor", "show ip ospf nei", "sh ip route ospf" were marked wrong because the verb check needs the full verb | added the abbreviations as alternates
- cli-ios-111 | required flag '0' also matched priority 10 or 100 | flag 'priority 0'
- cli-ios-112 | flag '10' matched inside 10.10.10.1, so "standby ip 10.10.10.1" (group 0) passed | flag '10 ip'
- cli-ios-122 | duplicate of cli-ios-16 (transport input ssh in vty line mode) | now tests login local (vty lines check the local user accounts); prompt, verb, flag and explanation rewritten
- cli-ios-123 | the port was not required, so "deny tcp ... host 192.168.5.10" (all TCP) passed | flag 'host 192.168.5.10 eq'
- cli-ios-124 | flag 'in' is too loose | flag '101 in'

All 45 canonical commands and every alternate were run through checkCliAnswer after the edits and are accepted as exact. Canonical commands are valid IOS in the stated mode; the other alternates are real equivalents or abbreviations.

## Needs a human check
- Cheat sheet, section "What changes in CCNA v2.0 (from February 3, 2027)" | the first v2.0 date (3 Feb 2027) is confirmed by Cisco Press (https://www.ciscopress.com/promotions/new-cisco-certifications-142035), but the five v2.0 domain names and weights and the statements on what v2.0 drops (Automation domain, REST, JSON, Terraform) come from third-party summaries that disagree with each other (one table sums to 115 percent) | left, because the text already says "reported" and "unconfirmed"; check against the Cisco Learning Network v2.0 topics. The exam-day facts (about 100 to 120 questions, passing score near 825) are also third-party reports, hedged in the text.
- f84, q47, lesson ccna-wireless-architectures-management, cheat sheet bullet on the WLC LAG | "static EtherChannel (mode on), not LACP or PAgP" is true for AireOS WLCs and is what the exam teaches; I could not confirm it for the Catalyst 9800 controller, which may accept LACP | left as the exam answer; q47 could be ambiguous if the learner thinks of a 9800.
- f112, f103, q57, q53, msq15, cmp-ccna-8 | the v1.1 outline dropped Puppet and Chef (6.6 is now "such as Ansible and Terraform") and the DNA Center comparison (old 6.4 became AI and machine learning); these items are still accurate background | left; the owner may prefer to trim them.
- Coverage: v1.1 added 2.5.d (root guard, loop guard, BPDU filter, BPDU guard) to Rapid PVST+, but only BPDU Guard (f74) has a card; there is no question on root guard, loop guard or BPDU filter | cannot add items.
- TACACS+ versus RADIUS is tested by q45, cmp-ccna-106, msq1012, tf20 and f1101 (same point, different formats); also q26 and cs-ccna-harbor-dental-q2 (allowed vlan add) and q1020 and tf1008 (passive interface still advertises the subnet) | left as different formats; I only rescoped f86 and q1055.

## Patterns
The track was accurate: no answer key was wrong, every calculation checked out, and the lessons and cheat sheet had no factual errors beyond the DNA Center remark. Most problems came from the two authoring parts overlapping (wildcard masks, TACACS+ versus RADIUS, WPA generations, the /27 wildcard question, vty SSH in two CLI challenges). The new definition-first prompts also exposed fronts whose brackets list acronyms (f85, f1041, f1069, f1114), which blank the wrong words in the prompt. The CLI checker data had a few loose required flags ('0', '10', 'in') and missing abbreviations, now tightened. Overall quality is good and little needed to change.
