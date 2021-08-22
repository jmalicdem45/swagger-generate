#!/usr/bin/env node
'use strict';
const chalk = require("chalk");
const boxen = require("boxen");
const fs = require('fs');
const toPascalCase = require('to-pascal-case');
const {toKebab} = require("to-kebab");
const pluralize = require('pluralize');

const greeting = chalk.white.bold("Generating interfaces");

const boxenOptions = {
 padding: 1,
 margin: 1,
 borderColor: "white",
 backgroundColor: "#555555"
};
const msgBox = boxen( greeting, boxenOptions );

console.log(msgBox);

const yargs = require("yargs");

const options = yargs
 .usage("Usage: -s <name>")
 .option("s", { alias: "swagger-name", describe: "Swagger.json name", type: "string", demandOption: true })
 .argv;

 const rawData = fs.readFileSync(options.s);
 const swagger = JSON.parse(rawData);
 const directory = 'interfaces';
 if (!fs.existsSync(directory)) {
     fs.mkdirSync(directory, { recursive: true });
 }
 Object.keys(swagger.definitions).forEach(async(key) => {
     if (key === 'ApiResponse') {
         return;
     }
     console.log(`Generating: ${ key } \n`);
     const model = swagger.definitions[key];
     const fileName = `${ toKebab(key).toLowerCase() }.interface.ts`;
     fs.writeFileSync(`${ directory }/${ fileName }`, writeFileContents(key, model.properties));
});

function writeFileContents(modelName, properties) {
    let fileContent = '';
    fileContent += buildImports(properties);
    const className = toPascalCase(modelName);
    fileContent  += `export interface I${ className } { \n${ buildProperties(properties) }}`;

    return fileContent;
}

function buildImports(properties) {
    let imports = '';
    Object.keys(properties).forEach(key => {
        const property = properties[key];
        if (property.type === 'object') {
            imports += `import { I${toPascalCase(key)} } from './${key}.interface'\n;`;
        }
        if (!property.hasOwnProperty('type')) {
            imports +=  `import { I${toPascalCase(key)} } from './${key}.interface';\n`;
        }
        if (property.type === 'array' && !property.items.hasOwnProperty('type')) {
            imports +=  `import { I${toPascalCase(pluralize.singular(key))} } from './${pluralize.singular(key)}.interface';\n`;
        }
    });
    if (imports !== '') {
        imports += '\n';
    }
    return imports;
}

function buildProperties(properties) {
    let content = '';
    Object.keys(properties).forEach(key => {
        const property = properties[key];
        content += `    ${key}: ${ getType(property.type) === '[]' 
        ?`${ property.items.hasOwnProperty('type') ? getType(property.items.type) : 'I'+toPascalCase(pluralize.singular(key)) }[]` 
        :property.hasOwnProperty('type') ? getType(property.type) : 'I'+toPascalCase(pluralize.singular(key)) };\n`;
    });
    return content;
}

function getType(type) {
    if (!type) {

    }
    switch(type) {
        case 'string':
            return 'string';
        case 'integer':
            return 'number';
        case 'boolean':
            return 'boolean';
        case 'double':
            return 'number';
        case 'float':
            return 'number';
        case 'array':
            return '[]'
        default:
            return 'any';
    }
}

