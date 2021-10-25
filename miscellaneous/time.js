module.exports=ms=>{
  const yearValue=3.154e10;
  const monthValue=2.628e9;
  const dayValue=8.64e7;
  const hourValue=3.6e6;
  const minutesValue=6e4;
  const secondsValue=1e3;
  const yearNumber=Math.floor(ms/yearValue);
  ms-=(yearNumber*yearValue);
  const monthNumber=Math.floor(ms/monthValue);
  ms-=(monthNumber*monthValue);
  const dayNumber=Math.floor(ms/dayValue);
  ms-=(dayNumber*dayValue);
  const hourNumber=Math.floor(ms/hourValue);
  ms-=(hourNumber*hourValue);
  const minutesNumber=Math.floor(ms/minutesValue);
  ms-=(minutesNumber*minutesValue);
  const secondsNumber=Math.floor(ms/secondsValue);
  ms-=(secondsNumber*secondsValue);
  return`${
    yearNumber?
    `${yearNumber}y${monthNumber?`${monthNumber}mo`:""}`:
    `${
      monthNumber?
      `${monthNumber}mo${dayNumber?`${dayNumber}d`:""}`:
      `${
        dayNumber?
        `${dayNumber}d${hourNumber?`${hourNumber}h`:""}`:
        `${
          hourNumber?
          `${hourNumber}h${minutesNumber?`${minutesNumber}m`:""}`:
          `${
            minutesNumber?
            `${minutesNumber}m${secondsNumber?`${secondsNumber}s`:""}`:
            `${
              secondsNumber?
              `${secondsNumber}s${ms?`${ms}ms`:""}`:
              `${ms}ms`
            }`
          }`
        }`
      }`
    }`
  }`;
};