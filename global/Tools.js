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

}

module.exports = Tools;