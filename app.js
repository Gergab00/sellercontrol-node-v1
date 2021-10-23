//require('dotenv').config();
const fs = require('fs');
const MarketsyncModel = require('./marketsync/MarketsyncModel');
const AllController = require('./controller/AllController');

(async () => {

    
    const Controller = new AllController();
    await Controller.connect()
        .then(async (res) => {
            console.log("Respuesta de connect: ", res);
        })
        .catch(async (error) => {
            console.log("Error en connect: ", error);
        });

    /*let inventory = await Controller.getAmazonSellerInventory()
        .then(async (res) => {
            console.log("Respuesta de getAmazonSellerInventory: ", res.msg);
            return res.data;
        })
        .catch(async (error) => {
            console.log("Error en getAmazonSellerInventory: ", error);
        });*/
    let rawdata = fs.readFileSync('./json/simple_data.json', 'utf8');
    let inventory = await JSON.parse(rawdata);

    const browser = await Controller.startBrowser(false);
    for (let i = 0; i < inventory.length; i++) {
        const element = inventory[i];
        await Controller.copyAmazonToWoocommerce(element, browser)
            .then(async (res) => {
                console.log("Respuesta de copyAmazonToWoocommerce: ", res);
            })
            .catch(async (error) => {
                console.log("Error de copyAmazonToWoocommerce: ", error);
            });
    }

    await Controller.stopBrowser(browser);

})();