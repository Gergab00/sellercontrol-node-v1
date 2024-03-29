//require('dotenv').config();
//requiere('colors');
const fs = require('fs');
const AllController = require('./controller/AllController');


(async () => {

    const Controller = new AllController();

    let key = 17;
    let b = false;
    let inventory = [];
    let asin = 'B08SRB1PTX';
    let ml_cat = 'MLM1610';
    let cl_cat = '20251';

    switch (key) {
        case 1: //Doc Actualizar stock Mercadolibre
            await Controller.connectAll()
                .then(async (res) => {
                    console.log("Respuesta de connectAll: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de connectAll: ", error);
                });
            if (b) {
                let rawdata = fs.readFileSync('./json/simple_data.json', 'utf8');
                inventory = await JSON.parse(rawdata);
            }
            await Controller.updateStockPriceMercadolibre(false, inventory)
                .then(async (res) => {
                    console.log("Respuesta de updateStockPriceMercadolibre: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de updateStockPriceMercadolibre: ", error);
                });

            break;
        case 2: //Doc Copiar productos de Amazon a Woocommerce
            await Controller.connectAll()
                .then(async (res) => {
                    console.log("Respuesta de connectAll: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de connectAll: ", error);
                });
            if (b) {
                let rawdata = fs.readFileSync('./json/simple_data.json', 'utf8');
                inventory = await JSON.parse(rawdata);
            }
            await Controller.copyAmazonToWoocommerce(false, inventory)
                .then(async (res) => {
                    console.log("Respuesta de copyAmazonToWoocommerce: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de copyAmazonToWoocommerce: ", error);
                })
            break;
        case 3: //Doc Copiar productos a Mercadolibre
            await Controller.connectAll('TG-62210466569000001b313f34-86979722')
                .then(async (res) => {
                    console.log("Respuesta de connectAll: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de connectAll: ", error);
                });

            if (b) {
                let rawdata = fs.readFileSync('./json/simple_data.json', 'utf8');
                inventory = await JSON.parse(rawdata);
            }

            await Controller.copyWoocommerceToMercadoLibre(false, inventory)
                .then(async (res) => {
                    console.log("Respuesta de copyWoocommerceToMercadoLibre: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de copyWoocommerceToMercadoLibre: ", error);
                });
            break;

        case 4: //doc Actualizar Woocommerce con Amazon
            await Controller.connectAll()
                .then(async (res) => {
                    console.log("Respuesta de connectAll: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de connectAll: ", error);
                });

            if (b) {
                let rawdata = fs.readFileSync('./json/simple_data.json', 'utf8');
                inventory = await JSON.parse(rawdata);
            }

            await Controller.updateWoocommerce(false, inventory)
                .then(async (res) => {
                    console.log("Respuesta de updateWoocommerce: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de updateWoocommerce: ", error);
                });

            break;
        case 5: //Doc Copiar productos de woocommerce a Claroshop
            await Controller.connectWoo()
                .then(async (res) => {
                    console.log("Respuesta de connectWoo: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de connectWoo: ", error);
                });

            if (b) {
                let rawdata = fs.readFileSync('./json/simple_data.json', 'utf8');
                inventory = await JSON.parse(rawdata);
            }

            await Controller.copyWoocommerceToClaroshop(false, inventory)
                .then(async (res) => {
                    console.log("Respuesta de copyWoocommerceToClaroshop: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de copyWoocommerceToClaroshop: ", error);
                })
            break;
        case 6: //Doc Actualizar precio y stock en Woocommerce
            await Controller.connectAll()
                .then(async (res) => {
                    console.log("Respuesta de connectWoo: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de connectWoo: ", error);
                });

            await Controller.updateWoocommerceStock(false)
                .then(async (res) => {
                    console.log("Respuesta de updateWoocommerceStock: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de updateWoocommerceStock: ", error);
                })
            break;
        case 7: //Doc Elimina Productos de Claroshop
            await Controller.eliminarTodosLosProductosClaroshop()
                .then(async (res) => {
                    console.log("Respuesta de eliminarTodosLosProductosClaroshop: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de eliminarTodosLosProductosClaroshop: ", error);
                })
            break;
        case 8: //Doc Obtener Atributos de la categoria de mercadolibre.
            await Controller.connectAll()
                .then(async (res) => {
                    console.log("Respuesta de connectAll: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de connectAll: ", error);
                });

            await Controller.getMercadolibreCategories(ml_cat)
            .then(async (res) => {
                console.log("Respuesta de getMercadolibreCategories: ", res);
            })
            .catch(async (error) => {
                console.log("Error de getMercadolibreCategories: ", error);
            });
            break;
        case 9: //Doc Actualizar inventario y precio de Claroshop
            await Controller.connectWoo()
                .then(async (res) => {
                    console.log("Respuesta de connectWoo: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de connectWoo: ", error);
                });

            if (b) {
                let rawdata = fs.readFileSync('./json/simple_data.json', 'utf8');
                inventory = await JSON.parse(rawdata);
            }

            await Controller.updateClaroPriceInventory(false, inventory)
                .then(async (res) => {
                    console.log("Respuesta de updateClaroPriceInventory: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de updateClaroPriceInventory: ", error);
                })
            break;

        case 10: //Doc Obtener información de un producto de Amazon
            await Controller.connectAll()
                .then(async (res) => {
                    console.log("Respuesta de connectWoo: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de connectWoo: ", error);
                });

            await Controller.getAmazonProducto(false, asin)
                .then(async (res) => {
                    console.log("Respuesta de getAmazonProducto: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de getAmazonProducto: ", error);
                });
            
            break;
            case 11: //Doc Obtener información de un producto de Woocomerce
            await Controller.connectAll()
                .then(async (res) => {
                    console.log("Respuesta de connectWoo: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de connectWoo: ", error);
                });

            await Controller.getWoocommerceProducto(asin)
                .then(async (res) => {
                    console.log("Respuesta de getWoocommerceProducto: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de getWoocommerceProducto: ", error);
                });
            
            break;
            case 12: //Doc Obtener información de un producto de Mercadolibre
            await Controller.connectAll()
                .then(async (res) => {
                    console.log("Respuesta de connectWoo: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de connectWoo: ", error);
                });

            await Controller.getMercadolibreProducto(asin)
                .then(async (res) => {
                    console.log("Respuesta de getMercadolibreProducto: ", res.response.data);
                })
                .catch(async (error) => {
                    console.log("Error de getMercadolibreProducto: ", error);
                });
            
            break;
        
            case 14: //Doc Obtener información de un producto de Claroshop
                console.log("No hay acciones programadas")
            break;
            case 15://Doc Obtener atributos de categoria de Claroshop
                await Controller.getAtributosCategoriaClaro(cl_cat)
                .then(async (res) => {
                    console.log("Respuesta de getAtributosCategoriaClaro: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de getAtributosCategoriaClaro: ", error);
                });
                break;
            case 16://Doc Actualizar Woocommerce con información de Mercadolibre
            await Controller.connectAll()
                .then(async (res) => {
                    console.log("Respuesta de connectAll: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de connectAll: ", error);
                });

            if (b) {
                let rawdata = fs.readFileSync('./json/simple_data.json', 'utf8');
                inventory = await JSON.parse(rawdata);
            }

            await Controller.updateWoocommerceWithMercadoLibre(false, inventory)
                .then(async (res) => {
                    console.log("Respuesta de updateWoocommerceWithMercadoLibre: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de updateWoocommerceWithMercadoLibre: ", error);
                });
            break;
            case 17://Doc Copiar productos de Amazon Prime a Woocommerce y ML
            await Controller.connectAll()
                .then(async (res) => {
                    console.log("Respuesta de connectAll: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de connectAll: ", error);
                });
                    
            await Controller.copyAmazonPrimeToWooyML(false)
                .then(async (res) => {
                    console.log("Respuesta de copyAmazonPrimeToWooyML: ", res);
                })
                .catch(async (error) => {
                    console.log("Error de copyAmazonPrimeToWooyML: ", error);
                });
            break;
        default:
            break;
    }

    await Controller.createLogFile();

})();