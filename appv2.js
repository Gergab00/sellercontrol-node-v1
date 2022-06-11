require('colors');
const fs = require('fs');
const AllController = require('./controller/AllController');
const {
    inquirerMenu,
    pausa,
    leerInput
} = require('./helpers/inquirer');

const main = async () => {

    console.clear();

    const Controller = new AllController();
    

    await Controller.connectAll('TG-6287d003dc3cdd00142a2c00-1066828182')
                    .then(async (res) => {
                        console.log("Respuesta de connectAll: ", res);
                    })
                    .catch(async (error) => {
                        console.log("Error de connectAll: ", error);
                    });

    let opt = '';

    do {

        opt = await inquirerMenu();

        switch (opt) {
            case '1':                

                await Controller.copyAmazonPrimeToWooyML(false)
                    .then(async (res) => {
                        console.log("Respuesta de copyAmazonPrimeToWooyML: ", res);
                    })
                    .catch(async (error) => {
                        console.log("Error de copyAmazonPrimeToWooyML: ", error);
                    });

                break;
            case '2':
                const asin = await leerInput('Ingresa un ASIN para obtener la información:');
                const producto = await Controller.getAmazonProducto(true, asin);
                console.log('Producto obtenido de Amazon: '.italic.green, producto);
                break;
            case '3':
                const mlcat = await leerInput('Ingresa un código de categoria de Mercadolibre:');
                const info = await Controller.getMercadolibreCategories(mlcat);
                console.log('Información de categoria: '.italic.green, info);
                break;
            
            //* Case para pruebas 
            case '98':
                break;
            case '99':
                let p ={};
                const name = await leerInput('Ingresa el nombre de una categoria:');
                const code = await leerInput('Ingresa el código de la categoria:');
                const id = await Controller.manejoCategoriasWoo({
                    nombre: name,
                    code
                });
                console.log('ID de categoria obtenido: ', id);
                break;
        }

        await pausa();
        console.clear();

    } while (opt !== '0');
}

main();