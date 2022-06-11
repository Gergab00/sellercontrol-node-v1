const inquirer = require('inquirer');
require('colors');

//* Configuración del menú de selección
const menuOpts = [
    {
        type: 'list',
        name: 'opcion',
        message: '¿Qué desea hacer?',
        choices: [
            {
                value: '1',
                name: `${ '1.'.green } Sincronizar productos Prime.`
            },
            {
                value: '2',
                name: `${ '2.'.green } Obtener datos de un producto de Amazon.`
            },
            {
                value: '3',
                name: `${ '3.'.green } Obtener datos de un categoria de Mercadolibre.`
            },
            {
                value: '98',
                name: `${ '98.'.green } Prueba de code challenge.`
            },
            {
                value: '99',
                name: `${ '99.'.green } Prueba de manejoCategoriasWoo.`
            },
            {
                value: '0',
                name: `${ '0.'.green } Salir.`
            }

        ]
    }
]

const inquirerMenu = async() => {

    
    console.log('\n');
    console.log('==================================================='.green);
    console.log('         Distribuidora Rivera-Gonzalez'.magenta);
    console.log('==================================================='.green);
    console.log('    Control y sincronización de Inventarios'.white);
    console.log('==================================================='.green);
    console.log('               Seleccione una opción'.yellow);
    console.log('===================================================\n'.green);

    const { opcion } = await inquirer.prompt(menuOpts);

    return opcion;
}

const pausa = async() => {
    
    const question = [
        {
            type: 'input',
            name: 'enter',
            message: `Presione ${ 'enter'.green } para continuar`
        }
    ];

    console.log('\n');
    await inquirer.prompt(question);
}

const leerInput = async( message ) => {

    const question = {
        type:'input',
        name: 'desc',
        message,
        validate( value ){
            return value.length === 0 ? 'Por favor ingresa un valor' : true;
        }
    }

    const { desc } = await inquirer.prompt(question);
    return desc
}

module.exports = {
    inquirerMenu,
    pausa,
    leerInput
}