const vision = require('@google-cloud/vision');
let words = [];
let numbers = [];
let blacklist = ['unleaded','cash','self','serve'];
let files = ['prices1.jpg','prices2.jpg','prices3.jpg','prices4.jpg','prices5.jpg','prices6.jpg', 'prices7.jpg', 'prices8.jpg',
  'prices9.jpg', 'prices10.jpg', 'prices11.jpg', 'prices12.jpg', 'prices13.jpg'];
let totalResults = {};

async function quickstart(filename) {
  // Creates a client
  const client = new vision.ImageAnnotatorClient();

  const fileName = './resources/'+filename;

  // Performs text detection on the local file
  const [result] = await client.textDetection(fileName);
  const [logoresult] = await client.logoDetection(fileName);
  const logos = logoresult.logoAnnotations;
  const detections = result.textAnnotations;
  totalResults[filename] = {
    brand: 'Unknown',
    isCash : false,
    prices : []
  };
  if(logos[0]!==undefined&&logos[0].score>0.8){
    totalResults[filename].brand = logos[0].description;
  }
  words[filename] = {};
  numbers[filename] = {};
  // detections
  //     // Filter any blacklisted results.
  //     .filter(object => !blacklist.has(object.description.toLowerCase()))
  //     // Filter garbage that is too long.
  //     .filter(object => object.description.length >= 25)
  //     .map(text =>{
  //         let avgX =0, avgY=0;
  //         for(let corner in text.boundingPoly.vertices){
  //           avgX+=text.boundingPoly.vertices[corner]['x'];
  //           avgY+=text.boundingPoly.vertices[corner]['y'];
  //         }
  //         if(/\d/.test(text.description)){
  //           return {
  //             type: 'number',
  //             word: text.description.substring(0,4),
  //             x: avgX,
  //             y: avgY
  //           }
  //         } else {
  //           return {
  //             type: 'word',
  //             word: text.description,
  //             x: avgX,
  //             y: avgY
  //           }
  //         }
  //         }
  //     )
  //     .forEach(object => {
  //       if (object.type = 'number') {
  //         numbers[object.word] = object
  //       }
  //       if (object.type = 'word') {
  //         words[object.word] = object
  //       }
  //     });

  detections.forEach(text =>{
        let avgX =0, avgY=0;
        for(let corner in text.boundingPoly.vertices){
          avgX+=text.boundingPoly.vertices[corner]['x'];
          avgY+=text.boundingPoly.vertices[corner]['y'];
        }
        if(text.description.toLowerCase()==='cash'){
          totalResults[filename].isCash = true;
        }
        if(text.description)
        if(text.description.length<25&&blacklist.indexOf(text.description.toLowerCase())<0&&text.description.length>2){
          if(!text.description.match(/[a-z]/i)){
            numbers[filename][text.description]={
              word: text.description.substring(0,4),
              x: avgX,
              y: avgY
            };
          } else {
            words[filename][text.description]={
              word: text.description.toLowerCase(),
              x: avgX,
              y: avgY
            };
          }
        }
  }
  );
}
for(let file in files){
  quickstart(files[file]).then(function(){
    //Per image
    let closestPairs = [];
    for(let word in words[files[file]]){
      let closest = {
        word: 'null',
        x: 9999999999,
        y: 9999999999
      };
      for(let otherword in numbers[files[file]]){
        if(word!==otherword){
          let xDif = Math.abs(words[files[file]][word]['x'] - numbers[files[file]][otherword]['x']);
          let yDif = Math.abs(words[files[file]][word]['y'] - numbers[files[file]][otherword]['y']);
          let totalDif = xDif + yDif;
          if(totalDif < Math.abs(words[files[file]][word]['x']- closest.x)+ Math.abs( words[files[file]][word]['y']- closest.y)){
            closest = numbers[files[file]][otherword];
          }
        }
      }
      closestPairs.push({
        word: words[files[file]][word],
        price: closest
      });
    }
    for(let pairs in closestPairs){
      for(let otherpairs in closestPairs){
        if(closestPairs[pairs]!==null&&closestPairs[otherpairs]!==null&&pairs!==otherpairs&&closestPairs[pairs].price.word===closestPairs[otherpairs].price.word){
          if(Math.abs(closestPairs[pairs].word['y']-closestPairs[pairs].price['y'])<Math.abs(closestPairs[otherpairs].word['y']-closestPairs[otherpairs].price['y'])){
            closestPairs[otherpairs] = null;
          } else {
            closestPairs[pairs] = null;
          }
        }
      }
    }
    for(let estimate in closestPairs) {
      if(closestPairs[estimate]!==null) {
        let price = '';
        if(closestPairs[estimate].price.word.indexOf('.')<0){
          price = closestPairs[estimate].price.word.substring(0,1)+'.'+closestPairs[estimate].price.word.substring(1,3);
        } else {
          price = closestPairs[estimate].price.word;
        }
        totalResults[files[file]].prices[closestPairs[estimate].word.word]=price;
      }
    }
      console.log("--- "+files[file]+' ---');
      console.log(totalResults[files[file]]);
      console.log("----------------------------\n\n");
  });
}
async function getBrands(filename) {

}
//Per set