/**
 * 
 * @param {Object} obj 
 * @param {Array} props 
 */
export default function (obj, props) {
  if(!Array.isArray(props)) props = [props];
  props.map((prop) => {
    const deepLink = prop.split(".");
    if(deepLink.length > 1) {
      let linked = obj;
      deepLink.forEach((link, index) => {
        index === deepLink.length - 1 ? delete linked[link] : linked = linked[link];
      });
    } else {
      delete obj[prop];
    }
  });

  return obj;
}