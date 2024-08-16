var countries = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level0");
var kenya = countries.filter(ee.Filter.eq('ADM0_NAME','Kenya'))

var Border =
    ee.Image().byte().paint({featureCollection: kenya, color: 1, width: 3});

Map.setOptions('SATELLITE');

Map.centerObject(kenya, 6);

Map.addLayer(Border ,null, 'kenya border')
var ESA_LULC = ee.ImageCollection('ESA/WorldCover/v200').first().clip(kenya);

var projection=ESA_LULC .projection().getInfo()
var visualization = {
  bands: ['Map'],
};

var Crop=ESA_LULC.select('Map').eq(40);
var Border = ee.Image().byte().paint({featureCollection: kenya, color: 1, width: 3});

Map.addLayer(Crop.selfMask(),'','Crop_Mask')
Map.addLayer(ESA_LULC, visualization, 'Landcover');
Map.addLayer(crop_data,'','Crop_vectors')


// var temp_crops= ee.ImageCollection('ESA/WorldCereal/2021/MODELS/v100')
// temp_crops = temp_crops.mosaic().select('classification').clip(kenya);
// Map.addLayer(temp_crops.selfMask(),null,'tc')

// Cloud things

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');

// Cloud Score+ image collection. Note Cloud Score+ is produced from Sentinel-2
// Level 1C data and can be applied to either L1C or L2A collections.
var csPlus = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED');

// Region of interest.

// Use 'cs' or 'cs_cdf', depending on your use case; see docs for guidance.
var QA_BAND = 'cs_cdf';

// The threshold for masking; values between 0.50 and 0.65 generally work well.
// Higher values will remove thin clouds, haze & cirrus shadows.
var CLEAR_THRESHOLD = 0.60;

// Make a clear median composite.
var composite = s2
    .filterBounds(kenya)
    .filterDate('2019-03-15', '2020-01-01')
    .linkCollection(csPlus, [QA_BAND])
    .map(function(img) {
      return img.updateMask(img.select(QA_BAND).gte(CLEAR_THRESHOLD));
    })
    .median().clip(kenya);

// Feature engineering

// var 

// Sentinel-2 visualization parameters.
var s2Viz = {bands: ['B4', 'B3', 'B2'], min: 0, max: 2500};

// Map.addLayer(composite, s2Viz, 'S2_median_composite')


var maize=crop_data.filter(ee.Filter.eq('label','maize'))

var cassava=crop_data.filter(ee.Filter.eq('label','cassava'))

var millet= crop_data.filter(ee.Filter.eq('label','millet'))

var groundnut=crop_data.filter(ee.Filter.eq('label','groundnut'))
maize = maize.set('class', '0');

maize = maize.map(function(feature) {
  return feature.set('class', 0);
});

cassava = cassava.map(function(feature) {
  return feature.set('class', 1);
});

millet=millet.map(function(feature) {
  return feature.set('class', 2);
});

groundnut=groundnut.map(function(feature) {
  return feature.set('class', 3);
});

var bands = ['B1','B2','B3','B4', 'B5', 'B6','B7','B8','B8A','B9','B11','B12']

var im_final=composite.select(bands)
var maize_samples=im_final.sampleRegions(
                    {collection: maize,
                    scale: 20,
                    })

var groundnut_samples=im_final.sampleRegions(
                    {collection: groundnut,
                    scale: 20,
                    })
var millet_samples=im_final.sampleRegions(
                    {collection: millet,
                    scale: 20,
                    })
  
var cassava_samples=im_final.sampleRegions(
                    {collection: cassava,
                    scale: 20,
                    })
// var training= maize_samples.merge(groundnut_samples).merge(cassava_samples).merge(millet_samples)
// var trainedRf = ee.Classifier.smileRandomForest({numberOfTrees: 10}).setOutputMode('MULTIPROBABILITY').train({
//   features: training,
//   classProperty: 'class',
//   inputProperties: bands
// });

// var classifiedRf = composite.select(bands).classify(trainedRf);
// var crop_mask=ESA_LULC.select('Map').neq(40)
// var masked_class=classifiedRf.updateMask(Crop)

// Map.addLayer(masked_class)


// Export.image.toAsset({
//   image: masked_class,
//   description: 'crop_kenya',
//   assetId: 'projects/ee-hydrosense/assets/Crop_tif',
//   region: kenya,
//   scale: 30,
//   maxPixels:1e13
// });

// Create a threshold based approach

masked_class=masked_class.arrayFlatten([['0','1','2','3']])
var maize_area= masked_class.select(0).gt(0.7).selfMask()
var cassava_area=ee.Image(masked_class).select(1).gt(0.4).selfMask()
var millet_area=ee.Image(masked_class).select(2).gt(0.4).selfMask()
var groundnut_area=ee.Image(masked_class).select(3).gt(0.4).selfMask()

Map.addLayer(maize_area,{max: 1, palette: ['yellow']},'maize')
Map.addLayer(cassava_area,{max: 1, palette: ['brown']},'cassava')
Map.addLayer(millet_area,{max: 1, palette: ['black']},'millet')
Map.addLayer(groundnut_area,{max: 1, palette: ['red']},'groundnut')



// print(maize_samples)
// print(millet_samples)
// print(groundnut_samples)
// print(cassava_samples)




// print(groundnut_samples)
// print(maize.first())
// print(groundnut.first())
// print(millet.first())
// print(cassava.first())


// Export Image viz to gee
// var ESA_viz=ESA_LULC.visualize(visualization)

// Export.image.toDrive({
//   image: ESA_viz,
//   description: 'ESA',
//   scale:1000,
//   region: kenya
// });
