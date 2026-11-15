import { applicationDefault, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import isoCountries from "i18n-iso-countries";
import japaneseLocale from "i18n-iso-countries/langs/ja.json";

isoCountries.registerLocale(japaneseLocale);

const databaseURL =
	process.env.FIREBASE_DATABASE_URL ??
	"https://my-ticket-app-5b992-default-rtdb.firebaseio.com/";
const sourceCacheDuration = 24 * 60 * 60 * 1000;
const nonCountryRegions = new Set(["AQ", "BV", "CC", "CX", "HM", "GS", "TF", "UM"]);
const obsoleteRssSourceIds = new Set(["tolo-news-rss"]);
const countriesWithFeedFallback = new Set(["fm"]);

export type NewsSource = {
	id: string;
	name: string;
	description?: string;
	url: string;
	rssUrl?: string;
	feedFormat?: "rss" | "wordpress-json";
	category: string;
	language: string;
	country: string;
};

export type CountryOption = {
	code: string;
	name: string;
};

const officialRssSources: NewsSource[] = [
	{ id: "yonhap-rss", name: "Yonhap News Agency", url: "https://yna.co.kr", rssUrl: "https://yna.co.kr/rss/news.xml", category: "general", language: "ko", country: "kr" },
	{ id: "scmp-rss", name: "South China Morning Post", url: "https://www.scmp.com", rssUrl: "https://www.scmp.com/rss/91/feed", category: "general", language: "en", country: "hk" },
	{ id: "cna-rss", name: "CNA", url: "https://www.channelnewsasia.com", rssUrl: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml", category: "general", language: "en", country: "sg" },
	{ id: "antara-rss", name: "ANTARA News", url: "https://en.antaranews.com", rssUrl: "https://en.antaranews.com/rss/news.xml", category: "general", language: "en", country: "id" },
	{ id: "bangkok-post-rss", name: "Bangkok Post", url: "https://www.bangkokpost.com", rssUrl: "https://www.bangkokpost.com/rss/data/topstories.xml", category: "general", language: "en", country: "th" },
	{ id: "vnexpress-rss", name: "VnExpress International", url: "https://vnexpress.net", rssUrl: "https://vnexpress.net/rss/tin-moi-nhat.rss", category: "general", language: "vi", country: "vn" },
	{ id: "inquirer-rss", name: "Philippine Daily Inquirer", url: "https://newsinfo.inquirer.net", rssUrl: "https://newsinfo.inquirer.net/feed", category: "general", language: "en", country: "ph" },
	{ id: "notes-from-poland-rss", name: "Notes from Poland", url: "https://notesfrompoland.com", rssUrl: "https://notesfrompoland.com/feed", category: "general", language: "en", country: "pl" },
	{ id: "orf-rss", name: "ORF.at", url: "https://orf.at", rssUrl: "https://rss.orf.at/news.xml", category: "general", language: "de", country: "at" },
	{ id: "dr-rss", name: "DR Nyheder", url: "https://www.dr.dk", rssUrl: "https://www.dr.dk/nyheder/service/feeds/allenyheder", category: "general", language: "da", country: "dk" },
	{ id: "yle-rss", name: "Yle News", url: "https://yle.fi", rssUrl: "https://yle.fi/uutiset/rss/uutiset.rss", category: "general", language: "fi", country: "fi" },
	{ id: "rtp-rss", name: "RTP Notícias", url: "https://www.rtp.pt", rssUrl: "https://www.rtp.pt/noticias/rss", category: "general", language: "pt", country: "pt" },
	{ id: "daily-news-hungary-rss", name: "Daily News Hungary", url: "https://dailynewshungary.com", rssUrl: "https://dailynewshungary.com/feed", category: "general", language: "en", country: "hu" },
	{ id: "romania-insider-rss", name: "Romania Insider", url: "https://www.romania-insider.com", rssUrl: "https://www.romania-insider.com/feed", category: "general", language: "en", country: "ro" },
	{ id: "ukrinform-rss", name: "Ukrinform", url: "https://www.ukrinform.net", rssUrl: "https://www.ukrinform.net/rss/block-lastnews", category: "general", language: "en", country: "ua" },
	{ id: "times-of-israel-rss", name: "The Times of Israel", url: "https://www.timesofisrael.com", rssUrl: "https://www.timesofisrael.com/feed/", category: "general", language: "en", country: "il" },
	{ id: "al-jazeera-rss", name: "Al Jazeera English", url: "https://www.aljazeera.com", rssUrl: "https://www.aljazeera.com/xml/rss/all.xml", category: "general", language: "en", country: "qa" },
	{ id: "daily-star-bd-rss", name: "The Daily Star", url: "https://www.thedailystar.net", rssUrl: "https://www.thedailystar.net/frontpage/rss.xml", category: "general", language: "en", country: "bd" },
	{ id: "punch-rss", name: "Punch Newspapers", url: "https://punchng.com", rssUrl: "https://punchng.com/feed", category: "general", language: "en", country: "ng" },
	{ id: "egypt-independent-rss", name: "Egypt Independent", url: "https://www.egyptindependent.com", rssUrl: "https://www.egyptindependent.com/feed/", category: "general", language: "en", country: "eg" },
	{ id: "nation-africa-rss", name: "Daily Nation", url: "https://nation.africa", rssUrl: "https://nation.africa/kenya/rss.xml", category: "general", language: "en", country: "ke" },
	{ id: "err-news-rss", name: "ERR News", url: "https://news.err.ee", rssUrl: "https://news.err.ee/rss", category: "general", language: "en", country: "ee" },
	{ id: "lsm-rss", name: "LSM.lv", url: "https://eng.lsm.lv", rssUrl: "https://eng.lsm.lv/rss/", category: "general", language: "en", country: "lv" },
	{ id: "24kg-rss", name: "24.kg", url: "https://24.kg", rssUrl: "https://24.kg/rss/", category: "general", language: "ru", country: "kg" },
	{ id: "slovak-spectator-rss", name: "The Slovak Spectator", url: "https://spectator.sme.sk", rssUrl: "https://spectator.sme.sk/rss", category: "general", language: "en", country: "sk" },
	{ id: "kun-uz-rss", name: "Kun.uz", url: "https://kun.uz/en", rssUrl: "https://kun.uz/en/news/rss", category: "general", language: "en", country: "uz" },
	{ id: "koha-rss", name: "Koha.net", url: "https://www.koha.net", rssUrl: "https://www.koha.net/rss", category: "general", language: "sq", country: "xk" },
	{ id: "klix-rss", name: "Klix.ba", url: "https://www.klix.ba", rssUrl: "https://www.klix.ba/rss", category: "general", language: "bs", country: "ba" },
	{ id: "n1-serbia-rss", name: "N1 Info", url: "https://n1info.rs", rssUrl: "https://n1info.rs/feed", category: "general", language: "sr", country: "rs" },
	{ id: "vijesti-rss", name: "Vijesti", url: "https://www.vijesti.me", rssUrl: "https://www.vijesti.me/rss", category: "general", language: "sr", country: "me" },
	{ id: "cyprus-mail-rss", name: "Cyprus Mail", url: "https://cyprus-mail.com", rssUrl: "https://cyprus-mail.com/feed", category: "general", language: "en", country: "cy" },
	{ id: "asia-plus-rss", name: "Asia-Plus", url: "https://asiaplustj.info", rssUrl: "https://asiaplustj.info/en/rss", category: "general", language: "en", country: "tj" },
	{ id: "mia-rss", name: "MIA", url: "https://mia.mk", rssUrl: "https://mia.mk/feed", category: "general", language: "en", country: "mk" },
	{ id: "stuff-rss", name: "Stuff", url: "https://www.stuff.co.nz", rssUrl: "https://www.stuff.co.nz/rss", category: "general", language: "en", country: "nz" },
	{ id: "srf-rss", name: "SRF News", url: "https://www.srf.ch", rssUrl: "https://www.srf.ch/news/bnf/rss/1646", category: "general", language: "de", country: "ch" },
	{ id: "tovima-rss", name: "To Vima", url: "https://www.tovima.com", rssUrl: "https://www.tovima.com/feed", category: "general", language: "en", country: "gr" },
	{ id: "rpp-rss", name: "RPP Noticias", url: "https://rpp.pe", rssUrl: "https://rpp.pe/rss", category: "general", language: "es", country: "pe" },
	{ id: "fmt-rss", name: "Free Malaysia Today", url: "https://www.freemalaysiatoday.com", rssUrl: "https://www.freemalaysiatoday.com/feed/", category: "general", language: "en", country: "my" },
	{ id: "naftemporiki-rss", name: "Naftemporiki", url: "https://www.naftemporiki.gr", rssUrl: "https://www.naftemporiki.gr/rss", category: "general", language: "el", country: "gr" },
	{ id: "latercera-rss", name: "La Tercera", url: "https://www.latercera.com", rssUrl: "https://www.latercera.com/rss/", category: "general", language: "es", country: "cl" },
	{ id: "letemps-rss", name: "Le Temps", url: "https://www.letemps.ch", rssUrl: "https://www.letemps.ch/feed", category: "general", language: "fr", country: "ch" },
	{ id: "daily-sabah-rss", name: "Daily Sabah", url: "https://www.dailysabah.com", rssUrl: "https://www.dailysabah.com/rssFeed/0", category: "general", language: "en", country: "tr" },
	{ id: "expats-cz-rss", name: "Expats.cz", url: "https://www.expats.cz", rssUrl: "https://www.expats.cz/feed", category: "general", language: "en", country: "cz" },
	{ id: "el-financiero-rss", name: "El Financiero", url: "https://www.elfinanciero.com.mx", rssUrl: "https://www.elfinanciero.com.mx/rss", category: "general", language: "es", country: "mx" },
	{ id: "tehran-times-rss", name: "Tehran Times", url: "https://www.tehrantimes.com", rssUrl: "https://www.tehrantimes.com/rss", category: "general", language: "en", country: "ir" },
	{ id: "iraqi-news-rss", name: "Iraqi News", url: "https://www.iraqinews.com", rssUrl: "https://www.iraqinews.com/rss", category: "general", language: "en", country: "iq" },
	{ id: "times-of-oman-rss", name: "Times of Oman", url: "https://timesofoman.com", rssUrl: "https://timesofoman.com/feed", category: "general", language: "en", country: "om" },
	{ id: "sana-rss", name: "SANA", url: "https://sana.sy/en", rssUrl: "https://sana.sy/en/rss", category: "general", language: "en", country: "sy" },
	{ id: "yemen-online-rss", name: "Yemen Online", url: "https://yemenonline.info", rssUrl: "https://yemenonline.info/feed", category: "general", language: "en", country: "ye" },
	{ id: "kathmandu-post-rss", name: "The Kathmandu Post", url: "https://kathmandupost.com", rssUrl: "https://kathmandupost.com/rss", category: "general", language: "en", country: "np" },
	{ id: "nhk-news-rss", name: "NHK News", url: "https://www.nhk.or.jp", rssUrl: "https://www.nhk.or.jp/rss/news/cat0.xml", category: "general", language: "ja", country: "jp" },
	{ id: "khmer-times-rss", name: "Khmer Times", url: "https://www.khmertimeskh.com", rssUrl: "https://www.khmertimeskh.com/feed/", category: "general", language: "en", country: "kh" },
	{ id: "laotian-times-rss", name: "The Laotian Times", url: "https://laotiantimes.com", rssUrl: "https://laotiantimes.com/feed", category: "general", language: "en", country: "la" },
	{ id: "irrawaddy-rss", name: "The Irrawaddy", url: "https://www.irrawaddy.com", rssUrl: "https://www.irrawaddy.com/feed", category: "general", language: "en", country: "mm" },
	{ id: "tatoli-rss", name: "Tatoli", url: "https://tatoli.tl", rssUrl: "https://tatoli.tl/feed", category: "general", language: "tet", country: "tl" },
	{ id: "roya-news-rss", name: "Roya News", url: "https://royanews.tv", rssUrl: "https://royanews.tv/rss", category: "general", language: "ar", country: "jo" },
	{ id: "daily-tribune-bahrain-rss", name: "The Daily Tribune", url: "https://newsofbahrain.com", rssUrl: "https://newsofbahrain.com/rss", category: "general", language: "en", country: "bh" },
	{ id: "macau-daily-times-rss", name: "Macau Daily Times", url: "https://macaudailytimes.com.mo", rssUrl: "https://macaudailytimes.com.mo/rss", category: "general", language: "en", country: "mo" },
	{ id: "the-scoop-rss", name: "The Scoop", url: "https://thescoop.co", rssUrl: "https://thescoop.co/feed", category: "general", language: "en", country: "bn" },
	{ id: "the-bhutanese-rss", name: "The Bhutanese", url: "https://thebhutanese.bt", rssUrl: "https://thebhutanese.bt/feed", category: "general", language: "en", country: "bt" },
	{ id: "news-mn-json", name: "News.mn", url: "https://news.mn", rssUrl: "https://news.mn/wp-json/wp/v2/posts?per_page=10", feedFormat: "wordpress-json", category: "general", language: "mn", country: "mn" },
	{ id: "tico-times-rss", name: "The Tico Times", url: "https://ticotimes.net", rssUrl: "https://ticotimes.net/feed", category: "general", language: "en", country: "cr" },
	{ id: "barbados-today-rss", name: "Barbados Today", url: "https://barbadostoday.bb", rssUrl: "https://barbadostoday.bb/feed", category: "general", language: "en", country: "bb" },
	{ id: "st-lucia-times-rss", name: "St Lucia Times", url: "https://stluciatimes.com", rssUrl: "https://stluciatimes.com/feed", category: "general", language: "en", country: "lc" },
	{ id: "el-deber-rss", name: "El Deber", url: "https://eldeber.com.bo", rssUrl: "https://eldeber.com.bo/feed", category: "general", language: "es", country: "bo" },
	{ id: "dominican-today-rss", name: "Dominican Today", url: "https://dominicantoday.com", rssUrl: "https://dominicantoday.com/feed", category: "general", language: "en", country: "do" },
	{ id: "el-nacional-rss", name: "El Nacional", url: "https://www.elnacional.com", rssUrl: "https://www.elnacional.com/rss", category: "general", language: "es", country: "ve" },
	{ id: "jamaica-observer-rss", name: "Jamaica Observer", url: "https://www.jamaicaobserver.com", rssUrl: "https://www.jamaicaobserver.com/feed", category: "general", language: "en", country: "jm" },
	{ id: "antigua-observer-rss", name: "Antigua Observer", url: "https://antiguaobserver.com", rssUrl: "https://antiguaobserver.com/feed/", category: "general", language: "en", country: "ag" },
	{ id: "now-grenada-rss", name: "NOW Grenada", url: "https://nowgrenada.com", rssUrl: "https://nowgrenada.com/feed", category: "general", language: "en", country: "gd" },
	{ id: "granma-english-rss", name: "Granma English", url: "https://en.granma.cu", rssUrl: "https://en.granma.cu/feed", category: "general", language: "en", country: "cu" },
	{ id: "elsalvador-rss", name: "El Diario de Hoy", url: "https://www.elsalvador.com", rssUrl: "https://www.elsalvador.com/rss", category: "general", language: "es", country: "sv" },
	{ id: "breaking-belize-news-rss", name: "Breaking Belize News", url: "https://breakingbelizenews.com", rssUrl: "https://breakingbelizenews.com/feed/", category: "general", language: "en", country: "bz" },
	{ id: "prensa-libre-rss", name: "Prensa Libre", url: "https://www.prensalibre.com", rssUrl: "https://www.prensalibre.com/rss", category: "general", language: "es", country: "gt" },
	{ id: "defimedia-rss", name: "Defimedia", url: "https://defimedia.info", rssUrl: "https://defimedia.info/rss.xml", category: "general", language: "fr", country: "mu" },
	{ id: "eye-radio-rss", name: "Eye Radio", url: "https://eyeradio.org", rssUrl: "https://eyeradio.org/feed/", category: "general", language: "en", country: "ss" },
	{ id: "lusaka-times-rss", name: "Lusaka Times", url: "https://www.lusakatimes.com", rssUrl: "https://www.lusakatimes.com/feed/", category: "general", language: "en", country: "zm" },
	{ id: "midi-madagasikara-rss", name: "Midi Madagasikara", url: "https://midi-madagasikara.mg", rssUrl: "https://midi-madagasikara.mg/feed/", category: "general", language: "fr", country: "mg" },
	{ id: "libya-herald-rss", name: "Libya Herald", url: "https://www.libyaherald.com", rssUrl: "https://www.libyaherald.com/feed/", category: "general", language: "en", country: "ly" },
	{ id: "nyasa-times-rss", name: "Nyasa Times", url: "https://www.nyasatimes.com", rssUrl: "https://www.nyasatimes.com/feed/", category: "general", language: "en", country: "mw" },
	{ id: "the-citizen-tz-rss", name: "The Citizen", url: "https://www.thecitizen.co.tz", rssUrl: "https://www.thecitizen.co.tz/rss.xml", category: "general", language: "en", country: "tz" },
	{ id: "club-of-mozambique-rss", name: "Club of Mozambique", url: "https://clubofmozambique.com", rssUrl: "https://clubofmozambique.com/feed/", category: "general", language: "en", country: "mz" },
	{ id: "times-eswatini-rss", name: "Times of Eswatini", url: "http://times.co.sz", rssUrl: "http://times.co.sz/feed", category: "general", language: "en", country: "sz" },
	{ id: "frontpage-africa-rss", name: "FrontPageAfrica", url: "https://frontpageafricaonline.com", rssUrl: "https://frontpageafricaonline.com/feed/", category: "general", language: "en", country: "lr" },
	{ id: "lefaso-rss", name: "Lefaso.net", url: "https://lefaso.net", rssUrl: "https://lefaso.net/spip.php?page=backend", category: "general", language: "fr", country: "bf" },
	{ id: "nouvelle-tribune-bj-rss", name: "La Nouvelle Tribune", url: "https://lanouvelletribune.info", rssUrl: "https://lanouvelletribune.info/feed/", category: "general", language: "fr", country: "bj" },
	{ id: "ahora-eg-rss", name: "Ahora EG", url: "https://ahoraeg.com", rssUrl: "https://ahoraeg.com/feed/", category: "general", language: "es", country: "gq" },
	{ id: "radio-ndeke-luka-rss", name: "Radio Ndeke Luka", url: "https://www.radiondekeluka.org", rssUrl: "https://www.radiondekeluka.org/feed", category: "general", language: "fr", country: "cf" },
	{ id: "ang-gw-rss", name: "ANG", url: "https://ang.gw", rssUrl: "https://ang.gw/feed", category: "general", language: "pt", country: "gw" },
	{ id: "seneweb-rss", name: "Seneweb", url: "https://www.seneweb.com", rssUrl: "https://www.seneweb.com/feed", category: "general", language: "fr", country: "sn" },
	{ id: "alwihda-rss", name: "Alwihda Info", url: "https://www.alwihdainfo.com", rssUrl: "https://www.alwihdainfo.com/feed", category: "general", language: "ar", country: "td" },
	{ id: "guineenews-rss", name: "Guineenews", url: "https://www.guineenews.org", rssUrl: "https://www.guineenews.org/feed", category: "general", language: "fr", country: "gn" },
	{ id: "iwacu-rss", name: "IWACU", url: "https://www.iwacu-burundi.org", rssUrl: "https://www.iwacu-burundi.org/feed", category: "general", language: "fr", country: "bi" },
	{ id: "telanon-rss", name: "Téla Nón", url: "https://www.telanon.info", rssUrl: "https://www.telanon.info/feed", category: "general", language: "pt", country: "st" },
	{ id: "gabonreview-rss", name: "Gabonreview", url: "https://www.gabonreview.com", rssUrl: "https://www.gabonreview.com/feed", category: "general", language: "fr", country: "ga" },
	{ id: "post-courier-rss", name: "Post-Courier", url: "https://postcourier.com.pg", rssUrl: "https://postcourier.com.pg/feed/", category: "general", language: "en", country: "pg" },
	{ id: "fbc-news-rss", name: "FBC News", url: "https://www.fbcnews.com.fj", rssUrl: "https://www.fbcnews.com.fj/rss", category: "general", language: "en", country: "fj" },
	{ id: "rnz-pacific-ki-rss", name: "RNZ Pacific", url: "https://www.rnz.co.nz", rssUrl: "https://www.rnz.co.nz/rss/pacific.xml", category: "general", language: "en", country: "ki" },
	{ id: "marshall-islands-journal-rss", name: "Marshall Islands Journal", url: "https://marshallislandsjournal.com", rssUrl: "https://marshallislandsjournal.com/feed/", category: "general", language: "en", country: "mh" },
	{ id: "island-times-pw-rss", name: "Island Times", url: "https://islandtimes.org", rssUrl: "https://islandtimes.org/feed/", category: "general", language: "en", country: "pw" },
	{ id: "rnz-pacific-nr-rss", name: "RNZ Pacific", url: "https://www.rnz.co.nz", rssUrl: "https://www.rnz.co.nz/rss/pacific.xml", category: "general", language: "en", country: "nr" },
	{ id: "rnz-pacific-tv-rss", name: "RNZ Pacific", url: "https://www.rnz.co.nz", rssUrl: "https://www.rnz.co.nz/rss/pacific.xml", category: "general", language: "en", country: "tv" },
	{ id: "matangi-tonga-rss", name: "Matangi Tonga", url: "https://matangitonga.to", rssUrl: "https://matangitonga.to/rss.xml", category: "general", language: "en", country: "to" },
	{ id: "monaco-tribune-rss", name: "Monaco Tribune", url: "https://www.monaco-tribune.com", rssUrl: "https://www.monaco-tribune.com/feed/", category: "general", language: "fr", country: "mc" },
	{ id: "san-marino-rtv-rss", name: "San Marino RTV", url: "https://www.sanmarinortv.sm", rssUrl: "https://www.sanmarinortv.sm/rss.xml", category: "general", language: "it", country: "sm" },
	{ id: "iwitness-svg-rss", name: "iWitness News", url: "https://iwnsvg.com", rssUrl: "https://iwnsvg.com/feed/", category: "general", language: "en", country: "vc" },
	{ id: "nk-news-rss", name: "NK News", url: "https://nknews.org", rssUrl: "https://nknews.org/feed/", category: "general", language: "en", country: "kp" },
	{ id: "cayman-compass-rss", name: "Cayman Compass", url: "https://www.caymancompass.com", rssUrl: "https://www.caymancompass.com/feed/", category: "general", language: "en", country: "ky" },
	{ id: "bernews-rss", name: "Bernews", url: "https://bernews.com", rssUrl: "https://bernews.com/feed/", category: "general", language: "en", country: "bm" },
	{ id: "bvi-news-rss", name: "BVI News", url: "https://bvinews.com", rssUrl: "https://bvinews.com/feed/", category: "general", language: "en", country: "vg" },
	{ id: "anguillian-rss", name: "The Anguillian", url: "https://theanguillian.com", rssUrl: "https://theanguillian.com/feed/", category: "general", language: "en", country: "ai" },
	{ id: "discover-montserrat-rss", name: "Discover Montserrat", url: "https://discovermni.com", rssUrl: "https://discovermni.com/feed/", category: "general", language: "en", country: "ms" },
	{ id: "bes-reporter-rss", name: "BES Reporter", url: "https://bes-reporter.com", rssUrl: "https://bes-reporter.com/rss", category: "general", language: "en", country: "bq" },
	{ id: "cook-islands-news-rss", name: "Cook Islands News", url: "https://www.cookislandsnews.com", rssUrl: "https://www.cookislandsnews.com/feed/", category: "general", language: "en", country: "ck" },
	{ id: "tv-niue-rss", name: "TV Niue", url: "https://tvniue.com", rssUrl: "https://tvniue.com/feed/", category: "general", language: "en", country: "nu" },
	{ id: "rnz-pacific-tk-rss", name: "RNZ Pacific", url: "https://www.rnz.co.nz", rssUrl: "https://www.rnz.co.nz/rss/pacific.xml", category: "general", language: "en", country: "tk" },
	{ id: "rnz-pacific-pn-rss", name: "RNZ Pacific", url: "https://www.rnz.co.nz", rssUrl: "https://www.rnz.co.nz/rss/pacific.xml", category: "general", language: "en", country: "pn" },
	{ id: "merco-press-rss", name: "MercoPress", url: "https://en.mercopress.com", rssUrl: "https://en.mercopress.com/rss", category: "general", language: "en", country: "io" },
	{ id: "lnc-rss", name: "Les Nouvelles Calédoniennes", url: "https://www.lnc.nc", rssUrl: "https://www.lnc.nc/rss.xml", category: "general", language: "fr", country: "nc" },
	{ id: "jersey-evening-post-rss", name: "Bailiwick Express Jersey", url: "https://jerseyeveningpost.com", rssUrl: "https://jerseyeveningpost.com/feed", category: "general", language: "en", country: "je" },
	{ id: "sams-sentinel-rss", name: "The Sentinel", url: "https://sams.sh", rssUrl: "https://sams.sh/rss", category: "general", language: "en", country: "sh" },
	{ id: "independent-uganda-rss", name: "The Independent Uganda", url: "https://www.independent.co.ug", rssUrl: "https://www.independent.co.ug/feed/", category: "general", language: "en", country: "ug" },
	{ id: "tsa-algerie-rss", name: "TSA (Tout Sur l'Algérie)", url: "https://www.tsa-algerie.com", rssUrl: "https://www.tsa-algerie.com/feed/", category: "general", language: "fr", country: "dz" },
	{ id: "astana-times-rss", name: "The Astana Times", url: "https://astanatimes.com", rssUrl: "https://astanatimes.com/feed/", category: "general", language: "en", country: "kz" },
	{ id: "expresso-ilhas-rss", name: "Expresso das Ilhas", url: "https://expressodasilhas.cv", rssUrl: "https://expressodasilhas.cv/rss", category: "general", language: "pt", country: "cv" },
	{ id: "habariza-comores-rss", name: "Habariza Comores", url: "https://www.habarizacomores.com", rssUrl: "https://www.habarizacomores.com/feeds/posts/default?alt=rss", category: "general", language: "fr", country: "km" },
	{ id: "semana-colombia-rss", name: "Semana", url: "https://www.semana.com", rssUrl: "https://www.semana.com/arc/outboundfeeds/rss/", category: "general", language: "es", country: "co" },
	{ id: "actualite-cd-rss", name: "Actualite.cd", url: "https://actualite.cd", rssUrl: "https://actualite.cd/rss.xml", category: "general", language: "fr", country: "cd" },
	{ id: "ada-derana-rss", name: "Ada Derana", url: "https://www.adaderana.lk", rssUrl: "https://www.adaderana.lk/rss.xml", category: "general", language: "en", country: "lk" },
	{ id: "cameroon-concord-rss", name: "Cameroon Concord", url: "https://cameroonconcordnews.com", rssUrl: "https://cameroonconcordnews.com/feed", category: "general", language: "en", country: "cm" },
	{ id: "civil-ge-rss", name: "Civil.ge", url: "https://civil.ge", rssUrl: "https://civil.ge/feed", category: "general", language: "en", country: "ge" },
	{ id: "dabanga-rss", name: "Dabanga Sudan", url: "https://www.dabangasudan.org", rssUrl: "https://www.dabangasudan.org/feed", category: "general", language: "en", country: "sd" },
	{ id: "waterkant-rss", name: "Waterkant", url: "https://www.waterkant.net", rssUrl: "https://www.waterkant.net/feed", category: "general", language: "nl", country: "sr" },
	{ id: "vox-congo-rss", name: "Vox Congo", url: "https://www.vox.cg", rssUrl: "https://www.vox.cg/feed", category: "general", language: "fr", country: "cg" },
	{ id: "sierra-leone-telegraph-rss", name: "Sierra Leone Telegraph", url: "https://www.thesierraleonetelegraph.com", rssUrl: "https://www.thesierraleonetelegraph.com/feed", category: "general", language: "en", country: "sl" },
	{ id: "nya-aland-rss", name: "Nya Åland", url: "https://www.nyan.ax", rssUrl: "https://www.nyan.ax/feed", category: "general", language: "sv", country: "ax" },
	{ id: "nu-cw-rss", name: "Nu.cw", url: "https://nu.cw", rssUrl: "https://nu.cw/feed", category: "general", language: "nl", country: "cw" },
	{ id: "ara-andorra-rss", name: "Ara Andorra", url: "https://www.ara.ad", rssUrl: "https://www.ara.ad/feed", category: "general", language: "ca", country: "ad" },
	{ id: "island-sun-rss", name: "Island Sun", url: "https://theislandsun.com.sb", rssUrl: "https://theislandsun.com.sb/feed/", category: "general", language: "en", country: "sb" },
	{ id: "magnetic-media-rss", name: "Magnetic Media", url: "https://magneticmediatv.com", rssUrl: "https://magneticmediatv.com/feed/", category: "general", language: "en", country: "tc" },
	{ id: "rnz-pacific-nf-rss", name: "RNZ Pacific", url: "https://www.rnz.co.nz", rssUrl: "https://www.rnz.co.nz/rss/pacific.xml", category: "general", language: "en", country: "nf" },
	{ id: "rnz-pacific-vu-rss", name: "RNZ Pacific", url: "https://www.rnz.co.nz", rssUrl: "https://www.rnz.co.nz/rss/pacific.xml", category: "general", language: "en", country: "vu" },
	{ id: "merco-press-fk-rss", name: "MercoPress", url: "https://en.mercopress.com", rssUrl: "https://en.mercopress.com/rss", category: "general", language: "en", country: "fk" },
	{ id: "kvf-rss", name: "KVF", url: "https://kvf.fo", rssUrl: "https://kvf.fo/rss", category: "general", language: "fo", country: "fo" },
	{ id: "le-nouvelliste-rss", name: "Le Nouvelliste", url: "https://lenouvelliste.com", rssUrl: "https://lenouvelliste.com/rss.xml", category: "general", language: "fr", country: "ht" },
	{ id: "poemario-sahara-rss", name: "Poemario por un Sahara Libre", url: "https://poemariosaharalibre.blogspot.com", rssUrl: "https://poemariosaharalibre.blogspot.com/feeds/posts/default", category: "general", language: "es", country: "eh" },
	{ id: "mayotte-journal-rss", name: "Le Journal de Mayotte", url: "https://lejournaldemayotte.yt", rssUrl: "https://lejournaldemayotte.yt/feed", category: "general", language: "fr", country: "yt" },
	{ id: "hespress-english-rss", name: "Hespress English", url: "https://en.hespress.com", rssUrl: "https://en.hespress.com/rss", category: "general", language: "en", country: "ma" },
	{ id: "studio-tamani-rss", name: "Studio Tamani", url: "https://www.studiotamani.org", rssUrl: "https://www.studiotamani.org/feed", category: "general", language: "fr", country: "ml" },
	{ id: "newsmaker-rss", name: "NewsMaker", url: "https://newsmaker.md", rssUrl: "https://newsmaker.md/ru/rss", category: "general", language: "ru", country: "md" },
	{ id: "kt-press-rss", name: "KT Press", url: "https://www.ktpress.rw", rssUrl: "https://www.ktpress.rw/feed", category: "general", language: "en", country: "rw" },
	{ id: "voice-bw-rss", name: "The Voice BW", url: "https://thevoicebw.com", rssUrl: "https://thevoicebw.com/feed", category: "general", language: "en", country: "bw" },
	{ id: "delfi-lt-rss", name: "Delfi.lt", url: "https://www.delfi.lt", rssUrl: "https://www.delfi.lt/rss.xml", category: "general", language: "lt", country: "lt" },
	{ id: "fides-rss", name: "Agenzia Fides", url: "https://www.fides.org", rssUrl: "https://www.fides.org/rss.xml", category: "general", language: "en", country: "va" },
	{ id: "zinfos974-rss", name: "Zinfos974", url: "https://www.zinfos974.com", rssUrl: "https://www.zinfos974.com/feed", category: "general", language: "fr", country: "re" },
	{ id: "chronicles-tm-rss", name: "Chronicles of Turkmenistan", url: "https://hronikatm.com", rssUrl: "https://hronikatm.com/rss", category: "general", language: "ru", country: "tm" },
	{ id: "iom-today-rss", name: "Isle of Man Today", url: "https://www.iomtoday.co.im", rssUrl: "https://www.iomtoday.co.im/rss", category: "general", language: "en", country: "im" },
	{ id: "tvn-panama-rss", name: "TVN Noticias", url: "https://www.tvn-2.com", rssUrl: "https://www.tvn-2.com/rss", category: "general", language: "es", country: "pa" },
	{ id: "new-era-namibia-rss", name: "New Era Live", url: "https://neweralive.na", rssUrl: "https://neweralive.na/feed", category: "general", language: "en", country: "na" },
	{ id: "times-caribbean-kn-rss", name: "Times Caribbean Online", url: "https://timescaribbeanonline.com", rssUrl: "https://timescaribbeanonline.com/feed/", category: "general", language: "en", country: "kn" },
	{ id: "horseed-media-rss", name: "Horseed Media", url: "https://horseedmedia.net", rssUrl: "https://horseedmedia.net/feed/", category: "general", language: "so", country: "so" },
	{ id: "proceso-digital-rss", name: "Proceso Digital", url: "https://proceso.hn", rssUrl: "https://proceso.hn/feed/", category: "general", language: "es", country: "hn" },
	{ id: "bahamas-press-rss", name: "Bahamas Press", url: "https://bahamaspress.com", rssUrl: "https://bahamaspress.com/feed", category: "general", language: "en", country: "bs" },
	{ id: "hoy-paraguay-rss", name: "Hoy Paraguay", url: "https://www.hoy.com.py", rssUrl: "https://www.hoy.com.py/feed", category: "general", language: "es", country: "py" },
	{ id: "tamtam-info-rss", name: "TamTam Info", url: "https://www.tamtaminfo.com", rssUrl: "https://www.tamtaminfo.com/feed", category: "general", language: "fr", country: "ne" },
	{ id: "lovin-malta-rss", name: "Lovin Malta", url: "https://lovinmalta.com", rssUrl: "https://lovinmalta.com/feed", category: "general", language: "en", country: "mt" },
	{ id: "sofia-globe-rss", name: "Sofia Globe", url: "https://sofiaglobe.com", rssUrl: "https://sofiaglobe.com/feed", category: "general", language: "en", country: "bg" },
	{ id: "sahara-media-rss", name: "Sahara Media", url: "https://saharamedias.net", rssUrl: "https://saharamedias.net/feed", category: "general", language: "ar", country: "mr" },
	{ id: "kandit-news-rss", name: "Kandit News Group", url: "https://kanditnews.com", rssUrl: "https://kanditnews.com/rss", category: "general", language: "en", country: "mp" },
	{ id: "reporter-lesotho-rss", name: "The Reporter Lesotho", url: "https://thereporter.co.ls", rssUrl: "https://thereporter.co.ls/rss", category: "general", language: "en", country: "ls" },
	{ id: "caliber-az-rss", name: "Caliber.Az", url: "https://caliber.az", rssUrl: "https://caliber.az/rss.xml", category: "general", language: "en", country: "az" },
	{ id: "amu-tv-rss", name: "Amu TV", url: "https://amu.tv", rssUrl: "https://amu.tv/feed/", category: "general", language: "en", country: "af" },
	{ id: "24ora-aruba-rss", name: "24ora", url: "https://24ora.com", rssUrl: "https://24ora.com/feed/", category: "general", language: "pap", country: "aw" },
	{ id: "arabian-business-rss", name: "Arabian Business", url: "https://www.arabianbusiness.com", rssUrl: "https://www.arabianbusiness.com/feed", category: "general", language: "en", country: "ae" },
	{ id: "karibinfo-rss", name: "Karibinfo", url: "https://www.karibinfo.com", rssUrl: "https://www.karibinfo.com/feed/", category: "general", language: "fr", country: "gp" },
	{ id: "el-mercurio-ecuador-rss", name: "El Mercurio Ecuador", url: "https://elmercurio.com.ec", rssUrl: "https://elmercurio.com.ec/feed/", category: "general", language: "es", country: "ec" },
	{ id: "nunatsiaq-rss", name: "Nunatsiaq News", url: "https://nunatsiaq.com", rssUrl: "https://nunatsiaq.com/feed", category: "general", language: "en", country: "gl" },
	{ id: "jutarnji-rss", name: "Jutarnji list", url: "https://www.jutarnji.hr", rssUrl: "https://www.jutarnji.hr/feed", category: "general", language: "hr", country: "hr" },
	{ id: "myjoyonline-rss", name: "MyJoyOnline", url: "https://www.myjoyonline.com", rssUrl: "https://www.myjoyonline.com/feed", category: "general", language: "en", country: "gh" },
	{ id: "euronews-albania-rss", name: "Euronews Albania", url: "https://euronews.al", rssUrl: "https://euronews.al/feed", category: "general", language: "sq", country: "al" },
	{ id: "olive-press-rss", name: "Olive Press", url: "https://www.theolivepress.es", rssUrl: "https://www.theolivepress.es/feed/", category: "general", language: "en", country: "gi" },
	{ id: "newsday-zimbabwe-rss", name: "NewsDay Zimbabwe", url: "https://www.newsday.co.zw", rssUrl: "https://www.newsday.co.zw/feed/", category: "general", language: "en", country: "zw" },
	{ id: "24ur-rss", name: "24ur.com", url: "https://www.24ur.com", rssUrl: "https://www.24ur.com/rss", category: "general", language: "sl", country: "si" },
	{ id: "icilome-rss", name: "IciLome", url: "https://icilome.com", rssUrl: "https://icilome.com/feed/", category: "general", language: "fr", country: "tg" },
	{ id: "cnc3-rss", name: "CNC3", url: "https://www.cnc3.co.tt", rssUrl: "https://www.cnc3.co.tt/feed/", category: "general", language: "en", country: "tt" },
	{ id: "stmaarten-newsday-rss", name: "StMaartenNews", url: "https://stmaartennews.com", rssUrl: "https://stmaartennews.com/feed/", category: "general", language: "en", country: "sx" },
	{ id: "blada-rss", name: "Blada", url: "https://www.blada.com", rssUrl: "https://www.blada.com/rss", category: "general", language: "fr", country: "gf" },
	{ id: "horn-diplomat-rss", name: "Horn Diplomat", url: "https://horndiplomat.com", rssUrl: "https://horndiplomat.com/feed/", category: "general", language: "en", country: "dj" },
	{ id: "zayactu-rss", name: "ZayActu", url: "https://www.zayactu.org", rssUrl: "https://www.zayactu.org/feed/", category: "general", language: "fr", country: "mq" },
	{ id: "new-bloom-rss", name: "New Bloom Magazine", url: "https://newbloommag.net", rssUrl: "https://newbloommag.net/feed/", category: "general", language: "en", country: "tw" },
	{ id: "rnz-pacific-as-rss", name: "RNZ Pacific", url: "https://www.rnz.co.nz", rssUrl: "https://www.rnz.co.nz/rss/pacific.xml", category: "general", language: "en", country: "as" },
	{ id: "asbarez-rss", name: "Asbarez", url: "https://asbarez.com", rssUrl: "https://asbarez.com/feed/", category: "general", language: "en", country: "am" },
	{ id: "expansao-rss", name: "Expansão", url: "https://expansao.co.ao", rssUrl: "https://expansao.co.ao/rss", category: "general", language: "pt", country: "ao" },
	{ id: "connection-ivoirienne-rss", name: "Connection Ivoirienne", url: "https://connectionivoirienne.net", rssUrl: "https://connectionivoirienne.net/feed/", category: "general", language: "fr", country: "ci" },
	{ id: "mondoweiss-rss", name: "Mondoweiss", url: "https://mondoweiss.net", rssUrl: "https://mondoweiss.net/feed/", category: "general", language: "en", country: "ps" },
	{ id: "noticel-rss", name: "NotiCel", url: "https://noticel.com", rssUrl: "https://noticel.com/feed/", category: "general", language: "es", country: "pr" },
	{ id: "le-pelican-rss", name: "Le Pélican", url: "https://lepelican-journal.com", rssUrl: "https://lepelican-journal.com/feed", category: "general", language: "fr", country: "bl" },
	{ id: "businessnews-tunisia-rss", name: "Business News Tunisia", url: "https://www.businessnews.com.tn", rssUrl: "https://www.businessnews.com.tn/feed", category: "general", language: "fr", country: "tn" },
	{ id: "rnz-pacific-wf-rss", name: "RNZ Pacific", url: "https://www.rnz.co.nz", rssUrl: "https://www.rnz.co.nz/rss/pacific.xml", category: "general", language: "en", country: "wf" },
];

function mergeSources(sources: NewsSource[]) {
	const merged = new Map(
		sources
			.filter((source) => !obsoleteRssSourceIds.has(source.id))
			.map((source) => [source.id, source]),
	);
	for (const source of officialRssSources) merged.set(source.id, source);
	return Array.from(merged.values());
}

export function normalizeCountryCode(code: string) {
	const normalized = code.toLowerCase();
	if (normalized === "tp") return "tl";
	if (normalized === "zh") return "cn";
	return normalized;
}

export function getCountryOptions(): CountryOption[] {
	const countries = Object.keys(isoCountries.getAlpha2Codes())
		.filter((code) => !nonCountryRegions.has(code))
		.map((code) => ({
			code: normalizeCountryCode(code),
			name: isoCountries.getName(code, "ja") ?? code,
		}));
	if (!countries.some((country) => country.code === "xk")) {
		countries.push({ code: "xk", name: "コソボ" });
	}
	return countries
		.filter((country, index, list) => list.findIndex((item) => item.code === country.code) === index)
		.filter((country) => !countriesWithFeedFallback.has(country.code))
		.sort((first, second) => first.name.localeCompare(second.name, "ja"));
}

export function getNewsDatabase() {
	const app = getApps().length
		? getApp()
		: initializeApp({ credential: applicationDefault(), databaseURL });
	return getDatabase(app);
}

export async function getNewsSources() {
	const database = getNewsDatabase();
	const sourceRef = database.ref("news_sources/catalog");
	const snapshot = await sourceRef.get();
	const cached = snapshot.val() as
		| { updatedAt?: number; sources?: NewsSource[] }
		| null;

	if (
		cached?.sources?.length &&
		Date.now() - (cached.updatedAt ?? 0) < sourceCacheDuration
	) {
		const mergedSources = mergeSources(cached.sources.map((source) => ({
			...source,
			country: normalizeCountryCode(source.country),
		})));
		if (mergedSources.length !== cached.sources.length) {
			await sourceRef.set({
				updatedAt: Date.now(),
				sources: mergedSources,
			});
		}
		return mergedSources;
	}

	const apiKey = process.env.NEWS_API_KEY;
	if (!apiKey) {
		if (cached?.sources?.length) return mergeSources(cached.sources);
		throw new Error("NEWS_API_KEY が設定されていません。");
	}

	const response = await fetch("https://newsapi.org/v2/top-headlines/sources", {
		headers: { "X-Api-Key": apiKey },
		cache: "no-store",
	});
	const data = await response.json();
	if (!response.ok || !Array.isArray(data.sources)) {
		throw new Error(data.message ?? "ニュース配信元を取得できませんでした。");
	}

	const sources = (data.sources as NewsSource[])
		.filter((source) => {
			if (!source.id || !source.name || !source.country || !source.url) return false;
			try {
				const url = new URL(source.url);
				return url.protocol === "https:" || url.protocol === "http:";
			} catch {
				return false;
			}
		})
		.map((source) => ({ ...source, country: normalizeCountryCode(source.country) }));

	const mergedSources = mergeSources(sources);
	await sourceRef.set({ updatedAt: Date.now(), sources: mergedSources });
	return mergedSources;
}