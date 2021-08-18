const dataProduct = {

    sku: "", //ASIN
    name: "",
    regular_price: "", //Amazon Price
    description: "",
    short_description: "",
    manage_stock: true,
    stock_quantity: 0,
    weight: "",
    dimensions: {
        length: "",
        width: "",
        height: "",
    },
    images: [
        /* 
        Bloque demo de contrucción de array de imagenes
        {
          src: "http://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2013/06/T_2_front.jpg"
        }, 
        */
    ],
    meta_data: [
        //dataProduct.meta_data[0].value
        {
            key: "_ean",
            value: "",
        },
        //dataProduct.meta_data[1].value
        {
            key: "_brand_name",
            value: "",
        },
        //dataProduct.meta_data[2].value
        {
            key: "_manufacturer",
            value: "",
        },
        //dataProduct.meta_data[3].value
        {
            key:"_model_number",
            value: "",
        },
        //dataProduct.meta_data[4].value
        {
            key: "_amazon_category",
            value: ""
        },
        //dataProduct.meta_data[5].value
        {
            key: "_competitive_pricing",
            value: "",
        }
    ],
}

module.exports = dataProduct;