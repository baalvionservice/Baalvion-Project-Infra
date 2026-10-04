// World Countries + States/Provinces/Regions
// Used in Apply modals for global targeting

export interface GeoCountry {
  code: string;
  name: string;
  states: string[];
}

export const WORLD_GEO: GeoCountry[] = [
  {
    code: "AF", name: "Afghanistan",
    states: ["Badakhshan","Badghis","Baghlan","Balkh","Bamyan","Daykundi","Farah","Faryab","Ghazni","Ghor","Helmand","Herat","Jowzjan","Kabul","Kandahar","Kapisa","Khost","Kunar","Kunduz","Laghman","Logar","Nangarhar","Nimroz","Nuristan","Paktia","Paktika","Panjshir","Parwan","Samangan","Sar-e Pol","Takhar","Urozgan","Wardak","Zabul"]
  },
  {
    code: "AL", name: "Albania",
    states: ["Berat","Dibër","Durrës","Elbasan","Fier","Gjirokastër","Korçë","Kukës","Lezhë","Shkodër","Tirana","Vlorë"]
  },
  {
    code: "DZ", name: "Algeria",
    states: ["Adrar","Aïn Defla","Aïn Témouchent","Algiers","Annaba","Batna","Béchar","Béjaïa","Biskra","Blida","Bordj Bou Arréridj","Bouira","Boumerdès","Chlef","Constantine","Djelfa","El Bayadh","El Oued","El Tarf","Ghardaïa","Guelma","Illizi","Jijel","Khenchela","Laghouat","Mascara","Médéa","Mila","Mostaganem","Msila","Naâma","Oran","Ouargla","Oum El Bouaghi","Relizane","Saïda","Sétif","Sidi Bel Abbès","Skikda","Souk Ahras","Tamanghasset","Tébessa","Tiaret","Tindouf","Tipaza","Tissemsilt","Tizi Ouzou","Tlemcen"]
  },
  {
    code: "AD", name: "Andorra",
    states: ["Andorra la Vella","Canillo","Encamp","Escaldes-Engordany","La Massana","Ordino","Sant Julià de Lòria"]
  },
  {
    code: "AO", name: "Angola",
    states: ["Bengo","Benguela","Bié","Cabinda","Cuando Cubango","Cuanza Norte","Cuanza Sul","Cunene","Huambo","Huíla","Luanda","Lunda Norte","Lunda Sul","Malanje","Moxico","Namibe","Uíge","Zaire"]
  },
  {
    code: "AG", name: "Antigua and Barbuda",
    states: ["Barbuda","Redonda","Saint George","Saint John","Saint Mary","Saint Paul","Saint Peter","Saint Philip"]
  },
  {
    code: "AR", name: "Argentina",
    states: ["Buenos Aires","Catamarca","Chaco","Chubut","Córdoba","Corrientes","Entre Ríos","Formosa","Jujuy","La Pampa","La Rioja","Mendoza","Misiones","Neuquén","Río Negro","Salta","San Juan","San Luis","Santa Cruz","Santa Fe","Santiago del Estero","Tierra del Fuego","Tucumán"]
  },
  {
    code: "AM", name: "Armenia",
    states: ["Aragatsotn","Ararat","Armavir","Gegharkunik","Kotayk","Lori","Shirak","Syunik","Tavush","Vayots Dzor","Yerevan"]
  },
  {
    code: "AU", name: "Australia",
    states: ["Australian Capital Territory","New South Wales","Northern Territory","Queensland","South Australia","Tasmania","Victoria","Western Australia"]
  },
  {
    code: "AT", name: "Austria",
    states: ["Burgenland","Carinthia","Lower Austria","Salzburg","Styria","Tyrol","Upper Austria","Vienna","Vorarlberg"]
  },
  {
    code: "AZ", name: "Azerbaijan",
    states: ["Absheron","Agdam","Agdash","Aghjabadi","Agstafa","Agsu","Astara","Baku","Balakan","Barda","Beylagan","Bilasuvar","Dashkasan","Fuzuli","Gadabay","Ganja","Gobustan","Goranboy","Goychay","Goygol","Hajigabul","Imishli","Ismailli","Jabrayil","Jalilabad","Kalbajar","Kurdamir","Lachin","Lankaran","Lerik","Masally","Mingachevir","Nakhchivan","Neftchala","Oghuz","Qakh","Qazakh","Quba","Qubadli","Qus","Saatly","Sabirabad","Salyan","Shamakhi","Shamkir","Shirvan","Shusha","Siazan","Sumgayit","Tartar","Tovuz","Ujar","Yardymli","Yevlakh","Zangilan","Zaqatala","Zardab"]
  },
  {
    code: "BS", name: "Bahamas",
    states: ["Acklins","Berry Islands","Bimini","Black Point","Cat Island","Central Abaco","Central Andros","Central Eleuthera","City of Freeport","Crooked Island and Long Cay","East Grand Bahama","Exuma","Grand Cay","Harbour Island","Hope Town","Inagua","Long Island","Mangrove Cay","Mayaguana","Moore's Island","New Providence","North Abaco","North Andros","North Eleuthera","Rum Cay","San Salvador","South Abaco","South Andros","South Eleuthera","South Grand Bahama","Spanish Wells","West Grand Bahama"]
  },
  {
    code: "BH", name: "Bahrain",
    states: ["Capital","Central","Muharraq","Northern","Southern"]
  },
  {
    code: "BD", name: "Bangladesh",
    states: ["Barisal","Chittagong","Dhaka","Khulna","Mymensingh","Rajshahi","Rangpur","Sylhet"]
  },
  {
    code: "BB", name: "Barbados",
    states: ["Christ Church","Saint Andrew","Saint George","Saint James","Saint John","Saint Joseph","Saint Lucy","Saint Michael","Saint Peter","Saint Philip","Saint Thomas"]
  },
  {
    code: "BY", name: "Belarus",
    states: ["Brest","Gomel","Grodno","Minsk","Mogilev","Vitebsk"]
  },
  {
    code: "BE", name: "Belgium",
    states: ["Antwerp","East Flanders","Flemish Brabant","Hainaut","Liège","Limburg","Luxembourg","Namur","Walloon Brabant","West Flanders","Brussels"]
  },
  {
    code: "BZ", name: "Belize",
    states: ["Belize","Cayo","Corozal","Orange Walk","Stann Creek","Toledo"]
  },
  {
    code: "BJ", name: "Benin",
    states: ["Alibori","Atakora","Atlantique","Borgou","Collines","Couffo","Donga","Littoral","Mono","Ouémé","Plateau","Zou"]
  },
  {
    code: "BT", name: "Bhutan",
    states: ["Bumthang","Chhukha","Dagana","Gasa","Haa","Lhuentse","Mongar","Paro","Pemagatshel","Punakha","Samdrup Jongkhar","Samtse","Sarpang","Thimphu","Trashigang","Trashiyangtse","Trongsa","Tsirang","Wangdue Phodrang","Zhemgang"]
  },
  {
    code: "BO", name: "Bolivia",
    states: ["Beni","Chuquisaca","Cochabamba","La Paz","Oruro","Pando","Potosí","Santa Cruz","Tarija"]
  },
  {
    code: "BA", name: "Bosnia and Herzegovina",
    states: ["Bosnian Podrinje Canton","Canton 10","Central Bosnia Canton","Federation of Bosnia and Herzegovina","Herzegovina-Neretva Canton","Posavina Canton","Republika Srpska","Sarajevo Canton","Tuzla Canton","Una-Sana Canton","West Herzegovina Canton","Zenica-Doboj Canton"]
  },
  {
    code: "BW", name: "Botswana",
    states: ["Central","Ghanzi","Kgalagadi","Kgatleng","Kweneng","North East","North West","South East","Southern"]
  },
  {
    code: "BR", name: "Brazil",
    states: ["Acre","Alagoas","Amapá","Amazonas","Bahia","Ceará","Distrito Federal","Espírito Santo","Goiás","Maranhão","Mato Grosso","Mato Grosso do Sul","Minas Gerais","Pará","Paraíba","Paraná","Pernambuco","Piauí","Rio de Janeiro","Rio Grande do Norte","Rio Grande do Sul","Rondônia","Roraima","Santa Catarina","São Paulo","Sergipe","Tocantins"]
  },
  {
    code: "BN", name: "Brunei",
    states: ["Belait","Brunei-Muara","Temburong","Tutong"]
  },
  {
    code: "BG", name: "Bulgaria",
    states: ["Blagoevgrad","Burgas","Dobrich","Gabrovo","Haskovo","Kardzhali","Kyustendil","Lovech","Montana","Pazardzhik","Pernik","Pleven","Plovdiv","Razgrad","Ruse","Shumen","Silistra","Sliven","Smolyan","Sofia","Sofia-City","Stara Zagora","Targovishte","Varna","Veliko Tarnovo","Vidin","Vratsa","Yambol"]
  },
  {
    code: "BF", name: "Burkina Faso",
    states: ["Boucle du Mouhoun","Cascades","Centre","Centre-Est","Centre-Nord","Centre-Ouest","Centre-Sud","Est","Hauts-Bassins","Nord","Plateau-Central","Sahel","Sud-Ouest"]
  },
  {
    code: "BI", name: "Burundi",
    states: ["Bubanza","Bujumbura Mairie","Bujumbura Rural","Bururi","Cankuzo","Cibitoke","Gitega","Karuzi","Kayanza","Kirundo","Makamba","Muramvya","Muyinga","Mwaro","Ngozi","Rumonge","Rutana","Ruyigi"]
  },
  {
    code: "CV", name: "Cabo Verde",
    states: ["Boa Vista","Brava","Maio","Mosteiros","Paul","Porto Novo","Praia","Ribeira Brava","Ribeira Grande","Ribeira Grande de Santiago","Sal","Santa Catarina","Santa Catarina do Fogo","Santa Cruz","São Domingos","São Filipe","São Lourenço dos Órgãos","São Miguel","São Roque do Fogo","São Salvador do Mundo","São Vicente","Tarrafal","Tarrafal de São Nicolau"]
  },
  {
    code: "KH", name: "Cambodia",
    states: ["Banteay Meanchey","Battambang","Kampong Cham","Kampong Chhnang","Kampong Speu","Kampong Thom","Kampot","Kandal","Kep","Koh Kong","Kratie","Mondulkiri","Oddar Meanchey","Pailin","Phnom Penh","Preah Sihanouk","Preah Vihear","Prey Veng","Pursat","Ratanakiri","Siem Reap","Stung Treng","Svay Rieng","Takeo","Tboung Khmum"]
  },
  {
    code: "CM", name: "Cameroon",
    states: ["Adamawa","Centre","East","Far North","Littoral","North","Northwest","South","Southwest","West"]
  },
  {
    code: "CA", name: "Canada",
    states: ["Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Northwest Territories","Nova Scotia","Nunavut","Ontario","Prince Edward Island","Quebec","Saskatchewan","Yukon"]
  },
  {
    code: "CF", name: "Central African Republic",
    states: ["Bamingui-Bangoran","Bangui","Basse-Kotto","Haute-Kotto","Haut-Mbomou","Kémo","Lobaye","Mambéré-Kadéï","Mbomou","Nana-Gribizi","Nana-Mambéré","Ombella-M'Poko","Ouaka","Ouham","Ouham-Pendé","Sangha-Mbaéré","Vakaga"]
  },
  {
    code: "TD", name: "Chad",
    states: ["Bahr el Gazel","Batha","Borkou","Chari-Baguirmi","Ennedi Est","Ennedi Ouest","Guéra","Hadjer-Lamis","Kanem","Lac","Logone Occidental","Logone Oriental","Mandoul","Mayo-Kebbi Est","Mayo-Kebbi Ouest","Moyen-Chari","N'Djamena","Ouaddaï","Salamat","Sila","Tandjilé","Tibesti","Wadi Fira"]
  },
  {
    code: "CL", name: "Chile",
    states: ["Antofagasta","Araucanía","Arica y Parinacota","Atacama","Aysén","Biobío","Coquimbo","Los Lagos","Los Ríos","Magallanes","Maule","Metropolitana","Nuble","O'Higgins","Tarapacá","Valparaíso"]
  },
  {
    code: "CN", name: "China",
    states: ["Anhui","Beijing","Chongqing","Fujian","Gansu","Guangdong","Guangxi","Guizhou","Hainan","Hebei","Heilongjiang","Henan","Hong Kong","Hubei","Hunan","Inner Mongolia","Jiangsu","Jiangxi","Jilin","Liaoning","Macau","Ningxia","Qinghai","Shaanxi","Shandong","Shanghai","Shanxi","Sichuan","Tianjin","Tibet","Xinjiang","Yunnan","Zhejiang"]
  },
  {
    code: "CO", name: "Colombia",
    states: ["Amazonas","Antioquia","Arauca","Atlántico","Bogotá D.C.","Bolívar","Boyacá","Caldas","Caquetá","Casanare","Cauca","Cesar","Chocó","Córdoba","Cundinamarca","Guainía","Guaviare","Huila","La Guajira","Magdalena","Meta","Nariño","Norte de Santander","Putumayo","Quindío","Risaralda","San Andrés y Providencia","Santander","Sucre","Tolima","Valle del Cauca","Vaupés","Vichada"]
  },
  {
    code: "KM", name: "Comoros",
    states: ["Anjouan","Grande Comore","Mohéli"]
  },
  {
    code: "CD", name: "Congo (DRC)",
    states: ["Bas-Uele","Équateur","Haut-Katanga","Haut-Lomami","Haut-Uele","Ituri","Kasaï","Kasaï-Central","Kasaï-Oriental","Kinshasa","Kongo Central","Kwango","Kwilu","Lomami","Lualaba","Maindombe","Maniema","Mongala","Nord-Kivu","Nord-Ubangi","Sankuru","Sud-Kivu","Sud-Ubangi","Tanganyika","Tshopo","Tshuapa"]
  },
  {
    code: "CG", name: "Congo (Republic)",
    states: ["Bouenza","Brazzaville","Cuvette","Cuvette-Ouest","Kouilou","Lékoumou","Likouala","Niari","Plateaux","Pointe-Noire","Pool","Sangha"]
  },
  {
    code: "CR", name: "Costa Rica",
    states: ["Alajuela","Cartago","Guanacaste","Heredia","Limón","Puntarenas","San José"]
  },
  {
    code: "CI", name: "Côte d'Ivoire",
    states: ["Abidjan","Bas-Sassandra","Comoé","Denguélé","Gôh-Djiboua","Lacs","Lagunes","Montagnes","Sassandra-Marahoué","Savanes","Vallée du Bandama","Woroba","Yamoussoukro","Zanzan"]
  },
  {
    code: "HR", name: "Croatia",
    states: ["Bjelovar-Bilogora","Brod-Posavina","Dubrovnik-Neretva","Istria","Karlovac","Koprivnica-Križevci","Krapina-Zagorje","Lika-Senj","Međimurje","Osijek-Baranja","Požega-Slavonia","Primorje-Gorski Kotar","Sisak-Moslavina","Split-Dalmatia","Šibenik-Knin","Varaždin","Virovitica-Podravina","Vukovar-Srijem","Zadar","Zagreb","Zagreb City"]
  },
  {
    code: "CU", name: "Cuba",
    states: ["Artemisa","Camagüey","Ciego de Ávila","Cienfuegos","Granma","Guantánamo","Holguín","Isla de la Juventud","La Habana","Las Tunas","Matanzas","Mayabeque","Pinar del Río","Sancti Spíritus","Santiago de Cuba","Villa Clara"]
  },
  {
    code: "CY", name: "Cyprus",
    states: ["Famagusta","Kyrenia","Larnaca","Limassol","Nicosia","Paphos"]
  },
  {
    code: "CZ", name: "Czech Republic",
    states: ["Central Bohemian","Hradec Králové","Karlovy Vary","Liberec","Moravian-Silesian","Olomouc","Pardubice","Plzeň","Prague","South Bohemian","South Moravian","Ústí nad Labem","Vysočina","Zlín"]
  },
  {
    code: "DK", name: "Denmark",
    states: ["Capital Region","Central Denmark","North Denmark","Region Zealand","Region of Southern Denmark"]
  },
  {
    code: "DJ", name: "Djibouti",
    states: ["Ali Sabieh","Arta","Dikhil","Djibouti","Obock","Tadjourah"]
  },
  {
    code: "DM", name: "Dominica",
    states: ["Saint Andrew","Saint David","Saint George","Saint John","Saint Joseph","Saint Luke","Saint Mark","Saint Patrick","Saint Paul","Saint Peter"]
  },
  {
    code: "DO", name: "Dominican Republic",
    states: ["Azua","Bahoruco","Barahona","Dajabón","Distrito Nacional","Duarte","El Seibo","Elías Piña","Espaillat","Hato Mayor","Hermanas Mirabal","Independencia","La Altagracia","La Romana","La Vega","María Trinidad Sánchez","Monseñor Nouel","Monte Cristi","Monte Plata","Pedernales","Peravia","Puerto Plata","Samaná","San Cristóbal","San José de Ocoa","San Juan","San Pedro de Macorís","Sánchez Ramírez","Santiago","Santiago Rodríguez","Santo Domingo","Valverde"]
  },
  {
    code: "EC", name: "Ecuador",
    states: ["Azuay","Bolívar","Cañar","Carchi","Chimborazo","Cotopaxi","El Oro","Esmeraldas","Galápagos","Guayas","Imbabura","Loja","Los Ríos","Manabí","Morona Santiago","Napo","Orellana","Pastaza","Pichincha","Santa Elena","Santo Domingo de los Tsáchilas","Sucumbíos","Tungurahua","Zamora Chinchipe"]
  },
  {
    code: "EG", name: "Egypt",
    states: ["Alexandria","Aswan","Asyut","Beheira","Beni Suef","Cairo","Dakahlia","Damietta","Faiyum","Gharbia","Giza","Ismailia","Kafr el-Sheikh","Luxor","Matruh","Minya","Monufia","New Valley","North Sinai","Port Said","Qalyubia","Qena","Red Sea","Sharqia","Sohag","South Sinai","Suez"]
  },
  {
    code: "SV", name: "El Salvador",
    states: ["Ahuachapán","Cabañas","Chalatenango","Cuscatlán","La Libertad","La Paz","La Unión","Morazán","San Miguel","San Salvador","San Vicente","Santa Ana","Sonsonate","Usulután"]
  },
  {
    code: "GQ", name: "Equatorial Guinea",
    states: ["Annobón","Bioko Norte","Bioko Sur","Centro Sur","Djibloho","Kié-Ntem","Litoral","Wele-Nzas"]
  },
  {
    code: "ER", name: "Eritrea",
    states: ["Anseba","Debub","Gash-Barka","Maekel","Northern Red Sea","Southern Red Sea"]
  },
  {
    code: "EE", name: "Estonia",
    states: ["Harju","Hiiu","Ida-Viru","Järva","Jõgeva","Lääne","Lääne-Viru","Põlva","Pärnu","Rapla","Saare","Tartu","Valga","Viljandi","Võru"]
  },
  {
    code: "SZ", name: "Eswatini",
    states: ["Hhohho","Lubombo","Manzini","Shiselweni"]
  },
  {
    code: "ET", name: "Ethiopia",
    states: ["Addis Ababa","Afar","Amhara","Benishangul-Gumuz","Dire Dawa","Gambela","Harari","Oromia","Sidama","Somali","South West Ethiopia Peoples","Southern Nations Nationalities and Peoples","Tigray"]
  },
  {
    code: "FJ", name: "Fiji",
    states: ["Ba","Bua","Cakaudrove","Kadavu","Lau","Lomaiviti","Macuata","Nadroga-Navosa","Naitasiri","Namosi","Ra","Rewa","Serua","Tailevu"]
  },
  {
    code: "FI", name: "Finland",
    states: ["Åland Islands","Central Finland","Central Ostrobothnia","Finland Proper","Kainuu","Kymenlaakso","Lapland","North Karelia","North Ostrobothnia","North Savo","Ostrobothnia","Päijänne Tavastia","Pirkanmaa","Satakunta","South Karelia","South Ostrobothnia","South Savo","Tavastia Proper","Uusimaa"]
  },
  {
    code: "FR", name: "France",
    states: ["Auvergne-Rhône-Alpes","Bourgogne-Franche-Comté","Bretagne","Centre-Val de Loire","Corse","Grand Est","Guadeloupe","Guyane","Hauts-de-France","Île-de-France","La Réunion","Martinique","Mayotte","Normandie","Nouvelle-Aquitaine","Occitanie","Pays de la Loire","Provence-Alpes-Côte d'Azur"]
  },
  {
    code: "GA", name: "Gabon",
    states: ["Estuaire","Haut-Ogooué","Moyen-Ogooué","Ngounié","Nyanga","Ogooué-Ivindo","Ogooué-Lolo","Ogooué-Maritime","Woleu-Ntem"]
  },
  {
    code: "GM", name: "Gambia",
    states: ["Banjul","Central River","Lower River","North Bank","Upper River","West Coast"]
  },
  {
    code: "GE", name: "Georgia",
    states: ["Adjara","Guria","Imereti","Kakheti","Kvemo Kartli","Mtskheta-Mtianeti","Racha-Lechkhumi and Kvemo Svaneti","Samegrelo-Zemo Svaneti","Samtskhe-Javakheti","Shida Kartli","Tbilisi"]
  },
  {
    code: "DE", name: "Germany",
    states: ["Baden-Württemberg","Bavaria","Berlin","Brandenburg","Bremen","Hamburg","Hesse","Lower Saxony","Mecklenburg-Vorpommern","North Rhine-Westphalia","Rhineland-Palatinate","Saarland","Saxony","Saxony-Anhalt","Schleswig-Holstein","Thuringia"]
  },
  {
    code: "GH", name: "Ghana",
    states: ["Ahafo","Ashanti","Bono","Bono East","Central","Eastern","Greater Accra","North East","Northern","Oti","Savannah","Upper East","Upper West","Volta","Western","Western North"]
  },
  {
    code: "GR", name: "Greece",
    states: ["Attica","Central Greece","Central Macedonia","Crete","Eastern Macedonia and Thrace","Epirus","Ionian Islands","North Aegean","Peloponnese","South Aegean","Thessaly","Western Greece","Western Macedonia"]
  },
  {
    code: "GD", name: "Grenada",
    states: ["Carriacou and Petite Martinique","Saint Andrew","Saint David","Saint George","Saint John","Saint Mark","Saint Patrick"]
  },
  {
    code: "GT", name: "Guatemala",
    states: ["Alta Verapaz","Baja Verapaz","Chimaltenango","Chiquimula","El Progreso","Escuintla","Guatemala","Huehuetenango","Izabal","Jalapa","Jutiapa","Petén","Quetzaltenango","Quiché","Retalhuleu","Sacatepéquez","San Marcos","Santa Rosa","Sololá","Suchitepéquez","Totonicapán","Zacapa"]
  },
  {
    code: "GN", name: "Guinea",
    states: ["Beyla","Boffa","Boké","Conakry","Coyah","Dabola","Dalaba","Dinguiraye","Dubréka","Faranah","Forécariah","Fria","Gaoual","Guékédou","Kankan","Kérouané","Kindia","Kissidougou","Koubia","Koundara","Kouroussa","Labé","Lélouma","Lola","Macenta","Mali","Mamou","Mandiana","Nzérékoré","Pita","Siguiri","Télimélé","Tougué","Yomou"]
  },
  {
    code: "GW", name: "Guinea-Bissau",
    states: ["Bafatá","Biombo","Bissau","Bolama","Cacheu","Gabú","Oio","Quinara","Tombali"]
  },
  {
    code: "GY", name: "Guyana",
    states: ["Barima-Waini","Cuyuni-Mazaruni","Demerara-Mahaica","East Berbice-Corentyne","Essequibo Islands-West Demerara","Mahaica-Berbice","Pomeroon-Supenaam","Potaro-Siparuni","Upper Demerara-Berbice","Upper Takutu-Upper Essequibo"]
  },
  {
    code: "HT", name: "Haiti",
    states: ["Artibonite","Centre","Grand'Anse","Nippes","Nord","Nord-Est","Nord-Ouest","Ouest","Sud","Sud-Est"]
  },
  {
    code: "HN", name: "Honduras",
    states: ["Atlántida","Choluteca","Colón","Comayagua","Copán","Cortés","El Paraíso","Francisco Morazán","Gracias a Dios","Intibucá","Islas de la Bahía","La Paz","Lempira","Ocotepeque","Olancho","Santa Bárbara","Valle","Yoro"]
  },
  {
    code: "HU", name: "Hungary",
    states: ["Bács-Kiskun","Baranya","Békés","Borsod-Abaúj-Zemplén","Budapest","Csongrád-Csanád","Fejér","Győr-Moson-Sopron","Hajdú-Bihar","Heves","Jász-Nagykun-Szolnok","Komárom-Esztergom","Nógrád","Pest","Somogy","Szabolcs-Szatmár-Bereg","Tolna","Vas","Veszprém","Zala"]
  },
  {
    code: "IS", name: "Iceland",
    states: ["Capital Region","Eastern","Northeastern","Northwestern","Reykjanes","Southern","Southern Peninsula","Western","Westfjords"]
  },
  {
    code: "IN", name: "India",
    states: ["Andaman and Nicobar Islands","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chandigarh","Chhattisgarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir","Jharkhand","Karnataka","Kerala","Ladakh","Lakshadweep","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"]
  },
  {
    code: "ID", name: "Indonesia",
    states: ["Aceh","Bali","Bangka Belitung","Banten","Bengkulu","Central Java","Central Kalimantan","Central Sulawesi","East Java","East Kalimantan","East Nusa Tenggara","Gorontalo","Jakarta","Jambi","Lampung","Maluku","North Kalimantan","North Maluku","North Sulawesi","North Sumatra","Papua","Riau","Riau Islands","South Kalimantan","South Sulawesi","South Sumatra","Southeast Sulawesi","West Java","West Kalimantan","West Nusa Tenggara","West Papua","West Sulawesi","West Sumatra","Yogyakarta"]
  },
  {
    code: "IR", name: "Iran",
    states: ["Alborz","Ardabil","Bushehr","Chaharmahal and Bakhtiari","East Azerbaijan","Fars","Gilan","Golestan","Hamadan","Hormozgan","Ilam","Isfahan","Kerman","Kermanshah","Khuzestan","Kohgiluyeh and Boyer-Ahmad","Kurdistan","Lorestan","Markazi","Mazandaran","North Khorasan","Qazvin","Qom","Razavi Khorasan","Semnan","Sistan and Baluchestan","South Khorasan","Tehran","West Azerbaijan","Yazd","Zanjan"]
  },
  {
    code: "IQ", name: "Iraq",
    states: ["Al Anbar","Al Muthanna","Al-Qādisiyyah","An Najaf","Babil","Baghdad","Basra","Dahuk","Dhi Qar","Diyala","Dohuk","Erbil","Halabja","Karbala","Kirkuk","Maysan","Nineveh","Saladin","Sulaymaniyah","Wasit"]
  },
  {
    code: "IE", name: "Ireland",
    states: ["Carlow","Cavan","Clare","Cork","Donegal","Dublin","Galway","Kerry","Kildare","Kilkenny","Laois","Leitrim","Limerick","Longford","Louth","Mayo","Meath","Monaghan","Offaly","Roscommon","Sligo","Tipperary","Waterford","Westmeath","Wexford","Wicklow"]
  },
  {
    code: "IL", name: "Israel",
    states: ["Central","Haifa","Jerusalem","Northern","Southern","Tel Aviv"]
  },
  {
    code: "IT", name: "Italy",
    states: ["Abruzzo","Aosta Valley","Apulia","Basilicata","Calabria","Campania","Emilia-Romagna","Friuli-Venezia Giulia","Lazio","Liguria","Lombardy","Marche","Molise","Piedmont","Sardinia","Sicily","Trentino-South Tyrol","Tuscany","Umbria","Veneto"]
  },
  {
    code: "JM", name: "Jamaica",
    states: ["Clarendon","Hanover","Kingston","Manchester","Portland","Saint Andrew","Saint Ann","Saint Catherine","Saint Elizabeth","Saint James","Saint Mary","Saint Thomas","Trelawny","Westmoreland"]
  },
  {
    code: "JP", name: "Japan",
    states: ["Aichi","Akita","Aomori","Chiba","Ehime","Fukui","Fukuoka","Fukushima","Gifu","Gunma","Hiroshima","Hokkaido","Hyogo","Ibaraki","Ishikawa","Iwate","Kagawa","Kagoshima","Kanagawa","Kochi","Kumamoto","Kyoto","Mie","Miyagi","Miyazaki","Nagano","Nagasaki","Nara","Niigata","Oita","Okayama","Okinawa","Osaka","Saga","Saitama","Shiga","Shimane","Shizuoka","Tochigi","Tokushima","Tokyo","Tottori","Toyama","Wakayama","Yamagata","Yamaguchi","Yamanashi"]
  },
  {
    code: "JO", name: "Jordan",
    states: ["Ajloun","Amman","Aqaba","Balqa","Irbid","Jerash","Karak","Ma'an","Madaba","Mafraq","Tafilah","Zarqa"]
  },
  {
    code: "KZ", name: "Kazakhstan",
    states: ["Akmola","Aktobe","Almaty","Almaty City","Astana","Atyrau","East Kazakhstan","Jambyl","Karaganda","Kostanay","Kyzylorda","Mangystau","North Kazakhstan","Pavlodar","Shymkent","Turkistan","West Kazakhstan"]
  },
  {
    code: "KE", name: "Kenya",
    states: ["Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa","Homa Bay","Isiolo","Kajiado","Kakamega","Kericho","Kiambu","Kilifi","Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos","Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Murang'a","Nairobi","Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri","Samburu","Siaya","Taita-Taveta","Tana River","Tharaka-Nithi","Trans-Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot"]
  },
  {
    code: "KI", name: "Kiribati",
    states: ["Gilbert Islands","Line Islands","Phoenix Islands"]
  },
  {
    code: "KP", name: "North Korea",
    states: ["Chagang","Hamgyong North","Hamgyong South","Hwanghae North","Hwanghae South","Kangwon","North Pyongan","Pyongyang","Rason","Ryanggang","South Pyongan","South Hamgyong"]
  },
  {
    code: "KR", name: "South Korea",
    states: ["Busan","Chungcheongbuk-do","Chungcheongnam-do","Daegu","Daejeon","Gangwon-do","Gwangju","Gyeonggi-do","Gyeongsangbuk-do","Gyeongsangnam-do","Incheon","Jeju","Jeollabuk-do","Jeollanam-do","Sejong","Seoul","Ulsan"]
  },
  {
    code: "XK", name: "Kosovo",
    states: ["Đakovica","Gnjilane","Kosovo Mitrovica","Peć","Pristina","Prizren","Uroševac"]
  },
  {
    code: "KW", name: "Kuwait",
    states: ["Ahmadi","Al Asimah","Farwaniyah","Hawalli","Jahra","Mubarak Al-Kabeer"]
  },
  {
    code: "KG", name: "Kyrgyzstan",
    states: ["Batken","Bishkek","Chuy","Issyk-Kul","Jalal-Abad","Naryn","Osh City","Osh","Talas"]
  },
  {
    code: "LA", name: "Laos",
    states: ["Attapeu","Bokeo","Bolikhamsai","Champasak","Houaphanh","Khammouane","Luang Namtha","Luang Prabang","Oudomxay","Phongsaly","Sainyabuli","Salavan","Savannakhet","Sekong","Vientiane","Vientiane Prefecture","Xaisomboun","Xekong","Xiangkhouang"]
  },
  {
    code: "LV", name: "Latvia",
    states: ["Aglona","Aizkraukle","Aizpute","Aknīste","Aloja","Alsunga","Alūksne","Amata","Ape","Auce","Ādaži","Babīte","Baldone","Baltinava","Balvi","Bauska","Beverīna","Brocēni","Burtnieki","Carnikava","Cesvaine","Cēsis","Cibla","Dagda","Daugavpils","Dobele","Dundaga","Durbe","Engure","Ērgļi","Garkalne","Grobiņa","Gulbene","Iecava","Ikšķile","Ilūkste","Inčukalns","Jaunjelgava","Jaunpiebalga","Jaunpils","Jēkabpils","Jelgava","Jelgavas","Jēkabpils","Jūrmala","Kandava","Kārsava","Kocēni","Koknese","Krāslava","Krimulda","Krustpils","Kuldīga","Ķegums","Ķekava","Lielvārde","Limbaži","Līgatne","Līvāni","Lubāna","Ludza","Madona","Mālpils","Mārupe","Mazsalaca","Mērsrags","Naukšēni","Neretas","Nīca","Ogre","Olaine","Ozolnieki","Pārgauja","Pāvilosta","Pļaviņas","Preiļi","Priekule","Priekuļi","Rauna","Rēzekne","Riebiņi","Rīga","Roja","Ropaži","Rucava","Rugāji","Rūjiena","Rundāle","Sala","Salacgrīva","Salaspils","Saldus","Saulkrasti","Sēja","Sigulda","Skrīveri","Skrunda","Smiltene","Stopiņi","Strenči","Talsi","Tērvete","Tukums","Vaiņode","Valka","Valmiera","Varakļāni","Vārkava","Vecpiebalga","Vecumnieki","Ventspils","Viesīte","Viļaka","Viļāni","Zilupe"]
  },
  {
    code: "LB", name: "Lebanon",
    states: ["Akkar","Baalbek-Hermel","Beirut","Beqaa","Mount Lebanon","Nabatieh","North Lebanon","South Lebanon"]
  },
  {
    code: "LS", name: "Lesotho",
    states: ["Berea","Butha-Buthe","Leribe","Mafeteng","Maseru","Mohale's Hoek","Mokhotlong","Qacha's Nek","Quthing","Thaba-Tseka"]
  },
  {
    code: "LR", name: "Liberia",
    states: ["Bomi","Bong","Gbarpolu","Grand Bassa","Grand Cape Mount","Grand Gedeh","Grand Kru","Lofa","Margibi","Maryland","Montserrado","Nimba","River Cess","River Gee","Sinoe"]
  },
  {
    code: "LY", name: "Libya",
    states: ["Al Butnan","Al Jabal al Akhdar","Al Jabal al Gharbi","Al Jafara","Al Jufrah","Al Kufrah","Al Marj","Al Marqab","Al Wahat","An Nuqat al Khams","Az Zawiya","Benghazi","Derna","Ghat","Misrata","Murzuq","Nalut","Sabha","Surt","Tripoli","Wadi al Hayaa","Wadi al Shatii","Zuwarah"]
  },
  {
    code: "LI", name: "Liechtenstein",
    states: ["Balzers","Eschen","Gamprin","Mauren","Planken","Ruggell","Schaan","Schellenberg","Triesen","Triesenberg","Vaduz"]
  },
  {
    code: "LT", name: "Lithuania",
    states: ["Alytus","Kaunas","Klaipėda","Marijampolė","Panevėžys","Šiauliai","Tauragė","Telšiai","Utena","Vilnius"]
  },
  {
    code: "LU", name: "Luxembourg",
    states: ["Capellen","Clervaux","Diekirch","Echternach","Esch-sur-Alzette","Grevenmacher","Luxembourg","Mersch","Redange","Remich","Vianden","Wiltz"]
  },
  {
    code: "MG", name: "Madagascar",
    states: ["Alaotra-Mangoro","Amoron'i Mania","Analamanga","Analanjirofo","Androy","Anosy","Atsimo-Andrefana","Atsimo-Atsinanana","Atsinanana","Betsiboka","Boeny","Bongolava","Diana","Haute Matsiatra","Ihorombe","Itasy","Melaky","Menabe","Sava","Sofia","Vakinankaratra","Vatovavy-Fitovinany"]
  },
  {
    code: "MW", name: "Malawi",
    states: ["Balaka","Blantyre","Chikwawa","Chiradzulu","Chitipa","Dedza","Dowa","Karonga","Kasungu","Likoma","Lilongwe","Machinga","Mangochi","Mchinji","Mulanje","Mwanza","Mzimba","Neno","Nkhata Bay","Nkhotakota","Nsanje","Ntcheu","Ntchisi","Phalombe","Rumphi","Salima","Thyolo","Zomba"]
  },
  {
    code: "MY", name: "Malaysia",
    states: ["Johor","Kedah","Kelantan","Kuala Lumpur","Labuan","Malacca","Negeri Sembilan","Pahang","Penang","Perak","Perlis","Putrajaya","Sabah","Sarawak","Selangor","Terengganu"]
  },
  {
    code: "MV", name: "Maldives",
    states: ["Addu City","Fuvahmulah","Malé","North Central Province","North Province","South Central Province","South Province","Upper North Province","Upper South Province"]
  },
  {
    code: "ML", name: "Mali",
    states: ["Bamako","Gao","Kayes","Kidal","Koulikoro","Ménaka","Mopti","Ségou","Sikasso","Taoudénit","Tombouctou"]
  },
  {
    code: "MT", name: "Malta",
    states: ["Gozo","Malta"]
  },
  {
    code: "MH", name: "Marshall Islands",
    states: ["Ailinglaplap","Ailuk","Arno","Aur","Bikini","Ebon","Enewetak","Jabat","Jaluit","Kili","Kwajalein","Lae","Lib","Likiep","Majuro","Maloelap","Mejit","Mili","Namdrik","Namu","Rongelap","Ujae","Ujelang","Utirik","Wotho","Wotje"]
  },
  {
    code: "MR", name: "Mauritania",
    states: ["Adrar","Assaba","Brakna","Dakhlet Nouadhibou","Gorgol","Guidimaka","Hodh Ech Chargui","Hodh El Gharbi","Inchiri","Nouakchott Nord","Nouakchott Ouest","Nouakchott Sud","Tagant","Tiris Zemmour","Trarza"]
  },
  {
    code: "MU", name: "Mauritius",
    states: ["Agaléga","Black River","Cargados Carajos","Flacq","Grand Port","Moka","Pamplemousses","Plaines Wilhems","Port Louis","Rivière du Rempart","Rodrigues","Savanne"]
  },
  {
    code: "MX", name: "Mexico",
    states: ["Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Guanajuato","Guerrero","Hidalgo","Jalisco","México","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas"]
  },
  {
    code: "FM", name: "Micronesia",
    states: ["Chuuk","Kosrae","Pohnpei","Yap"]
  },
  {
    code: "MD", name: "Moldova",
    states: ["Anenii Noi","Basarabeasca","Briceni","Cahul","Călărași","Cantemir","Căușeni","Cimișlia","Criuleni","Dondușeni","Drochia","Dubăsari","Edineț","Fălești","Florești","Gagauzia","Glodeni","Hîncești","Ialoveni","Leova","Nisporeni","Ocnița","Orhei","Rezina","Rîșcani","Sîngerei","Șoldănești","Soroca","Ștefan Vodă","Strășeni","Taraclia","Telenești","Transnistria","Ungheni"]
  },
  {
    code: "MC", name: "Monaco",
    states: ["Monaco"]
  },
  {
    code: "MN", name: "Mongolia",
    states: ["Arkhangai","Bayan-Ölgii","Bayankhongor","Bulgan","Darkhan-Uul","Dornod","Dornogovi","Dundgovi","Govi-Altai","Govisümber","Khentii","Khovd","Khövsgöl","Ömnögovi","Orkhon","Övörkhangai","Selenge","Sükhbaatar","Töv","Ulaanbaatar","Uvs","Zavkhan"]
  },
  {
    code: "ME", name: "Montenegro",
    states: ["Andrijevica","Bar","Berane","Bijelo Polje","Budva","Cetinje","Danilovgrad","Gusinje","Herceg Novi","Kolašin","Kotor","Mojkovac","Nikšić","Petnjica","Plav","Pljevlja","Plužine","Podgorica","Rožaje","Šavnik","Tivat","Tuzi","Ulcinj","Žabljak"]
  },
  {
    code: "MA", name: "Morocco",
    states: ["Béni Mellal-Khénifra","Casablanca-Settat","Dakhla-Oued Ed-Dahab","Drâa-Tafilalet","Fès-Meknès","Guelmim-Oued Noun","L'Oriental","Laâyoune-Sakia El Hamra","Marrakech-Safi","Rabat-Salé-Kénitra","Souss-Massa","Tanger-Tétouan-Al Hoceïma"]
  },
  {
    code: "MZ", name: "Mozambique",
    states: ["Cabo Delgado","Gaza","Inhambane","Manica","Maputo","Maputo City","Nampula","Niassa","Sofala","Tete","Zambezia"]
  },
  {
    code: "MM", name: "Myanmar",
    states: ["Ayeyarwady","Bago","Chin","Kachin","Kayah","Kayin","Magway","Mandalay","Mon","Naypyidaw","Rakhine","Sagaing","Shan","Tanintharyi","Yangon"]
  },
  {
    code: "NA", name: "Namibia",
    states: ["//Karas","Erongo","Hardap","Kavango East","Kavango West","Khomas","Kunene","Ohangwena","Omaheke","Omusati","Oshana","Oshikoto","Otjozondjupa","Zambezi"]
  },
  {
    code: "NR", name: "Nauru",
    states: ["Aiwo","Anabar","Anetan","Anibare","Baiti","Boe","Buada","Denigomodu","Ewa","Ijuw","Meneng","Nibok","Uaboe","Yaren"]
  },
  {
    code: "NP", name: "Nepal",
    states: ["Bagmati","Gandaki","Karnali","Koshi","Lumbini","Madhesh","Sudurpashchim"]
  },
  {
    code: "NL", name: "Netherlands",
    states: ["Drenthe","Flevoland","Friesland","Gelderland","Groningen","Limburg","North Brabant","North Holland","Overijssel","South Holland","Utrecht","Zeeland"]
  },
  {
    code: "NZ", name: "New Zealand",
    states: ["Auckland","Bay of Plenty","Canterbury","Gisborne","Hawke's Bay","Manawatu-Wanganui","Marlborough","Nelson","Northland","Otago","Southland","Taranaki","Tasman","Waikato","Wellington","West Coast"]
  },
  {
    code: "NI", name: "Nicaragua",
    states: ["Boaco","Carazo","Chinandega","Chontales","Costa Caribe Norte","Costa Caribe Sur","Estelí","Granada","Jinotega","León","Madriz","Managua","Masaya","Matagalpa","Nueva Segovia","Río San Juan","Rivas"]
  },
  {
    code: "NE", name: "Niger",
    states: ["Agadez","Diffa","Dosso","Maradi","Niamey","Tahoua","Tillabéri","Zinder"]
  },
  {
    code: "NG", name: "Nigeria",
    states: ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Federal Capital Territory","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"]
  },
  {
    code: "NO", name: "Norway",
    states: ["Agder","Innlandet","Møre og Romsdal","Nordland","Oslo","Rogaland","Svalbard","Troms og Finnmark","Trøndelag","Vestfold og Telemark","Vestland","Viken"]
  },
  {
    code: "OM", name: "Oman",
    states: ["Ad Dakhiliyah","Ad Dhahirah","Al Batinah North","Al Batinah South","Al Buraimi","Al Wusta","Ash Sharqiyah North","Ash Sharqiyah South","Dhofar","Musandam","Muscat"]
  },
  {
    code: "PK", name: "Pakistan",
    states: ["Azad Kashmir","Balochistan","Federal Capital Area","Gilgit-Baltistan","Khyber Pakhtunkhwa","Punjab","Sindh"]
  },
  {
    code: "PW", name: "Palau",
    states: ["Aimeliik","Airai","Angaur","Hatohobei","Kayangel","Koror","Melekeok","Ngaraard","Ngarchelong","Ngardmau","Ngatpang","Ngchesar","Ngeremlengui","Ngiwal","Peleliu","Sonsorol"]
  },
  {
    code: "PS", name: "Palestine",
    states: ["Gaza Strip","West Bank"]
  },
  {
    code: "PA", name: "Panama",
    states: ["Bocas del Toro","Chiriquí","Coclé","Colón","Darién","Emberá","Guna Yala","Herrera","Los Santos","Naso Tjër Di","Ngäbe-Buglé","Panamá","Panamá Oeste","Veraguas"]
  },
  {
    code: "PG", name: "Papua New Guinea",
    states: ["Bougainville","Central","Chimbu","East New Britain","East Sepik","Eastern Highlands","Enga","Gulf","Hela","Jiwaka","Madang","Manus","Milne Bay","Morobe","National Capital","New Ireland","Northern","Sandaun","Southern Highlands","West New Britain","West Sepik","Western","Western Highlands"]
  },
  {
    code: "PY", name: "Paraguay",
    states: ["Alto Paraguay","Alto Paraná","Amambay","Asunción","Boquerón","Caaguazú","Caazapá","Canindeyú","Central","Concepción","Cordillera","Guairá","Itapúa","Misiones","Ñeembucú","Paraguarí","Presidente Hayes","San Pedro"]
  },
  {
    code: "PE", name: "Peru",
    states: ["Amazonas","Áncash","Apurímac","Arequipa","Ayacucho","Cajamarca","Callao","Cusco","Huancavelica","Huánuco","Ica","Junín","La Libertad","Lambayeque","Lima","Loreto","Madre de Dios","Moquegua","Pasco","Piura","Puno","San Martín","Tacna","Tumbes","Ucayali"]
  },
  {
    code: "PH", name: "Philippines",
    states: ["Abra","Agusan del Norte","Agusan del Sur","Aklan","Albay","Antique","Apayao","Aurora","Basilan","Bataan","Batanes","Batangas","Benguet","Biliran","Bohol","Bukidnon","Bulacan","Cagayan","Camarines Norte","Camarines Sur","Camiguin","Capiz","Catanduanes","Cavite","Cebu","Compostela Valley","Cotabato","Davao del Norte","Davao del Sur","Davao Occidental","Davao Oriental","Dinagat Islands","Eastern Samar","Guimaras","Ifugao","Ilocos Norte","Ilocos Sur","Iloilo","Isabela","Kalinga","La Union","Laguna","Lanao del Norte","Lanao del Sur","Leyte","Maguindanao","Marinduque","Masbate","Metro Manila","Misamis Occidental","Misamis Oriental","Mountain Province","Negros Occidental","Negros Oriental","Northern Samar","Nueva Ecija","Nueva Vizcaya","Occidental Mindoro","Oriental Mindoro","Palawan","Pampanga","Pangasinan","Quezon","Quirino","Rizal","Romblon","Samar","Sarangani","Siquijor","Sorsogon","South Cotabato","Southern Leyte","Sultan Kudarat","Sulu","Surigao del Norte","Surigao del Sur","Tarlac","Tawi-Tawi","Zambales","Zamboanga del Norte","Zamboanga del Sur","Zamboanga Sibugay"]
  },
  {
    code: "PL", name: "Poland",
    states: ["Greater Poland","Holy Cross","Kuyavian-Pomeranian","Lesser Poland","Lodz","Lower Silesian","Lublin","Lubusz","Masovian","Opole","Podlaskie","Pomeranian","Silesian","Subcarpathian","Warmian-Masurian","West Pomeranian"]
  },
  {
    code: "PT", name: "Portugal",
    states: ["Aveiro","Azores","Beja","Braga","Bragança","Castelo Branco","Coimbra","Évora","Faro","Guarda","Leiria","Lisbon","Madeira","Portalegre","Porto","Santarém","Setúbal","Viana do Castelo","Vila Real","Viseu"]
  },
  {
    code: "QA", name: "Qatar",
    states: ["Al Daayen","Al Khor","Al Rayyan","Al Shamal","Al Wakrah","Doha","Madinat ash Shamal","Umm Salal"]
  },
  {
    code: "RO", name: "Romania",
    states: ["Alba","Arad","Argeș","Bacău","Bihor","Bistrița-Năsăud","Botoșani","Brăila","Brașov","București","Buzău","Călărași","Caraș-Severin","Cluj","Constanța","Covasna","Dâmbovița","Dolj","Galați","Giurgiu","Gorj","Harghita","Hunedoara","Ialomița","Iași","Ilfov","Maramureș","Mehedinți","Mureș","Neamț","Olt","Prahova","Sălaj","Satu Mare","Sibiu","Suceava","Teleorman","Timiș","Tulcea","Vâlcea","Vaslui","Vrancea"]
  },
  {
    code: "RU", name: "Russia",
    states: ["Altai Krai","Altai Republic","Amur","Arkhangelsk","Astrakhan","Bashkortostan","Belgorod","Bryansk","Buryatia","Chechnya","Chelyabinsk","Chukotka","Chuvashia","Dagestan","Ingushetia","Irkutsk","Ivanovo","Jewish Autonomous Oblast","Kabardino-Balkaria","Kaliningrad","Kalmykia","Kaluga","Kamchatka","Karachay-Cherkessia","Karelia","Kemerovo","Khabarovsk","Khakassia","Khanty-Mansiysk","Kirov","Komi","Kostroma","Krasnodar","Krasnoyarsk","Kurgan","Kursk","Leningrad","Lipetsk","Magadan","Mari El","Mordovia","Moscow","Moscow City","Murmansk","Nenets","Nizhny Novgorod","North Ossetia","Novosibirsk","Omsk","Orel","Orenburg","Penza","Perm","Primorsky","Pskov","Rostov","Ryazan","Saint Petersburg","Sakha","Sakhalin","Samara","Saratov","Smolensk","Stavropol","Sverdlovsk","Tambov","Tatarstan","Tomsk","Tula","Tuva","Tver","Tyumen","Udmurtia","Ulyanovsk","Vladimir","Volgograd","Vologda","Voronezh","Yamalo-Nenets","Yaroslavl","Zabaykalsky"]
  },
  {
    code: "RW", name: "Rwanda",
    states: ["Eastern","Kigali","Northern","Southern","Western"]
  },
  {
    code: "KN", name: "Saint Kitts and Nevis",
    states: ["Christ Church Nichola Town","Nevis","Saint Anne Sandy Point","Saint George Basseterre","Saint George Gingerland","Saint James Windward","Saint John Capesterre","Saint John Figtree","Saint Mary Cayon","Saint Paul Capesterre","Saint Paul Charlestown","Saint Peter Basseterre","Saint Thomas Lowland","Saint Thomas Middle Island","Trinity Palmetto Point"]
  },
  {
    code: "LC", name: "Saint Lucia",
    states: ["Anse la Raye","Canaries","Castries","Choiseul","Dennery","Gros Islet","Laborie","Micoud","Soufrière","Vieux Fort"]
  },
  {
    code: "VC", name: "Saint Vincent and the Grenadines",
    states: ["Charlotte","Grenadines","Saint Andrew","Saint David","Saint George","Saint Patrick"]
  },
  {
    code: "WS", name: "Samoa",
    states: ["A'ana","Aiga-i-le-Tai","Atua","Fa'asaleleaga","Gaga'emauga","Gaga'ifomauga","Palauli","Satupa'itea","Tuamasaga","Va'a-o-Fonoti","Vaisigano"]
  },
  {
    code: "SM", name: "San Marino",
    states: ["Acquaviva","Borgo Maggiore","Chiesanuova","Domagnano","Faetano","Fiorentino","Montegiardino","San Marino","Serravalle"]
  },
  {
    code: "ST", name: "São Tomé and Príncipe",
    states: ["Príncipe","São Tomé"]
  },
  {
    code: "SA", name: "Saudi Arabia",
    states: ["Al-Bahah","Al-Jawf","Al-Madinah","Al-Qassim","Asir","Eastern Province","Ha'il","Jazan","Mecca","Najran","Northern Borders","Riyadh","Tabuk"]
  },
  {
    code: "SN", name: "Senegal",
    states: ["Dakar","Diourbel","Fatick","Kaffrine","Kaolack","Kédougou","Kolda","Louga","Matam","Saint-Louis","Sédhiou","Tambacounda","Thiès","Ziguinchor"]
  },
  {
    code: "RS", name: "Serbia",
    states: ["Belgrade","Bor","Braničevo","Jablanica","Kolubara","Mačva","Moravica","Nišava","Pčinja","Pirot","Podunavlje","Pomoravlje","Rasina","Raška","South Bačka","South Banat","Šumadija","Toplica","Vojvodina","Zaječar","Zlatibor"]
  },
  {
    code: "SC", name: "Seychelles",
    states: ["Anse aux Pins","Anse Boileau","Anse Etoile","Anse Royale","Baie Lazare","Baie Sainte Anne","Beau Vallon","Bel Air","Bel Ombre","Cascade","Glacis","Grand Anse Mahe","Grand Anse Praslin","Inner Islands","La Digue","La Riviere Anglaise","Les Mamelles","Mont Buxton","Mont Fleuri","Plaisance","Pointe Larue","Port Glaud","Roche Caiman","Saint Louis","Takamaka"]
  },
  {
    code: "SL", name: "Sierra Leone",
    states: ["Eastern","North West","Northern","Southern","Western Area"]
  },
  {
    code: "SG", name: "Singapore",
    states: ["Central Singapore","North East","North West","South East","South West"]
  },
  {
    code: "SK", name: "Slovakia",
    states: ["Banská Bystrica","Bratislava","Košice","Nitra","Prešov","Trenčín","Trnava","Žilina"]
  },
  {
    code: "SI", name: "Slovenia",
    states: ["Carinthia","Central Slovenia","Coastal–Karst","Drava","Littoral–Inner Carniola","Lower Sava","Savinja","Southeastern Slovenia","Upper Carniola","Upper Sava"]
  },
  {
    code: "SB", name: "Solomon Islands",
    states: ["Central","Choiseul","Guadalcanal","Honiara","Isabel","Makira-Ulawa","Malaita","Rennell and Bellona","Temotu","Western"]
  },
  {
    code: "SO", name: "Somalia",
    states: ["Awdal","Bakool","Banaadir","Bari","Bay","Galguduud","Gedo","Hiiraan","Jubbada Dhexe","Jubbada Hoose","Lower Juba","Lower Shabelle","Mudug","Nugaal","Puntland","Sanaag","Shabeellaha Dhexe","Shabeellaha Hoose","Sool","Togdheer","Woqooyi Galbeed"]
  },
  {
    code: "ZA", name: "South Africa",
    states: ["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","North West","Northern Cape","Western Cape"]
  },
  {
    code: "SS", name: "South Sudan",
    states: ["Central Equatoria","Eastern Equatoria","Jonglei","Lakes","Northern Bahr el Ghazal","Unity","Upper Nile","Warrap","Western Bahr el Ghazal","Western Equatoria"]
  },
  {
    code: "ES", name: "Spain",
    states: ["Andalusia","Aragon","Asturias","Balearic Islands","Basque Country","Canary Islands","Cantabria","Castilla-La Mancha","Castilla y León","Catalonia","Ceuta","Extremadura","Galicia","La Rioja","Madrid","Melilla","Murcia","Navarre","Valencia"]
  },
  {
    code: "LK", name: "Sri Lanka",
    states: ["Central","Eastern","Northern","North Central","Northwestern","Sabaragamuwa","Southern","Uva","Western"]
  },
  {
    code: "SD", name: "Sudan",
    states: ["Al Jazirah","Al Qadarif","Blue Nile","Central Darfur","East Darfur","Kassala","Khartoum","North Darfur","North Kordofan","Northern","Red Sea","River Nile","Sennar","South Darfur","South Kordofan","West Darfur","West Kordofan","White Nile"]
  },
  {
    code: "SR", name: "Suriname",
    states: ["Brokopondo","Commewijne","Coronie","Marowijne","Nickerie","Para","Paramaribo","Saramacca","Sipaliwini","Wanica"]
  },
  {
    code: "SE", name: "Sweden",
    states: ["Blekinge","Dalarna","Gävleborg","Gotland","Halland","Jämtland","Jönköping","Kalmar","Kronoberg","Norrbotten","Örebro","Östergötland","Skåne","Södermanland","Stockholm","Uppsala","Värmland","Västerbotten","Västernorrland","Västmanland","Västra Götaland"]
  },
  {
    code: "CH", name: "Switzerland",
    states: ["Aargau","Appenzell Ausserrhoden","Appenzell Innerrhoden","Basel-Landschaft","Basel-Stadt","Bern","Fribourg","Geneva","Glarus","Graubünden","Jura","Lucerne","Nidwalden","Obwalden","Schaffhausen","Schwyz","Solothurn","St. Gallen","Thurgau","Ticino","Uri","Valais","Vaud","Zug","Zürich"]
  },
  {
    code: "SY", name: "Syria",
    states: ["Al-Hasakah","Al-Raqqah","Aleppo","As-Suwayda","Damascus","Daraa","Deir ez-Zor","Hama","Homs","Idlib","Latakia","Quneitra","Rif Dimashq","Tartus"]
  },
  {
    code: "TW", name: "Taiwan",
    states: ["Changhua","Chiayi City","Chiayi County","Hsinchu City","Hsinchu County","Hualien","Kaohsiung","Keelung","Kinmen","Lienchiang","Miaoli","Nantou","New Taipei","Penghu","Pingtung","Taichung","Tainan","Taipei","Taitung","Taoyuan","Yilan","Yunlin"]
  },
  {
    code: "TJ", name: "Tajikistan",
    states: ["Dushanbe","Gorno-Badakhshan","Khatlon","Regions of Republican Subordination","Sogd"]
  },
  {
    code: "TZ", name: "Tanzania",
    states: ["Arusha","Dar es Salaam","Dodoma","Geita","Iringa","Kagera","Katavi","Kigoma","Kilimanjaro","Lindi","Manyara","Mara","Mbeya","Morogoro","Mtwara","Mwanza","Njombe","Pemba North","Pemba South","Pwani","Rukwa","Ruvuma","Shinyanga","Simiyu","Singida","Songwe","Tabora","Tanga","Zanzibar North","Zanzibar South and Central","Zanzibar Urban/West"]
  },
  {
    code: "TH", name: "Thailand",
    states: ["Amnat Charoen","Ang Thong","Bangkok","Bueng Kan","Buri Ram","Chachoengsao","Chai Nat","Chaiyaphum","Chanthaburi","Chiang Mai","Chiang Rai","Chon Buri","Chumphon","Kalasin","Kamphaeng Phet","Kanchanaburi","Khon Kaen","Krabi","Lampang","Lamphun","Loei","Lop Buri","Mae Hong Son","Maha Sarakham","Mukdahan","Nakhon Nayok","Nakhon Pathom","Nakhon Phanom","Nakhon Ratchasima","Nakhon Sawan","Nakhon Si Thammarat","Nan","Narathiwat","Nong Bua Lam Phu","Nong Khai","Nonthaburi","Pathum Thani","Pattani","Phangnga","Phatthalung","Phayao","Phetchabun","Phetchaburi","Phichit","Phitsanulok","Phra Nakhon Si Ayutthaya","Phrae","Phuket","Prachin Buri","Prachuap Khiri Khan","Ranong","Ratchaburi","Rayong","Roi Et","Sa Kaeo","Sakon Nakhon","Samut Prakan","Samut Sakhon","Samut Songkhram","Saraburi","Satun","Sing Buri","Sisaket","Songkhla","Sukhothai","Suphan Buri","Surat Thani","Surin","Tak","Trang","Trat","Ubon Ratchathani","Udon Thani","Uthai Thani","Uttaradit","Yala","Yasothon"]
  },
  {
    code: "TL", name: "Timor-Leste",
    states: ["Aileu","Ainaro","Baucau","Bobonaro","Cova Lima","Dili","Ermera","Lautém","Liquiçá","Manatuto","Manufahi","Oecusse","Viqueque"]
  },
  {
    code: "TG", name: "Togo",
    states: ["Centrale","Kara","Maritime","Plateaux","Savanes"]
  },
  {
    code: "TO", name: "Tonga",
    states: ["Eua","Ha'apai","Niuas","Tongatapu","Vava'u"]
  },
  {
    code: "TT", name: "Trinidad and Tobago",
    states: ["Arima","Chaguanas","Couva-Tabaquite-Talparo","Diego Martin","Mayaro","Penal-Debe","Port of Spain","Princes Town","Rio Claro-Mayaro","San Fernando","San Juan-Laventille","Sangre Grande","Siparia","Tobago","Tunapuna-Piarco"]
  },
  {
    code: "TN", name: "Tunisia",
    states: ["Ariana","Béja","Ben Arous","Bizerte","Gabès","Gafsa","Jendouba","Kairouan","Kasserine","Kébili","Kef","Mahdia","Manouba","Médenine","Monastir","Nabeul","Sfax","Sidi Bouzid","Siliana","Sousse","Tataouine","Tozeur","Tunis","Zaghouan"]
  },
  {
    code: "TR", name: "Turkey",
    states: ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin","Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkâri","Hatay","Iğdır","Isparta","İstanbul","İzmir","Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kırıkkale","Kırklareli","Kırşehir","Kilis","Kocaeli","Konya","Kütahya","Malatya","Manisa","Mardin","Mersin","Muğla","Muş","Nevşehir","Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Şanlıurfa","Siirt","Sinop","Şırnak","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"]
  },
  {
    code: "TM", name: "Turkmenistan",
    states: ["Ahal","Ashgabat","Balkan","Daşoguz","Lebap","Mary"]
  },
  {
    code: "TV", name: "Tuvalu",
    states: ["Funafuti","Nanumanga","Nanumea","Niulakita","Niutao","Nui","Nukufetau","Nukulaelae","Vaitupu"]
  },
  {
    code: "UG", name: "Uganda",
    states: ["Central","Eastern","Northern","Western"]
  },
  {
    code: "UA", name: "Ukraine",
    states: ["Cherkasy","Chernihiv","Chernivtsi","Dnipropetrovsk","Donetsk","Ivano-Frankivsk","Kharkiv","Kherson","Khmelnytskyi","Kirovohrad","Kyiv","Kyiv City","Luhansk","Lviv","Mykolaiv","Odessa","Poltava","Rivne","Sumy","Ternopil","Vinnytsia","Volyn","Zakarpattia","Zaporizhzhia","Zhytomyr"]
  },
  {
    code: "AE", name: "United Arab Emirates",
    states: ["Abu Dhabi","Ajman","Dubai","Fujairah","Ras Al Khaimah","Sharjah","Umm Al Quwain"]
  },
  {
    code: "GB", name: "United Kingdom",
    states: ["England","Northern Ireland","Scotland","Wales"]
  },
  {
    code: "US", name: "United States",
    states: ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","District of Columbia"]
  },
  {
    code: "UY", name: "Uruguay",
    states: ["Artigas","Canelones","Cerro Largo","Colonia","Durazno","Flores","Florida","Lavalleja","Maldonado","Montevideo","Paysandú","Rivera","Rocha","Salto","San José","Soriano","Tacuarembó","Treinta y Tres"]
  },
  {
    code: "UZ", name: "Uzbekistan",
    states: ["Andijan","Bukhara","Fergana","Jizzakh","Karakalpakstan","Kashkadarya","Khorezm","Namangan","Navoiy","Samarkand","Sirdaryo","Surxondaryo","Tashkent","Tashkent City"]
  },
  {
    code: "VU", name: "Vanuatu",
    states: ["Malampa","Penama","Sanma","Shefa","Tafea","Torba"]
  },
  {
    code: "VE", name: "Venezuela",
    states: ["Amazonas","Anzoátegui","Apure","Aragua","Barinas","Bolívar","Carabobo","Cojedes","Delta Amacuro","Dependencias Federales","Distrito Capital","Falcón","Guárico","Lara","Mérida","Miranda","Monagas","Nueva Esparta","Portuguesa","Sucre","Táchira","Trujillo","Vargas","Yaracuy","Zulia"]
  },
  {
    code: "VN", name: "Vietnam",
    states: ["An Giang","Bà Rịa-Vũng Tàu","Bắc Giang","Bắc Kạn","Bạc Liêu","Bắc Ninh","Bến Tre","Bình Định","Bình Dương","Bình Phước","Bình Thuận","Cà Mau","Cần Thơ","Cao Bằng","Đà Nẵng","Đắk Lắk","Đắk Nông","Điện Biên","Đồng Nai","Đồng Tháp","Gia Lai","Hà Giang","Hà Nam","Hà Nội","Hà Tĩnh","Hải Dương","Hải Phòng","Hậu Giang","Hồ Chí Minh","Hòa Bình","Hưng Yên","Khánh Hòa","Kiên Giang","Kon Tum","Lai Châu","Lâm Đồng","Lạng Sơn","Lào Cai","Long An","Nam Định","Nghệ An","Ninh Bình","Ninh Thuận","Phú Thọ","Phú Yên","Quảng Bình","Quảng Nam","Quảng Ngãi","Quảng Ninh","Quảng Trị","Sóc Trăng","Sơn La","Tây Ninh","Thái Bình","Thái Nguyên","Thanh Hóa","Thừa Thiên Huế","Tiền Giang","Trà Vinh","Tuyên Quang","Vĩnh Long","Vĩnh Phúc","Yên Bái"]
  },
  {
    code: "YE", name: "Yemen",
    states: ["Abyan","Aden","Al Bayda","Al Hudaydah","Al Jawf","Al Mahrah","Al Mahwit","Amran","Dhamar","Hadhramaut","Hajjah","Ibb","Lahij","Ma'rib","Raymah","Sa'dah","Sana'a","Sana'a City","Shabwah","Socotra","Ta'izz"]
  },
  {
    code: "ZM", name: "Zambia",
    states: ["Central","Copperbelt","Eastern","Luapula","Lusaka","Muchinga","Northern","North-Western","Southern","Western"]
  },
  {
    code: "ZW", name: "Zimbabwe",
    states: ["Bulawayo","Harare","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"]
  },
];

export const COUNTRY_NAMES = WORLD_GEO.map(c => c.name);

export function getStates(countryName: string): string[] {
  const found = WORLD_GEO.find(c => c.name === countryName);
  return found ? found.states : [];
}
