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

// Representative artist image per genre, used as the backdrop for the
// genre browse cards on the Search screen.
export const GENRE_IMAGES = {
    'Tech House': maxstylerImg,
    'Bass House': oddmobImg,
    'Melodic House': vintagecultureImg,
    'Progressive House': johnsummitImg,
    'Deep House': maupImg,
    'Techno': laytongiordaniImg,
    'UK Garage': riordanImg,
    'Trap': shipwrekImg,
    'Hard House': placeholder,
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
        genres: ['Tech House'],
    },
    {
        id: 'Vintage Culture',
        name: 'Vintage Culture',
        image: vintagecultureImg,
        youtubeQuery: 'Vintage Culture',
        genres: ['Progressive House', 'Melodic House'],
    },
    {
        id: 'Odd Mob',
        name: 'Odd Mob',
        image: oddmobImg,
        youtubeQuery: 'Odd Mob',
        genres: ['Bass House', 'Tech House'],
    },
    {
        id: 'Disco Lines',
        name: 'Disco Lines',
        image: discoLinesImg,
        youtubeQuery: 'Disco Lines',
        genres: ['Tech House', 'Melodic House'],
    },
    {
        id: 'Riordan',
        name: 'Riordan',
        image: riordanImg,
        youtubeQuery: 'Riordan',
        genres: ['Tech House'],
    },
    {
        id: 'Mau P',
        name: 'Mau P',
        image: maupImg,
        youtubeQuery: 'Mau P',
        genres: ['Tech House'],
    },
    {
        id: 'John Summit',
        name: 'John Summit',
        image: johnsummitImg,
        youtubeQuery: 'John Summit',
        genres: ['Tech House', 'Progressive House'],
    },
    {
        id: 'J. Worra',
        name: 'J. Worra',
        image: jworraImg,
        youtubeQuery: 'J. Worra',
        genres: ['Tech House', 'Bass House'],
    },
    {
        id: 'Ship Wrek',
        name: 'Ship Wrek',
        image: shipwrekImg,
        youtubeQuery: 'Ship Wrek',
        genres: ['Bass House'],
    },
    {
        id: 'Gorgon City',
        name: 'Gorgon City',
        image: gorgoncityImg,
        youtubeQuery: 'Gorgon City',
        genres: ['UK Garage', 'Deep House'],
    },
    {
        id: 'Discloure',
        name: 'Disclosure',
        image: disclosureImg,
        youtubeQuery: 'Disclosure',
        genres: ['UK Garage', 'Deep House'],
    },
    {
        id: 'Discip',
        name: 'Discip',
        image: discipImg,
        youtubeQuery: 'Discip',
        genres: ['Bass House'],
    },
    {
        id: 'GENESI',
        name: 'GENESI',
        image: genesiImg,
        youtubeQuery: 'GENESI',
        genres: ['Tech House'],
    },
    {
        id: 'Max Styler',
        name: 'Max Styler',
        image: maxstylerImg,
        youtubeQuery: 'Max Styler',
        genres: ['Tech House', 'Bass House'],
    },
    {
        id: 'GUDFELLA',
        name: 'GUDFELLA',
        image: gudfellaImg,
        youtubeQuery: 'GUDFELLA',
        genres: ['Tech House'],
    },
    {
        id: 'Layton Giordani',
        name: 'Layton Giordani',
        image: laytongiordaniImg,
        youtubeQuery: 'Layton Giordani',
        genres: ['Techno'],
    },
    {
        id: 'Roddy Lima',
        name: 'Roddy Lima',
        image: placeholder,
        youtubeQuery: 'Roddy Lima',
        genres: ['Tech House'],
    },
    {
        id: 'Green Velvet',
        name: 'Green Velvet',
        image: placeholder,
        youtubeQuery: 'Green Velvet',
        genres: ['Tech House', 'Techno'],
    },
    {
        id: 'Chris Lorenzo',
        name: 'Chris Lorenzo',
        image: placeholder,
        youtubeQuery: 'Chris Lorenzo',
        genres: ['Bass House', 'UK Garage'],
    },
    {
        id: 'Matroda',
        name: 'Matroda',
        image: placeholder,
        youtubeQuery: 'Matroda',
        genres: ['Tech House', 'Bass House'],
    },
    {
        id: 'SIDEPIECE',
        name: 'SIDEPIECE',
        image: placeholder,
        youtubeQuery: 'SIDEPIECE',
        genres: ['Tech House'],
    },
    {
        id: 'Westend',
        name: 'Westend',
        image: placeholder,
        youtubeQuery: 'Westend',
        genres: ['Tech House'],
    },
    {
        id: 'OMNOM',
        name: 'OMNOM',
        image: placeholder,
        youtubeQuery: 'OMNOM',
        genres: ['Bass House'],
    },
    {
        id: 'AYYBO',
        name: 'AYYBO',
        image: placeholder,
        youtubeQuery: 'AYYBO',
        genres: ['Bass House'],
    },
    {
        id: 'Cloonee',
        name: 'Cloonee',
        image: clooneeImg,
        youtubeQuery: 'Cloonee',
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
        genres: ['Bass House', 'Tech House'],
    },
    {
        id: 'Fred again..',
        name: 'Fred again..',
        image: fredagainImg,
        youtubeQuery: 'Fred again..',
        genres: ['UK Garage', 'Melodic House'],
    },
];
