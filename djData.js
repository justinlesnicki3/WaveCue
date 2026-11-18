import discoLinesImg from './assets/images/discolines.jpg';
import fisherImg from './assets/images/fisher.jpg';
import oddmobImg from './assets/images/oddmob.jpg';
import vintagecultureImg from './assets/images/vintageculture.jpg';
import riordanImg from './assets/images/riordan.jpg';
import placeholder from './assets/images/placeholder.jpg';
import maupImg from './assets/images/maup.jpg';
import gorgoncityImg from './assets/images/gorgoncity.jpg';
import johnsummitImg from './assets/images/johnsummit.jpg';
import clooneeImg from './assets/images/cloonee.jpg';
import disclosureImg from './assets/images/disclosureImg.avif';
import discipImg from './assets/images/discipImg.webp';
import genesiImg from './assets/images/genesi.jpg';
import maxstylerImg from './assets/images/maxstyler.jpg';
import gudfellaImg from './assets/images/gudfella.jpg';
import jworraImg from './assets/images/jworra.jpg';
import shipwrekImg from './assets/images/shipwrek.jpg';
import fredagainImg from './assets/images/fredagain.jpg';
import laytongiordaniImg from './assets/images/laytongiordani.jpg';
import kettamaImg from './assets/images/kettama.jpg';
import kettamaCardImg from './assets/images/kettamaCard.jpg';
import interplanetarycriminalImg from './assets/images/interplanetarycriminal.jpg';
import interplanetarycriminalCardImg from './assets/images/interplanetarycriminalCard.jpg';
import silvabumpaImg from './assets/images/silvabumpa.jpg';

// Representative artist image per genre, used as the backdrop for the
// genre browse cards on the Search screen.
export const GENRE_IMAGES = {
    'Tech House': maxstylerImg,
    'Bass House': oddmobImg,
    'Melodic House': vintagecultureImg,
    'Progressive House': johnsummitImg,
    'Deep House': maupImg,
    'Techno': laytongiordaniImg,
    'UK Garage': interplanetarycriminalCardImg,
    'Trap': shipwrekImg,
    'Hard House': kettamaCardImg,
    'Jersey Club': placeholder,
};

export const EDM_GENRES = [
    'Tech House',
    'Bass House',
    'Melodic House',
    'Progressive House',
    'Deep House',
    'Techno',
    'UK Garage',
    'Hard House',
];

export const DJ_DATABASE = [

    {
        id: 'Fisher',
        name: 'FISHER',
        image: fisherImg,
        youtubeQuery: 'FISHER',
        youtubeChannelId: 'UCnr1-8gbgQ7YFd8twlBDhhg', // official channel (New Sets reads its uploads)
        genres: ['Tech House'],
    },
    {
        id: 'Vintage Culture',
        name: 'Vintage Culture',
        image: vintagecultureImg,
        youtubeQuery: 'Vintage Culture',
        youtubeChannelId: 'UC4N1snt2b0d83vOkvaWP6mg', // official channel (New Sets reads its uploads)
        genres: ['Progressive House', 'Melodic House'],
    },
    {
        id: 'Odd Mob',
        name: 'Odd Mob',
        image: oddmobImg,
        youtubeQuery: 'Odd Mob',
        youtubeChannelId: 'UCogDK2p-5iY0qpn4lOFLGWA', // official channel (New Sets reads its uploads)
        genres: ['Bass House', 'Tech House'],
    },
    {
        id: 'Disco Lines',
        name: 'Disco Lines',
        image: discoLinesImg,
        youtubeQuery: 'Disco Lines',
        youtubeChannelId: 'UCSVO3zCAiv2Q5GVeGFNVgyQ', // official channel (New Sets reads its uploads)
        genres: ['Tech House', 'Melodic House'],
    },
    {
        id: 'Riordan',
        name: 'Riordan',
        image: riordanImg,
        youtubeQuery: 'Riordan',
        youtubeChannelId: 'UCgyVv5a-W3ZcBZmSnvwk_ew', // official channel (New Sets reads its uploads)
        genres: ['Tech House'],
    },
    {
        id: 'Mau P',
        name: 'Mau P',
        image: maupImg,
        youtubeQuery: 'Mau P',
        youtubeChannelId: 'UCTJ1YTI-M0LgBl_-JNGCwmw', // official channel (New Sets reads its uploads)
        genres: ['Tech House'],
    },
    {
        id: 'John Summit',
        name: 'John Summit',
        image: johnsummitImg,
        youtubeQuery: 'John Summit',
        youtubeChannelId: 'UCsIVrho83JfwUieSs_UKCmA', // official channel (New Sets reads its uploads)
        genres: ['Tech House', 'Progressive House'],
    },
    {
        id: 'J. Worra',
        name: 'J. Worra',
        image: jworraImg,
        youtubeQuery: 'J. Worra',
        youtubeChannelId: 'UCKbul9QRhCawR1CsEFcKDtA', // official channel (New Sets reads its uploads)
        genres: ['Tech House', 'Bass House'],
    },
    {
        id: 'Ship Wrek',
        name: 'Ship Wrek',
        image: shipwrekImg,
        youtubeQuery: 'Ship Wrek',
        youtubeChannelId: 'UCMBgTF8d6cZ_y6lnL8NQlcw', // official channel (New Sets reads its uploads)
        genres: ['Bass House'],
    },
    {
        id: 'Gorgon City',
        name: 'Gorgon City',
        image: gorgoncityImg,
        youtubeQuery: 'Gorgon City',
        youtubeChannelId: 'UCxD2gCy3e0EUWN5EylcBGMA', // official channel (New Sets reads its uploads)
        genres: ['UK Garage', 'Deep House'],
    },
    {
        id: 'Discloure',
        name: 'Disclosure',
        image: disclosureImg,
        youtubeQuery: 'Disclosure',
        youtubeChannelId: 'UCTyZ4LCVRiCEVfkVqdi0m3A', // official channel (New Sets reads its uploads)
        genres: ['UK Garage', 'Deep House'],
    },
    {
        id: 'Discip',
        name: 'Discip',
        image: discipImg,
        youtubeQuery: 'Discip',
        youtubeChannelId: 'UCYWBEn7SchUq923olLWjNug', // official channel (New Sets reads its uploads)
        genres: ['Bass House'],
    },
    {
        id: 'GENESI',
        name: 'GENESI',
        image: genesiImg,
        youtubeQuery: 'GENESI',
        youtubeChannelId: 'UCoUWy8Wi8rpa_vzbB1IDbRQ', // official channel (New Sets reads its uploads)
        genres: ['Tech House'],
    },
    {
        id: 'Max Styler',
        name: 'Max Styler',
        image: maxstylerImg,
        youtubeQuery: 'Max Styler',
        youtubeChannelId: 'UC_CrzdzLplnf2lqZwypeM1w', // official channel (New Sets reads its uploads)
        genres: ['Tech House', 'Bass House'],
    },
    {
        id: 'GUDFELLA',
        name: 'GUDFELLA',
        image: gudfellaImg,
        youtubeQuery: 'GUDFELLA',
        youtubeChannelId: 'UCGFSmOuR7P_TS5XidoF3WkA', // official channel (New Sets reads its uploads)
        genres: ['Tech House'],
    },
    {
        id: 'Layton Giordani',
        name: 'Layton Giordani',
        image: laytongiordaniImg,
        youtubeQuery: 'Layton Giordani',
        youtubeChannelId: 'UCKZmvCsaDGGGfijZMs9uNjg', // official channel (New Sets reads its uploads)
        genres: ['Techno'],
    },
    {
        id: 'Roddy Lima',
        name: 'Roddy Lima',
        image: placeholder,
        youtubeQuery: 'Roddy Lima',
        youtubeChannelId: 'UClF0lap0s4hMLP2kIeADWtg', // official channel (New Sets reads its uploads)
        genres: ['Tech House'],
    },
    {
        id: 'Green Velvet',
        name: 'Green Velvet',
        image: placeholder,
        youtubeQuery: 'Green Velvet',
        youtubeChannelId: 'UCTQqrOsFi1Rxta5R9mpbX3g', // official channel (New Sets reads its uploads)
        genres: ['Tech House', 'Techno'],
    },
    {
        id: 'Chris Lorenzo',
        name: 'Chris Lorenzo',
        image: placeholder,
        youtubeQuery: 'Chris Lorenzo',
        youtubeChannelId: 'UCTrorfY74Fs3Nn1za0mUP7g', // official channel (New Sets reads its uploads)
        genres: ['Bass House', 'UK Garage'],
    },
    {
        id: 'Matroda',
        name: 'Matroda',
        image: placeholder,
        youtubeQuery: 'Matroda',
        youtubeChannelId: 'UCwe-ITb2csyXTuB-l2Cf9MA', // official channel (New Sets reads its uploads)
        genres: ['Tech House', 'Bass House'],
    },
    {
        id: 'SIDEPIECE',
        name: 'SIDEPIECE',
        image: placeholder,
        youtubeQuery: 'SIDEPIECE',
        youtubeChannelId: 'UC4CFtujFMNGXRixR5tCPKdQ', // official channel (New Sets reads its uploads)
        genres: ['Tech House'],
    },
    {
        id: 'Westend',
        name: 'Westend',
        image: placeholder,
        youtubeQuery: 'Westend',
        youtubeChannelId: 'UCgrA524q825FtGsF3mYyw1g', // official channel (New Sets reads its uploads)
        genres: ['Tech House'],
    },
    {
        id: 'OMNOM',
        name: 'OMNOM',
        image: placeholder,
        youtubeQuery: 'OMNOM',
        youtubeChannelId: 'UC_43kOpqmQyDFSk1BYskbuQ', // official channel (New Sets reads its uploads)
        genres: ['Bass House'],
    },
    {
        id: 'AYYBO',
        name: 'AYYBO',
        image: placeholder,
        youtubeQuery: 'AYYBO',
        youtubeChannelId: 'UCpXN2mFZZ76QcwHWeUPEg8g', // official channel (New Sets reads its uploads)
        genres: ['Bass House'],
    },
    {
        id: 'Cloonee',
        name: 'Cloonee',
        image: clooneeImg,
        youtubeQuery: 'Cloonee',
        youtubeChannelId: 'UC51WF-i8Wtp1PqRc3mXfKaA', // official channel (New Sets reads its uploads)
        genres: ['Tech House'],
    },
    {
        id: "it's murph",
        name: "it's murph",
        image: placeholder,
        youtubeQuery: "it's murph",
        genres: ['Tech House'],
    },
    {
        id: 'MALAA',
        name: 'MALAA',
        image: placeholder,
        youtubeQuery: 'MALAAA',
        youtubeChannelId: 'UCIyzc4i5ewvmJLzHFF4G5kw', // official channel (New Sets reads its uploads)
        genres: ['Bass House', 'Tech House'],
    },
    {
        id: 'Fred again..',
        name: 'Fred again..',
        image: fredagainImg,
        youtubeQuery: 'Fred again..',
        youtubeChannelId: 'UCXF6DMVLIVRr2OQAqyfEGeg', // official channel (New Sets reads its uploads)
        genres: ['UK Garage', 'Melodic House'],
    },
    {
        id: 'Kettama',
        name: 'Kettama',
        image: kettamaImg,
        youtubeQuery: 'Kettama',
        youtubeChannelId: 'UC8Ux8sqx7e4Z-GQz0QVjPXQ', // official channel (New Sets reads its uploads)
        genres: ['Hard House', 'UK Garage'],
    },
    {
        id: 'Interplanetary Criminal',
        name: 'Interplanetary Criminal',
        image: interplanetarycriminalImg,
        youtubeQuery: 'Interplanetary Criminal',
        youtubeChannelId: 'UCCr1ACiFCncsPFXDmGzZPbw', // official channel (New Sets reads its uploads)
        genres: ['UK Garage', 'Hard House'],
    },
    {
        id: 'Silva Bumpa',
        name: 'Silva Bumpa',
        image: silvabumpaImg,
        youtubeQuery: 'Silva Bumpa',
        youtubeChannelId: 'UCW_qdUJiD8-VUJMQ7FQ0xRg', // official channel (New Sets reads its uploads)
        genres: ['UK Garage'],
    },
];
