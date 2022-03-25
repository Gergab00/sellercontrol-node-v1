//Note carlos.cruz@claroshop.com
//Note luis.cebada@claroshop.com
require('dotenv').config();
const fs = require('fs');
const axios = require("axios");
const colors = require('colors');
const crypto = require("crypto-js");

class ClaroshopModel {

    CS_PUBLIC;
    CS_PRIVATE;

    constructor() {
        this.CS_PRIVATE = process.env.CS_PRIVATE;
        this.CS_PUBLIC = process.env.CS_PUBLIC;
    }

    /**
     * @returns String - Devuelve un string que es el code para poder hacer las llamadas a la API
     */
    async getSignature() {
        return new Promise(async (resolve) => {
            let hoy = new Date();
            let fecha = await this.formatoFecha(hoy);
            let pub = this.CS_PUBLIC;
            let priv = this.CS_PRIVATE;
            let hash = crypto.SHA256(pub + fecha + priv);
            resolve(`${pub}/${hash.toString()}/${fecha}`);
        });
    }

    async createProducto(code, dataProduct) {
        return new Promise(async (resolve, reject) => {
            console.log('Creando producto: ', dataProduct.sku);
            console.log(dataProduct.name.slice(0, 119).replace(/^[a-zA-Z0-9äÄëËïÏöÖüÜáéíóúÁÉÍÓÚÂÊÎÔÛâêîôûàèìòùÀÈÌÒÙñÑ&$,\.'"-.:%;=#!_¡\/?´¨`|¿*+~@()[\\]{]+$/));
            let att = {

                'Otra Información': `Material - ${await this.getMaterial(dataProduct)}`,
                'Edad Recomendada': `${await this.getMinAge(dataProduct)} - ${await this.getMaxAge(dataProduct)} meses`,
                'Color': await this.getColor(dataProduct)

            };
            let options = {
                method: 'post',
                baseURL: `https://selfservice.claroshop.com/apicm/v1/${code}/producto`,
                headers: {
                    'content-type': 'application/json'
                },
                data: {
                    nombre: dataProduct.name.slice(0, 119).replace(/^[a-zA-Z0-9äÄëËïÏöÖüÜáéíóúÁÉÍÓÚÂÊÎÔÛâêîôûàèìòùÀÈÌÒÙñÑ&$,\.'"-.:%;=#!_¡\/?´¨`|¿*+~@()[\\]{]+$/),
                    descripcion: dataProduct.description.slice(0, 1300).replace(/(<([^>]+)>)/ig, '') + '\n Garantía de 20 días con nosotros.\n' + dataProduct.short_description.slice(0, 300).replace(/(<([^>]+)>)/ig, ''),
                    especificacionestecnicas: dataProduct.short_description.slice(0, 300),
                    alto: Number.parseInt(dataProduct.dimensions.height),
                    ancho: Number.parseInt(dataProduct.dimensions.width),
                    profundidad: Number.parseInt(dataProduct.dimensions.length),
                    peso: (Number.parseInt(dataProduct.weight) > 1) ? Number.parseInt(dataProduct.weight) : 1,
                    preciopublicobase: Number.parseInt(dataProduct.regular_price) * 1.72,
                    preciopublicooferta: Number.parseInt(dataProduct.regular_price),
                    cantidad: dataProduct.stock_quantity,
                    skupadre: dataProduct.sku,
                    ean: await this.getEAN(dataProduct),
                    estatus: "activo",
                    embarque: 3,
                    categoria: await this.getClaroshopCategoryCode(dataProduct),
                    fotos: await this.normalizePictures(dataProduct).catch(async () => {
                        return {
                            "url": "https://st4.depositphotos.com/14953852/24787/v/600/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg",
                            "orden": 1
                        }
                    }),
                    marca: await this.getManufacturer(dataProduct).then(async (res) => {
                        return res.toUpperCase()
                    }),
                    agregarmarca: await this.getManufacturer(dataProduct).then(async (res) => {
                        return res.toUpperCase()
                    }),
                    atributos: JSON.stringify(att),
                    tag: dataProduct.name.replace(" ", ", "),
                    garantia: "{\"warranty\":[{\"seller\":{\"time\":\"20 Día(s)\"},\"manufacturer\":{\"time\":\"3 Mes(es)\"}}]}",
                }
            };
            axios(options)
                .then(async (res) => {
                    //console.log('----------------------------------------------------------------------\nREQUEST: ',res);
                    //Doc Se revisa si hubo algún error aunque el código de estatus 200.
                    if (new RegExp('error', "gi").test(res.data.estatus)) {
                        //Doc si existe algún error se revisa si fue por marca para iniciar de nuevo el registro pero con el cambio de campo de agregar marca
                        if (res.data.mensaje.hasOwnProperty('marca')) {
                            console.log('Se entra en el if de marca.')
                            let options_2 = {
                                method: 'post',
                                baseURL: `https://selfservice.claroshop.com/apicm/v1/${code}/producto`,
                                headers: {
                                    'content-type': 'application/json'
                                },
                                data: {
                                    nombre: dataProduct.name.slice(0, 119).replace(/^[a-zA-Z0-9äÄëËïÏöÖüÜáéíóúÁÉÍÓÚÂÊÎÔÛâêîôûàèìòùÀÈÌÒÙñÑ&$,\.'"-.:%;=#!_¡\/?´¨`|¿*+~@()[\\]{]+$/),
                                    descripcion: dataProduct.description.slice(0, 1300).replace(/(<([^>]+)>)/ig, '') + '\n Garantía de 20 días con nosotros.\n' + dataProduct.short_description.slice(0, 300).replace(/(<([^>]+)>)/ig, ''),
                                    especificacionestecnicas: dataProduct.short_description.slice(0, 300),
                                    alto: Number.parseInt(dataProduct.dimensions.height),
                                    ancho: Number.parseInt(dataProduct.dimensions.width),
                                    profundidad: Number.parseInt(dataProduct.dimensions.length),
                                    peso: (Number.parseInt(dataProduct.weight) > 1) ? Number.parseInt(dataProduct.weight) : 1,
                                    preciopublicobase: Number.parseInt(dataProduct.regular_price) * 1.72,
                                    preciopublicooferta: Number.parseInt(dataProduct.regular_price),
                                    cantidad: dataProduct.stock_quantity,
                                    skupadre: dataProduct.sku,
                                    ean: await this.getEAN(dataProduct),
                                    estatus: "activo",
                                    embarque: 3,
                                    categoria: await this.getClaroshopCategoryCode(dataProduct),
                                    fotos: await this.normalizePictures(dataProduct),
                                    marca: "",
                                    agregarmarca: await this.getManufacturer(dataProduct).then(async (res) => {
                                        return res.slice(0, 59)
                                    }),
                                    atributos: JSON.stringify(att),
                                    tag: dataProduct.name.replace(" ", ", "),
                                    garantia: "{\"warranty\":[{\"seller\":{\"time\":\"20 Día(s)\"},\"manufacturer\":{\"time\":\"3 Mes(es)\"}}]}",
                                }
                            };

                            axios(options_2)
                                .then(async (res) => {
                                    //console.log('----------------------------------------------------------------------\nREQUEST: ',res);
                                    resolve(res.data)
                                })
                                .catch(async (error) => {

                                    if (error.response.data.mensaje.includes('atributos')) {

                                        console.log('Se entra en el if de atributos.')
                                        let options_3 = {
                                            method: 'post',
                                            baseURL: `https://selfservice.claroshop.com/apicm/v1/${code}/producto`,
                                            headers: {
                                                'content-type': 'application/json'
                                            },
                                            data: {
                                                nombre: dataProduct.name.slice(0, 119).replace(/^[a-zA-Z0-9äÄëËïÏöÖüÜáéíóúÁÉÍÓÚÂÊÎÔÛâêîôûàèìòùÀÈÌÒÙñÑ&$,\.'"-.:%;=#!_¡\/?´¨`|¿*+~@()[\\]{]+$/),
                                                descripcion: dataProduct.description.slice(0, 1300).replace(/(<([^>]+)>)/ig, '') + '\n Garantía de 20 días con nosotros.\n' + dataProduct.short_description.slice(0, 300).replace(/(<([^>]+)>)/ig, ''),
                                                especificacionestecnicas: dataProduct.short_description.slice(0, 300),
                                                alto: Number.parseInt(dataProduct.dimensions.height),
                                                ancho: Number.parseInt(dataProduct.dimensions.width),
                                                profundidad: Number.parseInt(dataProduct.dimensions.length),
                                                peso: (Number.parseInt(dataProduct.weight) > 1) ? Number.parseInt(dataProduct.weight) : 1,
                                                preciopublicobase: Number.parseInt(dataProduct.regular_price) * 1.72,
                                                preciopublicooferta: Number.parseInt(dataProduct.regular_price),
                                                cantidad: dataProduct.stock_quantity,
                                                skupadre: dataProduct.sku,
                                                ean: await this.getEAN(dataProduct),
                                                estatus: "activo",
                                                embarque: 3,
                                                categoria: await this.getClaroshopCategoryCode(dataProduct),
                                                fotos: await this.normalizePictures(dataProduct),
                                                marca: "",
                                                agregarmarca: await this.getManufacturer(dataProduct).then(async (res) => {
                                                    return res.slice(0, 59)
                                                }),
                                                tag: dataProduct.name.replace(" ", ", "),
                                                garantia: "{\"warranty\":[{\"seller\":{\"time\":\"20 Día(s)\"},\"manufacturer\":{\"time\":\"3 Mes(es)\"}}]}",
                                            }
                                        };

                                        axios(options_3)
                                            .then(async (res) => {
                                                //console.log('----------------------------------------------------------------------\nREQUEST: ',res);
                                                resolve(res.data)
                                            })
                                            .catch(async (error) => {
                                                reject(error)
                                            });

                                    }
                                    reject(error)
                                });

                        }

                    }
                    resolve(res.data)
                })
                .catch(async (error) => {
                    console.log("Error: ", error);
                    reject(error)
                });

            //resolve(`data: ${JSON.stringify(options.data)}`)
        });
    }


    async getCategorias(code) {
        return new Promise((resolve, reject) => {
            let options = {
                method: 'get',
                baseURL: `https://selfservice.claroshop.com/apicm/v1/${code}/categorias`,
                headers: {
                    'content-type': 'application/json'
                },
            }

            axios(options)
                .then((res) => {
                    fs.writeFile(
                        './json/claroshop_cat.json',
                        JSON.stringify(res.data, null, 2),
                        (err) => {
                            if (err) console.log(err)
                            else {
                                console.log('\nFile data written successfully\n'.green);
                                //console.log('The written has the following contents:')
                                console.log(fs.readFileSync('./json/claroshop_cat.json', 'utf8').blue);
                            }
                        },
                    );
                    resolve('Categorias obtenidas exitosamente.');
                })
                .catch((error) => {
                    console.log(error.message);
                    //console.log(error.response);
                    reject(error.message);
                });
        });
    }

    /**
     * Funcion que retorna los valores en JSON de los productos disponibles
     * 
     * @param {String} pub 
     * @param {hash} hash 
     * @param {date} fecha 
     * @returns  {Promise}
     */
    async getProducto(code, id) {
        return new Promise((resolve, reject) => {
            let options = {
                method: 'get',
                baseURL: `https://selfservice.claroshop.com/apicm/v1/${code}/producto/${id}`,
                headers: {
                    'content-type': 'application/json'
                },
            }

            axios(options)
                .then((res) => {
                    console.log(res.data);
                    resolve(res.data);
                })
                .catch((error) => {
                    console.log(error.message);
                    reject(error.message);
                });
        });
    }

    async getClaroCategory(mlCode) {
        return new Promise(async (resolve, reject) => {

            switch (mlCode) {
                case 'MLM189529':
                    resolve('20136') //Muebles
                    break;
                case 'MLM167538':
                case 'MLM167538':
                    resolve('20231') //Cocina
                    break;
                case 'MLM159228':
                case 'MLM1610':
                case 'MLM30075':
                    resolve('20251') //Blancos
                    break;
                case 'MLM119999':
                    resolve('20282') //Electrodomesticos
                    break;
                case 'MLM1271':
                    resolve('21078')//Perfumes y Fragancias
                    break;
                case 'MLM4597':
                    resolve('21104') //Cuidado del cabello
                    break;
                case 'MLM191844':
                    resolve('21208')
                    break;
                case 'MLM38485':
                case 'MLM455430':
                case 'MLM82876':
                case 'MLM179241':
                case 'MLM37525':
                case 'MLM2097':
                case 'MLM3043':
                case 'MLM190014':
                case 'MLM437278':
                case 'MLM422405':
                    resolve('21211'); //Figuras y muñecos
                    break;
                case 'MLM189401':
                    resolve('21213') //Instrumentos de juguete
                    break;
                case 'MLM194667':
                case 'MLM431919':
                    resolve('21214') //Playmobil
                    break;
                case 'MLM422407':
                case 'MLM352342':
                case 'MLM454736':
                    resolve('21216') //Trenes de juguetes
                    break;
                case 'MLM433685':
                case 'MLM189205':
                case 'MLM1887':
                case 'MLM431103':
                case 'MLM455861':
                case 'MLM189897':
                case 'MLM432702':
                case 'MLM3530':
                case 'MLM418349':
                case 'MLM29883':
                case 'MLM1843':
                    resolve('21217') //Otros Juguetes
                    break;
                case 'MLM82301':
                case 'MLM27814':
                case 'MLM423153':
                    resolve('21219') //Gimnasios y Tapetes
                    break;
                case 'MLM7809':
                case 'MLM1858':
                case 'MLM428944':
                case 'MLM431043':
                case 'MLM418879':
                case 'MLM429329':
                case 'MLM1196':
                case 'MLM32230':
                    resolve('21221') //Aprendizaje
                    break;
                case 'MLM437329':
                case 'MLM119997':
                case 'MLM455517':
                case 'MLM418394':
                case 'MLM429204':
                case 'MLM1910':
                case 'MLM429199':
                case 'MLM429203':
                case 'MLM418399':
                case 'MLM187767':
                case 'MLM189344':
                case 'MLM433755':
                case 'MLM118805':
                case 'MLM436930':
                case 'MLM119995':
                case 'MLM151595':
                case 'MLM185698':
                case 'MLM185696':
                case 'MLM4772':
                case 'MLM186862':
                    resolve('21222') //Didacticos
                    break;
                case 'MLM455509':
                    resolve('21225') //Vehículos montables
                    break;
                case 'MLM2968':
                    resolve('21227') //Muñecas
                    break;
                case 'MLM432149':
                    resolve('21236') //Juguetes exterior
                    break;
                case 'MLM429249':
                case 'MLM189110':
                case 'MLM2961':
                    resolve('21244') //Juguetes electronicos
                    break;
                case 'MLM430481':
                case 'MLM1161':
                    resolve('21249') //Juegos de mesa infantiles
                    break;
                case 'MLM191712':
                    resolve('21251') //Lego
                    break;
                case 'MLM1166':
                    resolve('21270') //Peluches
                    break;
                case 'MLM1196':
                    resolve('21287')//Libors y Revistas
                    break;
                case 'MLM431573':
                case 'MLM194743':
                case 'MLM1132':
                    resolve('21301') //Juguetes Novedosos
                    break;
                case 'MLM1077':
                    resolve('21852') //Alimentos y Premios
                    break;
                case 'MLM191692':
                case 'MLM168075':
                case 'MLM189205':
                    resolve('22032') //Higiene bucal
                    break;
                case 'MLM29907':
                case 'MLM172359':
                case 'MLM29883':
                case 'MLM172335':
                case 'MLM193880':
                case 'MLM172336':
                case 'MLM172337':
                case 'MLM29883':
                case 'MLM176144':
                case 'MLM172386':
                case 'MLM29901':
                    resolve('22140') //Maquillaje
                    break;
                case 'MLM6585':
                    resolve('22173') //Calzado deportivo
                    break;
                case 'MLM178496':
                    resolve('22158') //Guantes desechables
                    break;

                default:
                    reject(`No hay categoria registrada para ${mlCode}.`)
                    break;
            }
        });
    }

    async getAtributosCat(code, cat) {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'put',
                baseURL: `https://selfservice.claroshop.com/apicm/v1/${code}/categorias/${cat}`,
                headers: {
                    'content-type': 'application/json'
                },
            }

            axios(options)
                .then((res) => {
                    console.log(res.data);
                    resolve(res.data);
                })
                .catch((error) => {
                    console.log(error.message);
                    reject(error.message);
                });

        });
    }

    async updateProduct(code, ean, data) {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'put',
                baseURL: `https://selfservice.claroshop.com/apicm/v1/${code}/eanoperations/ean-${ean}`,
                headers: {
                    'content-type': 'application/json'
                },
                data: data
            }

            axios(options)
                .then((res) => {
                    console.log(res.data);
                    resolve(res.data);
                })
                .catch((error) => {
                    console.log(error.message);
                    reject(error.message);
                });

        });
    }

    async getProductos(code, params) {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'get',
                baseURL: `https://selfservice.claroshop.com/apicm/v1/${code}/producto${params}`,
                headers: {
                    'content-type': 'application/json'
                },
            }

            axios(options)
                .then((res) => {
                    console.log(res.data);
                    resolve(res.data);
                })
                .catch((error) => {
                    console.log(error.message);
                    reject(error.message);
                });
        });
    }

    async deleteProducto(code, transacionId) {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'delete',
                baseURL: `https://selfservice.claroshop.com/apicm/v1/${code}/producto/${transacionId}`,
                headers: {
                    'content-type': 'application/json'
                },
            }

            axios(options)
                .then((res) => {
                    console.log(res.data);
                    resolve(res.data);
                })
                .catch((error) => {
                    console.log(error.message);
                    reject(error.message);
                });
        });
    }

    //*Getters

    async getEAN(dataProduct) {
        return new Promise(async (resolve) => {
            for (let i = 0; i < dataProduct.meta_data.length; i++) {
                if (dataProduct.meta_data[i].key == '_ean') {
                    resolve(dataProduct.meta_data[i].value)
                }
            }
            resolve("");
        });
    }

    async getBrand(dataProduct) {
        return new Promise(async (resolve) => {
            for (let i = 0; i < dataProduct.meta_data.length; i++) {
                if (dataProduct.meta_data[i].key == '_brand_name') {
                    resolve(dataProduct.meta_data[i].value)
                }
            }
            resolve("");
        });
    }

    async getManufacturer(dataProduct) {
        return new Promise(async (resolve) => {
            for (let i = 0; i < dataProduct.meta_data.length; i++) {
                if (dataProduct.meta_data[i].key == '_manufacturer') {
                    resolve(dataProduct.meta_data[i].value)
                }
            }
            resolve("");
        });
    }

    async getModelNumber(dataProduct) {
        return new Promise(async (resolve) => {
            for (let i = 0; i < dataProduct.meta_data.length; i++) {
                if (dataProduct.meta_data[i].key == '_model_number') {
                    resolve(dataProduct.meta_data[i].value)
                }
            }
            resolve("");
        });
    }

    async getMercadolibreCategoryCode(dataProduct) {
        return new Promise(async (resolve) => {
            for (let i = 0; i < dataProduct.meta_data.length; i++) {
                if (dataProduct.meta_data[i].key == '_mercadolibre_category_code') {
                    resolve(dataProduct.meta_data[i].value)
                }
            }
            resolve("");
        });
    }

    async getClaroshopCategoryCode(dataProduct) {
        return new Promise(async (resolve) => {
            for (let i = 0; i < dataProduct.meta_data.length; i++) {
                if (dataProduct.meta_data[i].key == '_claroshop_category_code') {
                    resolve(dataProduct.meta_data[i].value)
                }
            }
            resolve("");
        });
    }

    async getMaterial(dataProduct) {
        return new Promise(async (resolve) => {
            for (let i = 0; i < dataProduct.meta_data.length; i++) {
                if (dataProduct.meta_data[i].key == '_material') {
                    resolve(dataProduct.meta_data[i].value)
                }
            }
            resolve("");
        });
    }

    async getColor(dataProduct) {
        return new Promise(async (resolve) => {
            for (let i = 0; i < dataProduct.meta_data.length; i++) {
                if (dataProduct.meta_data[i].key == '_color') {
                    resolve(dataProduct.meta_data[i].value.replace(/^[a-zA-Z0-9äÄëËïÏöÖüÜáéíóúÁÉÍÓÚÂÊÎÔÛâêîôûàèìòùÀÈÌÒÙñÑ&$,\.'"-.:%;=#!_¡\/?´¨`|¿*+~@()[\\]{]+$/))
                }
            }
            resolve("");
        });
    }

    async getMaxAge(dataProduct) {
        return new Promise(async (resolve) => {
            for (let i = 0; i < dataProduct.meta_data.length; i++) {
                if (dataProduct.meta_data[i].key == '_max_age') {
                    resolve(dataProduct.meta_data[i].value)
                }
            }
            resolve("");
        });
    }

    async getMinAge(dataProduct) {
        return new Promise(async (resolve) => {
            for (let i = 0; i < dataProduct.meta_data.length; i++) {
                if (dataProduct.meta_data[i].key == '_min_age') {
                    resolve(dataProduct.meta_data[i].value)
                }
            }
            resolve("");
        });
    }

    //*Otras funciones indispensables para la clase
    /**
     * Función que da formato a la fecha con la composición YYYY-MM-DDTHH:MM:SS
     * 
     * @param {Date} fecha 
     * @returns {String} De la fecha con el formato necesario.
     */
    async formatoFecha(fecha) {
        return new Promise(resolve => {
            const map = {
                dd: ('0' + fecha.getDate()).slice(-2),
                mon: ('0' + (fecha.getUTCMonth() + 1)).slice(-2),
                yyyy: fecha.getFullYear(),
                hh: ('0' + fecha.getHours()).slice(-2),
                min: ('0' + fecha.getMinutes()).slice(-2),
                ss: ('0' + fecha.getSeconds()).slice(-2)
            }

            let formattedDate = `${map.yyyy}-${map.mon}-${map.dd}T${map.hh}:${map.min}:${map.ss}`
            resolve(formattedDate);
        });
    }

    /**
     * Funcion que aumenta el precio segun el valor que se le de en porcentaje mayor a 1, por ejemplo 1.2 para aumentar en 20%
     * 
     * @param {number} price 
     * @param {float} aumento 
     * @returns El valor del precio aumentado en el porcentaje indicado
     */
    async aumentarPrecio(price, aumento) {
        let pricef = Number.parseFloat(price.replace(",", ""));
        let p = pricef * aumento;
        return p.toFixed(2);
    }

    /**
     * Devuelve un array con el formato necesario para el post.
     * 
     * @param {Array} imageSRC Array con la información de las imagenes
     * @returns Devuelve un Array formateado para poder realizar el post
     */
    async normalizePictures(pics) {
        return new Promise(async (resolve, reject) => {

            let pictures = [];
            if (0 != pics.images.length) {
                for (let j = 0; j < pics.images.length; j++) {
                    let a = {
                        "url": pics.images[j].src,
                        "orden": j + 1
                    }
                    pictures.push(a);
                    if (9 == j) resolve(pictures)
                }
                resolve(pictures);
            } else {
                reject("Error en normalizePictures.");
            }

        });
    }

    async normalize(str) {
        return new Promise(async resolve => {
            let from = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç",
                to = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc",
                mapping = {};

            for (let i = 0, j = from.length; i < j; i++)
                mapping[from.charAt(i)] = to.charAt(i);

            let ret = [];
            for (let i = 0, j = str.length; i < j; i++) {
                let c = str.charAt(i);
                if (mapping.hasOwnProperty(str.charAt(i)))
                    ret.push(mapping[c]);
                else
                    ret.push(c);
            }

            resolve(ret.toString());
        });
    }

}

module.exports = ClaroshopModel;