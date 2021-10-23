require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const CryptoJS = require("crypto-js");

class MarketsyncModel {

    server = 'https://web.marketsync.mx/api/';
    MS_PUBLIC_KEY;
    MS_PRIVATE_KEY;

    constructor() {
        this.MS_PUBLIC_KEY = process.env.MS_PUBLIC_KEY;
        this.MS_PRIVATE_KEY = process.env.MS_PRIVATE_KEY;
    }

    async getSignature(p = {}){
        return new Promise(async (resolve)=>{
            let hash = CryptoJS.HmacSHA256(await this.getParamtersEncode(p), this.MS_PRIVATE_KEY);
            resolve(hash.toString(CryptoJS.enc.Hex))
            //resolve(encodeURIComponent(hash));
        });
    }

    async getParamtersEncode(p = {}){
        return new Promise(async(resolve)=>{
            let hoy = new Date();
            p['timestamp'] = await this.formatoFecha(hoy);
            p['token'] = this.MS_PUBLIC_KEY;
            p["version"] = "1.0";
            let encode = [];
            for (let i = 0; i < Object.entries(p).length; i++) {
                const element = Object.entries(p)[i];
                encode.push(encodeURIComponent(element[0])+'='+encodeURIComponent(element[1]));
            }
            resolve(encode.join('&'))
        });
    }

    async getURL(controlador,p={}){
        return new Promise(async(resolve)=>{
            resolve(`${this.server}${controlador}?`+await this.getParamtersEncode(p)+'&signature='+await this.getSignature(p))
        });
    }

    async getProducts(){
        return new Promise(async (resolve, reject)=>{
            let options = {
                method : 'get',
                baseURL: await this.getURL('productos',{limit:'1'}),
                //baseURL : 'https://web.marketsync.mx/api/productos?timestamp=2021-10-08T05%3A54%3A23&token=acf2fc85bab0a2917fa6bf5f427a55f3&version=1.0&signature=585abb359ca67a62c16b30fc169f659e439fe806314068b32b976c5bbadf270b'
            }

            axios(options)
            .then((res)=>{
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }

    async createProducts(){
        return new Promise(async (resolve, reject)=>{
            let options = {
                method : 'post',
                baseURL: await this.getURL(''),
            }

            axios(options)
            .then((res)=>{
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }
    async upProducts(){
        return new Promise(async (resolve, reject)=>{
            let options = {
                method : 'put',
                baseURL: await this.getURL(''),
            }

            axios(options)
            .then((res)=>{
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }

//* Otras funciones
     /**
     * Función que da formato a la fecha con la composición YYYY-MM-DDTHH:MM:SS
     * 
     * @param {Date} fecha 
     * @returns {String} De la fecha con el formato necesario.
     */
      async formatoFecha(fecha) {
        return new Promise(resolve=>{
            const map = {
                dd: ('0'+fecha.getDate()).slice(-2),
                mon: ('0'+(fecha.getUTCMonth()+1)).slice(-2),
                yyyy: fecha.getFullYear(),
                hh: ('0'+fecha.getHours()).slice(-2),
                min: ('0'+fecha.getUTCMinutes()).slice(-2),
                ss: ('0'+fecha.getUTCSeconds()).slice(-2),
                mls: (fecha.getUTCMilliseconds())
            }

            let formattedDate = `${map.yyyy}-${map.mon}-${map.dd}T${map.hh}:${map.min}:${map.ss}.${map.mls}`
            resolve(formattedDate);
        });
    }
}

module.exports = MarketsyncModel;