//require('dotenv').config();
const fs = require('fs');
const MarketsyncModel = require('./marketsync/MarketsyncModel');
const AllController = require('./controller/AllController');

(async () => {


    const Controller = new AllController();
    //const MktSyncMod = new MarketsyncModel();

    await Controller.connectWoo()
        .then(async (res) => {
            console.log("Respuesta de connectWoo: ", res);
        })
        .catch(async (error) => {
            console.log("Error de connectWoo: ", error);
        });

        const browser = await Controller.startBrowser(false);

        //*Actualizar stock de productos en woocommerce
 await Controller.updateWoocommerceStock(false)
 .then(async(res)=>{
     console.log("Respuesta de updateWoocommerceStock: ", res);
 })
 .catch(async(error)=>{
     console.log("Error de updateWoocommerceStock: ", error);
 });


    //*Copiar productos de Woocommerce en Marketsync
let rawdata = fs.readFileSync('./json/simple_data.json', 'utf8');
let inventory = await JSON.parse(rawdata);
console.log('Tamaño inventario: ', inventory.length);
for (let cwm = 0; cwm < inventory.length; cwm++) {
    const element = inventory[cwm].asin;
    //console.log('Element: ', element);

    await Controller.copyWoocommerceToMarketsync(element)
        .then(async (res) => {
            console.log("Respuesta: ", res);
        })
        .catch(async (error) => {
            console.log("Error: ", error);
        });
}

})();

//*Actualizar stock de productos en woocommerce
//  await Controller.updateWoocommerceStock(false)
//  .then(async(res)=>{
//      console.log("Respuesta de updateWoocommerceStock: ", res);
//  })
//  .catch(async(error)=>{
//      console.log("Error de updateWoocommerceStock: ", error);
//  });
//*Copiar productos de Woocommerce en Marketsync
// for (let cwm = 0; cwm < inventory.length; cwm++) {
//     const element = inventory[cwm].asin;
//     console.log('Element: ', element);


//     await Controller.copyWoocommerceToMarketsync(element)
//         .then(async (res) => {
//             console.log("Respuesta: ", res);
//         })
//         .catch(async (error) => {
//             console.log("Error: ", error);
//         });
// }
//*Escrapear categorias de marketsync y actualizar en woocommerce
//    await Controller.updateMarketsyncCategoriesOnWoocommerce()
//    .then(async(res)=>{
//        console.log("Respuesta de scrapeCategoriesOnMarketsync: ", res);
//    })
//    .catch(async(error)=>{
//        console.log("Error de scrapeCategoriesOnMarketsync: ", error);
//    });

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

//*Actualizar la garantía del producto en Marketsync
// await Controller.updateWarratyOnMarktsync()
// .then(async(res)=>{
//     console.log("Respuesta de updateWarratyOnMarktsync: Producto actualizado correctamente; ", res);
// })
// .catch(async(error)=>{
//     console.log("Error de updateWarratyOnMarktsync: ", error);
// });

//*Eliminar TODOS los productos de Marketsync
// await Controller.deleteAllofMarketsync()
// .then(async(res)=>{
//     console.log("Respuesta de deleteAllofMarketsync: ", res);
// })
// .catch(async(error)=>{
//     console.log("Error de deleteAllofMarketsync: ", error);
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

//*Actualizar precios e inventario de Woocommer y Marketsync
// await Controller.updateWooMarketWithAmazonData()
// .then(async(res)=>{
//     console.log("Respuesta de updateWooMarketWithAmazonData: ", res);
// })
// .catch(async(error)=>{
//     console.log("Error de updateWooMarketWithAmazonData: ", error);
// });

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

//*Actualizar categorias Woocommerce individualmente
//    await Controller.updateCategoriesOnWoocommerce(false)
//    .then(async(res)=>{
//        console.log("Respuesta de scrapeCategoriesOnMarketsync: ", res);
//    })
//    .catch(async(error)=>{
//        console.log("Error de scrapeCategoriesOnMarketsync: ", error);
//    });