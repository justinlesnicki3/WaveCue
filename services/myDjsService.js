// services/myDjsService.js

const djImages = {
  'disco lines': require('../assets/images/discolinesMYDJ.jpg'),
  fisher: require('../assets/images/fisherMYDJ.jpg'),
  'vintage culture': require('../assets/images/vintagecultureMYDJ.jpg'),
  'odd mob': require('../assets/images/oddmobMYDJ.jpg'),
  riordan: require('../assets/images/riordanMYDJ.jpg'),
  'mau p': require('../assets/images/maupMYDJ.jpg'),
  'gorgon city': require('../assets/images/gorgoncityMYDJ.webp'),
  'john summit': require('../assets/images/johnsummitMYDJ.jpg'),
  cloonee: require('../assets/images/clooneeMYDJ.jpg'),
  disclosure: require('../assets/images/disclosureMYDJ.webp'),
  genesi: require('../assets/images/genesiMYDJ.jpg'),
  'max styler': require('../assets/images/maxstylerMYDJ.jpg'),
  gudfella: require('../assets/images/gudfellaMYDJ.jpg'),
  'j. worra': require('../assets/images/jworraMYDJ.webp'),
  'ship wrek': require('../assets/images/shipwrekMYDJ.jpg'),
  'fred again..': require('../assets/images/fredagainMYDJ.jpg'),
  kettama: require('../assets/images/kettamaMYDJ.jpg'),
  'interplanetary criminal': require('../assets/images/interplanetarycriminalMYDJ.jpg'),
};

const placeholder = require('../assets/images/placeholder.jpg');

export function getDjImage(djName) {
  const key = (djName || '').trim().toLowerCase();
  return djImages[key] || placeholder;
}

export function buildDjDetailNavParams(djName) {
  return { djName };
}

export function formatSubscribeDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

export function keyForDj(item, index) {
  return item?.name ?? String(index);
}
