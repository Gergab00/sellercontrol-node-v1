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

    async getSignature(p = {}) {
        return new Promise(async (resolve) => {
            let hash = CryptoJS.HmacSHA256(await this.getParamtersEncode(p), this.MS_PRIVATE_KEY);
            resolve(hash.toString(CryptoJS.enc.Hex))
            //resolve(encodeURIComponent(hash));
            resolve(encodeURIComponent(hash.toString(CryptoJS.enc.Hex)));
        });
    }

    async getParamtersEncode(p = {}) {
        return new Promise(async (resolve) => {
            let hoy = new Date();
            p['token'] = this.MS_PUBLIC_KEY;
            p['timestamp'] = await this.formatoFecha(hoy);
            p["version"] = "1.0";
            let encode = [];
            for (let i = 0; i < Object.entries(p).length; i++) {
                const element = Object.entries(p)[i];
                encode.push(encodeURIComponent(element[0]) + '=' + encodeURIComponent(element[1]));
            }
            resolve(encode.sort().join('&'))
        });
    }

    async getURL(controlador, p = {}) {
        return new Promise(async (resolve) => {
            resolve(`${this.server}${controlador}?` + await this.getParamtersEncode(p) + '&signature=' + await this.getSignature(p))
        });
    }

    async getProducts() {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'get',
                baseURL: await this.getURL('productos', {}),
                //baseURL : 'https://web.marketsync.mx/api/productos?timestamp=2021-10-08T05%3A54%3A23&token=acf2fc85bab0a2917fa6bf5f427a55f3&version=1.0&signature=585abb359ca67a62c16b30fc169f659e439fe806314068b32b976c5bbadf270b'
            }

            axios(options)
                .then((res) => {
                    console.log(`Productos obtenidos con éxito.`);
                    resolve(res);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    async existsProduct(sku) {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'get',
                baseURL: await this.getURL('productos', {
                    sku: sku
                }),
            }
            let ret;
            axios(options)
                .then(async (response) => {
                    if (1 === response.data.length) {
                        ret = false;
                    } else {
                        ret = true;
                    } //Si existe el producto regresa true, si no existe regresa false
                    console.log(`Resultado de existsProducts ${ret}`)
                    resolve(ret);
                })
                .catch(async (error) => {
                    reject(error)
                });
        });
    }

    async getCategories() {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'get',
                baseURL: await this.getURL('categorias', {
                    limit: 9999
                }),
            }

            axios(options)
                .then((res) => {
                    console.log('Categorias obtenidas exitosamente. Tamaño array: ', res.data.answer.length)
                    resolve(res.data.answer);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    async getAtributos(id) {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'get',
                baseURL: await this.getURL(`categorias/atributos/${id}`, {
                    limit: 9999
                }),
            }

            axios(options)
                .then((res) => {
                    console.log('Atributos obtenidas exitosamente.')
                    //resolve(res.data.answer[3].valores);
                    resolve(res.data.answer);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    async getAtributosFilter(id, manufacturer) {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'get',
                baseURL: await this.getURL(`categorias/atributos/${id}`, {
                    limit: 9999
                }),
            }

            axios(options)
                .then((res) => {
                    let atributos = [];
                    for (let i = 0; i < res.data.answer.length; i++) {
                        const element = res.data.answer[i];
                        //Doc Elimina los atributos por default, agrega los atributos de cada categoria eligiendo el primer elmento de la lista.
                        //Note Probar adquirir los demas elementos.
                        if (!element.atributo.includes('BRAND') && !element.atributo.includes('MODEL') && !element.atributo.includes('GTIN') && !element.atributo.includes('SELLER_SKU') && !element.atributo.includes('UPC') && !element.atributo.includes('EAN')) {
                            if (element.atributo.includes('MANUFACTURER')) {
                                atributos.push({
                                    atributo: 'MANUFACTURER',
                                    valor: manufacturer
                                })
                            } else {
                                let v;
                                if (element.valores.length != 0) {
                                    v = element.valores[0].valor
                                } else {
                                    if (element.tipo_valor.includes('string')) {
                                        v = ""
                                    } else {
                                        v = 10
                                    }
                                };
                                let u;
                                if (element.unidades.length != 0) {
                                    u = element.unidades[0].valor
                                } else {
                                    u = ""
                                }
                                let a = {
                                    atributo: element.atributo,
                                    //valor : (element.valores.length == 0) ? element.valores[0].valor:"",
                                    valor: v + ' ' + u,
                                    //unidad: u
                                };
                                atributos.push(a);
                            }
                        }
                    }
                    console.log('Atributos obtenidas exitosamente: ', atributos);
                    resolve(atributos);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    async getAtributosVarFilter(id, gtin, seller_sku) {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'get',
                baseURL: await this.getURL(`categorias/atributos/${id}`, {
                    limit: 9999
                }),
            }

            axios(options)
                .then((res) => {
                    let atributos = [];
                    for (let i = 0; i < res.data.answer.length; i++) {
                        const element = res.data.answer[i];
                        if (!element.variacion.includes('0') && !element.atributo.includes('BRAND') && !element.atributo.includes('MODEL') && !element.atributo.includes('GTIN') && !element.atributo.includes('SELLER_SKU') && !element.atributo.includes('UPC') && !element.atributo.includes('EAN')) {
                            if (element.atributo.includes('GTIN')) {
                                atributos.push({
                                    atributo: 'GTIN',
                                    valor: gtin
                                })
                            } else if (element.atributo.includes('SELLER_SKU')) {
                                atributos.push({
                                    atributo: 'SELLER_SKU',
                                    valor: seller_sku
                                })
                            } else {
                                let v;
                                if (element.valores.length != 0) {
                                    v = element.valores[0].valor
                                } else {
                                    if (element.tipo_valor.includes('string')) {
                                        v = ""
                                    } else {
                                        v = 10
                                    }
                                };
                                let u;
                                if (element.unidades.length != 0) {
                                    u = element.unidades[0].valor
                                } else {
                                    u = ""
                                }
                                let a = {
                                    atributo: element.atributo,
                                    //valor : (element.valores.length == 0) ? element.valores[0].valor:"",
                                    valor: v + ' ' + u,
                                    //unidad: u
                                };
                                atributos.push(a);
                            }

                        }
                    }
                    console.log('Atributos obtenidas exitosamente: ', atributos);
                    resolve(atributos);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    async getCategorieID(mlCatName, categorias) {
        return new Promise(async (resolve) => {
            for (let i = 0; i < categorias.length; i++) {

                if (categorias[i].ruta.toUpperCase().includes(mlCatName.replace(/\s/g, "_").toUpperCase())) {
                    resolve(categorias[i].id)
                }

                if (i + 1 == categorias.length) {
                    resolve("17644")
                }
            }
        });
    }

    async createProducts(dataProduct) {
        return new Promise(async (resolve, reject) => {
            let newProduct;
            try {
                let a = [{
                        atributo: 'EAN',
                        valor: await this.getEAN(dataProduct),
                    },
                    {
                        atributo: 'GTIN',
                        valor: await this.getEAN(dataProduct),
                    },
                    {
                        atributo: 'SELLER_SKU',
                        valor: dataProduct.sku
                    },
                    {
                        atributo: 'BRAND',
                        valor: await this.getBrand(dataProduct),
                    },
                    {
                        atributo: 'MODEL',
                        valor: await this.getModelNumber(dataProduct)
                    },
                    // {
                    //      atributo: 'ALPHANUMERIC_MODEL',
                    //      valor: await this.getModelNumber(dataProduct)
                    // }
                ];
                let b = await this.getAtributosFilter(await this.getMarketsycCategoryCode(dataProduct), await this.getManufacturer(dataProduct));
                let c = a.concat(b);
                newProduct = {
                    nombre: dataProduct.name,
                    descripcion: dataProduct.description,
                    ficha: `${dataProduct.short_description} \n Garantía de 30 días con nosotros.`,
                    alto: Number.parseInt(dataProduct.dimensions.height),
                    ancho: Number.parseInt(dataProduct.dimensions.width),
                    largo: Number.parseInt(dataProduct.dimensions.length),
                    peso: Number.parseInt(dataProduct.weight),
                    sku: dataProduct.sku,
                    dias_embarque: 2,
                    categoria_id: await this.getMarketsycCategoryCode(dataProduct),
                    filtro_id: "",
                    marca: await this.getManufacturer(dataProduct),
                    etiquetas: dataProduct.name.replace(" ", ", "),
                    modelo: await this.getModelNumber(dataProduct),
                    listing_type_id: 'gold_special',
                    warranty: "Garantí­a del vendedor: 30 dí­as",
                    nombre_modelo: dataProduct.name,
                    origen: "0",
                    color: "blanco",
                    base: "BLANCO",
                    palto: Number.parseInt(dataProduct.dimensions.height),
                    pancho: Number.parseInt(dataProduct.dimensions.width),
                    plargo: Number.parseInt(dataProduct.dimensions.length),
                    ppeso: Number.parseInt(dataProduct.weight),
                    date_created: await this.formatoFecha(new Date()),
                    etiquetas_web: "",
                    atributos: c
                }

            } catch (error) {
                reject(error)
            }
            let data = [];
            data.push(newProduct);
            let options = {
                method: 'post',
                baseURL: await this.getURL('productos'),
                data: data,
            }

            axios(options)
                .then((res) => {
                    console.log(`Producto creado con exito`, dataProduct.sku); //id path res.data.answer.ids
                    resolve(res);
                })
                .catch((error) => {
                    //console.log(`Error en createProduct: ${error.response.statusText}`);
                    reject(`Error en createProduct: ${error.response.statusText}`);
                });
        });
    }

    async createVaration(id, dataProduct) {
        return new Promise(async (resolve, reject) => {
            let a = [{
                    atributo: 'EAN',
                    valor: await this.getEAN(dataProduct)
                },
                //{atributo:'BRAND', valor:dataProduct.meta_data[1].value},
                //{atributo:'MODEL', valor:dataProduct.meta_data[3].value},
                //{atributo:'MANUFACTURER', valor:dataProduct.meta_data[2].value}
            ];
            let b = await this.getAtributosVarFilter(await this.getMarketsycCategoryCode(dataProduct), await this.getEAN(dataProduct), dataProduct.sku);
            let c = a.concat(b);
            let varProduct = {
                product_id: id,
                sku: dataProduct.sku,
                color: "blanco",
                base: "BLANCO",
                stock: dataProduct.stock_quantity,
                imagen1: (dataProduct.images.length > 2) ? dataProduct.images[0].src : "",
                imagen2: (dataProduct.images.length > 3) ? dataProduct.images[1].src : "",
                imagen3: (dataProduct.images.length > 4) ? dataProduct.images[2].src : "",
                imagen4: (dataProduct.images.length > 5) ? dataProduct.images[3].src : "",
                imagen5: (dataProduct.images.length > 6) ? dataProduct.images[4].src : "",
                imagen6: (dataProduct.images.length > 7) ? dataProduct.images[5].src : "",
                bullet1: (dataProduct.short_description.split('.').length > 2) ? dataProduct.short_description.split('.')[0] : "Un gran juguete de novedad.",
                bullet2: (dataProduct.short_description.split('.').length > 3) ? dataProduct.short_description.split('.')[1] : "Para diversión de niños y grandes.",
                bullet3: (dataProduct.short_description.split('.').length > 4) ? dataProduct.short_description.split('.')[2] : "Juguetes divertidos para toda la familia.",
                bullet4: (dataProduct.short_description.split('.').length > 5) ? dataProduct.short_description.split('.')[3] : "Juguetes originales y nuevos.",
                bullet5: (dataProduct.short_description.split('.').length > 6) ? dataProduct.short_description.split('.')[4] : "Juguetes con garantía de satisfacción.",
                bullet6: (dataProduct.short_description.split('.').length > 7) ? dataProduct.short_description.split('.')[5] : "Entre los mejores juguets para dar esta temporada.",
                atributos: c
            }
            
            let data = [];
            data.push(varProduct);
            console.log('Data varation: ', data[0]);
            let options = {
                method: 'post',
                baseURL: await this.getURL('variacion'),
                data: data
            };
            axios(options)
                .then(async (res) => {
                    console.log(`Variación creado con exito `, dataProduct.sku, res);
                    resolve(res)
                })
                .catch(async (error) => {
                    console.log(`Error en createVaration: ${error}`)
                    reject(error)
                });
        });
    }

    async setPrice(id, dataProduct) {
        return new Promise(async (resolve, reject) => {
            let price = [{
                    'product_id': id,
                    'market_id': 1,
                    'oferta': Math.round(Number.parseInt(dataProduct.regular_price) * 1.12),
                    'precio': Math.round(Number.parseInt(dataProduct.regular_price) * 1.27)
                }, // Claro
                {
                    'product_id': id,
                    'market_id': 2,
                    'oferta': Math.round(Number.parseInt(dataProduct.regular_price) * 1.12),
                    'precio': Math.round(Number.parseInt(dataProduct.regular_price) * 1.27)
                }, // Linio
                {
                    'product_id': id,
                    'market_id': 4,
                    'oferta': Number.parseInt(dataProduct.regular_price) * 1.12,
                    'precio': Number.parseInt(dataProduct.regular_price) * 1.27
                }, // MeLi
                {
                    'product_id': id,
                    'market_id': 5,
                    'oferta': Number.parseInt(dataProduct.regular_price) * 1.12,
                    'precio': Number.parseInt(dataProduct.regular_price) * 1.27
                }, // Walmart
                {
                    'product_id': id,
                    'market_id': 6,
                    'oferta': Number.parseInt(dataProduct.regular_price),
                    'precio': Number.parseInt(dataProduct.regular_price)
                }, // Amazon
            ];

            let options = {
                method: 'put',
                baseURL: await this.getURL('precios'),
                data: price
            };
            axios(options)
                .then(async (res) => {
                    console.log(`Precios creados con exito `/* , res.data.answer, res.data.answer[0].precios */);
                    resolve(res)
                })
                .catch(async (error) => {
                    console.log(`Error en setPrice: ${error}`);
                    reject(error)
                });
        });
    }

    async publicarProducto(id) {
        return new Promise(async (resolve, reject) => {
            let markets = [{
                    'product_id': id,
                    'market_id': 1
                }, // Claro
                {
                    'product_id': id,
                    'market_id': 2
                }, // Linio
                {
                    'product_id': id,
                    'market_id': 4
                }, // MeLi
                {
                    'product_id': id,
                    'market_id': 5
                }, // Walmart
                {
                    'product_id': id,
                    'market_id': 6
                }, // Amazon
            ];

            let options = {
                method: 'put',
                baseURL: await this.getURL('productos/publicar'),
                data: markets
            };

            axios(options)
                .then(async (res) => {
                    console.log(`Productos publicados con exito `/* , res.data.answer */);
                    resolve(res)
                })
                .catch(async (error) => {
                    console.log(`Error en setPrice: ${error}`);
                    reject(error)
                });
        });
    }

    /**
     * @param Object Un objeto llave-valor con el product_id (indispensable) y los valores a modificar.
     * @see https://github.com/Gergab00/marketsync/blob/master/controllers/productos.md
     */
    async updateProducts(p) {
        return new Promise(async (resolve, reject) => {
            let data = [];
            data.push(p);
            let options = {
                method: 'put',
                baseURL: await this.getURL('productos'),
                data: data,
            }

            axios(options)
                .then((res) => {
                    //console.log(res.data.answer);
                    resolve(res);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    async updateStockProducts(data) {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'put',
                baseURL: await this.getURL('stock'),
                data: data,
            }

            axios(options)
                .then((res) => {
                    //console.log(res.data.answer);
                    //console.log('Productos en Marketsync actualizados correctamente.')
                    resolve(res);
                })
                .catch((error) => {
                    console.log(error.response.data);
                    reject(error);
                });
        });
    }

    async updateStockCut(){
        return new Promise(async (resolve, reject) => {
            let hoy = new Date();
            let options = {
                method: 'post',
                baseURL: await this.getURL('stock'),
                data: {update_stock: await this.formatoFecha(hoy)},
            }
            axios(options)
                        .then((res) => {
                            resolve(res);
                        })
                        .catch((error) => {
                            console.log(error.response.data);
                            reject(error);
                        });
        });
    }

    async deleteProducts(id) {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'delete',
                baseURL: await this.getURL('productos'),
                data: [{
                    'product_id': id
                }]
            }

            axios(options)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }
    //*Getters

    async getEAN(dataProduct){
        return new Promise(async (resolve) => {
            for (let i = 0; i < dataProduct.meta_data.length; i++) {
                if(dataProduct.meta_data[i].key == '_ean'){
                   resolve(dataProduct.meta_data[i].value)
                }
            }
            resolve("");
        });
    }

    async getBrand(dataProduct){
        return new Promise(async (resolve) => {
            for (let i = 0; i < dataProduct.meta_data.length; i++) {
                if(dataProduct.meta_data[i].key == '_brand_name'){
                   resolve(dataProduct.meta_data[i].value)
                }
            }
            resolve("");
        });
    }

    async getManufacturer(dataProduct){
        return new Promise(async (resolve) => {
            for (let i = 0; i < dataProduct.meta_data.length; i++) {
                if(dataProduct.meta_data[i].key == '_manufacturer'){
                   resolve(dataProduct.meta_data[i].value)
                }
            }
            resolve("");
        });
    }

    async getModelNumber(dataProduct){
        return new Promise(async (resolve) => {
            for (let i = 0; i < dataProduct.meta_data.length; i++) {
                if(dataProduct.meta_data[i].key == '_model_number'){
                   resolve(dataProduct.meta_data[i].value)
                }
            }
            resolve("");
        });
    }

    async getMarketsycCategoryCode(dataProduct){
        return new Promise(async (resolve) => {
            for (let i = 0; i < dataProduct.meta_data.length; i++) {
                if(dataProduct.meta_data[i].key == '_marketsync_category_code'){
                   resolve(dataProduct.meta_data[i].value)
                }
            }
            resolve("");
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
        return new Promise(resolve => {
            const map = {
                dd: ('0' + fecha.getDate()).slice(-2),
                mon: ('0' + (fecha.getUTCMonth() + 1)).slice(-2),
                yyyy: fecha.getFullYear(),
                hh: ('0' + fecha.getHours()).slice(-2),
                min: ('0' + fecha.getUTCMinutes()).slice(-2),
                ss: ('0' + fecha.getUTCSeconds()).slice(-2),
                mls: (fecha.getUTCMilliseconds())
            }

            let formattedDate = `${map.yyyy}-${map.mon}-${map.dd}T${map.hh}:${map.min}:${map.ss}`
            resolve(formattedDate);
        });
    }

}

module.exports = MarketsyncModel;