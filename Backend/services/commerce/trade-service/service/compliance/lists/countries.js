'use strict';
/**
 * Country name -> ISO 3166-1 alpha-2, for reading the three official lists.
 *
 * OFAC writes "Korea, North", the UN writes "Democratic People's Republic of
 * Korea", the EU already gives ISO codes. All of them are mapped here against the
 * ISO 3166-1 standard. A name that is not in this table is NOT guessed: the
 * importer keeps the original text and records it as unmapped, so a gap is
 * visible in the import report rather than silently dropped.
 */

// [iso2, canonical name, ...other spellings used by the publishers]
const TABLE = [
    ['AF', 'Afghanistan'], ['AX', 'Aland Islands'], ['AL', 'Albania'], ['DZ', 'Algeria'],
    ['AS', 'American Samoa'], ['AD', 'Andorra'], ['AO', 'Angola'], ['AI', 'Anguilla'],
    ['AQ', 'Antarctica'], ['AG', 'Antigua and Barbuda'], ['AR', 'Argentina'], ['AM', 'Armenia'],
    ['AW', 'Aruba'], ['AU', 'Australia'], ['AT', 'Austria'], ['AZ', 'Azerbaijan'],
    ['BS', 'Bahamas', 'The Bahamas', 'Bahamas, The'], ['BH', 'Bahrain'], ['BD', 'Bangladesh'],
    ['BB', 'Barbados'], ['BY', 'Belarus'], ['BE', 'Belgium'], ['BZ', 'Belize'], ['BJ', 'Benin'],
    ['BM', 'Bermuda'], ['BT', 'Bhutan'], ['BO', 'Bolivia', 'Plurinational State of Bolivia', 'Bolivia (Plurinational State of)'],
    ['BQ', 'Bonaire, Sint Eustatius and Saba', 'Bonaire'], ['BA', 'Bosnia and Herzegovina', 'Bosnia-Herzegovina'],
    ['BW', 'Botswana'], ['BV', 'Bouvet Island'], ['BR', 'Brazil'], ['IO', 'British Indian Ocean Territory'],
    ['BN', 'Brunei', 'Brunei Darussalam'], ['BG', 'Bulgaria'], ['BF', 'Burkina Faso'],
    ['BI', 'Burundi'], ['CV', 'Cabo Verde', 'Cape Verde'], ['KH', 'Cambodia'], ['CM', 'Cameroon'],
    ['CA', 'Canada'], ['KY', 'Cayman Islands'], ['CF', 'Central African Republic'], ['TD', 'Chad'],
    ['CL', 'Chile'], ['CN', 'China', "People's Republic of China"], ['CX', 'Christmas Island'],
    ['CC', 'Cocos (Keeling) Islands', 'Cocos Islands'], ['CO', 'Colombia'], ['KM', 'Comoros'],
    ['CG', 'Congo', 'Republic of the Congo', 'Congo, Republic of the', 'Congo (Brazzaville)'],
    ['CD', 'Democratic Republic of the Congo', 'Congo, Democratic Republic of the', 'Congo (Kinshasa)', 'Zaire'],
    ['CK', 'Cook Islands'], ['CR', 'Costa Rica'], ['CI', "Cote d'Ivoire", "Côte d'Ivoire", 'Ivory Coast'],
    ['HR', 'Croatia'], ['CU', 'Cuba'], ['CW', 'Curacao', 'Curaçao'], ['CY', 'Cyprus'],
    ['CZ', 'Czech Republic', 'Czechia'], ['DK', 'Denmark'], ['DJ', 'Djibouti'], ['DM', 'Dominica'],
    ['DO', 'Dominican Republic'], ['EC', 'Ecuador'], ['EG', 'Egypt'], ['SV', 'El Salvador'],
    ['GQ', 'Equatorial Guinea'], ['ER', 'Eritrea'], ['EE', 'Estonia'], ['SZ', 'Eswatini', 'Swaziland'],
    ['ET', 'Ethiopia'], ['FK', 'Falkland Islands', 'Falkland Islands (Malvinas)'], ['FO', 'Faroe Islands'],
    ['FJ', 'Fiji'], ['FI', 'Finland'], ['FR', 'France'], ['GF', 'French Guiana'],
    ['PF', 'French Polynesia'], ['TF', 'French Southern Territories'], ['GA', 'Gabon'],
    ['GM', 'Gambia', 'The Gambia', 'Gambia, The'], ['GE', 'Georgia'], ['DE', 'Germany'], ['GH', 'Ghana'],
    ['GI', 'Gibraltar'], ['GR', 'Greece'], ['GL', 'Greenland'], ['GD', 'Grenada'], ['GP', 'Guadeloupe'],
    ['GU', 'Guam'], ['GT', 'Guatemala'], ['GG', 'Guernsey'], ['GN', 'Guinea'], ['GW', 'Guinea-Bissau'],
    ['GY', 'Guyana'], ['HT', 'Haiti'], ['HM', 'Heard Island and McDonald Islands'],
    ['VA', 'Holy See', 'Vatican City', 'Vatican'], ['HN', 'Honduras'], ['HK', 'Hong Kong', 'Hong Kong SAR', 'China, Hong Kong Special Administrative Region'],
    ['HU', 'Hungary'], ['IS', 'Iceland'], ['IN', 'India'], ['ID', 'Indonesia'],
    ['IR', 'Iran', 'Iran (Islamic Republic of)', 'Islamic Republic of Iran'], ['IQ', 'Iraq'],
    ['IE', 'Ireland'], ['IM', 'Isle of Man', 'Man, Isle of'], ['IL', 'Israel'], ['IT', 'Italy'], ['JM', 'Jamaica'],
    ['JP', 'Japan'], ['JE', 'Jersey'], ['JO', 'Jordan'], ['KZ', 'Kazakhstan'], ['KE', 'Kenya'],
    ['KI', 'Kiribati'], ['KP', 'North Korea', 'Korea, North', "Democratic People's Republic of Korea", 'Korea (Democratic People\'s Republic of)'],
    ['KR', 'South Korea', 'Korea, South', 'Republic of Korea', 'Korea (Republic of)'],
    ['XK', 'Kosovo'], ['KW', 'Kuwait'], ['KG', 'Kyrgyzstan', 'Kyrgyz Republic'],
    ['LA', 'Laos', "Lao People's Democratic Republic", 'Lao PDR'], ['LV', 'Latvia'], ['LB', 'Lebanon'],
    ['LS', 'Lesotho'], ['LR', 'Liberia'], ['LY', 'Libya', 'Libyan Arab Jamahiriya'], ['LI', 'Liechtenstein'],
    ['LT', 'Lithuania'], ['LU', 'Luxembourg'], ['MO', 'Macau', 'Macao', 'Macao SAR'],
    ['MG', 'Madagascar'], ['MW', 'Malawi'], ['MY', 'Malaysia'], ['MV', 'Maldives'], ['ML', 'Mali'],
    ['MT', 'Malta'], ['MH', 'Marshall Islands'], ['MQ', 'Martinique'], ['MR', 'Mauritania'],
    ['MU', 'Mauritius'], ['YT', 'Mayotte'], ['MX', 'Mexico'], ['FM', 'Micronesia', 'Federated States of Micronesia', 'Micronesia (Federated States of)'],
    ['MD', 'Moldova', 'Republic of Moldova', 'Moldova, Republic of'], ['MC', 'Monaco'], ['MN', 'Mongolia'],
    ['ME', 'Montenegro'], ['MS', 'Montserrat'], ['MA', 'Morocco'], ['MZ', 'Mozambique'],
    ['MM', 'Burma', 'Myanmar'], ['NA', 'Namibia'], ['NR', 'Nauru'], ['NP', 'Nepal'],
    ['NL', 'Netherlands', 'The Netherlands', 'Netherlands, The'], ['NC', 'New Caledonia'],
    ['NZ', 'New Zealand'], ['NI', 'Nicaragua'], ['NE', 'Niger'], ['NG', 'Nigeria'], ['NU', 'Niue'],
    ['NF', 'Norfolk Island'], ['MK', 'North Macedonia', 'Macedonia', 'The former Yugoslav Republic of Macedonia', 'North Macedonia, The Republic of'],
    ['MP', 'Northern Mariana Islands'], ['NO', 'Norway'], ['OM', 'Oman'], ['PK', 'Pakistan'],
    ['PW', 'Palau'], ['PS', 'Palestine', 'State of Palestine', 'West Bank', 'Gaza Strip', 'West Bank and Gaza', 'Palestinian Territory', 'Palestinian', 'Gaza', 'Northern Gaza', 'North Gaza'],
    ['PA', 'Panama'], ['PG', 'Papua New Guinea'], ['PY', 'Paraguay'], ['PE', 'Peru'],
    ['PH', 'Philippines'], ['PN', 'Pitcairn', 'Pitcairn Islands'], ['PL', 'Poland'], ['PT', 'Portugal'],
    ['PR', 'Puerto Rico'], ['QA', 'Qatar'], ['RE', 'Reunion', 'Réunion'], ['RO', 'Romania'],
    ['RU', 'Russia', 'Russian Federation'], ['RW', 'Rwanda'], ['BL', 'Saint Barthelemy', 'Saint Barthélemy'],
    ['SH', 'Saint Helena', 'Saint Helena, Ascension and Tristan da Cunha'],
    ['KN', 'Saint Kitts and Nevis', 'St. Kitts and Nevis'], ['LC', 'Saint Lucia', 'St. Lucia'],
    ['MF', 'Saint Martin', 'Saint Martin (French part)'], ['PM', 'Saint Pierre and Miquelon'],
    ['VC', 'Saint Vincent and the Grenadines', 'St. Vincent and the Grenadines'], ['WS', 'Samoa'],
    ['SM', 'San Marino'], ['ST', 'Sao Tome and Principe', 'São Tomé and Príncipe'],
    ['SA', 'Saudi Arabia'], ['SN', 'Senegal'], ['RS', 'Serbia', 'Serbia and Montenegro'], ['SC', 'Seychelles'],
    ['SL', 'Sierra Leone'], ['SG', 'Singapore'], ['SX', 'Sint Maarten', 'Sint Maarten (Dutch part)'],
    ['SK', 'Slovakia', 'Slovak Republic'], ['SI', 'Slovenia'], ['SB', 'Solomon Islands'],
    ['SO', 'Somalia'], ['ZA', 'South Africa'], ['GS', 'South Georgia and the South Sandwich Islands'],
    ['SS', 'South Sudan'], ['ES', 'Spain'], ['LK', 'Sri Lanka'], ['SD', 'Sudan'], ['SR', 'Suriname'],
    ['SJ', 'Svalbard and Jan Mayen'], ['SE', 'Sweden'], ['CH', 'Switzerland'],
    ['SY', 'Syria', 'Syrian Arab Republic'], ['TW', 'Taiwan', 'Taiwan, Province of China'], ['TJ', 'Tajikistan'],
    ['TZ', 'Tanzania', 'United Republic of Tanzania', 'Tanzania, United Republic of'], ['TH', 'Thailand'],
    ['TL', 'Timor-Leste', 'East Timor'], ['TG', 'Togo'], ['TK', 'Tokelau'], ['TO', 'Tonga'],
    ['TT', 'Trinidad and Tobago'], ['TN', 'Tunisia'], ['TR', 'Turkey', 'Türkiye', 'Turkiye'],
    ['TM', 'Turkmenistan'], ['TC', 'Turks and Caicos Islands'], ['TV', 'Tuvalu'], ['UG', 'Uganda'],
    ['UA', 'Ukraine'], ['AE', 'United Arab Emirates', 'UAE'], ['GB', 'United Kingdom', 'UK', 'Great Britain', 'United Kingdom of Great Britain and Northern Ireland'],
    ['US', 'United States', 'United States of America', 'USA'], ['UM', 'United States Minor Outlying Islands'],
    ['UY', 'Uruguay'], ['UZ', 'Uzbekistan'], ['VU', 'Vanuatu'], ['VE', 'Venezuela', 'Bolivarian Republic of Venezuela', 'Venezuela (Bolivarian Republic of)'],
    ['VN', 'Vietnam', 'Viet Nam'], ['VG', 'British Virgin Islands', 'Virgin Islands, British'],
    ['VI', 'U.S. Virgin Islands', 'Virgin Islands, U.S.', 'United States Virgin Islands'],
    ['WF', 'Wallis and Futuna'], ['EH', 'Western Sahara'], ['YE', 'Yemen'], ['ZM', 'Zambia'], ['ZW', 'Zimbabwe'],
];

const fold = (s) => String(s || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();

const BY_NAME = new Map();
const ISO = new Set();
for (const [iso, ...names] of TABLE) {
    ISO.add(iso);
    for (const n of names) BY_NAME.set(fold(n), iso);
}

/** ISO-2 for a publisher's country text, or null when it is not in the table. */
function toIso2(name) {
    if (!name) return null;
    // OFAC marks sub-national areas as "Region: Gaza"; the area is what the country code names.
    const raw = String(name).trim().replace(/^Region:\s*/i, '');
    if (/^[A-Za-z]{2}$/.test(raw) && ISO.has(raw.toUpperCase())) return raw.toUpperCase();
    return BY_NAME.get(fold(raw)) || null;
}

module.exports = { toIso2, ISO };
