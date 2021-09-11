require('dotenv').config();
const MercadoLibreWoocommerceController = require('./controller/MercadolibreWoocommerceController');
//const AmazonWoocommerceController = require('./controller/AmazonWoocommerceController.js');

(async () => {

    const  mlwooCon = new MercadoLibreWoocommerceController();
    await mlwooCon.createConections()
    .then(async (res) => {
        console.log("Respuesta: ", res);
    })
    .catch(async (error) => {
        console.log("Error: ", error);
    });

    let skus;
    
    await mlwooCon.getAvailableSku()
    .then(async(res)=>{
        skus = res;
        console.log("Respuesta: ", res);
    })
    .catch(async(error)=>{
        console.log("Error: ", error);
    });

    for (let i = 0; i < 10; i++) {
        await mlwooCon.copyWoocommerceToMercadoLibre(skus[i])
        .then(async(res)=>{
            console.log("Respuesta: ", res);
        })
        .catch(async(error)=>{
            console.log("Error: ", error);
        })
    }

    /*const AmzWooCon = new AmazonWoocommerceController();

    await AmzWooCon.createConections()
        .then(async (res) => {
            console.log("Respuesta: ", res);
        })
        .catch(async (error) => {
            console.log("Error: ", error);
        });

    let inventory = await AmzWooCon.getInventory()
        .then(async (res) => {
            console.log("Respuesta: ", res.msg);
            return res.data;
        })
        .catch(async (error) => {
            console.log("Error: ", error);
        });*/

})();