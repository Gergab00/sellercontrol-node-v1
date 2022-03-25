const urlRegexSafe = require('url-regex-safe');

/**
 * @version 2021.03.03
 * @author Gerardo Gonzalez
 */
class Tools{

    constructor(){}

    /**
     * @version 2021.03.03
     * @author Gerardo Gonzalez
     */
    isObject(input) {
        return typeof input === "object" && input !== null
    }

    /**
     * @version 2021.03.03
     * @author Gerardo Gonzalez
     */
    async eliminarURLTexto(texto){
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
            
            if(data.meta_data === 'undefined') reject();

            for (let i = 0; i < data.meta_data.length; i++) {
                if (data.meta_data[i].key == value) {
                    //if(dataProduct.meta_data[i].key == '') resolve("Generico");
                    if("L'Oreal Paris" == data.meta_data[i].value) resolve("L'Oréal Paris");
                    resolve(data.meta_data[i].value)
                }
            }
            reject()
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

}

module.exports = Tools;