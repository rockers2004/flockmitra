/**
 * English and Marathi dictionaries for all user-facing text.
 *
 * `en` is the key authority: `TranslationKey` is derived from it, and `mr`
 * must match it exactly (TypeScript rejects missing or extra keys), so the
 * two languages can never drift apart at compile time. Placeholder sets
 * (`{batch}`, `{days}`, …) must also match — enforced by strings.test.ts.
 *
 * Screens must never hardcode user-facing text; always call `t(key)`.
 */
export const en = {
  // Common
  'common.appName': 'FlockMitra',
  'common.tagline': 'Your trusted companion for smarter poultry farming.',
  'common.sampleBadge': 'Sample data',
  'common.sampleNotice': 'Preview only — sample records are not saved or synced.',
  'common.plannedNotice': "This workflow isn't available yet. Nothing was saved.",
  'common.planned': 'Planned',
  'common.stockInvalid':
    "Today's sample movements could not be validated, so the bird count is hidden.",

  // Bottom navigation
  'tabs.home': 'Home',
  'tabs.batches': 'Batches',
  'tabs.reports': 'Reports',
  'tabs.settings': 'Settings',

  // Home
  'home.title': 'Home',
  'home.subtitle': "Today's flock situation",
  'home.currentBirds': 'Current birds',
  'home.fromMovements': "Calculated from today's sample movements",
  'home.opening': 'Opening',
  'home.inflow': 'Added in',
  'home.losses': 'Losses',
  'home.outflow': 'Sold / out',
  'home.needsAttention': 'Needs attention',
  'home.noAlerts': 'Nothing needs attention right now.',
  'home.todayActions': "Today's actions",
  'home.recordReport': 'Record daily report',
  'home.newBatch': 'New batch',
  'home.alertPendingReport': '{batch}: daily report pending',
  'home.alertClosingReady': '{batch}: ready for closing review',

  // Batches
  'batches.title': 'Batches',
  'batches.subtitle': 'Active, closing and completed flocks',
  'batches.newBatch': 'New batch',
  'batches.sectionActive': 'Active',
  'batches.sectionClosing': 'Closing review',
  'batches.sectionCompleted': 'Completed',
  'batches.birdsNoun': 'birds',
  'batches.age': '{days} days',
  'batches.type.broiler': 'Broiler',
  'batches.type.layer': 'Layer',
  'batches.type.desi': 'Desi',
  'batches.status.active': 'Active',
  'batches.status.closingReview': 'Closing review',
  'batches.status.completed': 'Completed',
  'batches.readOnly': 'Read-only',
  'batches.action.record': 'Record report',
  'batches.action.review': 'Review closure',
  'batches.action.summary': 'View summary',

  // Reports
  'reports.title': 'Reports',
  'reports.intro':
    'Reports will appear here once daily entry and batch closure are implemented.',
  'reports.daily': 'Daily report',
  'reports.dailyDesc': 'One day of movements, mortality, feed and observations for a batch.',
  'reports.summary': 'Batch summary',
  'reports.summaryDesc': 'Lifecycle totals: birds, mortality, feed, revenue and profit/loss.',
  'reports.plannedNote': 'Nothing has been recorded yet.',

  // Settings
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.languageNote':
    'Changes apply immediately. This choice is not saved after the app restarts.',
  'settings.langEn': 'English',
  'settings.langMr': 'मराठी',
  'settings.farm': 'Farm',
  'settings.about': 'About',
  'settings.version': 'Version',
  'settings.notEnabled': 'Accounts, cloud sync and AI are not enabled in this build.',
} as const;

export type TranslationKey = keyof typeof en;

export const mr: Readonly<Record<TranslationKey, string>> = {
  // Common
  'common.appName': 'FlockMitra',
  'common.tagline': 'स्मार्ट पोल्ट्री शेतीसाठी तुमचा विश्वसनीय सोबती.',
  'common.sampleBadge': 'नमुना डेटा',
  'common.sampleNotice': 'केवळ पूर्वावलोकन — नमुना रेकॉर्ड जतन किंवा सिंक केले जात नाहीत.',
  'common.plannedNotice': 'हा कार्यप्रवाह अद्याप उपलब्ध नाही. काहीही जतन केले नाही.',
  'common.planned': 'नियोजित',
  'common.stockInvalid':
    'आजच्या नमुना हालचाली पडताळणीत येत नाहीत, त्यामुळे पक्षी संख्या लपवली आहे.',

  // Bottom navigation
  'tabs.home': 'होम',
  'tabs.batches': 'बॅचेस',
  'tabs.reports': 'अहवाल',
  'tabs.settings': 'सेटिंग्ज',

  // Home
  'home.title': 'होम',
  'home.subtitle': 'आजच्या गटाची स्थिती',
  'home.currentBirds': 'सध्याची पक्षी संख्या',
  'home.fromMovements': 'आजच्या नमुना हालचालींवरून मोजलेली',
  'home.opening': 'सुरुवातीची',
  'home.inflow': 'जोडलेली',
  'home.losses': 'नुकसान',
  'home.outflow': 'विक्री / बाहेर',
  'home.needsAttention': 'लक्ष देणे आवश्यक',
  'home.noAlerts': 'सध्या काही लक्ष देण्यासारखे नाही.',
  'home.todayActions': 'आजच्या कृती',
  'home.recordReport': 'दैनिक अहवाल नोंदवा',
  'home.newBatch': 'नवीन बॅच',
  'home.alertPendingReport': '{batch}: दैनिक अहवाल बाकी',
  'home.alertClosingReady': '{batch}: बंद करण्यासाठी तयार',

  // Batches
  'batches.title': 'बॅचेस',
  'batches.subtitle': 'सक्रिय, बंद होत असलेले व पूर्ण झालेले गट',
  'batches.newBatch': 'नवीन बॅच',
  'batches.sectionActive': 'सक्रिय',
  'batches.sectionClosing': 'बंद करण्यास तयार',
  'batches.sectionCompleted': 'पूर्ण',
  'batches.birdsNoun': 'पक्षी',
  'batches.age': '{days} दिवस',
  'batches.type.broiler': 'ब्रॉयलर',
  'batches.type.layer': 'लेयर',
  'batches.type.desi': 'देशी',
  'batches.status.active': 'सक्रिय',
  'batches.status.closingReview': 'बंद करण्यास तयार',
  'batches.status.completed': 'पूर्ण',
  'batches.readOnly': 'केवळ वाचनीय',
  'batches.action.record': 'अहवाल नोंदवा',
  'batches.action.review': 'बंदी पुनरावलोकन',
  'batches.action.summary': 'सारांश पहा',

  // Reports
  'reports.title': 'अहवाल',
  'reports.intro': 'दैनिक नोंद व बॅच समाप्ती लागू झाल्यावर अहवाल येथे दिसतील.',
  'reports.daily': 'दैनिक अहवाल',
  'reports.dailyDesc': 'बॅचसाठी एकादिवसाच्या हालचाली, मृत्यू, चारा व निरीक्षणे.',
  'reports.summary': 'बॅच सारांश',
  'reports.summaryDesc': 'टप्प्याचे बेरीज: पक्षी, मृत्यू, चारा, महसूल व नफा/तोटा.',
  'reports.plannedNote': 'अद्याप काहीही नोंदवले नाही.',

  // Settings
  'settings.title': 'सेटिंग्ज',
  'settings.language': 'भाषा',
  'settings.languageNote': 'बदल लगेच लागू होतात. ही निवड अ‍ॅप पुन्हा सुरू झाल्यावर जतन होत नाही.',
  'settings.langEn': 'English',
  'settings.langMr': 'मराठी',
  'settings.farm': 'शेत',
  'settings.about': 'बद्दल',
  'settings.version': 'आवृत्ती',
  'settings.notEnabled': 'या बिल्डमध्ये खाती, क्लाउड सिंक व AI सुरू केलेले नाहीत.',
};

export type Language = 'en' | 'mr';

export const dictionaries: Readonly<Record<Language, Readonly<Record<TranslationKey, string>>>> = {
  en,
  mr,
};

export const LANGUAGES: readonly Language[] = ['en', 'mr'];
