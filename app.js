//require('dotenv').config();
const fs = require('fs');
const MarketsyncModel = require('./marketsync/MarketsyncModel');
const AllController = require('./controller/AllController');

(async () => {


    const Controller = new AllController();
    //const MktSyncMod = new MarketsyncModel();

    await Controller.connectAll()
        .then(async (res) => {
            console.log("Respuesta de connectWoo: ", res);
        })
        .catch(async (error) => {
            console.log("Error de connectWoo: ", error);
        });
    
        await Controller.copyAmazonToWoocommerce(false)
        .then(async(res)=>{
            console.log("Respuesta de copyAmazonToWoocommerce: ", res);
        })
        .catch(async(error)=>{
            console.log("Error de copyAmazonToWoocommerce: ", error);
        });

        await Controller.updateClaroshopCategoryOnWoocommerce(await Controller.getInventory())
        .then(async(res)=>{
            console.log("Respuesta de updateClaroshopCategoryOnWoocommerce: ", res);
        })
        .catch(async(error)=>{
            console.log("Error de updateClaroshopCategoryOnWoocommerce: ", error);
        })
})();

//*Actualizar stock de productos en woocommerce
//  await Controller.updateWoocommerceStock(false)
//  .then(async(res)=>{
//      console.log("Respuesta de updateWoocommerceStock: ", res);
//  })
//  .catch(async(error)=>{
//      console.log("Error de updateWoocommerceStock: ", error);
//  });

//*Mercadolibre obtener atributos del producto
//await Controller.mlConnect()
//      .then(async (res) => {
//          console.log("Respuesta de connect: ", res);
//      })
//      .catch(async (error) => {
//          console.log("Error en connect: ", error);
//      });

// await Controller.getDataProductML("Barbie", "")
// .then(async(res)=>{
//     console.log("Respuesta: ", res.data);
// })
// .catch(async(error)=>{
//     console.log("Error: ", error);
// });

//*Copiar productos de Amazon a Woocommerce
//    let inventory = await Controller.getAmazonSellerInventory()
//    .then(async (res) => {
//        console.log("Respuesta de getAmazonSellerInventory: ", res.msg);
//        return res.data;
//    })
//    .catch(async (error) => {
//        console.log("Error en getAmazonSellerInventory: ", error);
//    });
// //let rawdata = fs.readFileSync('./json/simple_data.json', 'utf8');
// //let inventory = await JSON.parse(rawdata);

// //const browser = await Controller.startBrowser(true);
// for (let caw = 0; caw < inventory.length; caw++) {
//    const element = inventory[caw];
//    await Controller.copyAmazonToWoocommerce(element, browser)
//        .then(async (res) => {
//            console.log("Respuesta de copyAmazonToWoocommerce: ", res);
//        })
//        .catch(async (error) => {
//            console.log("Error de copyAmazonToWoocommerce: ", error);
//        });
// }

// await Controller.stopBrowser(browser);

//*Copiar productos de Woocommerce a Mercadolibre
// let inventory = await Controller.getAmazonSellerInventory()
//     .then(async (res) => {
//         console.log("Respuesta de getAmazonSellerInventory: ", res.msg);
//         return res.data;
//     })
//     .catch(async (error) => {
//         console.log("Error en getAmazonSellerInventory: ", error);
//     });
// let rawdata = fs.readFileSync('./json/simple_data.json', 'utf8');
// let inventory = await JSON.parse(rawdata);


// for (let cwm = 0; cwm < inventory.length; cwm++) {
//     await Controller.copyWoocommerceToMercadoLibre(inventory[cwm])
//         .then(async (res) => {
//             console.log("Respuesta de copyWoocommerceToMercadoLibre: ", res);
//         })
//         .catch(async (error) => {
//             console.log("Error de copyWoocommerceToMercadoLibre: ", error);
//         });
// }