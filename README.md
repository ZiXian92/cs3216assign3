# TL;DR

**URL:** tldr.sshz.org

### Contributors:
| Matric No. | Name | Contributions |
| ---------- | ---- | ------------- |
| A0119416H | Huang Yue | Server-side development, UI fixes |
| A0099429L | Nguyen Tan Sy Nguyen | Crawler and content parsing |
| A0102147W | Gan Mei Lan | UI design and wireframes, Logo and splash screen design, UI and UX critique |
| A0110781N | Qua Zi Xian | Front-end developer |

### Known Problems

* If the app is started offline, Facebook features may not be able to work as its SDK cannot be properly loaded.
* Splash screen does not support Android devices, as there is no documentation of how this can be done. Furthermore, Android devices are too fragmented and we are not able to provide resources for all resolutions.
* Splash screen does not work on iOS 9. This is an iOS 9 problem.
* After Facebook login or sharing, iOS users (using 'native app' mode) may see a blank screen. This is because Facebook's redirect pages do not work outside Safari. They can close and reopen the app and their login status will be kept (they will be logged in if it is during a login redirect).
* On iOS devices, if the app is started offline and the user accessed a feed page after accessing his or her bookmarks, the app may show a blank screen. This is a Safari bug where contents are loaded but not rendered properly.
