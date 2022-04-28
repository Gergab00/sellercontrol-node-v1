const urlRegexSafe = require('url-regex-safe');
const { convert } = require('html-to-text');
const jimp = require('jimp');

/**
 * @version 2021.03.03
 * @author Gerardo Gonzalez
 */
class Tools{

    constructor(){}

    /**
     * @version 2022.04.19
     * @author Gerardo Gonzalez
     */
    async ponerMargenAlaImagen(src_img){
        const image = await jimp.read(src_img);
        const parrot = await jimp.read('/img/white_background.jpg');
        const height = image.height + 100;
        const width  = image.width + 100;
        
        parrot.resize(width, height);

        image.blit(parrot);
    }

    /**
     * @version 2021.03.03
     * @author Gerardo Gonzalez
     */
    async isObject(input) {
        return typeof input === "object" && input !== null
    }

    /**
     * @version 2021.03.03
     * @author Gerardo Gonzalez
     */
    async eliminarURLTexto(texto){
        
        texto = convert(texto);

        const matches = texto.match(urlRegexSafe());
        
        if(matches === null) return texto;

        for (const match of matches) {
        console.log('match', match);
        texto = texto.replace(match, '');
        console.log(texto)
        }
    
        return texto
    }

    async getMetadata(data, value){
        return new Promise(async (resolve, reject) => {
            
            if(data.meta_data === undefined) reject('Error en getMetadata, en key - ' + value + ' - el valor es undefined.');

            for (let i = 0; i < data.meta_data.length; i++) {
                if (data.meta_data[i].key == value) {
                    //if(dataProduct.meta_data[i].key == '') resolve("Generico");
                    if('' === data.meta_data[i].value) reject('Error en getMetadata, en key - ' + value + ' - el valor está vacío.');
                    if("L'Oreal Paris" == data.meta_data[i].value) resolve("L'Oréal Paris");
                    resolve(data.meta_data[i].value)
                }
            }
            reject('Error en getMetadata, no se encontro ningun valor a la clave ' + value + '.')
        });
    }

    async getAttributesML(data, value){
        return new Promise(async (resolve, reject) => {
            for (let i = 0; i < data.attributes.length; i++) {
                if (data.attributes[i].id == value) {
                    if('' === data.attributes[i].value_name) reject('Error en getAttributesML, en id - ' + value + ' - el valor está vacío.');
                    if(value === 'VOLUME_CAPACITY') resolve(data.attributes[i].value_struct.number)
                    resolve(data.attributes[i].value_name)
                }
            }
            reject('Error en getAttributesML, en id - ' + value + ' - el valor está vacío.');                    
        });
    }

    async pausa(){
        return new Promise(async (resolve) => {
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            readline.question('Revise el error. Presione ENTER para continuar.', (opt) =>{
                readline.close();
                resolve()
            });
        });
    }

    /**
     * Funcion que aumenta el precio segun el valor que se le de en porcentaje mayor a 1, por ejemplo 1.2 para aumentar en 20%
     * @version 2022.04.21
     * @author Gerardo Gonzalez
     * @param {number} price 
     * @param {float} aumento 
     * @returns {float} El valor del precio aumentado en el porcentaje indicado
     */
     async aumentarPrecio(price, aumento) {
        let pricef = Number.parseFloat(price.replace(",", ""));
        let p = (pricef * aumento)/0.75;
        return p.toFixed(2);
    }

}

module.exports = Tools;