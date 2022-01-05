//require('dotenv').config();
const fs = require('fs');
const MarketsyncModel = require('./marketsync/MarketsyncModel');
const AllController = require('./controller/AllController');

(async () => {

    const Controller = new AllController();

        let key = 9;
        let b = true;
        let inventory = []

    switch (key) {
        case 1://Doc Actualizar stock Mercadolibre
            await Controller.connectAll()
            .then(async(res)=>{
                console.log("Respuesta de connectAll: ", res);
            })
            .catch(async(error)=>{
                console.log("Error de connectAll: ", error);
            });
            await Controller.updateStockPriceMercadolibre(false)
            .then(async(res)=>{
                console.log("Respuesta de updateStockPriceMercadolibre: ", res);
            })
            .catch(async(error)=>{
                console.log("Error de updateStockPriceMercadolibre: ", error);
            });
            
            break;
        case 2://Doc Copiar productos de Amazon a Woocommerce
            await Controller.connectAll()
            .then(async(res)=>{
                console.log("Respuesta de connectAll: ", res);
            })
            .catch(async(error)=>{
                console.log("Error de connectAll: ", error);
            });
            if(b){
                let rawdata = fs.readFileSync('./json/simple_data.json', 'utf8');
                inventory = await JSON.parse(rawdata);
            }
            await Controller.copyAmazonToWoocommerce(false, inventory)
            .then(async(res)=>{
                console.log("Respuesta de copyAmazonToWoocommerce: ", res);
            })
            .catch(async(error)=>{
                console.log("Error de copyAmazonToWoocommerce: ", error);
            })
            break;
        case 3://Doc Copiar productos a Mercadolibre
            await Controller.connectAll()
            .then(async(res)=>{
                console.log("Respuesta de connectAll: ", res);
            })
            .catch(async(error)=>{
                console.log("Error de connectAll: ", error);
            });

            if(b){
                let rawdata = fs.readFileSync('./json/simple_data.json', 'utf8');
                inventory = await JSON.parse(rawdata);
            }

            for (let cwm = 0; cwm < inventory.length; cwm++) {
                await Controller.copyWoocommerceToMercadoLibre(inventory[cwm])
                    .then(async (res) => {
                        console.log("Respuesta de copyWoocommerceToMercadoLibre: ", res);
                    })
                    .catch(async (error) => {
                        console.log("Error de copyWoocommerceToMercadoLibre: ", error);
                    });
            }
            break;

        case 4://doc Actualizar imagenes en Woocommerce
            await Controller.connectAll()
            .then(async(res)=>{
                console.log("Respuesta de connectAll: ", res);
            })
            .catch(async(error)=>{
                console.log("Error de connectAll: ", error);
            });

            await Controller.updateWoocommerceImages(false)
            .then(async(res)=>{
                console.log("Respuesta de updateWoocommerceImages: ", res);
            })
            .catch(async(error)=>{
                console.log("Error de updateWoocommerceImages: ", error);
            });

            break;
        case 5://Doc Copiar productos de woocommerce a Claroshop
            await Controller.connectWoo()
            .then(async(res)=>{
                console.log("Respuesta de connectWoo: ", res);
            })
            .catch(async(error)=>{
                console.log("Error de connectWoo: ", error);
            });

            await Controller.copyWoocommerceToClaroshop(false)
            .then(async(res)=>{
                console.log("Respuesta de copyWoocommerceToClaroshop: ", res);
            })
            .catch(async(error)=>{
                console.log("Error de copyWoocommerceToClaroshop: ", error);
            })
            break;
        case 6://Doc Actualizar precio y stock en Woocommerce
            await Controller.connectWoo()
            .then(async(res)=>{
                console.log("Respuesta de connectWoo: ", res);
            })
            .catch(async(error)=>{
                console.log("Error de connectWoo: ", error);
            });

            await Controller.updateWoocommerceStock(false)
            .then(async(res)=>{
                console.log("Respuesta de updateWoocommerceStock: ", res);
            })
            .catch(async(error)=>{
                console.log("Error de updateWoocommerceStock: ", error);
            })
            break;
        case 7: //Doc Elimina Productos de Claroshop
            await Controller.eliminarTodosLosProductosClaroshop()
            .then(async(res)=>{
                console.log("Respuesta de eliminarTodosLosProductosClaroshop: ", res);
            })
            .catch(async(error)=>{
                console.log("Error de eliminarTodosLosProductosClaroshop: ", error);
            })
            break;
        case 8:
            await Controller.connectAll()
            .then(async(res)=>{
                console.log("Respuesta de connectAll: ", res);
            })
            .catch(async(error)=>{
                console.log("Error de connectAll: ", error);
            });

            await Controller.getMercadolibreCategories();
            break;
        case 9:
            await Controller.connectWoo()
            .then(async(res)=>{
                console.log("Respuesta de connectWoo: ", res);
            })
            .catch(async(error)=>{
                console.log("Error de connectWoo: ", error);
            });

            if(b){
                let rawdata = fs.readFileSync('./json/simple_data.json', 'utf8');
                inventory = await JSON.parse(rawdata);
            }
            

            await Controller.updateClaroPriceInventory(false, inventory)
            .then(async(res)=>{
                console.log("Respuesta de updateClaroPriceInventory: ", res);
            })
            .catch(async(error)=>{
                console.log("Error de updateClaroPriceInventory: ", error);
            })
            break;
        default:
            break;
    }

    await Controller.createLogFile();

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